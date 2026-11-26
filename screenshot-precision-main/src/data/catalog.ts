import doorWhite from "@/assets/door-white.jpg";
import doorOak from "@/assets/door-oak.jpg";
import doorGray from "@/assets/door-gray.jpg";
import doorGreen from "@/assets/door-green.jpg";
import doorWalnut from "@/assets/door-walnut.jpg";
import entranceDark from "@/assets/entrance-dark.jpg";
import entranceBronze from "@/assets/entrance-bronze.jpg";
import handleBrass from "@/assets/handle-brass.jpg";
import hardwareSet from "@/assets/hardware-set.jpg";
import trimImg from "@/assets/trim.jpg";
import type { StockState } from "@/lib/pricing";

export type CategorySlug = "interior" | "entrance" | "hardware" | "trim";
export type CatalogSlug = CategorySlug | "all" | "sale";
export type BadgeKind = "hit" | "clearance" | "new";

export interface Option {
  key: string;
  label: string;
}

export interface ColorVariant {
  name: string;
  /** Swatch color of the physical finish (product data, not a theme color). */
  swatch: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  sub?: string;
  brand: string;
  collection: string;
  price: number;
  oldPrice?: number;
  badges: BadgeKind[];
  stock: StockState;
  image: string;
  colors: ColorVariant[];
  color?: string;
  material?: string;
  doorType?: string;
  tags?: string[];
  sizes?: string[];
  purpose?: string[];
  features?: string[];
  contours?: number;
  metal?: string;
  popularity: number;
  views: number;
  addedAt: string;
  description: string;
}

export const CATALOG_TITLES: Record<CatalogSlug, string> = {
  all: "Весь каталог",
  interior: "Межкомнатные двери",
  entrance: "Входные двери",
  hardware: "Фурнитура",
  trim: "Погонаж",
  sale: "Акции и распродажа",
};

export const CATALOG_SLUGS: CatalogSlug[] = ["all", "interior", "entrance", "hardware", "trim", "sale"];

export const COLORS: Option[] = [
  { key: "white", label: "Белые" },
  { key: "gray", label: "Серые" },
  { key: "light", label: "Светлые" },
  { key: "paint", label: "Под покраску" },
  { key: "dark", label: "Тёмные" },
  { key: "blue", label: "Синие" },
  { key: "green", label: "Зелёные" },
  { key: "brown", label: "Коричневые" },
  { key: "cream", label: "Кремовые" },
];

export const MATERIALS: Option[] = [
  { key: "emalex", label: "Эмалекс" },
  { key: "ecoveneer", label: "Экошпон" },
  { key: "veneer", label: "Шпон" },
  { key: "enamel", label: "Эмаль" },
  { key: "solid", label: "Массив" },
  { key: "gloss", label: "Глянцевые" },
  { key: "cpl", label: "CPL" },
  { key: "softtouch", label: "Soft Touch" },
  { key: "vinyl", label: "Винил" },
  { key: "flex", label: "3D Flex" },
];

export const DOOR_TYPES: Option[] = [
  { key: "blind", label: "Глухие" },
  { key: "glass", label: "Остеклённые" },
  { key: "mirror", label: "С зеркалом" },
  { key: "invisible", label: "Скрытые Invisible" },
  { key: "finish", label: "Под отделку" },
];

export const POPULAR_TAGS: Option[] = [
  { key: "sliding", label: "Раздвижные" },
  { key: "coupe", label: "Купе" },
  { key: "classic", label: "Классические" },
  { key: "soundproof", label: "Шумоизоляционные" },
  { key: "budget", label: "Недорогие" },
];

export const PURPOSES: Option[] = [
  { key: "apartment", label: "В квартиру" },
  { key: "house", label: "В дом" },
];

export const ENTRANCE_FEATURES: Option[] = [
  { key: "thermal", label: "С терморазрывом" },
  { key: "mirror", label: "С зеркалом" },
];

export const METAL_COLORS: Option[] = [
  { key: "black", label: "Чёрный" },
  { key: "graphite", label: "Графит" },
  { key: "bronze", label: "Бронза" },
  { key: "white", label: "Белый" },
];

export const CONTOURS: Option[] = [
  { key: "2", label: "2 контура" },
  { key: "3", label: "3 контура" },
  { key: "4", label: "4 контура" },
];

