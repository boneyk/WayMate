import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, Button, Card, Form, Input, Spin, Typography } from "antd";
import { CloudSyncOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useTripStore } from "../store/TripStore.jsx";
import { flushSharedState } from "../store/tripSync.js";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient.js";

const { Text, Title } = Typography;
export const AuthContext = createContext({ session: null, signOut: async () => {} });
export const useAuth = () => useContext(AuthContext);

export default function AuthGate({ children }) {
  const store = useTripStore();
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setError("");
    });

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!active) return;
        if (sessionError) setError(sessionError.message);
        setSession(data.session);
        setAuthLoading(false);
      })
      .catch((sessionError) => {
        if (!active) return;
        setError(sessionError.message || "Не удалось проверить вход.");
        setAuthLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session || !supabase) {
      setSyncLoading(false);
      store.disconnectSharedDatabase();
      return undefined;
    }

    let active = true;
    setSyncLoading(true);
    setError("");
    store
      .connectSharedDatabase(supabase)
      .then(() => {
        if (active) setSyncLoading(false);
      })
      .catch((syncError) => {
        if (active) {
          setError(store.syncError || syncError.message || "Не удалось загрузить общие данные.");
          setSyncLoading(false);
        }
      });

    return () => {
      active = false;
      store.disconnectSharedDatabase();
    };
  }, [session?.user?.id, store]);

  const signIn = async ({ email, password }) => {
    if (!supabase) return;
    setFormLoading(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setFormLoading(false);
    if (signInError) {
      setError("Не удалось войти. Проверь почту и пароль общего аккаунта.");
      return;
    }
    setSession(data.session);
  };

  const signOut = useCallback(async () => {
    if (!supabase) return;
    if (store.syncTimer) {
      clearTimeout(store.syncTimer);
      store.syncTimer = null;
    }
    try {
      await store.syncWritePromise;
      await flushSharedState(store);
    } catch {
      // Keep sign-out available when the network is unavailable.
    }
    await supabase.auth.signOut();
  }, [store]);

  const contextValue = useMemo(() => ({ session, signOut }), [session, signOut]);

  if (!isSupabaseConfigured) {
    return (
      <AuthScreen>
        <Alert
          type="error"
          showIcon
          message="Не настроено подключение к Supabase"
          description="Задай VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY для локального запуска и GitHub Actions."
        />
      </AuthScreen>
    );
  }

  if (authLoading) {
    return (
      <AuthScreen>
        <Spin size="large" />
        <Text>Проверяем вход…</Text>
      </AuthScreen>
    );
  }

  if (!session) {
    return (
      <AuthScreen>
        <div className="shared-auth-brand">
          <span className="shared-auth-mark"><CloudSyncOutlined /></span>
          <span>Way<span>mate</span></span>
        </div>
        <Title level={2}>Общая поездка</Title>
        <Text className="shared-auth-copy">
          Войди в аккаунт поездки, чтобы открыть и менять общий план с любого устройства.
        </Text>
        {error && <Alert type="error" showIcon message={error} />}
        <Form layout="vertical" onFinish={signIn} requiredMark={false}>
          <Form.Item
            label="Почта общего аккаунта"
            name="email"
            rules={[{ required: true, message: "Введи почту" }, { type: "email", message: "Проверь формат почты" }]}
          >
            <Input prefix={<MailOutlined />} autoComplete="username" />
          </Form.Item>
          <Form.Item
            label="Пароль"
            name="password"
            rules={[{ required: true, message: "Введи пароль" }]}
          >
            <Input.Password prefix={<LockOutlined />} autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={formLoading} block>
            Войти и загрузить план
          </Button>
        </Form>
        <Text className="shared-auth-hint">
          Аккаунт создаётся владельцем проекта в Supabase. Используйте один аккаунт на своих устройствах.
        </Text>
      </AuthScreen>
    );
  }

  if (syncLoading || store.syncStatus === "connecting") {
    return (
      <AuthScreen>
        <Spin size="large" />
        <Text>Загружаем общий план…</Text>
      </AuthScreen>
    );
  }

  if (store.syncStatus === "error" || error) {
    return (
      <AuthScreen>
        <Alert
          type="error"
          showIcon
          message="Не удалось подключиться к общей базе"
          description={error || store.syncError}
        />
        <div className="shared-auth-actions">
          <Button
            type="primary"
            onClick={() => {
              setError("");
              setSyncLoading(true);
              store
                .connectSharedDatabase(supabase)
                .catch((syncError) => setError(store.syncError || syncError.message))
                .finally(() => setSyncLoading(false));
            }}
          >
            Повторить подключение
          </Button>
          <Button onClick={signOut}>Выйти</Button>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

function AuthScreen({ children }) {
  return (
    <main className="shared-auth-screen">
      <Card className="shared-auth-card">{children}</Card>
    </main>
  );
}
