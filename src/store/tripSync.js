import { runInAction } from "mobx";
import {
  hasMeaningfulLocalData,
  mergeSharedStates,
  normalizeSharedState,
  SHARED_TRIP_ID,
  statesEqual,
} from "./sharedTripSync.js";

async function readRemoteState(client) {
  const { data, error } = await client
    .from("shared_trip_state")
    .select("state, version")
    .eq("id", SHARED_TRIP_ID)
    .maybeSingle();
  if (error) throw error;
  return data
    ? { state: normalizeSharedState(data.state), version: Number(data.version) || 0 }
    : null;
}

async function saveRemoteState(client, state, expectedVersion) {
  const { data, error } = await client.rpc("save_shared_trip_state", {
    p_id: SHARED_TRIP_ID,
    p_state: state,
    p_expected_version: expectedVersion,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Общая база не вернула результат сохранения.");
  return {
    saved: Boolean(row.saved),
    version: Number(row.version) || 0,
    state: row.state ? normalizeSharedState(row.state) : null,
  };
}

const syncErrorText = (error) => {
  const message = String(error?.message || error || "");
  if (/shared_trip_state|save_shared_trip_state|schema cache|does not exist/i.test(message)) {
    return "Сначала выполни supabase/setup.sql в SQL Editor проекта Supabase.";
  }
  if (/row-level security|permission denied|42501|not allowed/i.test(message)) {
    return "У аккаунта нет доступа к общей базе. Проверь пользователя и SQL-политики.";
  }
  if (/fetch|network|connection|failed to connect/i.test(message)) {
    return "Не удалось подключиться к Supabase. Проверь интернет и настройки проекта.";
  }
  return message || "Не удалось синхронизировать данные.";
};

const setSyncError = (store, error) => {
  runInAction(() => {
    store.syncStatus = "error";
    store.syncError = syncErrorText(error);
  });
};

export function disconnectSharedDatabase(store) {
  if (store.syncTimer) clearTimeout(store.syncTimer);
  store.syncTimer = null;
  if (store.onlineHandler) {
    window.removeEventListener("online", store.onlineHandler);
    store.onlineHandler = null;
  }
  if (store.syncChannel && store.syncClient) {
    store.syncClient.removeChannel(store.syncChannel);
    store.syncChannel = null;
  }
  store.syncClient = null;
  store.syncVersion = 0;
}

export async function connectSharedDatabase(store, client) {
  disconnectSharedDatabase(store);
  store.syncClient = client;
  runInAction(() => {
    store.syncStatus = "connecting";
    store.syncError = "";
  });

  try {
    const localState = store.getPersistedState();
    const baseState = store.readCloudSnapshot();
    const localHasChanges = baseState
      ? !statesEqual(localState, baseState)
      : hasMeaningfulLocalData(localState);
    let remote = await readRemoteState(client);
    let createdFromThisDevice = false;

    if (!remote) {
      const created = await saveRemoteState(client, localState, 0);
      if (created.saved) {
        remote = {
          state: created.state || localState,
          version: created.version,
        };
        createdFromThisDevice = true;
      } else if (created.state) {
        remote = { state: created.state, version: created.version };
      } else {
        remote = await readRemoteState(client);
      }
      if (!remote) throw new Error("Не удалось создать общую запись поездки.");
    }

    const localCatalogDiffers =
      !baseState &&
      !createdFromThisDevice &&
      localState.items.length > 0 &&
      !statesEqual(localState.items, remote.state.items);

    if ((localHasChanges || localCatalogDiffers) && !createdFromThisDevice) {
      let candidate = mergeSharedStates(remote.state, localState, baseState);
      let expectedVersion = remote.version;
      let merged = false;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const result = await saveRemoteState(client, candidate, expectedVersion);
        if (result.saved) {
          remote = {
            state: result.state || candidate,
            version: result.version,
          };
          merged = true;
          break;
        }

        if (result.state) {
          remote = { state: result.state, version: result.version };
        } else {
          remote = await readRemoteState(client);
          if (!remote) continue;
        }
        candidate = mergeSharedStates(remote.state, candidate, baseState);
        expectedVersion = remote.version;
      }

      if (!merged) {
        throw new Error("Данные меняются одновременно. Нажми «Повторить».");
      }
    }

    store.syncVersion = remote.version;
    store.applyingRemoteState = true;
    runInAction(() => {
      store.applyPersistedState(remote.state);
      store.writeLocalState();
      store.syncStatus = "synced";
      store.syncError = "";
    });
    store.applyingRemoteState = false;
    store.writeCloudSnapshot(remote.state);
    store.hasMeaningfulLocalState = hasMeaningfulLocalData(remote.state);

    store.syncChannel = client
      .channel(`shared-trip-${SHARED_TRIP_ID}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shared_trip_state",
          filter: `id=eq.${SHARED_TRIP_ID}`,
        },
        (payload) => receiveRemoteChange(store, payload),
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          runInAction(() => {
            if (store.syncStatus === "synced") store.syncStatus = "error";
            store.syncError = "Потеряно соединение с обновлениями. Проверь интернет.";
          });
        }
      });

    store.onlineHandler = () => scheduleSharedSave(store);
    window.addEventListener("online", store.onlineHandler);
  } catch (error) {
    store.applyingRemoteState = false;
    setSyncError(store, error);
    throw error;
  }
}

function receiveRemoteChange(store, payload) {
  const row = payload.new;
  if (!row?.state) return;
  const version = Number(row.version) || 0;
  if (version <= store.syncVersion) return;

  const remoteState = normalizeSharedState(row.state);
  const localState = store.getPersistedState();
  const baseState = store.readCloudSnapshot();
  const localIsPending = store.syncStatus === "saving" || store.syncTimer !== null;
  store.syncVersion = version;
  store.writeCloudSnapshot(remoteState);
  store.applyingRemoteState = true;

  if (localIsPending) {
    const merged = mergeSharedStates(remoteState, localState, baseState);
    runInAction(() => {
      store.applyPersistedState(merged);
      store.writeLocalState();
    });
    store.applyingRemoteState = false;
    scheduleSharedSave(store);
    return;
  }

  runInAction(() => {
    store.applyPersistedState(remoteState);
    store.writeLocalState();
    store.syncStatus = "synced";
    store.syncError = "";
  });
  store.applyingRemoteState = false;
  store.hasMeaningfulLocalState = hasMeaningfulLocalData(remoteState);
}

export function scheduleSharedSave(store) {
  if (!store.syncClient || store.applyingRemoteState) return;
  if (store.syncTimer) clearTimeout(store.syncTimer);
  runInAction(() => {
    store.syncStatus = "saving";
    store.syncError = "";
  });
  store.syncTimer = setTimeout(() => {
    store.syncTimer = null;
    store.syncWritePromise = store.syncWritePromise
      .then(() => flushSharedState(store))
      .catch((error) => setSyncError(store, error));
  }, 350);
}

export async function flushSharedState(store) {
  if (!store.syncClient) return;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const localState = store.getPersistedState();
    const baseState = store.readCloudSnapshot();
    const result = await saveRemoteState(
      store.syncClient,
      localState,
      store.syncVersion,
    );

    if (result.saved) {
      store.syncVersion = result.version;
      store.writeCloudSnapshot(result.state || localState);
      if (!statesEqual(store.getPersistedState(), localState)) {
        scheduleSharedSave(store);
      } else {
        runInAction(() => {
          store.syncStatus = "synced";
          store.syncError = "";
        });
      }
      return;
    }

    let remoteState = result.state;
    let remoteVersion = result.version;
    if (!remoteState) {
      const remote = await readRemoteState(store.syncClient);
      if (!remote) throw new Error("Не удалось прочитать общую запись поездки.");
      remoteState = remote.state;
      remoteVersion = remote.version;
    }

    const merged = mergeSharedStates(remoteState, localState, baseState);
    store.syncVersion = remoteVersion;
    store.writeCloudSnapshot(remoteState);
    store.applyingRemoteState = true;
    runInAction(() => {
      store.applyPersistedState(merged);
      store.writeLocalState();
    });
    store.applyingRemoteState = false;
  }
  throw new Error("Не удалось сохранить данные после нескольких конфликтов. Нажми «Повторить».");
}

export function retrySharedSync(store) {
  scheduleSharedSave(store);
}
