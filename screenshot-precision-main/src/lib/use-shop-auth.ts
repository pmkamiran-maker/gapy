import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import { CATALOG_ADMIN_TABLE } from "@/lib/live-catalog";
import {
  publicSupabaseConfig,
  SUPABASE_CONFIG_PATH,
  type PublicSupabaseConfig,
} from "@/lib/supabase-config";

export type AuthState =
  | { status: "loading" | "unconfigured" | "unavailable" }
  | {
      status: "ready";
      client: SupabaseClient;
      config: PublicSupabaseConfig;
      session: Session | null;
    };

const clients = new Map<string, SupabaseClient>();

export function useShopAuth() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });
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
              setAuth({
                status: "ready",
                client: activeClient,
                config: settings,
                session,
              });
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

  return [auth, setAuth] as const;
}

export function useCatalogAdmin(auth: AuthState) {
  const client = auth.status === "ready" ? auth.client : undefined;
  const userId = auth.status === "ready" ? auth.session?.user.id : undefined;
  const [permission, setPermission] = useState<{
    id: string;
    granted: boolean;
  }>();
  useEffect(() => {
    if (!client || !userId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const { data, error } = await client
          .from(CATALOG_ADMIN_TABLE)
          .select("user_id")
          .eq("user_id", userId)
          .abortSignal(controller.signal)
          .maybeSingle();
        if (!controller.signal.aborted)
          setPermission({
            id: userId,
            granted: !error && data?.user_id === userId,
          });
      } catch {
        if (!controller.signal.aborted)
          setPermission({ id: userId, granted: false });
      }
    })();
    return () => controller.abort();
  }, [client, userId]);

  if (!userId) return false;
  return permission?.id === userId ? permission.granted : undefined;
}
