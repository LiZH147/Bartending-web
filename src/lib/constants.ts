export const DIFFICULTIES = ["easy", "medium", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const STRENGTHS = ["none", "low", "medium", "high"] as const;
export type Strength = (typeof STRENGTHS)[number];

export const METHODS = ["shaken", "stirred", "built", "muddled", "blended"] as const;
export type Method = (typeof METHODS)[number];

export const SOURCES = ["classic", "ai"] as const;
export type Source = (typeof SOURCES)[number];

export const FLAVORS = [
  "sour",
  "sweet",
  "bitter",
  "fresh",
  "smoky",
  "fruity",
  "herbal",
  "dry",
  "floral",
  "spicy",
  "creamy",
  "citrus",
  "botanical",
  "strong",
] as const;
export type Flavor = (typeof FLAVORS)[number];

export const CATEGORIES = [
  "spirit",
  "liqueur",
  "juice",
  "fresh",
  "sweetener",
  "bitters",
  "mixer",
  "dairy",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface LocalizedLabel {
  en: string;
  zh: string;
}

export const DIFFICULTY_LABELS: Record<Difficulty, LocalizedLabel> = {
  easy: { en: "Easy", zh: "简单" },
  medium: { en: "Medium", zh: "中等" },
  advanced: { en: "Advanced", zh: "进阶" },
};

export const STRENGTH_LABELS: Record<Strength, LocalizedLabel> = {
  none: { en: "Alcohol-free", zh: "无酒精" },
  low: { en: "Low", zh: "低" },
  medium: { en: "Medium", zh: "中" },
  high: { en: "High", zh: "高" },
};

export const METHOD_LABELS: Record<Method, LocalizedLabel> = {
  shaken: { en: "Shaken", zh: "摇和" },
  stirred: { en: "Stirred", zh: "搅拌" },
  built: { en: "Built in glass", zh: "直调" },
  muddled: { en: "Muddled", zh: "捣压" },
  blended: { en: "Blended", zh: "搅打" },
};

export const FLAVOR_LABELS: Record<Flavor, LocalizedLabel> = {
  sour: { en: "Sour", zh: "酸" },
  sweet: { en: "Sweet", zh: "甜" },
  bitter: { en: "Bitter", zh: "苦" },
  fresh: { en: "Fresh", zh: "清爽" },
  smoky: { en: "Smoky", zh: "烟熏" },
  fruity: { en: "Fruity", zh: "果香" },
  herbal: { en: "Herbal", zh: "草本" },
  dry: { en: "Dry", zh: "干冽" },
  floral: { en: "Floral", zh: "花香" },
  spicy: { en: "Spicy", zh: "辛香" },
  creamy: { en: "Creamy", zh: "顺滑" },
  citrus: { en: "Citrus", zh: "柑橘" },
  botanical: { en: "Botanical", zh: "植物" },
  strong: { en: "Strong", zh: "浓烈" },
};

export const CATEGORY_LABELS: Record<Category, LocalizedLabel> = {
  spirit: { en: "Spirits", zh: "烈酒" },
  liqueur: { en: "Liqueurs", zh: "利口酒" },
  juice: { en: "Juices", zh: "果汁" },
  fresh: { en: "Fresh Produce", zh: "新鲜食材" },
  sweetener: { en: "Sweeteners", zh: "糖浆/甜味剂" },
  bitters: { en: "Bitters", zh: "苦精" },
  mixer: { en: "Mixers", zh: "软饮/气泡" },
  dairy: { en: "Dairy", zh: "乳制品" },
  other: { en: "Other", zh: "其他" },
};

export const SOURCE_LABELS: Record<Source, LocalizedLabel> = {
  classic: { en: "Classic", zh: "经典" },
  ai: { en: "AI Creation", zh: "AI 创意" },
};

/** Popular/quick-add ingredient ids shown on the homepage. */
export const QUICK_INGREDIENT_IDS = [
  "gin",
  "vodka",
  "white_rum",
  "tequila",
  "bourbon",
  "lemon_juice",
  "lime_juice",
  "simple_syrup",
  "tonic_water",
  "club_soda",
  "triple_sec",
  "sweet_vermouth",
  "campari",
  "angostura_bitters",
];