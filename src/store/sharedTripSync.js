export const SHARED_TRIP_ID = "waymate-sakhalin-trip";
export const SHARED_SNAPSHOT_KEY = "sahalin-trip-planner-cloud-snapshot-v1";

const DEFAULT_STATE = {
  items: [],
  customItems: [],
  itemOverrides: {},
  deletedItemIds: [],
  archivedItemIds: [],
  customCategories: [],
  deletedCategories: [],
  itinerary: [],
  customCosts: [],
  savedItems: [],
  dayCount: 7,
  travelers: 2,
  participants: [],
  proposals: [],
};

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
};

export const statesEqual = (left, right) =>
  JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));

export const normalizeSharedState = (value) => {
  const state = value && typeof value === "object" ? value : {};
  return {
    ...DEFAULT_STATE,
    ...state,
    items: Array.isArray(state.items) ? state.items : [],
    customItems: Array.isArray(state.customItems) ? state.customItems : [],
    itemOverrides:
      state.itemOverrides && typeof state.itemOverrides === "object"
        ? state.itemOverrides
        : {},
    deletedItemIds: Array.isArray(state.deletedItemIds)
      ? state.deletedItemIds
      : [],
    archivedItemIds: Array.isArray(state.archivedItemIds)
      ? state.archivedItemIds
      : [],
    customCategories: Array.isArray(state.customCategories)
      ? state.customCategories
      : [],
    deletedCategories: Array.isArray(state.deletedCategories)
      ? state.deletedCategories
      : [],
    itinerary: Array.isArray(state.itinerary) ? state.itinerary : [],
    customCosts: Array.isArray(state.customCosts) ? state.customCosts : [],
    savedItems: Array.isArray(state.savedItems) ? state.savedItems : [],
    participants: Array.isArray(state.participants) ? state.participants : [],
    proposals: Array.isArray(state.proposals) ? state.proposals : [],
  };
};

export const hasMeaningfulLocalData = (value) => {
  const state = normalizeSharedState(value);
  return Boolean(
    state.customItems.length ||
      Object.keys(state.itemOverrides).length ||
      state.deletedItemIds.length ||
      state.archivedItemIds.length ||
      state.customCategories.length ||
      state.deletedCategories.length ||
      state.itinerary.length ||
      state.customCosts.length ||
      state.savedItems.length ||
      state.proposals.length ||
      state.dayCount !== DEFAULT_STATE.dayCount ||
      state.travelers !== DEFAULT_STATE.travelers ||
      state.participants.some((person, index) => {
        const defaultNames = ["Дима", "Настя"];
        return person?.name !== (defaultNames[index] || `Участник ${index + 1}`);
      }),
  );
};

const hasNonDefaultParticipants = (participants = []) =>
  participants.some((person, index) => {
    const defaultNames = ["Дима", "Настя"];
    return person?.name !== (defaultNames[index] || `Участник ${index + 1}`);
  });

const mergeSet = (base = [], remote = [], local = []) => {
  if (!base.length) return [...new Set([...remote, ...local])];
  const values = new Set([...base, ...remote, ...local]);
  return [...values].filter((value) => {
    const before = base.includes(value);
    const fromRemote = remote.includes(value);
    const fromLocal = local.includes(value);
    if (fromRemote === before) return fromLocal;
    if (fromLocal === before) return fromRemote;
    return fromLocal;
  });
};

const mergeObject = (base = {}, remote = {}, local = {}) => {
  if (!Object.keys(base).length) return { ...remote, ...local };
  const result = {};
  const keys = new Set([
    ...Object.keys(base),
    ...Object.keys(remote),
    ...Object.keys(local),
  ]);
  for (const key of keys) {
    const before = base[key];
    const fromRemote = remote[key];
    const fromLocal = local[key];
    if (statesEqual(fromLocal, before)) {
      if (fromRemote !== undefined) result[key] = fromRemote;
    } else if (statesEqual(fromRemote, before)) {
      if (fromLocal !== undefined) result[key] = fromLocal;
    } else if (fromRemote !== undefined && fromLocal !== undefined) {
      result[key] = { ...fromRemote, ...fromLocal };
    } else if (fromLocal !== undefined) {
      result[key] = fromLocal;
    } else if (fromRemote !== undefined) {
      result[key] = fromRemote;
    }
  }
  return result;
};