export const HARDWARE_SUBS: Option[] = [
  { key: "handles", label: "Ручки" },
  { key: "turns", label: "Завертки и накладки" },
  { key: "latches", label: "Защёлки" },
  { key: "hinges", label: "Петли" },
  { key: "locks", label: "Замки" },
  { key: "cylinders", label: "Цилиндры" },
  { key: "stoppers", label: "Ограничители" },
  { key: "bolts", label: "Ригели" },
  { key: "thresholds", label: "Автопороги" },
  { key: "sliding-hw", label: "Для раздвижных дверей" },
  { key: "sliding-systems", label: "Раздвижные системы" },
  { key: "kits", label: "Дверные комплекты" },
];

export const TRIM_SUBS: Option[] = [
  { key: "frames", label: "Коробки" },
  { key: "casings", label: "Наличники" },
  { key: "extensions", label: "Доборы" },
];

export const SIZES: Option[] = [
  { key: "600x2000", label: "600 × 2000" },
  { key: "700x2000", label: "700 × 2000" },
  { key: "800x2000", label: "800 × 2000" },
  { key: "900x2000", label: "900 × 2000" },
  { key: "860x2050", label: "860 × 2050" },
  { key: "960x2050", label: "960 × 2050" },
];

export interface Brand {
  slug: string;
  name: string;
  country: string;
  categories: CategorySlug[];
  collections: string[];
}

export const BRANDS: Brand[] = [
  { slug: "nordwood", name: "Nordwood", country: "Скандинавский дизайн", categories: ["interior", "trim"], collections: ["Fjord", "Linea"] },
  { slug: "lambris", name: "Ламбрис", country: "Собственное производство", categories: ["interior", "trim"], collections: ["Классика", "Модерн"] },
  { slug: "verano", name: "Verano Porte", country: "Итальянская эстетика", categories: ["interior"], collections: ["Aria", "Sole"] },
  { slug: "terra", name: "Terra Linea", country: "Минимализм", categories: ["interior", "trim"], collections: ["Invisible", "Grain"] },
  { slug: "fortis", name: "Фортис", country: "Стальные конструкции", categories: ["entrance"], collections: ["Урбан", "Термо"] },
  { slug: "bastion", name: "Бастион", country: "Надёжность для дома", categories: ["entrance"], collections: ["Сити", "Хаус"] },
  { slug: "aurum", name: "Aurum Line", country: "Дизайнерская фурнитура", categories: ["hardware"], collections: ["Ovale", "Quadro"] },
  { slug: "nordfix", name: "Нордфикс", country: "Механизмы и петли", categories: ["hardware"], collections: ["Basic", "Pro"] },
];

export function brandName(slug: string): string {
  return BRANDS.find((b) => b.slug === slug)?.name ?? slug;
}

const SW = {
  white: { name: "Белый", swatch: "oklch(0.97 0.004 85)" },
  cream: { name: "Кремовый", swatch: "oklch(0.93 0.03 85)" },
  oak: { name: "Дуб натуральный", swatch: "oklch(0.74 0.09 70)" },
  walnut: { name: "Орех", swatch: "oklch(0.42 0.06 45)" },
  graphite: { name: "Графит", swatch: "oklch(0.42 0.006 60)" },
  gray: { name: "Серый шёлк", swatch: "oklch(0.72 0.006 70)" },
  sage: { name: "Шалфей", swatch: "oklch(0.52 0.05 140)" },
  navy: { name: "Тёмно-синий", swatch: "oklch(0.36 0.06 255)" },
  black: { name: "Чёрный", swatch: "oklch(0.22 0.005 60)" },
  bronze: { name: "Бронза", swatch: "oklch(0.5 0.07 60)" },
  brass: { name: "Латунь", swatch: "oklch(0.74 0.1 85)" },
  chrome: { name: "Хром", swatch: "oklch(0.82 0.004 250)" },
} satisfies Record<string, ColorVariant>;

const INT_SIZES = ["600x2000", "700x2000", "800x2000", "900x2000"];
const ENT_SIZES = ["860x2050", "960x2050"];

type Seed = Omit<Product, "id" | "slug"> & { slug: string };
let counter = 0;
const p = (seed: Seed): Product => ({ id: `p${++counter}`, ...seed });

