import { useShopLocale } from "@/lib/shop-locale";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { PRODUCTS, type Product } from "@/data/catalog";
import {
  applyCatalogChanges,
  CATALOG_PATH,
  catalogChangesSchema,
  type CatalogChange,
  type CatalogPosition,
} from "@/lib/live-catalog";

export interface CartLine {
  key: string;
  id: string;
  qty: number;
  color?: string;
  size?: string;
}

interface ShopState {
  cart: CartLine[];
  favorites: string[];
  compare: string[];
  viewed: string[];
}

const EMPTY: ShopState = { cart: [], favorites: [], compare: [], viewed: [] };
const STORAGE_KEY = "portal-shop-v1";
const MAX_COMPARE = 4;
const MAX_VIEWED = 12;

interface ShopContextValue extends ShopState {
  hydrated: boolean;
  catalogStatus: "loading" | "ready" | "error";
  products: Product[];
  positions: CatalogPosition[];
  productById: (id: string) => Product | undefined;
  productsByIds: (ids: string[]) => Product[];
  lineTotal: (line: CartLine) => number;
  cartCount: number;
  cartTotal: number;
  addToCart: (
    id: string,
    opts?: { qty?: number; color?: string; size?: string },
  ) => void;
  setQty: (key: string, qty: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  clearCompare: () => void;
  markViewed: (id: string) => void;
  clearViewed: () => void;
  isFavorite: (id: string) => boolean;
  isCompared: (id: string) => boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function ShopProvider({
  children,
  liveCatalog = false,
}: {
  children: ReactNode;
  liveCatalog?: boolean;
}) {
  const { t, productText } = useShopLocale();
  const [state, setState] = useState<ShopState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  const [changes, setChanges] = useState<CatalogChange[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<
    ShopContextValue["catalogStatus"]
  >(liveCatalog ? "loading" : "ready");

  useEffect(() => {
    if (!liveCatalog) return;
    const controller = new AbortController();
    async function loadCatalog() {
      try {
        const response = await fetch(CATALOG_PATH, {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(8000),
          ]),
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Catalog unavailable");
        const data = catalogChangesSchema.parse(await response.json());
        if (!controller.signal.aborted) {
          setChanges(data);
          setCatalogStatus("ready");
        }
      } catch {
        if (!controller.signal.aborted) setCatalogStatus("error");
      }
    }
    void loadCatalog();
    return () => controller.abort();
  }, [liveCatalog]);

  const snapshot = useMemo(() => applyCatalogChanges(changes), [changes]);
  const productIndex = useMemo(
    () =>
      new Map(
        catalogStatus === "ready"
          ? snapshot.products.map((product) => [product.id, product])
          : [],
      ),
    [snapshot, catalogStatus],
  );
  const productById = useCallback(
    (id: string) => productIndex.get(id),
    [productIndex],
  );
  const productsByIds = useCallback(
    (ids: string[]) =>
      ids.map(productById).filter((product): product is Product => !!product),
    [productById],
  );
  const lineTotal = useCallback(
    (line: CartLine) => (productById(line.id)?.price ?? 0) * line.qty,
    [productById],
  );

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ShopState>;
        const known = new Set(PRODUCTS.map((p) => p.id));
        setState({
          cart: (parsed.cart ?? []).filter((l) => known.has(l.id)),
          favorites: (parsed.favorites ?? []).filter((id) => known.has(id)),
          compare: (parsed.compare ?? []).filter((id) => known.has(id)),
          viewed: (parsed.viewed ?? []).filter((id) => known.has(id)),
        });
      }
    } catch {
      /* ignore broken storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Keep the shop usable in browsers that block storage or run out of quota.
    }
  }, [state, hydrated]);

  const addToCart = useCallback<ShopContextValue["addToCart"]>(
    (id, opts) => {
      const product = productById(id);
      if (!product || product.stock === "out") return;
      const color = opts?.color ?? product.colors[0]?.name;
      const size = opts?.size ?? product.sizes?.[0];
      const key = [id, color ?? "", size ?? ""].join("|");
      const qty = Math.max(1, Math.min(99, opts?.qty ?? 1));
      setState((s) => {
        const existing = s.cart.find((l) => l.key === key);
        const cart = existing
          ? s.cart.map((l) =>
              l.key === key ? { ...l, qty: Math.min(99, l.qty + qty) } : l,
            )
          : [
              ...s.cart,
              {
                key,
                id,
                qty,
                ...(color ? { color } : {}),
                ...(size ? { size } : {}),
              },
            ];
        return { ...s, cart };
      });
      toast.success(
        t(
          product.stock === "order"
            ? "Добавлено в заказ"
            : "Добавлено в корзину",
        ),
        {
          description: productText(product).name,
        },
      );
    },
    [t, productText, productById],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setState((s) => ({
      ...s,
      cart: s.cart.map((l) =>
        l.key === key ? { ...l, qty: Math.max(1, Math.min(99, qty)) } : l,
      ),
    }));
  }, []);

  const removeLine = useCallback((key: string) => {
    setState((s) => ({ ...s, cart: s.cart.filter((l) => l.key !== key) }));
  }, []);

  const clearCart = useCallback(
    () => setState((s) => ({ ...s, cart: [] })),
    [],
  );

  const toggleFavorite = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      favorites: s.favorites.includes(id)
        ? s.favorites.filter((x) => x !== id)
        : [id, ...s.favorites],
    }));
  }, []);

  const toggleCompare = useCallback(
    (id: string) => {
      setState((s) => {
        if (s.compare.includes(id))
          return { ...s, compare: s.compare.filter((x) => x !== id) };
        const visibleCount = s.compare.filter((id) =>
          productIndex.has(id),
        ).length;
        if (visibleCount >= MAX_COMPARE) {
          toast.message(
            t("В сравнении может быть до {count} товаров", {
              count: MAX_COMPARE,
            }),
          );
          return s;
        }
        return { ...s, compare: [...s.compare, id] };
      });
    },
    [t, productIndex],
  );

  const clearCompare = useCallback(
    () => setState((s) => ({ ...s, compare: [] })),
    [],
  );

  const markViewed = useCallback((id: string) => {
    setState((s) =>
      s.viewed[0] === id
        ? s
        : {
            ...s,
            viewed: [id, ...s.viewed.filter((x) => x !== id)].slice(
              0,
              MAX_VIEWED,
            ),
          },
    );
  }, []);

  const clearViewed = useCallback(
    () => setState((s) => ({ ...s, viewed: [] })),
    [],
  );

  const value = useMemo<ShopContextValue>(() => {
    const cart = state.cart.filter(({ id }) => {
      const product = productById(id);
      return product && product.stock !== "out";
    });
    const cartCount = cart.reduce((n, line) => n + line.qty, 0);
    const cartTotal = cart.reduce((n, line) => n + lineTotal(line), 0);
    return {
      ...state,
      cart,
      favorites: state.favorites.filter((id) => productIndex.has(id)),
      compare: state.compare.filter((id) => productIndex.has(id)),
      hydrated,
      catalogStatus,
      products: snapshot.products,
      positions: snapshot.positions,
      productById,
      productsByIds,
      lineTotal,
      cartCount,
      cartTotal,
      addToCart,
      setQty,
      removeLine,
      clearCart,
      toggleFavorite,
      toggleCompare,
      clearCompare,
      markViewed,
      clearViewed,
      isFavorite: (id) => state.favorites.includes(id),
      isCompared: (id) => state.compare.includes(id),
    };
  }, [
    state,
    hydrated,
    snapshot,
    catalogStatus,
    productIndex,
    productById,
    productsByIds,
    lineTotal,
    addToCart,
    setQty,
    removeLine,
    clearCart,
    toggleFavorite,
    toggleCompare,
    clearCompare,
    markViewed,
    clearViewed,
  ]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
