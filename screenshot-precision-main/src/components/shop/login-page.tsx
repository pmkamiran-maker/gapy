import { DoorClosed } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import door from "@/assets/hero.jpg";
import { useShopLocale } from "@/lib/shop-locale";
import { STORE } from "@/lib/store-config";
import {
  publicSupabaseConfig,
  SUPABASE_CONFIG_PATH,
} from "@/lib/supabase-config";
import { LanguagePicker } from "./language-picker";

type AuthState =
  | { status: "loading" | "unconfigured" | "unavailable" }
  | { status: "ready"; client: SupabaseClient; session: Session | null };

type Feedback =
  "invalid" | "unconfirmed" | "rateLimit" | "signInFailed" | "signOutFailed";

const errors: Record<Feedback, string> = {
  invalid: "Проверьте электронную почту и пароль.",
  unconfirmed: "Подтвердите электронную почту и повторите вход.",
  rateLimit: "Слишком много попыток. Попробуйте позже.",
  signInFailed: "Не удалось войти. Попробуйте ещё раз.",
  signOutFailed: "Не удалось выйти. Попробуйте ещё раз.",
};

const clients = new Map<string, SupabaseClient>();

export const LOGIN_TITLE = "Вход в аккаунт";

export function LoginPage() {
  const { t } = useShopLocale();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [feedback, setFeedback] = useState<Feedback>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let unsubscribe: (() => void) | undefined;

    async function initialize() {
      try {
        const response = await fetch(SUPABASE_CONFIG_PATH, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const config: { url?: string; key?: string } | null =
          await response.json();
        if (controller.signal.aborted) return;
        const settings = publicSupabaseConfig(config?.url, config?.key);
        if (!settings) {
          setAuth({ status: "unconfigured" });
          return;
        }

        let client = clients.get(settings.url);
        if (!client) {
          const { createClient } = await import("@supabase/supabase-js");
          if (controller.signal.aborted) return;
          client =
            clients.get(settings.url) ??
            createClient(settings.url, settings.key, {
              auth: {
                detectSessionInUrl: false,
                persistSession: true,
                autoRefreshToken: true,
              },
            });
          clients.set(settings.url, client);
        }
        const activeClient = client;
        // INITIAL_SESSION covers the stored session and later events keep the page in sync.
        const { data } = activeClient.auth.onAuthStateChange(
          (_event, session) => {
            if (!controller.signal.aborted)
              setAuth({ status: "ready", client: activeClient, session });
          },
        );
        unsubscribe = () => data.subscription.unsubscribe();
      } catch {
        if (!controller.signal.aborted) setAuth({ status: "unavailable" });
      }
    }

    void initialize();
    return () => {
      controller.abort();
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    document.title = `${t(LOGIN_TITLE)} — ${t(STORE.name)}`;
  }, [t]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (auth.status !== "ready" || busy) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    if (!email || !password) return;

    setFeedback(undefined);
    setBusy(true);
    try {
      const { data, error } = await auth.client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.code === "invalid_credentials") setFeedback("invalid");
        else if (error.code === "email_not_confirmed")
          setFeedback("unconfirmed");
        else if (error.status === 429) setFeedback("rateLimit");
        else setFeedback("signInFailed");
      } else if (data.session) {
        setAuth({ ...auth, session: data.session });
      } else {
        setFeedback("signInFailed");
      }
    } catch {
      setFeedback("signInFailed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (auth.status !== "ready" || busy) return;
    setFeedback(undefined);
    setBusy(true);
    try {
      const { error } = await auth.client.auth.signOut({ scope: "local" });
      if (error) setFeedback("signOutFailed");
      else setAuth({ ...auth, session: null });
    } catch {
      setFeedback("signOutFailed");
    } finally {
      setBusy(false);
    }
  }

  const session = auth.status === "ready" ? auth.session : null;
  return (
    <div className="shop shop-auth">
      <div className="shop-top">
        <div className="shop-wrap">
          <a href="/">{t("На главную")}</a>
          <LanguagePicker />
        </div>
      </div>
      <main className="shop-auth-layout shop-wrap">
        <section className="shop-auth-content" aria-labelledby="login-title">
          <a href="/" className="shop-brand">
            <DoorClosed aria-hidden="true" size={30} strokeWidth={1.4} />
            <span>
              {t(STORE.name)}
              <small>{t(STORE.tagline)}</small>
            </span>
          </a>
          <h1 id="login-title">{t(session ? "Ваш аккаунт" : LOGIN_TITLE)}</h1>
          {auth.status === "loading" && (
            <p role="status">{t("Проверяем подключение…")}</p>
          )}
          {auth.status === "unconfigured" && (
            <p role="status">{t("Вход пока не настроен.")}</p>
          )}
          {auth.status === "unavailable" && (
            <p role="alert">
              {t(
                "Вход временно недоступен. Обновите страницу и попробуйте снова.",
              )}
            </p>
          )}
          {session ? (
            <div className="shop-auth-form">
              <p>{session.user.email ?? t("Вы вошли в аккаунт.")}</p>
              <button
                type="button"
                className="shop-button"
                disabled={busy}
                onClick={signOut}
              >
                {t(busy ? "Выполняем выход…" : "Выйти")}
              </button>
            </div>
          ) : (
            <form className="shop-auth-form" onSubmit={signIn}>
              <fieldset disabled={auth.status !== "ready" || busy}>
                <label>
                  {t("Электронная почта")}
                  <input
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                  />
                </label>
                <label>
                  {t("Пароль")}
                  <input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>
                <button type="submit" className="shop-button">
                  {t(busy ? "Выполняем вход…" : "Войти")}
                </button>
              </fieldset>
            </form>
          )}
          {feedback && (
            <p className="shop-auth-error" role="alert">
              {t(errors[feedback])}
            </p>
          )}
        </section>
        <img src={door} alt="" className="shop-auth-image" />
      </main>
    </div>
  );
}
