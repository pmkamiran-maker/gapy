import { useEffect, useRef, useState, type FormEvent } from "react";

import { LanguagePicker } from "@/components/shop/language-picker";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { paginate } from "@/lib/catalog-search";
import {
  applyCatalogChanges,
  availabilityLabel,
  CATALOG_AVAILABILITY,
  CATALOG_CHANGES_TABLE,
  CATALOG_KINDS,
  catalogPatchSchema,
  readCatalogChanges,
  type CatalogAvailability,
  type CatalogChange,
  type CatalogKind,
  type CatalogPatch,
} from "@/lib/live-catalog";
import { useShopLocale } from "@/lib/shop-locale";
import {
  useCatalogAdmin,
  useShopAuth,
  type AuthState,
} from "@/lib/use-shop-auth";

export const ADMIN_TITLE = "Управление каталогом";

const categoryNames: Record<CatalogKind, string> = {
  wood: "Деревянные двери",
  steel: "Стальные двери",
  hardware: "Фурнитура",
  trim: "Погонаж",
};

interface AdminItem {
  id: string;
  name: string;
  detail: string;
  price: number;
  image: string;
  kind?: CatalogKind;
  row?: number;
  availability?: CatalogAvailability;
  leadTimeDays?: number;
  width?: number;
  height?: number;
  opening?: string;
  stock?: CatalogPatch["stock"];
}

