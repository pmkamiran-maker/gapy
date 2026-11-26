import { useShopLocale } from "@/lib/shop-locale";
import { useRef, useState, type ReactNode } from "react";
import {
  DoorClosed,
  Heart,
  MapPin,
  Ruler,
  Scale,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  Wrench,
} from "lucide-react";
import { Toaster } from "sonner";

import showroom from "@/assets/work-1.jpg";
import type { Product } from "@/data/catalog";
import { useShop } from "@/lib/shop-store";
import { DELIVERY_PRICE, FREE_DELIVERY_FROM, STORE } from "@/lib/store-config";

import { LanguagePicker } from "./language-picker";
import { ProductDetails, ShopPanel, type Panel } from "./shop-dialogs";

const SERVICES = [
  {
    icon: Truck,
    title: "Доставка",
  },
  {
    icon: Ruler,
    title: "Замер",
  },
  {
    icon: Wrench,
    title: "Установка",
  },
];

function Brand() {
  const { t } = useShopLocale();
  return (
    <a href="/" className="shop-brand" aria-label={t("Портал, на главную")}>
      <DoorClosed aria-hidden="true" size={30} strokeWidth={1.4} />
      <span>
        {t(STORE.name)}
        <small>{t(STORE.tagline)}</small>
      </span>
    </a>
  );
}

export function Storefront({
  catalog,
}: {
  catalog?: (openProduct: (product: Product) => void) => ReactNode;
}) {
  const { cartCount, favorites, compare } = useShop();
  const { t } = useShopLocale();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const switchingDialog = useRef(false);
  const servicesLink = catalog ? "/#services" : "#services";

  function openProduct(value: Product) {
    switchingDialog.current = panel !== null;
    if (!panel) previousFocus.current = document.activeElement as HTMLElement;
    setPanel(null);
    setProduct(value);
  }

  function openPanel(value: Panel) {
    switchingDialog.current = false;
    previousFocus.current = document.activeElement as HTMLElement;
    setPanel(value);
  }

  function restoreFocus(event: Event) {
    event.preventDefault();
    if (previousFocus.current?.isConnected) previousFocus.current.focus();
    else mainRef.current?.focus();
  }

  return (
    <div className="shop" id="top">
      <a className="shop-skip" href="#storefront-main">
        {t("Перейти к содержимому")}
      </a>
      <div className="shop-top">
        <div className="shop-wrap">
          <span>
            <MapPin size={15} aria-hidden="true" /> {t("Ашхабад")}
          </span>
          <div className="shop-top-settings">
            {STORE.hours && (
              <span className="shop-hours">{t(STORE.hours)}</span>
            )}
            <a className="shop-login-link" href="/login">
              <UserRound size={17} aria-hidden="true" />
              {t("Аккаунт")}
            </a>
            <LanguagePicker />
          </div>
        </div>
      </div>
      <header className="shop-header">
        <div className="shop-wrap shop-header-row">
          <Brand />
          <nav className="shop-nav" aria-label={t("Основное меню")}>
            <a href="/doors">{t("Каталог")}</a>
            <a href={servicesLink}>{t("Услуги")}</a>
          </nav>
          <div className="shop-header-actions">
            <a
              className="shop-icon"
              href="/doors#door-search"
              aria-label={t("Поиск по каталогу")}
            >
              <Search size={21} aria-hidden="true" />
            </a>
            <button
              type="button"
              className="shop-icon"
              aria-label={t("Избранное")}
              onClick={() => openPanel("favorites")}
            >
              <Heart size={21} aria-hidden="true" />
              {favorites.length > 0 && (
                <span className="shop-count">{favorites.length}</span>
              )}
            </button>
            <button
              type="button"
              className="shop-icon"
              aria-label={t("Сравнение")}
              onClick={() => openPanel("compare")}
            >
              <Scale size={21} aria-hidden="true" />
              {compare.length > 0 && (
                <span className="shop-count">{compare.length}</span>
              )}
            </button>
            <button
              type="button"
              className="shop-icon shop-header-cart"
              aria-label={t("Корзина")}
              onClick={() => openPanel("cart")}
            >
              <ShoppingBag size={20} aria-hidden="true" />
              {cartCount > 0 && <span className="shop-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>
      <main id="storefront-main" ref={mainRef} tabIndex={-1}>
        {catalog ? (
          catalog(openProduct)
        ) : (
          <>
            <section
              className="shop-hero shop-wrap"
              aria-labelledby="hero-title"
            >
              <div className="shop-hero-inner">
                <div className="shop-hero-copy">
                  <p className="shop-kicker">
                    {t("Двери и фурнитура в Ашхабаде")}
                  </p>
                  <h1 id="hero-title">{t("Двери для вашего дома")}</h1>
                  <p className="shop-hero-text">
                    {t(
                      "Подберите межкомнатные и входные двери, ручки и комплектующие для вашего интерьера.",
                    )}
                  </p>
                  <a className="shop-button" href="/doors">
                    {t("Смотреть каталог")}
                  </a>
                </div>
                <img
                  className="shop-hero-image"
                  src={showroom}
                  alt={t("Деревянные раздвижные двери в светлой гостиной")}
                  fetchPriority="high"
                />
              </div>
            </section>
            <section
              id="services"
              className="shop-services shop-wrap"
              aria-label={t("Услуги магазина")}
            >
              {SERVICES.map(({ icon: Icon, title }) => (
                <div key={title} className="shop-service">
                  <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
                  <div>
                    <strong>{t(title)}</strong>
                  </div>
                </div>
              ))}
              <p className="shop-service-note">
                {t(
                  "Условия доставки и монтажа уточняются при подтверждении заявки.",
                )}
              </p>
            </section>
          </>
        )}
      </main>
      <footer className="shop-footer">
        <div className="shop-wrap">
          <Brand />
          <a href="/doors">{t("Каталог")}</a>
          <a href={servicesLink}>{t("Доставка и установка")}</a>
          <address className="shop-contact">
            <strong>
              {t(STORE.verifiedDetails ? "Контакты" : "Пример контактов")}
            </strong>
            <span>
              {t("Ашхабад")}
              {STORE.address && ` · ${t(STORE.address)}`}
            </span>
            {STORE.hours && <span>{t(STORE.hours)}</span>}
            {STORE.phone &&
              (STORE.verifiedDetails ? (
                <a href={`tel:${STORE.phone.replace(/[^+\d]/g, "")}`}>
                  {STORE.phone}
                </a>
              ) : (
                <span>{STORE.phone}</span>
              ))}
            {STORE.email &&
              (STORE.verifiedDetails ? (
                <a href={`mailto:${STORE.email}`}>{STORE.email}</a>
              ) : (
                <span>{STORE.email}</span>
              ))}
          </address>
        </div>
      </footer>
      <ShopPanel
        panel={panel}
        onClose={() => setPanel(null)}
        onProduct={openProduct}
        onCloseAutoFocus={(event) => {
          if (switchingDialog.current) event.preventDefault();
          else restoreFocus(event);
        }}
      />
      <ProductDetails
        key={product?.id}
        product={product}
        onClose={() => setProduct(null)}
        onCloseAutoFocus={restoreFocus}
      />
      <Toaster
        position="bottom-center"
        closeButton
        containerAriaLabel={t("Уведомления")}
        toastOptions={{ closeButtonAriaLabel: t("Закрыть") }}
      />
    </div>
  );
}
