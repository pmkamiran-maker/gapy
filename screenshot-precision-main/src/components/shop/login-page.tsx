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
  | "invalid"
  | "unconfirmed"
  | "rateLimit"
  | "signInFailed"
  | "signOutFailed"
  | "mismatch"
  | "weakPassword"
  | "registrationDisabled"
  | "signUpFailed";

const errors: Record<Feedback, string> = {
  invalid: "Проверьте электронную почту и пароль.",
  unconfirmed: "Подтвердите электронную почту и повторите вход.",
  rateLimit: "Слишком много попыток. Попробуйте позже.",
  signInFailed: "Не удалось войти. Попробуйте ещё раз.",
  signOutFailed: "Не удалось выйти. Попробуйте ещё раз.",
  mismatch: "Пароли не совпадают.",
  weakPassword: "Выберите более надёжный пароль.",
  registrationDisabled: "Регистрация сейчас недоступна.",
  signUpFailed: "Не удалось завершить регистрацию. Попробуйте ещё раз.",
};

const clients = new Map<string, SupabaseClient>();

export const LOGIN_TITLE = "Вход в аккаунт";

export const REGISTER_TITLE = "Регистрация";

export function LoginPage({
  registration = false,
}: {
  registration?: boolean;
}) {
  const { t } = useShopLocale();
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
  const [feedback, setFeedback] = useState<Feedback>();
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const title = registration ? REGISTER_TITLE : LOGIN_TITLE;

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
                flowType: "pkce",
                detectSessionInUrl: true,
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
    document.title = `${t(title)} — ${t(STORE.name)}`;
  }, [t, title]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (auth.status !== "ready" || busy) return;
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    if (!email || !password) return;
    if (registration && password !== fields.get("confirmation")) {
      setFeedback("mismatch");
      return;
    }

    const failure = registration ? "signUpFailed" : "signInFailed";

    setFeedback(undefined);
    setBusy(true);
    try {
      const { data, error } = registration
        ? await auth.client.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: new URL("/login", window.location.origin).href,
            },
          })
        : await auth.client.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === "invalid_credentials") setFeedback("invalid");
        else if (error.code === "email_not_confirmed")
          setFeedback("unconfirmed");
        else if (error.status === 429) setFeedback("rateLimit");
        else if (error.code === "weak_password") setFeedback("weakPassword");
        else if (error.code === "signup_disabled")
          setFeedback("registrationDisabled");
        else setFeedback(failure);
      } else if (data.session) {
        setAuth({ ...auth, session: data.session });
      } else if (registration) {
        setCheckEmail(true);
      } else {
        setFeedback(failure);
      }
    } catch {
      setFeedback(failure);
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
          <h1 id="login-title">{t(session ? "Ваш аккаунт" : title)}</h1>
          {auth.status === "loading" && (
            <p role="status">{t("Проверяем подключение…")}</p>
          )}
          {auth.status === "unconfigured" && (
            <p role="status">
              {t(
                registration
                  ? "Регистрация пока не настроена."
                  : "Вход пока не настроен.",
              )}
            </p>
          )}
          {auth.status === "unavailable" && (
            <p role="alert">
              {t(
                registration
                  ? "Регистрация сейчас недоступна."
                  : "Вход временно недоступен. Обновите страницу и попробуйте снова.",
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
          ) : checkEmail ? (
            <p role="status">
              {t(
                "Проверьте почту. Если пришло письмо от Supabase, подтвердите адрес по ссылке и войдите.",
              )}
            </p>
          ) : (
            <form className="shop-auth-form" onSubmit={submit}>
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
                    autoComplete={
                      registration ? "new-password" : "current-password"
                    }
                    minLength={registration ? 6 : undefined}
                    required
                  />
                </label>
                {registration && (
                  <label>
                    {t("Повторите пароль")}
                    <input
                      name="confirmation"
                      type="password"
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </label>
                )}
                <button type="submit" className="shop-button">
                  {t(
                    registration
                      ? busy
                        ? "Создаём аккаунт…"
                        : "Создать аккаунт"
                      : busy
                        ? "Выполняем вход…"
                        : "Войти",
                  )}
                </button>
              </fieldset>
            </form>
          )}
          {!session && (
            <a
              className="shop-text-link"
              href={registration ? "/login" : "/register"}
            >
              {t(
                registration
                  ? "Уже есть аккаунт? Войти"
                  : "Нет аккаунта? Зарегистрироваться",
              )}
            </a>
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
