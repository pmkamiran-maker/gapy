/** Public business details. Set only values verified by the store. */
interface StoreConfig {
  name: string;
  tagline: string;
  hours?: string;
  phone?: string;
  email?: string;
  address?: string;
  verifiedCatalog: boolean;
  verifiedDetails: boolean;
  currency: string;
}

export const STORE: StoreConfig = {
  name: "Портал",
  tagline: "Двери и фурнитура",
  hours: "Ежедневно 10:00–22:00",
  address: "ул. Примерная, 1",
  phone: "+993 00 00-00-00",
  email: "hello@portal-doors.example",
  verifiedCatalog: false,
  verifiedDetails: false,
  currency: "TMT",
};

/** Provisional rates used to calculate estimates until the store confirms its tariff. */
export const FREE_DELIVERY_FROM = 5000;
export const DELIVERY_PRICE = 150;
