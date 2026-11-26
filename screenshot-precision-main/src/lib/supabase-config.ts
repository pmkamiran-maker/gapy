export const SUPABASE_CONFIG_PATH = "/api/auth/config";

export interface PublicSupabaseConfig {
  url: string;
  key: string;
}

export function publicSupabaseConfig(
  url: unknown,
  key: unknown,
): PublicSupabaseConfig | null {
  if (typeof url !== "string" || typeof key !== "string") return null;
  try {
    const endpoint = new URL(url.trim());
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      return null;
    }
    const value = key.trim();
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(value)) {
      const segments = value.split(".");
      if (
        segments.length !== 3 ||
        !segments.every((part) => /^[A-Za-z0-9_-]+$/.test(part))
      )
        return null;
      const claims = JSON.parse(
        atob(segments[1]!.replace(/-/g, "+").replace(/_/g, "/")),
      );
      if (claims?.role !== "anon") return null;
    }
    return { url: endpoint.toString().replace(/\/$/, ""), key: value };
  } catch {
    return null;
  }
}
