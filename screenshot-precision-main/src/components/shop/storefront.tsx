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
  paginate,
  sortProducts,
  type SortKey,
} from "@/lib/catalog-search";
import { discountPercent, formatPrice, stockLabel } from "@/lib/pricing";
import { useShop } from "@/lib/shop-store";
import { FREE_DELIVERY_FROM, STORE } from "@/lib/store-config";

import { ProductDetails, ShopPanel, type Panel } from "./shop-dialogs";

const SERVICES = [
  {
    icon: Truck,
    title: "Доставка",
    detail: `Бесплатно от ${formatPrice(FREE_DELIVERY_FROM)}`,
  },
  {
    icon: Ruler,
    title: "Замер",
    detail: "Бесплатно при заказе установки",
  },
  {
    icon: Wrench,
    title: "Установка",
    detail: "Гарантия на монтаж два года",
  },
];

function Brand() {
  return (
    <a
      href="#top"
      className="shop-brand"
      aria-label="Портал, в начало страницы"
    >
      <DoorClosed aria-hidden="true" size={30} strokeWidth={1.4} />
      <span>
        {STORE.name}
        <small>{STORE.tagline}</small>
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
          aria-label={`Подробнее: ${product.name}`}
        >
          <img src={product.image} alt="" loading="lazy" />
        </button>
        {discount > 0 ? (
          <span className="shop-badge shop-badge-sale">−{discount}%</span>
        ) : (
          badge && <span className="shop-badge">{BADGE_LABELS[badge]}</span>
        )}
        <button
          type="button"
          className="shop-icon shop-save"
          aria-label={`Избранное: ${product.name}`}
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
        <p className="shop-card-brand">{brandName(product.brand)}</p>
        <h3>
          <button type="button" onClick={onOpen}>
            {product.name}
          </button>
        </h3>
        <p className="shop-price">
          <strong>{formatPrice(product.price)}</strong>
          {discount > 0 && product.oldPrice && (
            <del>{formatPrice(product.oldPrice)}</del>
          )}
        </p>
        <span className="shop-stock" data-stock={product.stock}>
          {stockLabel(product.stock)}
        </span>
      </div>
    </article>
  );
}

export function Storefront() {
  const { cartCount, favorites, compare } = useShop();
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
  const filtered = sortProducts(
    filterProducts(PRODUCTS, category, { q: query.trim(), stock }),
    sort,
  );
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
      <a className="shop-skip" href="#catalog">
        Перейти к каталогу
      </a>
      <div className="shop-top">
        <div className="shop-wrap">
          <span>
            <MapPin size={15} aria-hidden="true" /> Ашхабад
          </span>
          <span>{STORE.hours}</span>
        </div>
      </div>
      <header className="shop-header">
        <div className="shop-wrap shop-header-row">
          <Brand />
          <nav className="shop-nav" aria-label="Основное меню">
            <a href="#catalog" onClick={() => selectCategory("all")}>
              Каталог
            </a>
            <a href="#catalog" onClick={() => selectCategory("interior")}>
              Межкомнатные
            </a>
            <a href="#catalog" onClick={() => selectCategory("entrance")}>
              Входные
            </a>
            <a href="#catalog" onClick={() => selectCategory("hardware")}>
              Фурнитура
            </a>
            <a href="#services">Услуги</a>
          </nav>
          <div className="shop-header-actions">
            <button
              type="button"
              className="shop-icon"
              aria-label="Поиск по каталогу"
              onClick={() => searchRef.current?.focus()}
            >
              <Search size={21} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="shop-icon"
              aria-label="Избранное"
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
              aria-label="Сравнение"
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
              aria-label="Корзина"
              onClick={() => openPanel("cart")}
            >
              <ShoppingBag size={20} aria-hidden="true" />
              {cartCount > 0 && <span className="shop-count">{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>
      <main>
        <section className="shop-hero shop-wrap" aria-labelledby="hero-title">
          <div className="shop-hero-inner">
            <div className="shop-hero-copy">
              <p className="shop-kicker">Двери и фурнитура в Ашхабаде</p>
              <h1 id="hero-title">
                Двери для
                <br />
                вашего дома
              </h1>
              <p className="shop-hero-text">
                Подберите межкомнатные и входные двери, ручки и комплектующие
                для вашего интерьера.
              </p>
              <a className="shop-button" href="#catalog">
                Смотреть каталог
              </a>
            </div>
            <img
              className="shop-hero-image"
              src={showroom}
              alt="Деревянные раздвижные двери в светлой гостиной"
              fetchPriority="high"
            />
          </div>
        </section>
        <section
          id="services"
          className="shop-services shop-wrap"
          aria-label="Услуги магазина"
        >
          {SERVICES.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="shop-service">
              <Icon size={26} strokeWidth={1.5} aria-hidden="true" />
              <div>
                <strong>{title}</strong>
                <p>{detail}</p>
              </div>
            </div>
          ))}
        </section>
        <section className="shop-catalog shop-wrap" aria-labelledby="catalog">
          <div className="shop-catalog-heading">
            <h2 id="catalog" tabIndex={-1} ref={catalogRef}>
              Каталог
            </h2>
            <div className="shop-search">
              <Search size={20} aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                aria-label="Поиск по каталогу"
                placeholder="Название или коллекция"
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
                  aria-label="Очистить поиск"
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
          <div
            className="shop-categories"
            aria-label="Категории каталога"
            role="group"
          >
            {CATALOG_SLUGS.map((slug) => (
              <button
                type="button"
                key={slug}
                aria-pressed={category === slug}
                onClick={() => selectCategory(slug)}
              >
                {CATALOG_TITLES[slug]}
              </button>
            ))}
          </div>
          <div className="shop-toolbar">
            <p role="status">Найдено товаров: {filtered.length}</p>
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
                В наличии
              </label>
              <label className="shop-sort">
                <span className="sr-only">Сортировка</span>
                <select
                  value={sort}
                  onChange={(event) => {
                    setSort(event.target.value as SortKey);
                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
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
              <h3>Товары не найдены</h3>
              <p>Попробуйте изменить запрос или сбросить фильтры.</p>
              <button
                type="button"
                className="shop-button"
                onClick={() => {
                  selectCategory("all");
                  setQuery("");
                  setStock(false);
                }}
              >
                Сбросить фильтры
              </button>
            </div>
          )}
          {pages > 1 && (
            <nav className="shop-pagination" aria-label="Страницы каталога">
              {Array.from({ length: pages }, (_, index) => index + 1).map(
                (number) => (
                  <button
                    type="button"
                    key={number}
                    aria-label={`Страница ${number}`}
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
          <a href="#catalog">Каталог</a>
          <a href="#services">Доставка и установка</a>
          <span>Ашхабад · {STORE.hours.toLowerCase()}</span>
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
      <Toaster position="bottom-center" closeButton />
    </div>
  );
}
