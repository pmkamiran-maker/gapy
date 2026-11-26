import type { CatalogSlug, Product } from "@/data/catalog";

export type SortKey = "popular" | "price-asc" | "price-desc" | "new" | "discount";
export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "popular", label: "По популярности" },
  { key: "price-asc", label: "Сначала дешевле" },
  { key: "price-desc", label: "Сначала дороже" },
  { key: "new", label: "Новинки" },
  { key: "discount", label: "По размеру скидки" },
];

/** Multi-value facets are comma-separated lists of option keys. */
export interface CatalogSearch {
  q?: string;
  brand?: string;
  collection?: string;
  color?: string;
  material?: string;
  type?: string;
  tag?: string;
  sub?: string;
  purpose?: string;
  feature?: string;
  metal?: string;
  contours?: string;
  size?: string;
  min?: number;
  max?: number;
  stock?: boolean;
  sale?: boolean;
  sort?: SortKey;
  view?: "grid" | "list";
  page?: number;
}

export const FACET_KEYS = [
  "brand",
  "collection",
  "color",
  "material",
  "type",
  "tag",
  "sub",
  "purpose",
  "feature",
  "metal",
  "contours",
  "size",
] as const;
export type FacetKey = (typeof FACET_KEYS)[number];

const SORT_KEYS: SortKey[] = ["popular", "price-asc", "price-desc", "new", "discount"];

function str(v: unknown): string | undefined {
  if (typeof v === "number") return String(v);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}
function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}
function bool(v: unknown): boolean | undefined {
  return v === true || v === "true" || v === 1 || v === "1" ? true : undefined;
}

export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const out: CatalogSearch = {};
  const q = str(raw["q"]);
  if (q) out.q = q;
  for (const key of FACET_KEYS) {
    const v = str(raw[key]);
    if (v) out[key] = v;
  }
  const min = num(raw["min"]);
  if (min !== undefined) out.min = min;
  const max = num(raw["max"]);
  if (max !== undefined) out.max = max;
  if (bool(raw["stock"])) out.stock = true;
  if (bool(raw["sale"])) out.sale = true;
  const sort = str(raw["sort"]);
  if (sort && (SORT_KEYS as string[]).includes(sort)) out.sort = sort as SortKey;
  if (raw["view"] === "list") out.view = "list";
  const page = num(raw["page"]);
  if (page && page > 1) out.page = Math.floor(page);
  return out;
}

export function listOf(value?: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export function toggleInList(value: string | undefined, key: string): string | undefined {
  const list = listOf(value);
  const next = list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
  return next.length ? next.join(",") : undefined;
}

function productFacetValues(p: Product, key: FacetKey): string[] {
  switch (key) {
    case "brand":
      return [p.brand];
    case "collection":
      return [p.collection];
    case "color":
      return p.color ? [p.color] : [];
    case "material":
      return p.material ? [p.material] : [];
    case "type":
      return p.doorType ? [p.doorType] : [];
    case "tag":
      return p.tags ?? [];
    case "sub":
      return p.sub ? [p.sub] : [];
    case "purpose":
      return p.purpose ?? [];
    case "feature":
      return p.features ?? [];
    case "metal":
      return p.metal ? [p.metal] : [];
    case "contours":
      return p.contours ? [String(p.contours)] : [];
    case "size":
      return p.sizes ?? [];
  }
}

export function inCatalog(p: Product, slug: CatalogSlug): boolean {
  if (slug === "all") return true;
  if (slug === "sale") return !!p.oldPrice && p.oldPrice > p.price;
  return p.category === slug;
}

export function matchesQuery(p: Product, q: string): boolean {
  const needle = q.toLowerCase();
  return [p.name, p.collection, p.description].some((s) => s.toLowerCase().includes(needle));
}

export function filterProducts(products: Product[], slug: CatalogSlug, s: CatalogSearch): Product[] {
  return products.filter((p) => {
    if (!inCatalog(p, slug)) return false;
    if (s.q && !matchesQuery(p, s.q)) return false;
    for (const key of FACET_KEYS) {
      const wanted = listOf(s[key]);
      if (wanted.length && !productFacetValues(p, key).some((v) => wanted.includes(v))) return false;
    }
    if (s.min !== undefined && p.price < s.min) return false;
    if (s.max !== undefined && p.price > s.max) return false;
    if (s.stock && p.stock !== "in") return false;
    if (s.sale && !(p.oldPrice && p.oldPrice > p.price)) return false;
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortKey = "popular"): Product[] {
  const list = [...products];
  const disc = (p: Product) => (p.oldPrice ? 1 - p.price / p.oldPrice : 0);
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "new":
      return list.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    case "discount":
      return list.sort((a, b) => disc(b) - disc(a));
    default:
      // Sold-out items sink to the end of the default order.
      return list.sort(
        (a, b) => Number(a.stock === "out") - Number(b.stock === "out") || b.popularity - a.popularity,
      );
  }
}

export const PAGE_SIZE = 12;

export function paginate<T>(items: T[], page = 1, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return { items: items.slice((current - 1) * size, current * size), pages, current };
}
