import { ChevronDown, DoorClosed, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductCard } from "@/components/shop/product-card";
import {
  CATALOG_SLUGS,
  CATALOG_TITLES,
  type CatalogSlug,
  type Product,
} from "@/data/catalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CatalogKind, CatalogPosition } from "@/lib/live-catalog";
import { useShop } from "@/lib/shop-store";
import {
  SORT_OPTIONS,
  filterProducts,
  matchesQuery,
  paginate,
  sortProducts,
  type SortKey,
} from "@/lib/catalog-search";
import { useShopLocale } from "@/lib/shop-locale";
import { STORE } from "@/lib/store-config";

export const DOOR_CATALOG_TITLE = "Каталог дверей и фурнитуры";

type Source = "all" | "priceList" | "demo";
type Category = CatalogKind | CatalogSlug;

const groups: Record<CatalogKind, string> = {
  wood: "Деревянные двери",
  steel: "Стальные двери",
  hardware: "Фурнитура",
  trim: "Погонаж",
};

function DoorDetails({
  item,
  close,
  restoreFocus,
}: {
  item: CatalogPosition;
  close: () => void;
  restoreFocus: (event: Event) => void;
}) {
  const { t, locale } = useShopLocale();
  const price = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="shop-dialog shop-panel-wide workbook-dialog"
        closeLabel={t("Закрыть")}
        onCloseAutoFocus={restoreFocus}
      >
        <div className="workbook-dialog-heading">
          <img src={item.image} alt="" width={105} height={140} />
          <div>
            <DialogTitle className="shop-dialog-title">
              {t(item.name)}
            </DialogTitle>
            <DialogDescription className="shop-dialog-description">
              {t(item.detail)}
            </DialogDescription>
            {item.image.startsWith("/catalog-doors/") && (
              <p>{t("Иллюстрация по описанию")}</p>
            )}
          </div>
        </div>
        <div
          className="shop-comparison"
          role="region"
          aria-label={t("Размеры и цены")}
          tabIndex={0}
        >
          <table className="workbook-variants">
            <thead>
              <tr>
                <th scope="col">{t("Строка Excel")}</th>
                <th scope="col">{t("Ширина × высота, мм")}</th>
                <th scope="col">{t("Размер в названии")}</th>
                <th scope="col">{t("Поле «Длина»")}</th>
                <th scope="col">{t("Открывание")}</th>
                <th scope="col">{item.row ? "50% · USD" : t("Цена, USD")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{item.row ?? "—"}</th>
                <td>
                  {item.width && item.height
                    ? `${item.width} × ${item.height}`
                    : "—"}
                </td>
                <td>
                  {item.namedSize ?? item.namedWidth ?? "—"}
                  {item.namedWidth !== undefined &&
                    item.namedWidth !== item.width && (
                      <strong className="workbook-discrepancy">
                        {t("Ширина расходится")}
                      </strong>
                    )}
                </td>
                <td>{item.listedLength ?? "—"}</td>
                <td>{item.opening ? t(item.opening) : "—"}</td>
                <td>{price.format(item.price)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        {item.row && (
          <p className="workbook-note">
            {t(
              "Размеры показаны по исходным записям. Подпись «см» в Excel интерпретирована как «мм» для ширины и высоты.",
            )}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DoorCatalog({
  onProduct,
}: {
  onProduct: (product: Product) => void;
}) {
  const { t, productText } = useShopLocale();
  const { positions, products, catalogStatus } = useShop();
  const [category, setCategory] = useState<Category>("all");
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [stock, setStock] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CatalogPosition | null>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = `${t(DOOR_CATALOG_TITLE)} — ${t(STORE.name)}`;
  }, [t]);

  const needle = query.trim().toLowerCase();
  const fromWorkbook =
    source === "demo"
      ? []
      : positions.filter((item) => {
          if (category !== "all" && category !== item.kind) return false;
          if (!needle) return true;
          const { namedSize, width, namedWidth, height, opening } = item;
          const fields = [
            item.name,
            item.detail,
            t(item.name),
            t(item.detail),
            namedSize,
            width,
            namedWidth,
            height,
            `${width} × ${height}`,
            opening,
            opening && t(opening),
          ];
          return fields.some(
            (field) =>
              field !== undefined &&
              String(field).toLowerCase().includes(needle),
          );
        });
  const fromDemo =
    source === "priceList" || category === "wood" || category === "steel"
      ? []
      : filterProducts(products, category, {
          stock: source === "demo" && stock,
        }).filter((product) => {
          if (!needle) return true;
          const { name, description } = productText(product);
          return (
            matchesQuery(product, needle) ||
            [name, description, t(product.collection)].some((text) =>
              text.toLowerCase().includes(needle),
            )
          );
        });
  const entries = [
    ...fromWorkbook.map((item) => ({ item, source: "priceList" as const })),
    ...sortProducts(fromDemo, source === "demo" ? sort : "popular").map(
      (product) => ({ product, source: "demo" as const }),
    ),
  ];
  const { items, pages, current } = paginate(entries, page);

  return (
    <div className="shop-wrap workbook-main">
      <header className="workbook-header">
        <div className="workbook-header-copy">
          <p className="workbook-brand">
            <DoorClosed size={24} aria-hidden="true" /> {t(STORE.name)}
          </p>
          <h1>{t(DOOR_CATALOG_TITLE)}</h1>
        </div>
        <div className="workbook-cover" aria-hidden="true">
          <img
            src="/catalog-doors/egger-oak.webp"
            alt=""
            width={150}
            height={200}
          />
          <img
            src="/catalog-doors/steel-single.webp"
            alt=""
            width={150}
            height={200}
          />
        </div>
      </header>
      <p className="workbook-note">
        {t(
          "Изображения сгенерированы по отделке или типу двери. Цены взяты из колонки 50% исходного прайс-листа и указаны в USD. Наличие в файле не указано.",
        )}{" "}
        {t("Цены и наличие демотоваров приведены для примера.")}
      </p>
      <div className="workbook-controls">
        <label className="shop-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">{t("Поиск по каталогу")}</span>
          <input
            id="door-search"
            type="search"
            value={query}
            placeholder={t("Модель, отделка или размер")}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label className="shop-sort">
          <span className="sr-only">{t("Категории каталога")}</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as Category);
              setPage(1);
            }}
          >
            <option value="all">{t("Все категории")}</option>
            {source !== "demo" && (
              <>
                <option value="wood">{t(groups.wood)}</option>
                <option value="steel">{t(groups.steel)}</option>
              </>
            )}
            {CATALOG_SLUGS.filter(
              (slug) =>
                slug !== "all" &&
                (source !== "priceList" ||
                  slug === "hardware" ||
                  slug === "trim"),
            ).map((slug) => (
              <option key={slug} value={slug}>
                {t(CATALOG_TITLES[slug])}
              </option>
            ))}
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
        <label className="shop-sort">
          <span className="sr-only">{t("Источник товаров")}</span>
          <select
            value={source}
            onChange={(event) => {
              setSource(event.target.value as Source);
              setCategory("all");
              setPage(1);
            }}
          >
            <option value="all">{t("Все товары")}</option>
            <option value="priceList">{t("Основной каталог")}</option>
            <option value="demo">{t("Демотовары")}</option>
          </select>
          <ChevronDown size={16} aria-hidden="true" />
        </label>
        {source === "demo" && (
          <>
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
          </>
        )}
      </div>
      <p className="workbook-results" role="status">
        {catalogStatus === "ready"
          ? t("Найдено позиций: {count}", { count: entries.length })
          : t(
              catalogStatus === "loading"
                ? "Загружаем каталог…"
                : "Каталог временно недоступен. Обновите страницу.",
            )}
      </p>
      {catalogStatus === "ready" &&
        (items.length ? (
          <div className="shop-grid workbook-grid">
            {items.map((entry) => {
              if (entry.source === "demo") {
                return (
                  <ProductCard
                    key={entry.product.id}
                    product={entry.product}
                    onOpen={() => onProduct(entry.product)}
                  />
                );
              }
              const { item } = entry;
              return (
                <article className="shop-card" key={item.id}>
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    width={314}
                    height={418}
                  />
                  <div className="shop-card-body">
                    <p className="shop-card-brand">{t(groups[item.kind])}</p>
                    <h2>{t(item.name)}</h2>
                    <p>{t(item.detail)}</p>
                    {(item.namedSize ||
                      (item.width && item.height) ||
                      item.opening) && (
                      <p>
                        {item.namedSize ??
                          (item.width && item.height
                            ? `${item.width} × ${item.height}`
                            : "")}{" "}
                        {item.width && item.height ? t("мм") : ""}
                        {item.opening && ` · ${t(item.opening)}`}
                      </p>
                    )}
                    <button
                      type="button"
                      className="shop-button"
                      onClick={(event) => {
                        opener.current = event.currentTarget;
                        setSelected(item);
                      }}
                      aria-label={t("Размеры и цены для {name}", {
                        name: item.row
                          ? `${t(item.name)} · ${t(item.detail)} · ${t("Строка Excel")} ${item.row}`
                          : t(item.name),
                      })}
                    >
                      {t("Размеры и цены")}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="shop-empty">{t("Товары не найдены")}</p>
        ))}
      {catalogStatus === "ready" && pages > 1 && (
        <nav className="shop-pagination" aria-label={t("Страницы каталога")}>
          {Array.from({ length: pages }, (_, index) => index + 1).map(
            (number) => (
              <button
                type="button"
                key={number}
                aria-label={t("Страница {number}", { number })}
                aria-current={current === number ? "page" : undefined}
                onClick={() => {
                  setPage(number);
                  window.scrollTo({ top: 0 });
                }}
              >
                {number}
              </button>
            ),
          )}
        </nav>
      )}
      {selected && (
        <DoorDetails
          item={selected}
          close={() => setSelected(null)}
          restoreFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        />
      )}
    </div>
  );
}
