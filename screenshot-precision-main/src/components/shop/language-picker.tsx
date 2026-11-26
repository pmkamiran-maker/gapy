import { ChevronDown } from "lucide-react";

import { LANGUAGES, useShopLocale } from "@/lib/shop-locale";

export function LanguagePicker() {
  const { locale, selectLocale, t } = useShopLocale();

  return (
    <label className="shop-language">
      <span className="sr-only">{t("Язык")}</span>
      <select
        value={locale}
        onChange={(event) => {
          const language = LANGUAGES.find(
            (option) => option.locale === event.target.value,
          );
          if (language) selectLocale(language.locale);
        }}
      >
        {LANGUAGES.map(({ locale: code, label, name }) => (
          <option key={code} value={code} lang={code} aria-label={name}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </label>
  );
}
