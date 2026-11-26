import { PRODUCTS } from "@/data/catalog";
import { applyCatalogChanges, readCatalogChanges } from "@/lib/live-catalog";
import type { PublicSupabaseConfig } from "@/lib/supabase-config";
import { ORDER_REQUEST_PATH, orderRequestSchema } from "@/lib/order-request";
import { deliveryCost } from "@/lib/pricing";
import { STORE } from "@/lib/store-config";

interface OrderEnvironment {
  ORDER_WEBHOOK_URL?: string;
  ORDER_WEBHOOK_SECRET?: string;
  ORDER_DEMO_ENABLED?: string;
}

const MAX_PAYLOAD = 24 * 1024;

function reply(status: number, body: Record<string, string | boolean>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function receiverUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url
      : undefined;
  } catch {
    return undefined;
  }
}

async function requestBody(request: Request): Promise<unknown> {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_PAYLOAD) {
      await reader.cancel();
      return undefined;
    }
    body += decoder.decode(value, { stream: true });
  }
  try {
    return JSON.parse(body + decoder.decode());
  } catch {
    return undefined;
  }
}

export async function handleOrderRequest(
  request: Request,
  env: OrderEnvironment,
  send = fetch,
  supabase: PublicSupabaseConfig | null = null,
) {
  const url = new URL(request.url);
  if (url.pathname !== ORDER_REQUEST_PATH) return undefined;

  const receiver = receiverUrl(env.ORDER_WEBHOOK_URL);
  const demo = !receiver && env.ORDER_DEMO_ENABLED === "true";
  if (request.method === "GET")
    return reply(200, { available: !!receiver || demo, demo });
  if (request.method !== "POST") return reply(405, { error: "method" });
  if (request.headers.get("origin") !== url.origin)
    return reply(403, { error: "origin" });
  if (
    request.headers.get("content-type")?.split(";")[0]?.trim() !==
    "application/json"
  ) {
    return reply(415, { error: "content_type" });
  }
  if (!receiver && !demo) return reply(503, { error: "unavailable" });

  const parsed = orderRequestSchema.safeParse(await requestBody(request));
  if (!parsed.success) return reply(400, { error: "invalid" });

  const { id, locale, contact, items } = parsed.data;
  let products = PRODUCTS;
  if (supabase) {
    try {
      products = applyCatalogChanges(
        await readCatalogChanges(supabase),
      ).products;
    } catch {
      return reply(503, { error: "catalog_unavailable" });
    }
  }
  const byId = new Map(products.map((product) => [product.id, product]));
  const lines = [];
  const seen = new Set<string>();
  for (const line of items) {
    const item = byId.get(line.id);
    const key = JSON.stringify([line.id, line.color, line.size]);
    if (
      !item ||
      item.stock === "out" ||
      seen.has(key) ||
      (item.colors.length
        ? !item.colors.some(({ name }) => name === line.color)
        : !!line.color) ||
      (item.sizes?.length
        ? !line.size || !item.sizes.includes(line.size)
        : !!line.size)
    ) {
      return reply(400, { error: "invalid_items" });
    }
    seen.add(key);
    lines.push({
      ...line,
      model: item.slug,
      name: item.name,
      category: item.category,
      stock: item.stock,
      unitPrice: item.price,
      total: item.price * line.qty,
    });
  }

  if (!receiver) return reply(200, { id, demo: true });

  const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
  const delivery =
    contact.fulfillment === "delivery" ? deliveryCost(subtotal) : 0;
  const payload = {
    id,
    locale,
    contact: {
      ...contact,
      address: contact.fulfillment === "delivery" ? contact.address : undefined,
      measure:
        contact.measure &&
        lines.some(
          ({ category }) => category === "interior" || category === "entrance",
        ),
    },
    items: lines,
    estimate: {
      currency: STORE.currency,
      subtotal,
      delivery,
      total: subtotal + delivery,
    },
  };

  const headers = new Headers({
    "Content-Type": "application/json",
    "Idempotency-Key": id,
  });
  if (env.ORDER_WEBHOOK_SECRET)
    headers.set("Authorization", `Bearer ${env.ORDER_WEBHOOK_SECRET}`);
  try {
    const response = await send(receiver, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
    if (response.ok) return reply(200, { id });
  } catch {
    // Keep contact details and receiver credentials out of logs.
  }

  return reply(502, { error: "receiver" });
}