const mergeRecords = (base = [], remote = [], local = []) => {
  const byId = (items) => new Map(items.filter((item) => item?.id).map((item) => [item.id, item]));
  const baseMap = byId(base);
  const remoteMap = byId(remote);
  const localMap = byId(local);
  const ids = new Set([...baseMap.keys(), ...remoteMap.keys(), ...localMap.keys()]);
  const merged = [];

  for (const id of ids) {
    const before = baseMap.get(id);
    const fromRemote = remoteMap.get(id);
    const fromLocal = localMap.get(id);
    if (!before) {
      if (fromRemote && fromLocal) {
        merged.push({
          ...fromRemote,
          ...fromLocal,
          ...(fromRemote.votes || fromLocal.votes
            ? { votes: { ...fromRemote.votes, ...fromLocal.votes } }
            : {}),
        });
      } else if (fromRemote || fromLocal) {
        merged.push(fromRemote || fromLocal);
      }
      continue;
    }
    if (!fromRemote && !fromLocal) continue;
    if (!fromLocal) {
      if (!statesEqual(fromRemote, before)) merged.push(fromRemote);
      continue;
    }
    if (!fromRemote) {
      if (!statesEqual(fromLocal, before)) merged.push(fromLocal);
      continue;
    }

    const localChanged = !statesEqual(fromLocal, before);
    const remoteChanged = !statesEqual(fromRemote, before);
    if (!localChanged) merged.push(fromRemote);
    else if (!remoteChanged) merged.push(fromLocal);
    else {
      merged.push({
        ...fromRemote,
        ...fromLocal,
        ...(fromRemote.votes || fromLocal.votes
          ? { votes: { ...fromRemote.votes, ...fromLocal.votes } }
          : {}),
      });
    }
  }
  return merged;
};

const mergeScalar = (before, remote, local, fallback) => {
  if (before !== undefined) {
    if (Object.is(local, before)) return remote;
    if (Object.is(remote, before)) return local;
    return local;
  }
  return Object.is(local, fallback) ? remote : local;
};

const remapProposalVotes = (proposals, fromParticipants, toParticipants) => {
  if (!fromParticipants.length || !toParticipants.length) return proposals;
  const idMap = new Map();
  fromParticipants.forEach((person, index) => {
    const target =
      toParticipants.find((candidate) => candidate.name === person.name) ||
      toParticipants[index];
    if (target) idMap.set(person.id, target.id);
  });
  return proposals.map((proposal) => {
    const votes = { ...proposal.votes };
    for (const [fromId, toId] of idMap) {
      if (Object.hasOwn(votes, fromId)) votes[toId] = votes[fromId];
    }
    return { ...proposal, votes };
  });
};

export const mergeSharedStates = (remoteValue, localValue, baseValue = null) => {
  const remote = normalizeSharedState(remoteValue);
  const local = normalizeSharedState(localValue);
  const base = baseValue ? normalizeSharedState(baseValue) : null;
  const localProposals = remapProposalVotes(
    local.proposals,
    local.participants,
    remote.participants,
  );

  const merged = {
    items: mergeRecords(base?.items, remote.items, local.items),
    customItems: mergeRecords(base?.customItems, remote.customItems, local.customItems),
    itemOverrides: mergeObject(base?.itemOverrides, remote.itemOverrides, local.itemOverrides),
    deletedItemIds: mergeSet(base?.deletedItemIds, remote.deletedItemIds, local.deletedItemIds),
    archivedItemIds: mergeSet(base?.archivedItemIds, remote.archivedItemIds, local.archivedItemIds),
    customCategories: mergeSet(base?.customCategories, remote.customCategories, local.customCategories),
    deletedCategories: mergeSet(base?.deletedCategories, remote.deletedCategories, local.deletedCategories),
    itinerary: mergeRecords(base?.itinerary, remote.itinerary, local.itinerary),
    customCosts: mergeRecords(base?.customCosts, remote.customCosts, local.customCosts),
    savedItems: mergeSet(base?.savedItems, remote.savedItems, local.savedItems),
    proposals: mergeRecords(base?.proposals, remote.proposals, localProposals),
    dayCount: mergeScalar(base?.dayCount, remote.dayCount, local.dayCount, DEFAULT_STATE.dayCount),
    travelers: mergeScalar(base?.travelers, remote.travelers, local.travelers, DEFAULT_STATE.travelers),
    participants: base
      ? mergeScalar(
          base.participants,
          remote.participants,
          local.participants,
          [],
        )
      : hasNonDefaultParticipants(local.participants) || !remote.participants.length
        ? local.participants
        : remote.participants,
  };

  if (!base && !merged.participants.length) merged.participants = local.participants;
  return normalizeSharedState(merged);
};
