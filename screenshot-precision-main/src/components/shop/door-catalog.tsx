import { ChevronDown, DoorClosed, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductCard } from "@/components/shop/product-card";
import {
  CATALOG_SLUGS,
  CATALOG_TITLES,
  PRODUCTS,
  type CatalogSlug,
  type Product,
} from "@/data/catalog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  workbookDoorImage,
  workbookDoors,
  type DoorKind,
  type DoorVariant,
  type WorkbookDoor,
} from "@/data/workbook-doors";
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
type Category = DoorKind | CatalogSlug;

const groups: Record<DoorKind, string> = {
  wood: "Деревянные двери",
  steel: "Стальные двери",
};

const positions = workbookDoors
  .flatMap((door) => door.variants.map((variant) => ({ door, variant })))
  .sort((a, b) => a.variant.row - b.variant.row);

function DoorDetails({
  door,
  variant,
  close,
  restoreFocus,
}: {
  door: WorkbookDoor;
  variant: DoorVariant;
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
          <img src={workbookDoorImage(door)} alt="" width={105} height={140} />
          <div>
            <DialogTitle className="shop-dialog-title">
              {t(door.model)}
            </DialogTitle>
            <DialogDescription className="shop-dialog-description">
              {t(door.detail)}
            </DialogDescription>
            <p>{t("Иллюстрация по описанию")}</p>
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
                <th scope="col">50% · USD</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">{variant.row}</th>
                <td>
                  {variant.width} × {variant.height}
                </td>
                <td>
                  {variant.namedSize ?? variant.namedWidth ?? "—"}
                  {variant.namedWidth !== undefined &&
                    variant.namedWidth !== variant.width && (
                      <strong className="workbook-discrepancy">
                        {t("Ширина расходится")}
                      </strong>
                    )}
                </td>
                <td>{variant.listedLength ?? "—"}</td>
                <td>{variant.opening ? t(variant.opening) : "—"}</td>
                <td>{price.format(variant.price50)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="workbook-note">
          {t(
            "Размеры показаны по исходным записям. Подпись «см» в Excel интерпретирована как «мм» для ширины и высоты.",
          )}
        </p>
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
  const [category, setCategory] = useState<Category>("all");
  const [source, setSource] = useState<Source>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [stock, setStock] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<(typeof positions)[number] | null>(
    null,
  );
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = `${t(DOOR_CATALOG_TITLE)} — ${t(STORE.name)}`;
  }, [t]);

  const needle = query.trim().toLowerCase();
  const fromWorkbook =
    source === "demo"
      ? []
      : positions.filter(({ door, variant }) => {
          if (category !== "all" && category !== door.kind) return false;
          if (!needle) return true;
          const { namedSize, width, namedWidth, height, opening } = variant;
          const fields = [
            door.model,
            door.detail,
            t(door.model),
            t(door.detail),
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
      : filterProducts(PRODUCTS, category, {
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
    ...fromWorkbook.map((position) => ({
      ...position,
      source: "priceList" as const,
    })),
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
            {source !== "priceList" &&
              CATALOG_SLUGS.filter((slug) => slug !== "all").map((slug) => (
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
            <option value="priceList">{t("Из прайс-листа")}</option>
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
        {t("Найдено позиций: {count}", { count: entries.length })}
      </p>
      {items.length ? (
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
            const { door, variant } = entry;
            return (
              <article className="shop-card" key={variant.row}>
                <img
                  src={workbookDoorImage(door)}
                  alt=""
                  loading="lazy"
                  width={314}
                  height={418}
                />
                <div className="shop-card-body">
                  <p className="shop-card-brand">{t(groups[door.kind])}</p>
                  <h2>{t(door.model)}</h2>
                  <p>{t(door.detail)}</p>
                  <p>
                    {variant.namedSize ??
                      `${variant.width} × ${variant.height}`}{" "}
                    {t("мм")}
                    {variant.opening && ` · ${t(variant.opening)}`}
                  </p>
                  <button
                    type="button"
                    className="shop-button"
                    onClick={(event) => {
                      opener.current = event.currentTarget;
                      setSelected({ door, variant });
                    }}
                    aria-label={t("Размеры и цены для {name}", {
                      name: `${t(door.model)} · ${t(door.detail)} · ${t("Строка Excel")} ${variant.row}`,
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
      )}
      {pages > 1 && (
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
          door={selected.door}
          variant={selected.variant}
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