export const PRODUCTS: Product[] = [
  // ——— Межкомнатные
  p({ slug: "fjord-01-white", name: "Fjord 01 эмаль белая", category: "interior", brand: "nordwood", collection: "Fjord", price: 2890, oldPrice: 3490, badges: ["hit"], stock: "in", image: doorWhite, colors: [SW.white, SW.cream, SW.gray], color: "white", material: "enamel", doorType: "blind", tags: ["classic", "soundproof"], sizes: INT_SIZES, popularity: 98, views: 1840, addedAt: "2026-08-10", description: "Филёнчатое полотно с матовой эмалью в несколько слоёв. Спокойная классика, которая подходит и к скандинавскому, и к современному интерьеру." }),
  p({ slug: "fjord-02-cream", name: "Fjord 02 кремовая", category: "interior", brand: "nordwood", collection: "Fjord", price: 3150, badges: ["new"], stock: "in", image: doorWhite, colors: [SW.cream, SW.white], color: "cream", material: "enamel", doorType: "blind", tags: ["classic"], sizes: INT_SIZES, popularity: 64, views: 720, addedAt: "2026-11-02", description: "Тёплый кремовый оттенок и мягкие филёнки. Полотно усилено сотовым заполнением для тишины в комнате." }),
  p({ slug: "linea-oak-flush", name: "Linea гладкая дуб натуральный", category: "interior", brand: "nordwood", collection: "Linea", price: 3640, badges: ["hit"], stock: "in", image: doorOak, colors: [SW.oak, SW.walnut], color: "light", material: "veneer", doorType: "blind", tags: ["soundproof"], sizes: INT_SIZES, popularity: 91, views: 2100, addedAt: "2026-06-15", description: "Гладкое полотно в натуральном шпоне дуба с подбором рисунка по вертикали. Живая текстура дерева и минимум деталей." }),
  p({ slug: "linea-walnut-inlay", name: "Linea Line орех с молдингом", category: "interior", brand: "nordwood", collection: "Linea", price: 3980, oldPrice: 4680, badges: [], stock: "order", image: doorWalnut, colors: [SW.walnut, SW.oak], color: "brown", material: "veneer", doorType: "blind", tags: [], sizes: INT_SIZES, popularity: 72, views: 1320, addedAt: "2026-05-01", description: "Шпон американского ореха с тонкими алюминиевыми вставками. Изготавливается под ваш проём за 14 дней." }),
  p({ slug: "klassika-sage", name: "Классика 2 шалфей", category: "interior", brand: "lambris", collection: "Классика", price: 3320, badges: ["new"], stock: "in", image: doorGreen, colors: [SW.sage, SW.navy, SW.white], color: "green", material: "emalex", doorType: "blind", tags: ["classic"], sizes: INT_SIZES, popularity: 77, views: 1490, addedAt: "2026-10-20", description: "Классическое полотно в глубоком зелёном оттенке с латунной фурнитурой в комплекте отделки. Покрытие эмалекс устойчиво к царапинам." }),
  p({ slug: "klassika-navy", name: "Классика 2 тёмно-синяя", category: "interior", brand: "lambris", collection: "Классика", price: 3320, oldPrice: 3790, badges: [], stock: "in", image: doorGreen, colors: [SW.navy, SW.sage], color: "blue", material: "emalex", doorType: "blind", tags: ["classic"], sizes: INT_SIZES, popularity: 55, views: 640, addedAt: "2026-09-12", description: "Тот же силуэт коллекции «Классика» в насыщенном синем — для кабинета или библиотеки." }),
  p({ slug: "modern-graphite-glass", name: "Модерн 7 графит со стеклом", category: "interior", brand: "lambris", collection: "Модерн", price: 2480, badges: ["hit"], stock: "in", image: doorGray, colors: [SW.graphite, SW.gray, SW.white], color: "gray", material: "softtouch", doorType: "glass", tags: ["budget"], sizes: INT_SIZES, popularity: 95, views: 2600, addedAt: "2026-04-08", description: "Покрытие Soft Touch бархатистое на ощупь и не оставляет отпечатков. Узкая вставка из матового стекла пропускает мягкий свет." }),
  p({ slug: "modern-gray-cpl", name: "Модерн 3 серый CPL", category: "interior", brand: "lambris", collection: "Модерн", price: 1690, oldPrice: 2190, badges: ["clearance"], stock: "in", image: doorGray, colors: [SW.gray, SW.white], color: "gray", material: "cpl", doorType: "glass", tags: ["budget"], sizes: ["700x2000", "800x2000"], popularity: 60, views: 980, addedAt: "2026-02-14", description: "Практичное полотно с плёнкой CPL, устойчивой к влаге и ударам. Остатки серии — успейте по специальной цене." }),
  p({ slug: "aria-mirror-white", name: "Aria Specchio белая с зеркалом", category: "interior", brand: "verano", collection: "Aria", price: 4290, badges: ["new"], stock: "order", image: doorWhite, colors: [SW.white, SW.graphite], color: "white", material: "gloss", doorType: "mirror", tags: [], sizes: INT_SIZES, popularity: 48, views: 560, addedAt: "2026-11-10", description: "Глянцевое полотно с зеркалом во всю высоту с одной стороны — визуально расширяет прихожую или гардеробную." }),
  p({ slug: "aria-sliding-oak", name: "Aria Scorrevole раздвижная дуб", category: "interior", brand: "verano", collection: "Aria", price: 5180, oldPrice: 5990, badges: ["hit"], stock: "in", image: doorOak, colors: [SW.oak, SW.white], color: "light", material: "ecoveneer", doorType: "blind", tags: ["sliding", "coupe"], sizes: ["800x2000", "900x2000"], popularity: 83, views: 1710, addedAt: "2026-07-01", description: "Раздвижное полотно в экошпоне с бесшумной направляющей. Экономит пространство в небольших квартирах." }),
  p({ slug: "sole-vinyl-light", name: "Sole 4 светлый ясень", category: "interior", brand: "verano", collection: "Sole", price: 1490, badges: [], stock: "in", image: doorOak, colors: [SW.oak, SW.cream], color: "light", material: "vinyl", doorType: "blind", tags: ["budget"], sizes: INT_SIZES, popularity: 70, views: 1150, addedAt: "2026-03-22", description: "Доступное полотно в виниловом покрытии под светлый ясень. Хороший выбор для съёмной квартиры или дачи." }),
  p({ slug: "sole-3dflex-gray", name: "Sole 9 3D Flex дымчатый", category: "interior", brand: "verano", collection: "Sole", price: 1980, badges: [], stock: "out", image: doorGray, colors: [SW.gray], color: "gray", material: "flex", doorType: "glass", tags: ["budget"], sizes: INT_SIZES, popularity: 41, views: 430, addedAt: "2026-01-18", description: "Объёмное покрытие 3D Flex повторяет фактуру дерева. Временно нет в наличии — новая партия ожидается." }),
  p({ slug: "invisible-paint", name: "Invisible под покраску", category: "interior", brand: "terra", collection: "Invisible", price: 4890, badges: ["hit"], stock: "order", image: doorWhite, colors: [SW.white], color: "paint", material: "solid", doorType: "invisible", tags: ["soundproof"], sizes: INT_SIZES, popularity: 88, views: 1980, addedAt: "2026-06-03", description: "Скрытая дверь заподлицо со стеной: алюминиевый короб, скрытые петли и магнитный замок. Покрасьте в цвет стен." }),
  p({ slug: "invisible-finish", name: "Invisible под отделку", category: "interior", brand: "terra", collection: "Invisible", price: 5390, badges: [], stock: "order", image: doorWhite, colors: [SW.white], color: "paint", material: "solid", doorType: "finish", tags: [], sizes: ["800x2000", "900x2000"], popularity: 39, views: 380, addedAt: "2026-09-30", description: "Полотно-основа под обои, панели или плитку. Дверь полностью растворяется в стене." }),
  p({ slug: "grain-dark-walnut", name: "Grain тёмный орех", category: "interior", brand: "terra", collection: "Grain", price: 4150, oldPrice: 4990, badges: [], stock: "in", image: doorWalnut, colors: [SW.walnut], color: "dark", material: "veneer", doorType: "blind", tags: ["soundproof"], sizes: INT_SIZES, popularity: 66, views: 1060, addedAt: "2026-08-25", description: "Глубокий тон ореха и горизонтальная раскладка шпона. Утолщённое полотно 44 мм для лучшей шумоизоляции." }),
  // ——— Входные
  p({ slug: "urban-graphite", name: "Урбан Лайн графит", category: "entrance", brand: "fortis", collection: "Урбан", price: 8900, oldPrice: 10400, badges: ["hit"], stock: "in", image: entranceDark, colors: [SW.graphite, SW.black], metal: "graphite", purpose: ["apartment"], features: ["mirror"], contours: 3, sizes: ENT_SIZES, popularity: 93, views: 2400, addedAt: "2026-05-18", description: "Входная дверь в квартиру с деревянной вставкой снаружи и зеркалом внутри. Три контура уплотнения, два замка разных систем." }),
  p({ slug: "urban-black", name: "Урбан Минимал чёрный", category: "entrance", brand: "fortis", collection: "Урбан", price: 7600, badges: ["new"], stock: "in", image: entranceDark, colors: [SW.black, SW.graphite], metal: "black", purpose: ["apartment"], features: [], contours: 2, sizes: ENT_SIZES, popularity: 58, views: 690, addedAt: "2026-11-05", description: "Строгая дверь с порошковым покрытием и скрытыми петлями. Хорошее соотношение цены и защиты." }),
  p({ slug: "termo-house-bronze", name: "Термо Хаус бронза", category: "entrance", brand: "fortis", collection: "Термо", price: 13900, badges: ["hit"], stock: "order", image: entranceBronze, colors: [SW.bronze, SW.graphite], metal: "bronze", purpose: ["house"], features: ["thermal"], contours: 4, sizes: ENT_SIZES, popularity: 86, views: 1530, addedAt: "2026-07-12", description: "Дверь для частного дома с терморазрывом: не промерзает и не покрывается конденсатом. Четыре контура уплотнения." }),
  p({ slug: "city-white", name: "Сити Светлая белая", category: "entrance", brand: "bastion", collection: "Сити", price: 9200, oldPrice: 9900, badges: [], stock: "in", image: entranceBronze, colors: [SW.white, SW.bronze], metal: "white", purpose: ["apartment"], features: ["mirror"], contours: 3, sizes: ENT_SIZES, popularity: 61, views: 870, addedAt: "2026-04-28", description: "Светлая отделка изнутри и зеркало в полный рост для маленькой прихожей." }),
  p({ slug: "house-thermo-black", name: "Хаус Термо чёрная", category: "entrance", brand: "bastion", collection: "Хаус", price: 12400, oldPrice: 14600, badges: ["clearance"], stock: "in", image: entranceDark, colors: [SW.black], metal: "black", purpose: ["house"], features: ["thermal"], contours: 4, sizes: ["960x2050"], popularity: 54, views: 760, addedAt: "2026-02-02", description: "Уличная дверь с терморазрывом и антивандальным покрытием. Последние экземпляры с выставки." }),
  // ——— Фурнитура
  p({ slug: "ovale-handle-brass", name: "Ручка Ovale латунь матовая", category: "hardware", sub: "handles", brand: "aurum", collection: "Ovale", price: 640, oldPrice: 790, badges: ["hit"], stock: "in", image: handleBrass, colors: [SW.brass, SW.black, SW.chrome], popularity: 97, views: 2300, addedAt: "2026-06-20", description: "Мягкая округлая форма на круглой розетке. Цинковый сплав с покрытием матовой латуни." }),
  p({ slug: "quadro-handle-black", name: "Ручка Quadro чёрная", category: "hardware", sub: "handles", brand: "aurum", collection: "Quadro", price: 520, badges: ["new"], stock: "in", image: handleBrass, colors: [SW.black, SW.brass], popularity: 74, views: 1100, addedAt: "2026-10-29", description: "Прямоугольная ручка на квадратной розетке — к современным полотнам без декора." }),
  p({ slug: "ovale-turn", name: "Завертка Ovale WC", category: "hardware", sub: "turns", brand: "aurum", collection: "Ovale", price: 290, badges: [], stock: "in", image: handleBrass, colors: [SW.brass, SW.black], popularity: 52, views: 410, addedAt: "2026-06-20", description: "Сантехническая завертка с индикатором в цвет ручек коллекции Ovale." }),
  p({ slug: "magnetic-latch", name: "Защёлка магнитная бесшумная", category: "hardware", sub: "latches", brand: "nordfix", collection: "Pro", price: 380, badges: ["hit"], stock: "in", image: hardwareSet, colors: [SW.black, SW.chrome], popularity: 81, views: 950, addedAt: "2026-03-10", description: "Магнитный язычок выдвигается только при закрывании: дверь захлопывается тихо и мягко." }),
  p({ slug: "hidden-hinge-3d", name: "Петля скрытая 3D", category: "hardware", sub: "hinges", brand: "nordfix", collection: "Pro", price: 460, badges: [], stock: "in", image: hardwareSet, colors: [SW.black, SW.chrome], popularity: 68, views: 720, addedAt: "2026-03-10", description: "Регулировка в трёх плоскостях, выдерживает полотно до 60 кг." }),
  p({ slug: "cylinder-70", name: "Цилиндр 70 мм ключ/ключ", category: "hardware", sub: "cylinders", brand: "nordfix", collection: "Basic", price: 340, badges: [], stock: "order", image: hardwareSet, colors: [SW.black, SW.chrome], popularity: 37, views: 300, addedAt: "2026-01-25", description: "Цилиндровый механизм с защитой от высверливания, 5 ключей в комплекте." }),
  p({ slug: "sliding-system-soft", name: "Раздвижная система Soft Close", category: "hardware", sub: "sliding-systems", brand: "nordfix", collection: "Pro", price: 1850, oldPrice: 2200, badges: [], stock: "in", image: hardwareSet, colors: [SW.chrome, SW.black], popularity: 59, views: 640, addedAt: "2026-09-01", description: "Алюминиевая направляющая с доводчиками с двух сторон для полотен до 80 кг." }),
  p({ slug: "door-kit-ovale", name: "Комплект Ovale: ручка, защёлка, петли", category: "hardware", sub: "kits", brand: "aurum", collection: "Ovale", price: 1390, badges: [], stock: "out", image: handleBrass, colors: [SW.brass, SW.black], popularity: 45, views: 520, addedAt: "2026-07-07", description: "Всё для установки одной двери в едином цвете. Временно закончился." }),
  // ——— Погонаж
  p({ slug: "frame-telescopic-oak", name: "Коробка телескопическая дуб", category: "trim", sub: "frames", brand: "nordwood", collection: "Linea", price: 690, badges: [], stock: "in", image: trimImg, colors: [SW.oak, SW.white, SW.walnut], popularity: 50, views: 380, addedAt: "2026-06-15", description: "Телескопическая коробка с уплотнителем, комплект на одну дверь." }),
  p({ slug: "casing-classic-white", name: "Наличник фигурный белый", category: "trim", sub: "casings", brand: "lambris", collection: "Классика", price: 210, badges: [], stock: "in", image: trimImg, colors: [SW.white, SW.cream], popularity: 44, views: 290, addedAt: "2026-08-10", description: "Наличник 80 мм с профилем для классических полотен, 2200 мм." }),
  p({ slug: "extension-100", name: "Добор 100 мм", category: "trim", sub: "extensions", brand: "terra", collection: "Grain", price: 180, oldPrice: 240, badges: ["clearance"], stock: "in", image: trimImg, colors: [SW.oak, SW.walnut, SW.white], popularity: 33, views: 210, addedAt: "2026-02-20", description: "Доборная планка для толстых стен, 2200 мм." }),
];

