import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "@/components/shop/login-page";
import { publicSupabaseConfig } from "@/lib/supabase-config";

const url = "https://demo.supabase.co";
const key = "sb_publishable_test";
const mock = vi.hoisted(() => ({
  createClient: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: mock.createClient }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("Public Supabase settings", () => {
  it("only exposes a secure URL with a publishable or legacy anon key", () => {
    const jwt = (role: string) =>
      `header.${btoa(JSON.stringify({ role })).replace(/=+$/, "")}.signature`;
    expect(publicSupabaseConfig(url, key)).toEqual({ url, key });
    expect(publicSupabaseConfig(url, jwt("anon"))?.key).toBe(jwt("anon"));
    expect(publicSupabaseConfig(url, jwt("service_role"))).toBeNull();
    expect(publicSupabaseConfig(url, "sb_secret_test")).toBeNull();
    expect(publicSupabaseConfig("http://demo.supabase.co", key)).toBeNull();
    expect(publicSupabaseConfig(undefined, undefined)).toBeNull();
  });
});

describe("Login", () => {
  it("shows a disabled form when Supabase settings are empty", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(null)));
    render(<LoginPage />);
    expect(
      await screen.findByText("Вход пока не настроен."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Войти" })).toBeDisabled();
    expect(mock.createClient).not.toHaveBeenCalled();
  });

  it("signs in through Supabase, shows the account, and signs out", async () => {
    const email = "customer@example.com";
    const password = "test-password";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ url, key })),
    );
    mock.createClient.mockReturnValue({
      auth: {
        onAuthStateChange: (
          callback: (event: string, session: null) => void,
        ) => {
          callback("INITIAL_SESSION", null);
          return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
        },
        signInWithPassword: mock.signInWithPassword,
        signOut: mock.signOut,
      },
    });
    mock.signInWithPassword
      .mockResolvedValueOnce({ error: { code: "invalid_credentials" } })
      .mockResolvedValueOnce({
        error: null,
        data: { session: { user: { email } } },
      });
    mock.signOut.mockResolvedValue({ error: null });

    const { unmount } = render(<LoginPage />);
    const field = await screen.findByLabelText("Электронная почта");
    await vi.waitFor(() => expect(field).toBeEnabled());
    fireEvent.change(field, { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Пароль"), {
      target: { value: password },
    });
    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Проверьте электронную почту и пароль.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Войти" }));
    expect(
      await screen.findByRole("heading", { name: "Ваш аккаунт" }),
    ).toBeInTheDocument();
    expect(screen.getByText(email)).toBeInTheDocument();
    expect(mock.signInWithPassword).toHaveBeenCalledWith({ email, password });

    fireEvent.click(screen.getByRole("button", { name: "Выйти" }));
    expect(
      await screen.findByRole("heading", { name: "Вход в аккаунт" }),
    ).toBeInTheDocument();
    expect(mock.signOut).toHaveBeenCalledWith({ scope: "local" });
    unmount();
    expect(mock.unsubscribe).toHaveBeenCalled();
  });

  it("checks the password confirmation and requests email verification through Supabase", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ url: "https://signup.supabase.co", key }),
        ),
    );
    mock.createClient.mockReturnValue({
      auth: {
        onAuthStateChange: (
          callback: (event: string, session: null) => void,
        ) => {
          callback("INITIAL_SESSION", null);
          return { data: { subscription: { unsubscribe: mock.unsubscribe } } };
        },
        signUp: mock.signUp,
      },
    });
    mock.signUp.mockResolvedValue({ data: { session: null }, error: null });

    render(<LoginPage registration />);
    expect(
      screen.getByRole("link", { name: "Уже есть аккаунт? Войти" }),
    ).toHaveAttribute("href", "/login");
    const email = screen.getByLabelText("Электронная почта");
    await vi.waitFor(() => expect(email).toBeEnabled());
    fireEvent.change(email, { target: { value: "customer@example.com" } });
    fireEvent.change(screen.getByLabelText("Пароль", { exact: true }), {
      target: { value: "test-password" },
    });
    const confirmation = screen.getByLabelText("Повторите пароль");
    fireEvent.change(confirmation, { target: { value: "other-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Пароли не совпадают.");
    expect(mock.signUp).not.toHaveBeenCalled();

    fireEvent.change(confirmation, { target: { value: "test-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Создать аккаунт" }));
    expect(await screen.findByText(/Проверьте почту/)).toBeInTheDocument();
    expect(mock.signUp).toHaveBeenCalledWith({
      email: "customer@example.com",
      password: "test-password",
      options: {
        emailRedirectTo: new URL("/login", window.location.origin).href,
      },
    });
  });
});
