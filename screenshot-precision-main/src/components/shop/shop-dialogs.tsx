import { Heart, Minus, Plus, Scale, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MATERIALS,
  brandName,
  labelOf,
  productById,
  type Product,
} from "@/data/catalog";
import {
  buyAction,
  deliveryCost,
  formatPrice,
  stockLabel,
} from "@/lib/pricing";
import { lineTotal, productsByIds, useShop } from "@/lib/shop-store";
import { STORE } from "@/lib/store-config";

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
  const [color, setColor] = useState(product?.colors[0]?.name);
  const [size, setSize] = useState(product?.sizes?.[0]);
  if (!product) return null;

  const action = buyAction(product.stock);
  const favorite = isFavorite(product.id);
  const compared = isCompared(product.id);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="shop-dialog shop-detail-dialog"
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <div className="shop-detail">
          <img src={product.image} alt={product.name} />
          <div className="shop-detail-body">
            <p className="shop-kicker">
              {brandName(product.brand)} · {product.collection}
            </p>
            <DialogTitle className="shop-dialog-title">
              {product.name}
            </DialogTitle>
            <DialogDescription className="shop-dialog-description">
              {product.description}
            </DialogDescription>
            <div className="shop-price">
              <strong>{formatPrice(product.price)}</strong>
              {product.oldPrice && product.oldPrice > product.price && (
                <del>{formatPrice(product.oldPrice)}</del>
              )}
            </div>
            <span className="shop-stock" data-stock={product.stock}>
              {stockLabel(product.stock)}
            </span>
            <div className="shop-variants">
              {product.colors.length > 0 && (
                <fieldset>
                  <legend>Цвет</legend>
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
                        {name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
              {!!product.sizes?.length && (
                <label className="shop-variant-size">
                  Размер, мм
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
                {action.label}
              </button>
              <button
                type="button"
                className="shop-icon"
                aria-label="В избранное"
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
                aria-label="Добавить к сравнению"
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
  const { cart, cartTotal, removeLine, setQty } = useShop();
  if (cart.length === 0)
    return <p className="shop-panel-empty">Корзина пока пуста.</p>;

  const delivery = deliveryCost(cartTotal);

  function downloadEstimate() {
    const lines = cart.flatMap((line) => {
      const item = productById(line.id);
      if (!item) return [];
      const variant = [line.color, line.size?.replace("x", " × ")]
        .filter(Boolean)
        .join(", ");
      return [
        `${item.name}${variant ? ` (${variant})` : ""} — ${line.qty} шт. — ${formatPrice(lineTotal(line))}`,
      ];
    });
    const quote = [
      STORE.name + " — расчёт корзины",
      "",
      ...lines,
      "",
      `Товары: ${formatPrice(cartTotal)}`,
      `Доставка: ${formatPrice(delivery)}`,
      `Итого: ${formatPrice(cartTotal + delivery)}`,
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([quote], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "portal-raschet.txt";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <ul className="shop-panel-list">
        {cart.map((line) => {
          const item = productById(line.id);
          if (!item) return null;
          const variant = [line.color, line.size?.replace("x", " × ")]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={line.key} className="shop-panel-item">
              <img src={item.image} alt="" />
              <div>
                <strong>{item.name}</strong>
                <p>{variant}</p>
                <div
                  className="shop-quantity"
                  aria-label={`Количество: ${item.name}`}
                  role="group"
                >
                  <button
                    type="button"
                    className="shop-icon"
                    aria-label="Уменьшить количество"
                    disabled={line.qty <= 1}
                    onClick={() => setQty(line.key, line.qty - 1)}
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <output>{line.qty}</output>
                  <button
                    type="button"
                    className="shop-icon"
                    aria-label="Увеличить количество"
                    disabled={line.qty >= 99}
                    onClick={() => setQty(line.key, line.qty + 1)}
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="shop-line-total">
                <strong>{formatPrice(lineTotal(line))}</strong>
                <button
                  type="button"
                  className="shop-icon"
                  aria-label={`Удалить: ${item.name}`}
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
          <dt>Товары</dt>
          <dd>{formatPrice(cartTotal)}</dd>
        </div>
        <div>
          <dt>Доставка</dt>
          <dd>{delivery ? formatPrice(delivery) : "Бесплатно"}</dd>
        </div>
        <div>
          <dt>Итого</dt>
          <dd>{formatPrice(cartTotal + delivery)}</dd>
        </div>
      </dl>
      <button type="button" className="shop-button" onClick={downloadEstimate}>
        Скачать расчёт
      </button>
    </>
  );
}

function FavoriteContents({
  onProduct,
}: {
  onProduct: (item: Product) => void;
}) {
  const { favorites, toggleFavorite } = useShop();
  if (favorites.length === 0)
    return (
      <p className="shop-panel-empty">
        Нажмите на сердечко, чтобы сохранить товар.
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
              {item.name}
            </button>
            <p>{formatPrice(item.price)}</p>
          </div>
          <button
            type="button"
            className="shop-icon"
            aria-label={`Убрать из избранного: ${item.name}`}
            onClick={() => toggleFavorite(item.id)}
          >
            <Trash2 size={17} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}

const COMPARISON_ROWS = [
  { title: "Цена", value: (item: Product) => formatPrice(item.price) },
  { title: "Наличие", value: (item: Product) => stockLabel(item.stock) },
  { title: "Бренд", value: (item: Product) => brandName(item.brand) },
  {
    title: "Материал",
    value: (item: Product) => labelOf(MATERIALS, item.material) ?? "—",
  },
  {
    title: "Цвета",
    value: (item: Product) =>
      item.colors.map(({ name }) => name).join(", ") || "—",
  },
  {
    title: "Размеры, мм",
    value: (item: Product) =>
      item.sizes?.map((size) => size.replace("x", " × ")).join(", ") ?? "—",
  },
];

function CompareContents({
  onProduct,
}: {
  onProduct: (item: Product) => void;
}) {
  const { compare, toggleCompare } = useShop();
  const items = productsByIds(compare);
  if (items.length === 0)
    return (
      <p className="shop-panel-empty">
        Откройте карточку товара и нажмите на значок весов.
      </p>
    );

  return (
    <div
      className="shop-comparison"
      role="region"
      aria-label="Таблица характеристик"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            <th scope="col">Характеристики</th>
            {items.map((item) => (
              <th scope="col" key={item.id}>
                <img src={item.image} alt="" />
                <button
                  type="button"
                  className="shop-text-link"
                  onClick={() => onProduct(item)}
                >
                  {item.name}
                </button>
                <button
                  type="button"
                  className="shop-icon"
                  aria-label={`Убрать из сравнения: ${item.name}`}
                  onClick={() => toggleCompare(item.id)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARISON_ROWS.map(({ title, value }) => (
            <tr key={title}>
              <th scope="row">{title}</th>
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
  if (!panel) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`shop-dialog shop-panel ${panel === "compare" ? "shop-panel-wide" : ""}`}
        aria-describedby={undefined}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogTitle className="shop-dialog-title">
          {PANEL_TITLES[panel]}
        </DialogTitle>
        {panel === "cart" && <CartContents />}
        {panel === "favorites" && <FavoriteContents onProduct={onProduct} />}
        {panel === "compare" && <CompareContents onProduct={onProduct} />}
      </DialogContent>
    </Dialog>
  );
}
