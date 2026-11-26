import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { handleOrderRequest } from "./lib/order-request-server";
import { publicSupabaseConfig, SUPABASE_CONFIG_PATH } from "./lib/supabase-config";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Hosting compresses every response at the edge. Never compress a body (gzip, brotli,
// CompressionStream) or set content-encoding here or in a server route: the body gets encoded
// twice and renders garbled.
export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const runtime = (request as Request & {
        runtime?: { cloudflare?: { env?: unknown } };
      }).runtime?.cloudflare?.env ?? env ?? (typeof process !== "undefined" ? process.env : {});
      if (new URL(request.url).pathname === SUPABASE_CONFIG_PATH) {
        const headers = { "Cache-Control": "no-store" };
        if (request.method !== "GET") return new Response(null, { status: 405, headers: { ...headers, Allow: "GET" } });
        const config = runtime as { SUPABASE_URL?: string; SUPABASE_PUBLISHABLE_KEY?: string };
        return Response.json(publicSupabaseConfig(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY), { headers });
      }

      const orderResponse = await handleOrderRequest(request, runtime as Parameters<typeof handleOrderRequest>[1]);
      if (orderResponse) return orderResponse;

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
