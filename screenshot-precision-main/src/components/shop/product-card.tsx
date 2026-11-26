import { Heart } from "lucide-react";

import { BADGE_LABELS, brandName, type Product } from "@/data/catalog";
import { discountPercent, stockLabel } from "@/lib/pricing";
import { useShopLocale } from "@/lib/shop-locale";
import { useShop } from "@/lib/shop-store";

export function ProductCard({
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
        <p className="shop-card-brand">
          {t("Демо")} · {t(brandName(product.brand))}
        </p>
        <h2>
          <button type="button" onClick={onOpen}>
            {name}
          </button>
        </h2>
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
