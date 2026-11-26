import { ChevronDown, DoorClosed, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "@/components/shop/language-picker";
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
  type WorkbookDoor,
} from "@/data/workbook-doors";
import { paginate } from "@/lib/catalog-search";
import { useShopLocale } from "@/lib/shop-locale";
import { STORE } from "@/lib/store-config";

export const WORKBOOK_TITLE = "Каталог дверей";

const groups: Record<DoorKind, string> = {
  wood: "Деревянные двери",
  steel: "Стальные двери",
};

function DoorDetails({
  door,
  close,
  restoreFocus,
}: {
  door: WorkbookDoor;
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
                <th scope="col">45% · USD</th>
                <th scope="col">50% · USD</th>
              </tr>
            </thead>
            <tbody>
              {door.variants.map((variant) => (
                <tr key={variant.row}>
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
                  <td>{price.format(variant.price45)}</td>
                  <td>{price.format(variant.price50)}</td>
                </tr>
              ))}
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

export function WorkbookCatalog() {
  const { t } = useShopLocale();
  const [kind, setKind] = useState<DoorKind | "all">("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<WorkbookDoor | null>(null);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = `${t(WORKBOOK_TITLE)} — ${t(STORE.name)}`;
  }, [t]);

  const needle = query.trim().toLowerCase();
  const matching = workbookDoors.filter((door) => {
    if (kind !== "all" && kind !== door.kind) return false;
    const fields = [
      door.model,
      door.detail,
      t(door.model),
      t(door.detail),
      ...door.variants.flatMap(
        ({ namedSize, width, namedWidth, height, opening }) => [
          namedSize,
          width,
          namedWidth,
          height,
          opening,
          opening && t(opening),
        ],
      ),
    ];
    return fields.some(
      (field) =>
        field !== undefined && String(field).toLowerCase().includes(needle),
    );
  });
  const { items, pages, current } = paginate(matching, page);

  return (
    <div className="shop workbook-page">
      <div className="shop-top">
        <div className="shop-wrap">
          <a href="/">{t("На главную")}</a>
          <LanguagePicker />
        </div>
      </div>
      <main className="shop-wrap workbook-main">
        <header className="workbook-header">
          <div className="workbook-header-copy">
            <p className="workbook-brand">
              <DoorClosed size={24} aria-hidden="true" /> {t(STORE.name)}
            </p>
            <h1>{t(WORKBOOK_TITLE)}</h1>
            <p>{t("Деревянные и стальные двери из прайс-листа.")}</p>
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
            "Изображения сгенерированы по отделке или типу двери. Цены 45% и 50% указаны по исходной таблице в USD. Наличие в файле не указано.",
          )}
        </p>
        <div className="workbook-controls">
          <label className="shop-search">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">{t("Поиск по каталогу")}</span>
            <input
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
              value={kind}
              onChange={(event) => {
                setKind(event.target.value as DoorKind | "all");
                setPage(1);
              }}
            >
              <option value="all">{t("Весь каталог")}</option>
              <option value="wood">{t(groups.wood)}</option>
              <option value="steel">{t(groups.steel)}</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
        </div>
        <p className="workbook-results" role="status">
          {t("Найдено товаров: {count}", { count: matching.length })}
        </p>
        {items.length ? (
          <div className="shop-grid workbook-grid">
            {items.map((door) => (
              <article className="shop-card" key={door.id}>
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
                  <button
                    type="button"
                    className="shop-button"
                    onClick={(event) => {
                      opener.current = event.currentTarget;
                      setSelected(door);
                    }}
                    aria-label={t("Размеры и цены для {name}", {
                      name: `${t(door.model)} · ${t(door.detail)}`,
                    })}
                  >
                    {t("Размеры и цены")}
                  </button>
                </div>
              </article>
            ))}
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
      </main>
      {selected && (
        <DoorDetails
          door={selected}
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
