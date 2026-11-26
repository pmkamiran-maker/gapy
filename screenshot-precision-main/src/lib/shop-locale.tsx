import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { shopMessages } from "@/data/shop-messages";
import { productTranslations } from "@/data/product-translations";
import type { Product } from "@/data/catalog";
import { formatPrice } from "@/lib/pricing";

export const LANGUAGES = [
  { locale: "ru", label: "RU", name: "Русский" },
  { locale: "tk", label: "TM", name: "Türkmençe" },
  { locale: "en", label: "EN", name: "English" },
] as const;

type Locale = (typeof LANGUAGES)[number]["locale"];
const STORAGE_KEY = "portal-language";
const TITLE = "Портал — двери и фурнитура в Ашхабаде";
const DESCRIPTION =
  "Межкомнатные и входные двери, ручки и комплектующие. Подберите модель, сравните варианты и рассчитайте стоимость комплекта.";

function translate(
  locale: Locale,
  source: string,
  values?: Record<string, string | number>,
) {
  const translated = Object.hasOwn(shopMessages, source)
    ? shopMessages[source]
    : undefined;
  const message =
    locale === "ru" || !translated
      ? source
      : translated[locale === "tk" ? 0 : 1];
  return values
    ? message.replace(/\{(\w+)\}/g, (match, key: string) =>
        String(values[key] ?? match),
      )
    : message;
}

function localizedProduct(locale: Locale, product: Product) {
  const translated =
    locale === "ru" ? undefined : productTranslations[product.slug]?.[locale];
  return {
    name: product.catalogText?.name ?? translated?.[0] ?? product.name,
    description: product.catalogText?.description ?? translated?.[1] ?? product.description,
  };
}

export function shopMetadata(locale: Locale = "ru") {
  return {
    title: translate(locale, TITLE),
    description: translate(locale, DESCRIPTION),
  };
}

function languageTools(locale: Locale) {
  return {
    locale,
    t: (source: string, values?: Record<string, string | number>) =>
      translate(locale, source, values),
    price: (value: number) =>
      formatPrice(value, locale === "tk" ? "tk-TM" : locale),
    productText: (product: Product) => localizedProduct(locale, product),
  };
}

const toolsByLocale = {
  ru: languageTools("ru"),
  tk: languageTools("tk"),
  en: languageTools("en"),
};
const LocaleContext = createContext({
  ...toolsByLocale.ru,
  selectLocale: (_locale: Locale) => {},
});

export function ShopLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("ru");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const language = LANGUAGES.find((option) => option.locale === stored);
      if (language) setLocale(language.locale);
    } catch {
      // Locale switching also works when browser storage is blocked.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (window.location.pathname !== "/") return;
    const { title, description } = shopMetadata(locale);
    document.title = title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
    document
      .querySelector('meta[property="og:title"]')
      ?.setAttribute("content", title);
    document
      .querySelector('meta[property="og:description"]')
      ?.setAttribute("content", description);
  }, [locale]);

  function selectLocale(next: Locale) {
    setLocale(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Keep the selection for the current page.
    }
  }

  return (
    <LocaleContext.Provider value={{ ...toolsByLocale[locale], selectLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useShopLocale() {
  return useContext(LocaleContext);
}
