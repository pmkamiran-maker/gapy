import { z } from "zod";

import fallbackImage from "@/assets/door-white.jpg";
import { PRODUCTS, type Product } from "@/data/catalog";
import { workbookDoorImage, workbookDoors } from "@/data/workbook-doors";
import { stockLabel } from "@/lib/pricing";
import type { PublicSupabaseConfig } from "@/lib/supabase-config";

export const CATALOG_PATH = "/api/catalog";
export const CATALOG_ADMIN_TABLE = "gapy_catalog_admins";
export const CATALOG_CHANGES_TABLE = "gapy_catalog_changes";
export const CATALOG_KINDS = ["wood", "steel", "hardware", "trim"] as const;

export const CATALOG_AVAILABILITY = ["unknown", "in", "order", "out"] as const;
export type CatalogAvailability = (typeof CATALOG_AVAILABILITY)[number];

export function availabilityLabel(value: CatalogAvailability) {
  return value === "unknown" ? "Уточнить наличие" : stockLabel(value);
}

export const catalogPatchSchema = z.strictObject({
  name: z.string().trim().min(1).max(180).optional(),
  detail: z.string().trim().max(1200).optional(),
  price: z.number().finite().min(0).max(9999999).optional(),
  image: z
    .string()
    .max(1000)
    .refine((value) => {
      if (/^\/(?!\/)[\w./%-]+$/.test(value)) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
      } catch {
        return false;
      }
    })
    .optional(),
  kind: z.enum(CATALOG_KINDS).optional(),
  width: z.number().int().min(1).max(100000).nullish(),
  height: z.number().int().min(1).max(100000).nullish(),
  opening: z.enum(["Левые", "Правые", ""]).optional(),
  stock: z.enum(["in", "order", "out"]).optional(),
  availability: z.enum(CATALOG_AVAILABILITY).optional(),
  leadTimeDays: z.number().int().nonnegative().nullish(),
});

const catalogChangeSchema = z
  .strictObject({
    id: z.string().regex(/^(?:p[1-9]\d*|excel-[1-9]\d*|item-[a-f0-9-]{36})$/),
    hidden: z.boolean(),
    patch: catalogPatchSchema,
  })
  .refine(
    ({ id, patch }) =>
      !id.startsWith("item-") ||
      (patch.name !== undefined &&
        patch.price !== undefined &&
        patch.kind !== undefined),
  );

export const catalogChangesSchema = z.array(catalogChangeSchema);
export type CatalogChange = z.infer<typeof catalogChangeSchema>;
export type CatalogPatch = z.infer<typeof catalogPatchSchema>;
export type CatalogKind = (typeof CATALOG_KINDS)[number];

export interface CatalogPosition {
  id: string;
  name: string;
  detail: string;
  kind: CatalogKind;
  image: string;
  price: number;
  availability: CatalogAvailability;
  leadTimeDays?: number;
  row?: number;
  width?: number;
  height?: number;
  opening?: string;
  namedWidth?: number;
  namedSize?: string;
  listedLength?: number;
}

const imported: CatalogPosition[] = workbookDoors
  .flatMap((door) =>
    door.variants.map(({ price50, ...variant }) => ({
      ...variant,
      id: `excel-${variant.row}`,
      name: door.model,
      detail: door.detail,
      kind: door.kind,
      image: workbookDoorImage(door),
      price: price50,
      availability: "unknown" as const,
    })),
  )
  .sort((a, b) => (a.row ?? 0) - (b.row ?? 0));

export function applyCatalogChanges(
  changes: CatalogChange[],
  includeHidden = false,
) {
  const byId = new Map(changes.map((change) => [change.id, change]));
  const visible = (id: string) => includeHidden || !byId.get(id)?.hidden;

  const products = PRODUCTS.filter((product) => visible(product.id)).map(
    (product): Product => {
      const patch = byId.get(product.id)?.patch;
      if (!patch) return product;
      const { oldPrice, ...item } = product;
      return {
        ...item,
        name: patch.name ?? product.name,
        description: patch.detail ?? product.description,
        price: patch.price ?? product.price,
        image: patch.image ?? product.image,
        stock: patch.stock ?? product.stock,
        ...(patch.price === undefined && oldPrice !== undefined
          ? { oldPrice }
          : {}),
        ...(patch.name !== undefined || patch.detail !== undefined
          ? {
              catalogText: {
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.detail !== undefined
                  ? { description: patch.detail }
                  : {}),
              },
            }
          : {}),
      };
    },
  );

  const positions = imported
    .filter(({ id }) => visible(id))
    .map((item): CatalogPosition => {
      const patch = byId.get(item.id)?.patch;
      if (!patch) return item;
      const { width, height, ...rest } = item;
      const nextWidth = patch.width === undefined ? width : patch.width;
      const nextHeight = patch.height === undefined ? height : patch.height;
      return {
        ...rest,
        name: patch.name ?? item.name,
        detail: patch.detail ?? item.detail,
        kind: patch.kind ?? item.kind,
        price: patch.price ?? item.price,
        image: patch.image ?? item.image,
        opening: patch.opening ?? item.opening ?? "",
        availability: patch.availability ?? item.availability,
        ...(patch.leadTimeDays != null
          ? { leadTimeDays: patch.leadTimeDays }
          : {}),
        ...(nextWidth !== null && nextWidth !== undefined
          ? { width: nextWidth }
          : {}),
        ...(nextHeight !== null && nextHeight !== undefined
          ? { height: nextHeight }
          : {}),
      };
    });

  for (const { id, patch } of changes) {
    if (
      !id.startsWith("item-") ||
      !visible(id) ||
      patch.name === undefined ||
      patch.price === undefined ||
      patch.kind === undefined
    )
      continue;
    positions.push({
      id,
      name: patch.name,
      detail: patch.detail ?? "",
      kind: patch.kind,
      price: patch.price,
      image: patch.image ?? fallbackImage,
      opening: patch.opening ?? "",
      availability: patch.availability ?? "unknown",
      ...(patch.leadTimeDays != null
        ? { leadTimeDays: patch.leadTimeDays }
        : {}),
      ...(patch.width != null ? { width: patch.width } : {}),
      ...(patch.height != null ? { height: patch.height } : {}),
    });
  }

  return { products, positions };
}

export async function readCatalogChanges(
  config: PublicSupabaseConfig,
  accessToken?: string,
  signal?: AbortSignal,
) {
  const changes: CatalogChange[] = [];
  const limit = 200;
  while (true) {
    const request = new URL(`${config.url}/rest/v1/${CATALOG_CHANGES_TABLE}`);
    request.searchParams.set("select", "id,hidden,patch");
    request.searchParams.set("order", "id.asc");
    request.searchParams.set("limit", String(limit));
    const last = changes.at(-1)?.id;
    if (last) request.searchParams.set("id", `gt.${last}`);
    const headers = new Headers({ apikey: config.key });
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    const response = await fetch(request, {
      headers,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(5000)])
        : AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Catalog request failed");
    const page = catalogChangesSchema.parse(await response.json());
    changes.push(...page);
    if (page.length < limit) return changes;
  }
}
