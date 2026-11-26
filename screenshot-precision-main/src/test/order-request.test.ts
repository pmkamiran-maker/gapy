import { describe, expect, it, vi } from "vitest";

import { handleOrderRequest } from "@/lib/order-request-server";

const endpoint = "https://store.example/api/order-requests";
const env = {
  ORDER_WEBHOOK_URL: "https://receiver.example/orders",
  ORDER_WEBHOOK_SECRET: "test-key",
};
const id = "1f7e4bec-61a5-48df-91d3-c1966f8a368c";
const body = {
  id,
  locale: "tk",
  contact: {
    name: "Test customer",
    phone: "+993 65 123456",
    fulfillment: "pickup",
    address: "",
    measure: true,
  },
  items: [{ id: "p1", qty: 2, color: "Кремовый", size: "800x2000" }],
};
function post(payload = body, origin = "https://store.example") {
  return new Request(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: origin },
    body: JSON.stringify(payload),
  });
}

describe("Order requests", () => {
  it("forwards a validated request with server-calculated prices and an idempotency key", async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 204 }));
    const response = await handleOrderRequest(post(), env, send);
    expect(response?.status).toBe(200);
    expect(await response?.json()).toEqual({ id });

    const call = send.mock.calls[0];
    expect(call?.[0].toString()).toBe(env.ORDER_WEBHOOK_URL);
    const headers = new Headers(call?.[1]?.headers);
    expect(headers.get("Idempotency-Key")).toBe(id);
    expect(headers.get("Authorization")).toBe("Bearer test-key");
    expect(JSON.parse(String(call?.[1]?.body))).toMatchObject({
      id,
      locale: "tk",
      contact: {
        fulfillment: "pickup",
        measure: true,
        phone: "+993 65 123456",
      },
      items: [{ color: "Кремовый", size: "800x2000", qty: 2, unitPrice: 2890 }],
      estimate: { subtotal: 5780, delivery: 0, total: 5780, currency: "TMT" },
    });
  });

  it("rejects invalid variants, missing delivery addresses, or requests from a different origin", async () => {
    const send = vi.fn<typeof fetch>();
    const badVariant = {
      ...body,
      items: [{ ...body.items[0]!, size: "wrong" }],
    };
    const noAddress = {
      ...body,
      contact: { ...body.contact, fulfillment: "delivery" },
    };
    expect(
      (await handleOrderRequest(post(badVariant), env, send))?.status,
    ).toBe(400);
    expect((await handleOrderRequest(post(noAddress), env, send))?.status).toBe(
      400,
    );
    expect(
      (await handleOrderRequest(post(body, "https://other.example"), env, send))
        ?.status,
    ).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it("avoids confirming a request when the receiver is unavailable", async () => {
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 500 }));
    await expect(
      (await handleOrderRequest(new Request(endpoint), {}, send))?.json(),
    ).resolves.toEqual({ available: false, demo: false });
    expect((await handleOrderRequest(post(), {}, send))?.status).toBe(503);
    expect((await handleOrderRequest(post(), env, send))?.status).toBe(502);
  });
  it("validates a demo request without forwarding it", async () => {
    const send = vi.fn<typeof fetch>();
    const demo = { ORDER_DEMO_ENABLED: "true" };
    const response = await handleOrderRequest(post(), demo, send);
    expect(await response?.json()).toEqual({ id, demo: true });
    expect(send).not.toHaveBeenCalled();
  });
});