export function productBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((x) => x.slug === slug);
}

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((x) => x.id === id);
}

export function labelOf(options: Option[], key?: string): string | undefined {
  return key ? options.find((o) => o.key === key)?.label : undefined;
}

export interface Review {
  name: string;
  city: string;
  rating: number;
  date: string;
  text: string;
  product: string;
}

export const REVIEWS: Review[] = [
  { name: "Айна", city: "Ашхабад", rating: 5, date: "12 ноября 2026", product: "Fjord 01 эмаль белая", text: "Заказали шесть дверей в новую квартиру. Замерщик приехал на следующий день, установка заняла один день и прошла без пыли." },
  { name: "Мерген", city: "Ашхабад", rating: 5, date: "3 ноября 2026", product: "Термо Хаус бронза", text: "Поставили входную дверь с терморазрывом в дом — зимой не промерзает. Отдельное спасибо за аккуратный монтаж откосов." },
  { name: "Ольга", city: "Туркменабат", rating: 4, date: "28 октября 2026", product: "Модерн 7 графит", text: "Покрытие очень приятное, отпечатков не видно. Доставка в регион заняла неделю, но всё пришло в идеальной упаковке." },
  { name: "Сердар", city: "Мары", rating: 5, date: "15 октября 2026", product: "Invisible под покраску", text: "Скрытые двери — именно то, что хотел дизайнер. Консультанты помогли подобрать петли и замок." },
];

export const BADGE_LABELS: Record<BadgeKind, string> = {
  hit: "Хит продаж",
  clearance: "Распродажа остатков",
  new: "Новинка",
};
