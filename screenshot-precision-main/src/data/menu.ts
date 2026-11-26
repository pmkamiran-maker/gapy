import {
  BRANDS,
  COLORS,
  CONTOURS,
  DOOR_TYPES,
  ENTRANCE_FEATURES,
  HARDWARE_SUBS,
  MATERIALS,
  METAL_COLORS,
  POPULAR_TAGS,
  PURPOSES,
  TRIM_SUBS,
  type CatalogSlug,
  type CategorySlug,
} from "./catalog";
import type { CatalogSearch } from "@/lib/catalog-search";
import type { InfoSlug } from "./info";

export type MenuTarget =
  | { kind: "catalog"; category: CatalogSlug; search?: CatalogSearch }
  | { kind: "info"; slug: InfoSlug };

export interface MenuLink {
  label: string;
  target: MenuTarget;
  children?: MenuLink[];
}

export interface MenuGroup {
  title: string;
  links: MenuLink[];
}

export interface MenuSection {
  key: string;
  title: string;
  target: MenuTarget;
  groups: MenuGroup[];
}

const cat = (category: CatalogSlug, search?: CatalogSearch): MenuTarget =>
  search ? { kind: "catalog", category, search } : { kind: "catalog", category };
const info = (slug: InfoSlug): MenuTarget => ({ kind: "info", slug });

function brandGroup(category: CategorySlug): MenuGroup {
  return {
    title: "Производители",
    links: BRANDS.filter((b) => b.categories.includes(category)).map((b) => ({
      label: b.name,
      target: cat(category, { brand: b.slug }),
      children: b.collections.map((c) => ({
        label: c,
        target: cat(category, { brand: b.slug, collection: c }),
      })),
    })),
  };
}

export const MEGA_MENU: MenuSection[] = [
  {
    key: "interior",
    title: "Межкомнатные двери",
    target: cat("interior"),
    groups: [
      { title: "По цвету", links: COLORS.map((o) => ({ label: o.label, target: cat("interior", { color: o.key }) })) },
      { title: "По материалу", links: MATERIALS.map((o) => ({ label: o.label, target: cat("interior", { material: o.key }) })) },
      { title: "По типу", links: DOOR_TYPES.map((o) => ({ label: o.label, target: cat("interior", { type: o.key }) })) },
      { title: "Популярное", links: POPULAR_TAGS.map((o) => ({ label: o.label, target: cat("interior", { tag: o.key }) })) },
      brandGroup("interior"),
    ],
  },
  {
    key: "entrance",
    title: "Входные двери",
    target: cat("entrance"),
    groups: [
      { title: "Назначение", links: PURPOSES.map((o) => ({ label: o.label, target: cat("entrance", { purpose: o.key }) })) },
      { title: "Конструкция", links: ENTRANCE_FEATURES.map((o) => ({ label: o.label, target: cat("entrance", { feature: o.key }) })) },
      { title: "Цвет металла", links: METAL_COLORS.map((o) => ({ label: o.label, target: cat("entrance", { metal: o.key }) })) },
      { title: "Контуры уплотнения", links: CONTOURS.map((o) => ({ label: o.label, target: cat("entrance", { contours: o.key }) })) },
      brandGroup("entrance"),
    ],
  },
  {
    key: "hardware",
    title: "Фурнитура",
    target: cat("hardware"),
    groups: [
      { title: "Фурнитура", links: HARDWARE_SUBS.slice(0, 6).map((o) => ({ label: o.label, target: cat("hardware", { sub: o.key }) })) },
      { title: "Механизмы и системы", links: HARDWARE_SUBS.slice(6).map((o) => ({ label: o.label, target: cat("hardware", { sub: o.key }) })) },
      brandGroup("hardware"),
    ],
  },
  {
    key: "trim",
    title: "Погонаж",
    target: cat("trim"),
    groups: [{ title: "Погонаж", links: TRIM_SUBS.map((o) => ({ label: o.label, target: cat("trim", { sub: o.key }) })) }],
  },
  {
    key: "brands",
    title: "Производители",
    target: info("proizvoditeli"),
    groups: [
      {
        title: "Все производители",
        links: BRANDS.map((b) => ({ label: b.name, target: cat("all", { brand: b.slug }) })),
      },
    ],
  },
  {
    key: "services",
    title: "Услуги",
    target: info("dostavka"),
    groups: [
      {
        title: "Услуги",
        links: [
          { label: "Доставка", target: info("dostavka") },
          { label: "Замер", target: info("zamer") },
          { label: "Установка", target: info("ustanovka") },
          { label: "Оплата", target: info("oplata") },
        ],
      },
    ],
  },
  {
    key: "info",
    title: "Информация",
    target: info("novosti"),
    groups: [
      {
        title: "Информация",
        links: [
          { label: "Новости", target: info("novosti") },
          { label: "Наши работы", target: info("raboty") },
          { label: "Гарантия и возврат", target: info("garantiya") },
          { label: "Написать нам", target: info("napisat") },
        ],
      },
    ],
  },
  {
    key: "sale",
    title: "Акции и распродажа",
    target: cat("sale"),
    groups: [
      {
        title: "Выгодно",
        links: [
          { label: "Все скидки", target: cat("sale") },
          { label: "Межкомнатные со скидкой", target: cat("interior", { sale: true }) },
          { label: "Входные со скидкой", target: cat("entrance", { sale: true }) },
          { label: "Фурнитура со скидкой", target: cat("hardware", { sale: true }) },
        ],
      },
    ],
  },
];
