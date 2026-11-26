import { useShopLocale } from "@/lib/shop-locale";
import { useRef, useState } from "react";
import {
  ChevronDown,
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
  X,
} from "lucide-react";
import { Toaster } from "sonner";

import showroom from "@/assets/work-1.jpg";
import {
  BADGE_LABELS,
  CATALOG_SLUGS,
  CATALOG_TITLES,
  PRODUCTS,
  brandName,
  type CatalogSlug,
  type Product,
} from "@/data/catalog";
import {
  SORT_OPTIONS,
  filterProducts,
  matchesQuery,
  paginate,
  sortProducts,
  type SortKey,
} from "@/lib/catalog-search";
import { discountPercent, stockLabel } from "@/lib/pricing";
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
    <a
      href="#top"
      className="shop-brand"
      aria-label={t("Портал, в начало страницы")}
    >
      <DoorClosed aria-hidden="true" size={30} strokeWidth={1.4} />
      <span>
        {t(STORE.name)}
        <small>{t(STORE.tagline)}</small>
      </span>
    </a>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: () => void;
}) {
  const { isFavorite, toggleFavorite } = useShop();
  const { t, price, productText } = useShopLocale();
  const { name } = productText(product);
  const favorite = isFavorite(product.id);
  const discount = discountPercent(product.price, product.oldPrice);
  const badge = product.badges[0];

  return (
    <article className="shop-card">
      <div className="shop-card-media">
        <button
          type="button"
          className="shop-card-image"
          onClick={onOpen}
          aria-label={t("Подробнее: {name}", { name })}
        >
          <img src={product.image} alt="" loading="lazy" />
        </button>
        {discount > 0 ? (
          <span className="shop-badge shop-badge-sale">−{discount}%</span>
        ) : (
          badge && <span className="shop-badge">{t(BADGE_LABELS[badge])}</span>
        )}
        <button
          type="button"
          className="shop-icon shop-save"
          aria-label={t("Избранное: {name}", { name })}
          aria-pressed={favorite}
          onClick={() => toggleFavorite(product.id)}
        >
          <Heart
            size={19}
            fill={favorite ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="shop-card-body">
        <p className="shop-card-brand">{t(brandName(product.brand))}</p>
        <h3>
          <button type="button" onClick={onOpen}>
            {name}
          </button>
        </h3>
        <p className="shop-price">
          <strong>{price(product.price)}</strong>
          {discount > 0 && product.oldPrice && (
            <del>{price(product.oldPrice)}</del>
          )}
        </p>
        <span className="shop-stock" data-stock={product.stock}>
          {t(stockLabel(product.stock))}
        </span>
      </div>
    </article>
  );
}

export function Storefront() {
  const { cartCount, favorites, compare } = useShop();
  const { t, price, productText } = useShopLocale();
  const [category, setCategory] = useState<CatalogSlug>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("popular");
  const [stock, setStock] = useState(false);
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const catalogRef = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const switchingDialog = useRef(false);
  const needle = query.trim().toLowerCase();
  const available = filterProducts(PRODUCTS, category, { stock });
  const results = needle
    ? available.filter((item) => {
        const { name, description } = productText(item);
        return (
          matchesQuery(item, needle) ||
          [name, description, t(item.collection)].some((value) =>
            value.toLowerCase().includes(needle),
          )
        );
      })
    : available;
  const filtered = sortProducts(results, sort);
  const { items, current, pages } = paginate(filtered, page);

  function selectCategory(value: CatalogSlug) {
    setCategory(value);
    setPage(1);
  }

  function jumpToCatalog() {
    catalogRef.current?.focus({ preventScroll: true });
    catalogRef.current?.scrollIntoView({ block: "start" });
  }

  function changePage(value: number) {
    setPage(value);
    jumpToCatalog();
  }

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
    else catalogRef.current?.focus();
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
            <a href="#catalog" onClick={() => selectCategory("all")}>
              {t("Демокаталог")}
            </a>
            <a href="#services">{t("Услуги")}</a>
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
      <main id="storefront-main" tabIndex={-1}>
        <section className="shop-hero shop-wrap" aria-labelledby="hero-title">
          <div className="shop-hero-inner">
            <div className="shop-hero-copy">
              <p className="shop-kicker">{t("Двери и фурнитура в Ашхабаде")}</p>
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
        <section className="shop-catalog shop-wrap" aria-labelledby="catalog">
          <div className="shop-catalog-heading">
            <h2 id="catalog" tabIndex={-1} ref={catalogRef}>
              {t("Демокаталог")}
            </h2>
            <div className="shop-search">
              <Search size={20} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                aria-label={t("Поиск по каталогу")}
                placeholder={t("Название или коллекция")}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
              {query && (
                <button
                  type="button"
                  className="shop-icon"
                  aria-label={t("Очистить поиск")}
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                    searchRef.current?.focus();
                  }}
                >
                  <X size={17} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          {!STORE.verifiedCatalog && (
            <p className="shop-catalog-note">
              {t("Цены и наличие приведены для примера.")}
            </p>
          )}
          <div
            className="shop-categories"
            aria-label={t("Категории каталога")}
            role="group"
          >
            {CATALOG_SLUGS.map((slug) => (
              <button
                type="button"
                key={slug}
                aria-pressed={category === slug}
                onClick={() => selectCategory(slug)}
              >
                {t(CATALOG_TITLES[slug])}
              </button>
            ))}
          </div>
          <div className="shop-toolbar">
            <p role="status">
              {t("Найдено товаров: {count}", { count: filtered.length })}
            </p>
            <div className="shop-filters">
              <label className="shop-stock-filter">
                <input
                  type="checkbox"
                  checked={stock}
                  onChange={(event) => {
                    setStock(event.target.checked);
                    setPage(1);
                  }}
                />
                {t("В наличии")}
              </label>
              <label className="shop-sort">
                <span className="sr-only">{t("Сортировка")}</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortKey);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {t(label)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} aria-hidden="true" />
              </label>
            </div>
          </div>
          {items.length > 0 ? (
            <div className="shop-grid">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  onOpen={() => openProduct(item)}
                />
              ))}
            </div>
          ) : (
            <div className="shop-empty">
              <h3>{t("Товары не найдены")}</h3>
              <p>{t("Попробуйте изменить запрос или сбросить фильтры.")}</p>
              <button
                type="button"
                className="shop-button"
                onClick={() => {
                  selectCategory("all");
                  setQuery("");
                  setStock(false);
                }}
              >
                {t("Сбросить фильтры")}
              </button>
            </div>
          )}
          {pages > 1 && (
            <nav
              className="shop-pagination"
              aria-label={t("Страницы каталога")}
            >
              {Array.from({ length: pages }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    type="button"
                    key={number}
                    aria-label={t("Страница {number}", { number })}
                    aria-current={number === current ? "page" : undefined}
                    onClick={() => changePage(number)}
                  >
                    {number}
                  </button>
                ),
              )}
            </nav>
          )}
        </section>
      </main>
      <footer className="shop-footer">
        <div className="shop-wrap">
          <Brand />
          <a href="/doors">{t("Каталог из прайс-листа")}</a>
          <a href="#services">{t("Доставка и установка")}</a>
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
