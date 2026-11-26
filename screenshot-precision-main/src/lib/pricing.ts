import { DELIVERY_PRICE, FREE_DELIVERY_FROM, STORE } from "./store-config";

export function formatPrice(value: number, locale = "ru-RU"): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value));
  return `${n.replace(/\u00a0/g, " ")} ${STORE.currency}`;
}

export function discountPercent(price: number, oldPrice?: number): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}

export function deliveryCost(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_PRICE;
}

export function amountToFreeDelivery(subtotal: number): number {
  return Math.max(0, FREE_DELIVERY_FROM - subtotal);
}

export type StockState = "in" | "order" | "out";

export interface BuyAction {
  label: string;
  disabled: boolean;
  variant: "default" | "bronze" | "soldout";
}

/** The product button depends on stock: in stock → cart, on request → order, sold out → disabled. */
export function buyAction(stock: StockState): BuyAction {
  switch (stock) {
    case "in":
      return { label: "В корзину", disabled: false, variant: "default" };
    case "order":
      return { label: "Заказать", disabled: false, variant: "bronze" };
    case "out":
      return { label: "Закончился", disabled: true, variant: "soldout" };
  }
}

export function stockLabel(stock: StockState): string {
  return stock === "in" ? "В наличии" : stock === "order" ? "Под заказ" : "Нет в наличии";
}