function CatalogEditor({
  item,
  existing,
  busy,
  errorMessage,
  onSave,
  onClose,
  restoreFocus,
}: {
  item: AdminItem | null;
  existing: CatalogChange | undefined;
  busy: boolean;
  errorMessage: string | undefined;
  onSave: (change: CatalogChange) => Promise<void>;
  onClose: () => void;
  restoreFocus: (event: Event) => void;
}) {
  const { t } = useShopLocale();
  const [invalid, setInvalid] = useState(false);
  const demo = item?.stock !== undefined;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const value = (name: string) => String(fields.get(name) ?? "").trim();
    const number = (name: string) => (value(name) ? Number(value(name)) : null);
    const patch: CatalogPatch = { ...existing?.patch };
    const name = value("name");
    const detail = value("detail");
    const image = value("image");
    const price = Number(value("price"));

    if (!item || item.name !== name) patch.name = name;
    if (!item || item.detail !== detail) patch.detail = detail;
    if (!item || item.price !== price) patch.price = price;
    if (image && image !== item?.image) patch.image = image;
    else if (!image) delete patch.image;
    if (demo) {
      if (value("stock") !== item.stock)
        patch.stock = value("stock") as CatalogPatch["stock"];
    } else {
      const kind = value("kind") as CatalogKind;
      const width = number("width");
      const height = number("height");
      const opening = value("opening") as CatalogPatch["opening"];
      const availability = value("availability") as CatalogAvailability;
      const leadTimeDays = number("leadTimeDays");
      if (availability !== (item?.availability ?? "unknown"))
        patch.availability = availability;
      if (leadTimeDays !== (item?.leadTimeDays ?? null))
        patch.leadTimeDays = leadTimeDays;
      if (!item || kind !== item.kind) patch.kind = kind;
      if (width !== (item?.width ?? null)) patch.width = width;
      if (height !== (item?.height ?? null)) patch.height = height;
      if (opening !== (item?.opening ?? "")) patch.opening = opening;
    }

    const parsed = catalogPatchSchema.safeParse(patch);
    if (
      !parsed.success ||
      !name ||
      value("price") === "" ||
      (demo ? !Number.isInteger(price) : /\.\d{3,}$/.test(value("price")))
    ) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    void onSave({
      id: item?.id ?? `item-${crypto.randomUUID()}`,
      hidden: existing?.hidden ?? false,
      patch: parsed.data,
    });
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent
        className="shop-dialog shop-panel-wide catalog-editor"
        closeLabel={t("Закрыть")}
        aria-describedby={undefined}
        onCloseAutoFocus={restoreFocus}
      >
        <DialogTitle className="shop-dialog-title">
          {t(item ? "Редактировать позицию" : "Добавить позицию")}
        </DialogTitle>
        <form onSubmit={submit} className="shop-order">
          <fieldset disabled={busy}>
            <label>
              {t("Название")}
              <input
                name="name"
                defaultValue={item?.name}
                required
                maxLength={180}
              />
            </label>
            <label>
              {t("Описание")}
              <textarea
                name="detail"
                defaultValue={item?.detail}
                rows={3}
                maxLength={1200}
              />
            </label>
            <div className="catalog-editor-fields">
              <label>
                {t(demo ? "Цена, TMT" : "Цена, USD")}
                <input
                  name="price"
                  type="number"
                  min="0"
                  max="9999999"
                  step={demo ? "1" : "0.01"}
                  inputMode="decimal"
                  defaultValue={item?.price}
                  required
                />
              </label>
              {demo ? (
                <label>
                  {t("Наличие")}
                  <select name="stock" defaultValue={item.stock}>
                    <option value="in">{t("В наличии")}</option>
                    <option value="order">{t("Под заказ")}</option>
                    <option value="out">{t("Нет в наличии")}</option>
                  </select>
                </label>
              ) : (
                <label>
                  {t("Категория")}
                  <select name="kind" defaultValue={item?.kind ?? "wood"}>
                    {CATALOG_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {t(categoryNames[kind])}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {!demo && (
                <>
                  <label>
                    {t("Ширина, мм")}
                    <input
                      name="width"
                      type="number"
                      min="1"
                      max="100000"
                      defaultValue={item?.width}
                    />
                  </label>
                  <label>
                    {t("Высота, мм")}
                    <input
                      name="height"
                      type="number"
                      min="1"
                      max="100000"
                      defaultValue={item?.height}
                    />
                  </label>
                  <label>
                    {t("Открывание")}
                    <select name="opening" defaultValue={item?.opening ?? ""}>
                      <option value="">—</option>
                      <option value="Левые">{t("Левые")}</option>
                      <option value="Правые">{t("Правые")}</option>
                    </select>
                  </label>
                  <label>
                    {t("Наличие")}
                    <select
                      name="availability"
                      defaultValue={item?.availability ?? "unknown"}
                    >
                      {CATALOG_AVAILABILITY.map((value) => (
                        <option key={value} value={value}>
                          {t(availabilityLabel(value))}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("Срок поставки, дней")}
                    <input
                      name="leadTimeDays"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={item?.leadTimeDays}
                    />
                  </label>
                </>
              )}
            </div>
            <label>
              {t("Ссылка на изображение")}
              <input name="image" defaultValue={item?.image} maxLength={1000} />
            </label>
            {invalid && (
              <p role="alert">
                {t(
                  "Проверьте поля позиции. Для внешнего изображения укажите HTTPS-ссылку.",
                )}
              </p>
            )}
          </fieldset>
          {errorMessage && <p role="alert">{t(errorMessage)}</p>}
          <div className="shop-order-actions">
            <button type="submit" className="shop-button" disabled={busy}>
              {t(busy ? "Сохраняем…" : "Сохранить")}
            </button>
            <button
              type="button"
              className="shop-text-link"
              disabled={busy}
              onClick={onClose}
            >
              {t("Отмена")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ReadyAuth = Extract<AuthState, { status: "ready" }>;

function CatalogManagement({ auth }: { auth: ReadyAuth }) {
  const { t, locale } = useShopLocale();
  const [changes, setChanges] = useState<CatalogChange[]>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error: boolean; text: string }>();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<AdminItem | "new" | null>(null);
  const editorOpener = useRef<HTMLButtonElement>(null);
  const token = auth.session?.access_token;

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoadFailed(false);
    void readCatalogChanges(auth.config, token, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setChanges(data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoadFailed(true);
      });
    return () => controller.abort();
  }, [auth.config, token]);

  if (loadFailed)
    return (
      <p role="alert">{t("Каталог временно недоступен. Обновите страницу.")}</p>
    );
  if (!changes) return <p role="status">{t("Загружаем каталог…")}</p>;

  const byId = new Map(changes.map((change) => [change.id, change]));
  const { positions, products } = applyCatalogChanges(changes, true);
  const all: AdminItem[] = [
    ...positions,
    ...products.map((product) => ({
      id: product.id,
      name: product.name,
      detail: product.description,
      price: product.price,
      image: product.image,
      stock: product.stock,
    })),
  ];
  const needle = query.trim().toLowerCase();
  const matching = all.filter((item) =>
    [item.name, item.detail, item.row].some(
      (value) =>
        value !== undefined && String(value).toLowerCase().includes(needle),
    ),
  );
  const { items, pages, current } = paginate(matching, page);
  const price = Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const duration = Intl.NumberFormat(locale, {
    style: "unit",
    unit: "day",
    unitDisplay: "long",
  });

  async function save(change: CatalogChange, visibilityOnly = false) {
    if (busy) return;
    const prior = byId.get(change.id);
    setBusy(true);
    setMessage(undefined);
    try {
      const table = auth.client.from(CATALOG_CHANGES_TABLE);
      const mutation = prior
        ? table
            .update(
              visibilityOnly
                ? { hidden: change.hidden }
                : { patch: change.patch },
            )
            .eq("id", change.id)
            .eq("hidden", prior.hidden)
            .eq("patch", JSON.stringify(prior.patch))
        : table.insert(change);
      const { error, data } = await mutation.select("id").single();
      if (error || data?.id !== change.id)
        throw new Error("Catalog update failed");
      setChanges((previous) => [
        ...(previous ?? []).filter(({ id }) => id !== change.id),
        change,
      ]);
      setEditor(null);
      setMessage({
        error: false,
        text: visibilityOnly
          ? change.hidden
            ? "Позиция убрана из каталога."
            : "Позиция возвращена в каталог."
          : "Позиция сохранена.",
      });
    } catch {
      setMessage({
        error: true,
        text: "Не удалось сохранить изменения. Обновите страницу и попробуйте снова.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="catalog-admin-controls">
        <label className="shop-search">
          <span className="sr-only">{t("Поиск по каталогу")}</span>
          <input
            type="search"
            value={query}
            placeholder={t("Название или строка Excel")}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <button
          type="button"
          className="shop-button"
          disabled={busy}
          onClick={(event) => {
            editorOpener.current = event.currentTarget;
            setMessage(undefined);
            setEditor("new");
          }}
        >
          {t("Добавить позицию")}
        </button>
      </div>
      {message && !editor && (
        <p
          className="catalog-admin-feedback"
          role={message.error ? "alert" : "status"}
        >
          {t(message.text)}
        </p>
      )}
      <p>{t("Найдено позиций: {count}", { count: matching.length })}</p>
      <div
        className="shop-comparison"
        role="region"
        aria-label={t(ADMIN_TITLE)}
        tabIndex={0}
      >
        <table>
          <thead>
            <tr>
              <th scope="col">{t("Название")}</th>
              <th scope="col">{t("Источник товаров")}</th>
              <th scope="col">{t("Цена")}</th>
              <th scope="col">{t("Наличие")}</th>
              <th scope="col">{t("В каталоге")}</th>
              <th scope="col">{t("Действия")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const prior = byId.get(item.id);
              const hidden = prior?.hidden ?? false;
              const demo = item.stock !== undefined;
              return (
                <tr key={item.id}>
                  <th scope="row">
                    {t(item.name)}
                    <small>
                      {[
                        item.row && `${t("Строка Excel")} ${item.row}`,
                        item.width &&
                          item.height &&
                          `${item.width} × ${item.height} ${t("мм")}`,
                        item.opening && t(item.opening),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </th>
                  <td>
                    {t(
                      demo
                        ? "Демо"
                        : item.row
                          ? "Из прайс-листа"
                          : "Добавлено вручную",
                    )}
                  </td>
                  <td>
                    {price.format(item.price)} {demo ? "TMT" : "USD"}
                  </td>
                  <td>
                    {t(
                      availabilityLabel(
                        item.stock ?? item.availability ?? "unknown",
                      ),
                    )}
                    {item.leadTimeDays !== undefined && (
                      <span className="catalog-lead-time">
                        {duration.format(item.leadTimeDays)}
                      </span>
                    )}
                  </td>
                  <td>{t(hidden ? "Скрыта" : "Показана")}</td>
                  <td>
                    <div className="catalog-admin-actions">
                      <button
                        type="button"
                        disabled={busy}
                        className="shop-text-link"
                        onClick={(event) => {
                          editorOpener.current = event.currentTarget;
                          setMessage(undefined);
                          setEditor(item);
                        }}
                      >
                        {t("Редактировать")}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        className="shop-text-link"
                        onClick={() => {
                          void save(
                            {
                              id: item.id,
                              hidden: !hidden,
                              patch: prior?.patch ?? {},
                            },
                            true,
                          );
                        }}
                      >
                        {t(hidden ? "Вернуть" : "Убрать")}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <nav className="shop-pagination" aria-label={t("Страницы каталога")}>
          {Array.from({ length: pages }, (_, index) => index + 1).map(
            (number) => (
              <button
                type="button"
                key={number}
                aria-label={t("Страница {number}", { number })}
                aria-current={current === number ? "page" : undefined}
                onClick={() => setPage(number)}
              >
                {number}
              </button>
            ),
          )}
        </nav>
      )}
      {editor && (
        <CatalogEditor
          key={editor === "new" ? editor : editor.id}
          item={editor === "new" ? null : editor}
          existing={editor === "new" ? undefined : byId.get(editor.id)}
          busy={busy}
          errorMessage={message?.error ? message.text : undefined}
          onSave={save}
          onClose={() => setEditor(null)}
          restoreFocus={(event) => {
            event.preventDefault();
            editorOpener.current?.focus();
          }}
        />
      )}
    </>
  );
}

export function AdminCatalog() {
  const { t } = useShopLocale();
  const [auth] = useShopAuth();
  const admin = useCatalogAdmin(auth);

  useEffect(() => {
    document.title = t(ADMIN_TITLE);
  }, [t]);

  return (
    <div className="shop catalog-admin">
      <div className="shop-top">
        <div className="shop-wrap">
          <a href="/doors">{t("Каталог")}</a>
          <LanguagePicker />
        </div>
      </div>
      <main className="shop-wrap catalog-admin-main">
        <h1>{t(ADMIN_TITLE)}</h1>
        {auth.status === "loading" || admin === undefined ? (
          <p role="status">{t("Проверяем подключение…")}</p>
        ) : auth.status !== "ready" || !auth.session ? (
          <a className="shop-button" href="/login">
            {t("Войти")}
          </a>
        ) : !admin ? (
          <p role="alert">
            {t("Для этого аккаунта нет доступа к управлению каталогом.")}
          </p>
        ) : (
          <CatalogManagement auth={auth} />
        )}
      </main>
    </div>
  );
}
