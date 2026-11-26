import { useEffect, useRef, useState, type FormEvent } from "react";

import { productById } from "@/data/catalog";
import { ORDER_REQUEST_PATH, orderFields } from "@/lib/order-request";
import { deliveryCost } from "@/lib/pricing";
import { useShopLocale } from "@/lib/shop-locale";
import { useShop } from "@/lib/shop-store";

type Status = "idle" | "sending" | "invalid" | "unavailable" | "failed";

export function OrderForm({ onBack }: { onBack: () => void }) {
  const { cart, cartTotal } = useShop();
  const { locale, price, t } = useShopLocale();
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [status, setStatus] = useState<Status>("idle");
  const [available, setAvailable] = useState<boolean>();
  const [demo, setDemo] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    id: string;
    demo: boolean;
  }>();
  const draft = useRef<{ signature: string; id: string }>(null);
  const sending = useRef(false);
  const result = useRef<HTMLDivElement>(null);

  const hasDoors = cart.some(({ id }) => {
    const category = productById(id)?.category;
    return category === "interior" || category === "entrance";
  });
  const delivery = fulfillment === "delivery" ? deliveryCost(cartTotal) : 0;

  useEffect(() => {
    const controller = new AbortController();
    fetch(ORDER_REQUEST_PATH, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        const data: { available?: boolean; demo?: boolean } =
          await response.json();
        setDemo(data.demo === true);
        setAvailable(data.available === true);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("failed");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (confirmation) result.current?.focus();
  }, [confirmation]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || !available) return;
    const form = new FormData(event.currentTarget);
    const parsed = orderFields.safeParse({
      name: form.get("name"),
      phone: form.get("phone"),
      fulfillment,
      address: form.get("address") ?? "",
      measure: form.has("measure"),
    });
    if (!parsed.success) {
      setStatus("invalid");
      return;
    }

    const items = cart.map(({ key: _key, ...line }) => line);
    const payload = { locale, contact: parsed.data, items };
    const signature = JSON.stringify(payload);
    if (draft.current?.signature !== signature) {
      draft.current = { signature, id: crypto.randomUUID() };
    }
    const { id } = draft.current;
    sending.current = true;
    setStatus("sending");
    try {
      const response = await fetch(ORDER_REQUEST_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, id }),
        signal: AbortSignal.timeout(12000),
      });
      if (response.status === 503) {
        setAvailable(false);
        setStatus("unavailable");
      } else if (!response.ok) {
        setStatus("failed");
      } else {
        const receipt: { id?: string; demo?: boolean } = await response.json();
        if (receipt.id !== id) throw new Error();
        setConfirmation({ id, demo: receipt.demo === true });
        setStatus("idle");
      }
    } catch {
      setStatus("failed");
    } finally {
      sending.current = false;
    }
  }

  if (confirmation) {
    return (
      <div className="shop-order" ref={result} tabIndex={-1}>
        <p role="status">
          <strong>
            {t(
              confirmation.demo
                ? "Тестовая заявка проверена"
                : "Заявка отправлена",
            )}
          </strong>
        </p>
        <p>
          {t(
            confirmation.demo
              ? "Данные не отправлены в магазин."
              : "Магазин свяжется с вами по указанному телефону, чтобы подтвердить заказ.",
          )}
        </p>
        <p>{t("Номер заявки: {id}", { id: confirmation.id })}</p>
        <button type="button" className="shop-button" onClick={onBack}>
          {t("К корзине")}
        </button>
      </div>
    );
  }

  return (
    <form
      className="shop-order"
      onSubmit={submit}
      aria-label={t("Заявка на заказ")}
    >
      <fieldset disabled={status === "sending" || available === false}>
        <legend>{t("Заявка на заказ")}</legend>
        <label>
          {t("Имя")}
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label>
          {t("Телефон")}
          <input
            name="phone"
            autoComplete="tel"
            type="tel"
            required
            maxLength={30}
          />
        </label>
        <label>
          {t("Получение")}
          <select
            name="fulfillment"
            value={fulfillment}
            onChange={(event) => {
              setFulfillment(
                event.target.value === "pickup" ? "pickup" : "delivery",
              );
            }}
          >
            <option value="delivery">{t("Доставка")}</option>
            <option value="pickup">{t("Самовывоз")}</option>
          </select>
        </label>
        {fulfillment === "delivery" && (
          <label>
            {t("Адрес доставки")}
            <input
              name="address"
              autoComplete="street-address"
              required
              minLength={4}
              maxLength={240}
            />
          </label>
        )}
        {hasDoors && (
          <label className="shop-order-check">
            <input name="measure" type="checkbox" />
            {t("Нужен замер")}
          </label>
        )}
      </fieldset>
      <p>
        {t("Предварительный итог: {price}", {
          price: price(cartTotal + delivery),
        })}
      </p>
      <p className="shop-order-note">
        {t(
          demo
            ? "Тестовый режим. Введите вымышленные имя, телефон и адрес."
            : "Контактные данные будут переданы магазину для обработки заявки.",
        )}
      </p>
      {available === false && (
        <p role="alert">
          {t("Приём заявок пока не подключён. Расчёт можно скачать в корзине.")}
        </p>
      )}
      {status === "invalid" && (
        <p role="alert">
          {t("Проверьте имя, номер телефона и адрес доставки.")}
        </p>
      )}
      {status === "failed" && (
        <p role="alert">
          {t("Не удалось подтвердить отправку. Попробуйте ещё раз.")}
        </p>
      )}
      <div className="shop-order-actions">
        <button
          type="submit"
          className="shop-button"
          disabled={!available || status === "sending"}
        >
          {t(status === "sending" ? "Отправляем…" : "Отправить заявку")}
        </button>
        <button
          type="button"
          className="shop-text-link"
          onClick={onBack}
          disabled={status === "sending"}
        >
          {t("К корзине")}
        </button>
      </div>
    </form>
  );
}
