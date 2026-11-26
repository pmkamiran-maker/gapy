import { useShopLocale } from "@/lib/shop-locale";
import { Heart, Minus, Plus, Scale, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { MATERIALS, brandName, labelOf, type Product } from "@/data/catalog";
import { buyAction, deliveryCost, stockLabel } from "@/lib/pricing";
import { useShop } from "@/lib/shop-store";
import { STORE } from "@/lib/store-config";
import { OrderForm } from "./order-form";

export type Panel = "cart" | "favorites" | "compare";

interface DialogActions {
  onClose: () => void;
  onCloseAutoFocus: (event: Event) => void;
}

export function ProductDetails({
  product,
  onClose,
  onCloseAutoFocus,
}: DialogActions & { product: Product | null }) {
  const { addToCart, isFavorite, isCompared, toggleFavorite, toggleCompare } =
    useShop();
  const { t, price, productText } = useShopLocale();
  const [color, setColor] = useState(product?.colors[0]?.name);
  const [size, setSize] = useState(product?.sizes?.[0]);
  if (!product) return null;

  const { name, description } = productText(product);
  const action = buyAction(product.stock);
  const favorite = isFavorite(product.id);
  const compared = isCompared(product.id);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="shop-dialog shop-detail-dialog"
        closeLabel={t("Закрыть")}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <div className="shop-detail">
          <img src={product.image} alt={name} />
          <div className="shop-detail-body">
            <p className="shop-kicker">
              {t(brandName(product.brand))} · {t(product.collection)}
            </p>
            <DialogTitle className="shop-dialog-title">{name}</DialogTitle>
            <DialogDescription className="shop-dialog-description">
              {description}
            </DialogDescription>
            <div className="shop-price">
              <strong>{price(product.price)}</strong>
              {product.oldPrice && product.oldPrice > product.price && (
                <del>{price(product.oldPrice)}</del>
              )}
            </div>
            <span className="shop-stock" data-stock={product.stock}>
              {t(stockLabel(product.stock))}
            </span>
            <div className="shop-variants">
              {product.colors.length > 0 && (
                <fieldset>
                  <legend>{t("Цвет")}</legend>
                  <div className="shop-color-options">
                    {product.colors.map(({ name, swatch }) => (
                      <label key={name} className="shop-color-option">
                        <input
                          type="radio"
                          name="product-color"
                          value={name}
                          checked={color === name}
                          onChange={() => setColor(name)}
                        />
                        <span
                          className="shop-swatch"
                          style={{ backgroundColor: swatch }}
                        />
                        {t(name)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {!!product.sizes?.length && (
                <label className="shop-variant-size">
                  {t("Размер, мм")}
                  <select
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                  >
                    {product.sizes.map((option) => (
                      <option key={option} value={option}>
                        {option.replace("x", " × ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="shop-detail-actions">
              <button
                type="button"
                className="shop-button"
                disabled={action.disabled}
                onClick={() => {
                  addToCart(product.id, {
                    ...(color ? { color } : {}),
                    ...(size ? { size } : {}),
                  });
                  onClose();
                }}
              >
                {t(action.label)}
              </button>
              <button
                type="button"
                className="shop-icon"
                aria-label={t("В избранное")}
                aria-pressed={favorite}
                onClick={() => toggleFavorite(product.id)}
              >
                <Heart
                  size={20}
                  fill={favorite ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                className="shop-icon"
                aria-label={t("Добавить к сравнению")}
                aria-pressed={compared}
                onClick={() => toggleCompare(product.id)}
              >
                <Scale size={21} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartContents() {
  const { cart, cartTotal, removeLine, setQty, productById, lineTotal } =
    useShop();
  const [ordering, setOrdering] = useState(false);
  const { t, price, productText, locale } = useShopLocale();
  if (cart.length === 0)
    return <p className="shop-panel-empty">{t("Корзина пока пуста.")}</p>;

  if (ordering) return <OrderForm onBack={() => setOrdering(false)} />;

  const delivery = deliveryCost(cartTotal);

  function downloadEstimate() {
    const lines = cart.flatMap((line) => {
      const item = productById(line.id);
      if (!item) return [];
      const variant = [
        line.color && t(line.color),
        line.size?.replace("x", " × "),
      ]
        .filter(Boolean)
        .join(", ");
      return [
        `${productText(item).name}${variant ? ` (${variant})` : ""} — ${line.qty} ${t("шт.")} — ${price(lineTotal(line))}`,
      ];
    });
    const quote = [
      `${t(STORE.name)} — ${t("расчёт корзины")}`,
      "",
      ...lines,
      "",
      `${t("Товары")}: ${price(cartTotal)}`,
      `${t("Доставка")}: ${price(delivery)}`,
      `${t("Итого")}: ${price(cartTotal + delivery)}`,
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([quote], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `portal-estimate-${locale}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <ul className="shop-panel-list">
        {cart.map((line) => {
          const item = productById(line.id);
          if (!item) return null;
          const variant = [
            line.color && t(line.color),
            line.size?.replace("x", " × "),
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={line.key} className="shop-panel-item">
              <img src={item.image} alt="" />
              <div>
                <strong>{productText(item).name}</strong>
                <p>{variant}</p>
                <div
                  className="shop-quantity"
                  aria-label={t("Количество: {name}", {
                    name: productText(item).name,
                  })}
                  role="group"
                >
                  <button
                    type="button"
                    className="shop-icon"
                    aria-label={t("Уменьшить количество")}
                    disabled={line.qty <= 1}
                    onClick={() => setQty(line.key, line.qty - 1)}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <output>{line.qty}</output>
                  <button
                    type="button"
                    className="shop-icon"
                    aria-label={t("Увеличить количество")}
                    disabled={line.qty >= 99}
                    onClick={() => setQty(line.key, line.qty + 1)}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="shop-line-total">
                <strong>{price(lineTotal(line))}</strong>
                <button
                  type="button"
                  className="shop-icon"
                  aria-label={t("Удалить: {name}", {
                    name: productText(item).name,
                  })}
                  onClick={() => removeLine(line.key)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <dl className="shop-totals">
        <div>
          <dt>{t("Товары")}</dt>
          <dd>{price(cartTotal)}</dd>
        </div>
        <div>
          <dt>{t("Доставка")}</dt>
          <dd>{delivery ? price(delivery) : t("Бесплатно")}</dd>
        </div>
        <div>
          <dt>{t("Итого")}</dt>
          <dd>{price(cartTotal + delivery)}</dd>
        </div>
      </dl>
      <div className="shop-order-actions">
        <button
          type="button"
          className="shop-button"
          onClick={() => setOrdering(true)}
        >
          {t("Оформить заявку")}
        </button>
        <button
          type="button"
          className="shop-text-link"
          onClick={downloadEstimate}
        >
          {t("Скачать расчёт")}
        </button>
      </div>
    </>
  );
}

function FavoriteContents({
  onProduct,
}: {
  onProduct: (item: Product) => void;
}) {
  const { favorites, toggleFavorite, productsByIds } = useShop();
  const { t, price, productText } = useShopLocale();
  if (favorites.length === 0)
    return (
      <p className="shop-panel-empty">
        {t("Нажмите на сердечко, чтобы сохранить товар.")}
      </p>
    );

  return (
    <ul className="shop-panel-list">
      {productsByIds(favorites).map((item) => (
        <li key={item.id} className="shop-panel-item">
          <img src={item.image} alt="" />
          <div>
            <button
              type="button"
              className="shop-text-link"
              onClick={() => onProduct(item)}
            >
              {productText(item).name}
            </button>
            <p>{price(item.price)}</p>
          </div>
          <button
            type="button"
            className="shop-icon"
            aria-label={t("Убрать из избранного: {name}", {
              name: productText(item).name,
            })}
            onClick={() => toggleFavorite(item.id)}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function CompareContents({
  onProduct,
}: {
  onProduct: (item: Product) => void;
}) {
  const { compare, toggleCompare, productsByIds } = useShop();
  const { t, price, productText } = useShopLocale();
  const items = productsByIds(compare);
  if (items.length === 0)
    return (
      <p className="shop-panel-empty">
        {t("Откройте карточку товара и нажмите на значок весов.")}
      </p>
    );

  const rows = [
    { title: "Цена", value: (item: Product) => price(item.price) },
    { title: "Наличие", value: (item: Product) => t(stockLabel(item.stock)) },
    { title: "Бренд", value: (item: Product) => t(brandName(item.brand)) },
    {
      title: "Материал",
      value: (item: Product) => t(labelOf(MATERIALS, item.material) ?? "—"),
    },
    {
      title: "Цвета",
      value: (item: Product) =>
        item.colors.map(({ name }) => t(name)).join(", ") || "—",
    },
    {
      title: "Размеры, мм",
      value: (item: Product) =>
        item.sizes?.map((size) => size.replace("x", " × ")).join(", ") ?? "—",
    },
  ];

  return (
    <div
      className="shop-comparison"
      role="region"
      aria-label={t("Таблица характеристик")}
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th scope="col">{t("Характеристики")}</th>
            {items.map((item) => (
              <th scope="col" key={item.id}>
                <img src={item.image} alt="" />
                <button
                  type="button"
                  className="shop-text-link"
                  onClick={() => onProduct(item)}
                >
                  {productText(item).name}
                </button>
                <button
                  type="button"
                  className="shop-icon"
                  aria-label={t("Убрать из сравнения: {name}", {
                    name: productText(item).name,
                  })}
                  onClick={() => toggleCompare(item.id)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ title, value }) => (
            <tr key={title}>
              <th scope="row">{t(title)}</th>
              {items.map((item) => (
                <td key={item.id}>{value(item)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const PANEL_TITLES: Record<Panel, string> = {
  cart: "Корзина",
  favorites: "Избранное",
  compare: "Сравнение товаров",
};

export function ShopPanel({
  panel,
  onClose,
  onCloseAutoFocus,
  onProduct,
}: DialogActions & {
  panel: Panel | null;
  onProduct: (item: Product) => void;
}) {
  const { t } = useShopLocale();
  if (!panel) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`shop-dialog shop-panel ${panel === "compare" ? "shop-panel-wide" : ""}`}
        aria-describedby={undefined}
        closeLabel={t("Закрыть")}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogTitle className="shop-dialog-title">
          {t(PANEL_TITLES[panel])}
        </DialogTitle>
        {panel === "cart" && <CartContents />}
        {panel === "favorites" && <FavoriteContents onProduct={onProduct} />}
        {panel === "compare" && <CompareContents onProduct={onProduct} />}
      </DialogContent>
    </Dialog>
  );
}
