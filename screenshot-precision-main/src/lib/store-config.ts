/** Store-wide settings: name, contacts, currency and delivery rules. */
export const STORE = {
  name: "Портал",
  tagline: "Двери и фурнитура",
  hours: "Ежедневно 10:00–22:00",
  phones: [
    { label: "Шоурум", value: "+993 12 00-00-00" },
    { label: "Интернет-магазин", value: "+993 65 00-00-00" },
    { label: "Монтаж и замер", value: "+993 61 00-00-00" },
  ],
  email: "hello@portal-doors.example",
  address: "г. Ашхабад, ул. Примерная, 1 (шоурум)",
  legal: "ИП «Портал» · Регистрационный номер 000000000 · Реквизиты будут добавлены",
  currency: "TMT",
} as const;

/** Orders at or above this sum get free delivery. */
export const FREE_DELIVERY_FROM = 5000;
/** Delivery price below the free threshold. */
export const DELIVERY_PRICE = 150;
