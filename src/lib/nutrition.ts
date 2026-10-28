/**
 * Estimated nutrition for a cocktail recipe.
 *
 * Why this exists: Google's Recipe structured-data guidelines recommend a
 * `nutrition` property, and "how many calories in a <cocktail>" is a large
 * search demand cluster. The site stores canonical ingredients + amounts
 * (Prisma `CocktailIngredient.amount`), so we can derive a defensible
 * per-serving estimate on the server instead of inventing numbers:
 *
 *   kcal / sugar = Σ (volume_mL / 100) × (standard value per 100 mL)
 *
 * Values are standard reference figures for typical commercial products
 * (spirits ≈ 231 kcal/100 mL at 40 % ABV, 1:1 simple syrup ≈ 250 kcal/100 mL,
 * etc.). They are estimates, not lab measurements — the UI and the JSON-LD
 * both label them "estimated", which keeps the markup honest and consistent
 * with the visible page (a hard requirement of Google's structured-data
 * policies).
 *
 * The same estimate powers the visible "Estimated nutrition" block on the
 * cocktail page, so structured data never describes content the user cannot
 * see.
 */

export interface NutritionEstimate {
  /** Estimated kilocalories per serving, rounded to the nearest 5. */
  calories: number;
  /** Estimated sugar in grams per serving. */
  sugarG: number;
  /** Approximate liquid volume in millilitres (used for serving-size text). */
  volumeMl: number;
}

export interface NutritionIngredient {
  id: string;
  amount: string;
}

interface IngredientNutrition {
  kcalPer100Ml: number;
  sugarPer100Ml: number;
  /** kcal for a single garnish piece (olive, cherry, leaf, …). */
  kcalPerPiece?: number;
  /** Volume assumed when the amount is "to top" (usually a mixer). */
  topUpMl?: number;
}

/** Standard reference values per 100 mL, keyed by canonical ingredient id. */
const PER_100_ML: Record<string, IngredientNutrition> = {
  // --- Spirits (~40 % ABV → ≈231 kcal/100 mL, no sugar) ---
  gin: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  vodka: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  white_rum: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  dark_rum: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  tequila: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  mezcal: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  bourbon: { kcalPer100Ml: 250, sugarPer100Ml: 0 },
  rye_whiskey: { kcalPer100Ml: 250, sugarPer100Ml: 0 },
  scotch: { kcalPer100Ml: 250, sugarPer100Ml: 0 },
  cognac: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  brandy: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  cachaca: { kcalPer100Ml: 231, sugarPer100Ml: 0 },
  pisco: { kcalPer100Ml: 229, sugarPer100Ml: 0 },
  absinthe: { kcalPer100Ml: 300, sugarPer100Ml: 0 },
  aquavit: { kcalPer100Ml: 240, sugarPer100Ml: 0 },

  // --- Liqueurs / fortified wines ---
  triple_sec: { kcalPer100Ml: 300, sugarPer100Ml: 25 },
  cointreau: { kcalPer100Ml: 300, sugarPer100Ml: 25 },
  curacao: { kcalPer100Ml: 250, sugarPer100Ml: 22 },
  grand_marnier: { kcalPer100Ml: 300, sugarPer100Ml: 25 },
  campari: { kcalPer100Ml: 240, sugarPer100Ml: 20 },
  aperol: { kcalPer100Ml: 160, sugarPer100Ml: 16 },
  sweet_vermouth: { kcalPer100Ml: 150, sugarPer100Ml: 12 },
  dry_vermouth: { kcalPer100Ml: 105, sugarPer100Ml: 2 },
  lillet_blanc: { kcalPer100Ml: 140, sugarPer100Ml: 12 },
  maraschino: { kcalPer100Ml: 300, sugarPer100Ml: 30 },
  amaretto: { kcalPer100Ml: 320, sugarPer100Ml: 30 },
  coffee_liqueur: { kcalPer100Ml: 320, sugarPer100Ml: 30 },
  irish_cream: { kcalPer100Ml: 330, sugarPer100Ml: 20 },
  creme_de_cacao: { kcalPer100Ml: 300, sugarPer100Ml: 28 },
  creme_de_violette: { kcalPer100Ml: 280, sugarPer100Ml: 25 },
  benedictine: { kcalPer100Ml: 250, sugarPer100Ml: 22 },
  chartreuse_green: { kcalPer100Ml: 300, sugarPer100Ml: 20 },
  cherry_liqueur: { kcalPer100Ml: 280, sugarPer100Ml: 25 },
  creme_de_menthe: { kcalPer100Ml: 300, sugarPer100Ml: 28 },
  pimm_no1: { kcalPer100Ml: 200, sugarPer100Ml: 18 },
  dubonnet: { kcalPer100Ml: 150, sugarPer100Ml: 12 },
  port: { kcalPer100Ml: 160, sugarPer100Ml: 10 },
  sherry: { kcalPer100Ml: 130, sugarPer100Ml: 1 },

  // --- Juices ---
  lemon_juice: { kcalPer100Ml: 25, sugarPer100Ml: 2.5 },
  lime_juice: { kcalPer100Ml: 25, sugarPer100Ml: 1.7 },
  orange_juice: { kcalPer100Ml: 45, sugarPer100Ml: 9 },
  grapefruit_juice: { kcalPer100Ml: 40, sugarPer100Ml: 7 },
  cranberry_juice: { kcalPer100Ml: 45, sugarPer100Ml: 12 },
  pineapple_juice: { kcalPer100Ml: 50, sugarPer100Ml: 10 },
  apple_juice: { kcalPer100Ml: 46, sugarPer100Ml: 10 },
  tomato_juice: { kcalPer100Ml: 17, sugarPer100Ml: 3.5 },

  // --- Fresh produce (garnish calories are per piece) ---
  mint: { kcalPer100Ml: 0, sugarPer100Ml: 0, kcalPerPiece: 0 },
  basil: { kcalPer100Ml: 0, sugarPer100Ml: 0, kcalPerPiece: 0 },
  cucumber: { kcalPer100Ml: 15, sugarPer100Ml: 1.7, kcalPerPiece: 1 },
  berries: { kcalPer100Ml: 45, sugarPer100Ml: 7, kcalPerPiece: 4 },
  cherry: { kcalPer100Ml: 50, sugarPer100Ml: 12, kcalPerPiece: 5 },
  olive: { kcalPer100Ml: 145, sugarPer100Ml: 0, kcalPerPiece: 5 },
  rosemary: { kcalPer100Ml: 0, sugarPer100Ml: 0, kcalPerPiece: 0 },

  // --- Sweeteners (syrups) ---
  simple_syrup: { kcalPer100Ml: 250, sugarPer100Ml: 55 },
  honey_syrup: { kcalPer100Ml: 300, sugarPer100Ml: 75 },
  agave_syrup: { kcalPer100Ml: 310, sugarPer100Ml: 70 },
  maple_syrup: { kcalPer100Ml: 260, sugarPer100Ml: 60 },
  grenadine: { kcalPer100Ml: 300, sugarPer100Ml: 65 },
  orgeat: { kcalPer100Ml: 320, sugarPer100Ml: 65 },

  // --- Bitters (a dash is ~1 mL; nutritionally negligible) ---
  angostura_bitters: { kcalPer100Ml: 0, sugarPer100Ml: 0 },
  orange_bitters: { kcalPer100Ml: 0, sugarPer100Ml: 0 },
  peychauds_bitters: { kcalPer100Ml: 0, sugarPer100Ml: 0 },

  // --- Mixers ---
  club_soda: { kcalPer100Ml: 0, sugarPer100Ml: 0 },
  tonic_water: { kcalPer100Ml: 35, sugarPer100Ml: 9 },
  ginger_beer: { kcalPer100Ml: 40, sugarPer100Ml: 9.5 },
  ginger_ale: { kcalPer100Ml: 35, sugarPer100Ml: 9 },
  cola: { kcalPer100Ml: 42, sugarPer100Ml: 10.6 },
  prosecco: { kcalPer100Ml: 75, sugarPer100Ml: 5, topUpMl: 60 },
  champagne: { kcalPer100Ml: 80, sugarPer100Ml: 4, topUpMl: 60 },

  // --- Dairy ---
  cream: { kcalPer100Ml: 340, sugarPer100Ml: 3 },
  coconut_cream: { kcalPer100Ml: 330, sugarPer100Ml: 6 },

  // --- Other ---
  egg_white: { kcalPer100Ml: 52, sugarPer100Ml: 0.7 },
  aquafaba: { kcalPer100Ml: 15, sugarPer100Ml: 0 },
  coffee: { kcalPer100Ml: 2, sugarPer100Ml: 0 },
};

const DEFAULT_TOP_UP_ML = 90;

/** Millilitres per unit, for the amount formats used by the recipe database. */
const VOLUME_UNITS: Record<string, number> = {
  ml: 1,
  cl: 10,
  oz: 29.5735,
  tbsp: 15,
  tsp: 5,
  dash: 0.92,
  dashes: 0.92,
  drop: 0.05,
  drops: 0.05,
  splash: 5,
  shot: 44,
  part: 30,
  parts: 30,
  cup: 240,
};

interface ParsedAmount {
  /** Liquid volume in millilitres. */
  ml: number;
  /** Whole garnish pieces (olive, cherry, mint leaf…). */
  pieces: number;
}

function parseAmount(amount: string, nutrition: IngredientNutrition): ParsedAmount {
  const raw = amount.trim().toLowerCase();
  if (!raw) return { ml: 0, pieces: 0 };

  // "to top", "top with soda", "fill with tonic" — an unspecified mixer volume.
  if (/\btop\b|\bfill\b/.test(raw)) {
    return { ml: nutrition.topUpMl ?? DEFAULT_TOP_UP_ML, pieces: 0 };
  }

  // A citrus twist contributes aroma only.
  if (/twist|zest|peel/.test(raw)) return { ml: 0, pieces: 0 };

  // A wedge ≈ 10 mL of juice, a slice ≈ 5 mL.
  if (/wedge/.test(raw)) return { ml: 10, pieces: 0 };
  if (/slice/.test(raw)) return { ml: 5, pieces: 0 };

  const numeric = raw.match(/(\d+\/\d+|\d+(?:[.,]\d+)?)/);
  const count = numeric ? toNumber(numeric[1]) : 1;

  // Leaves / sprigs / whole pieces: count them, calories come from kcalPerPiece.
  if (/leaf|leaves|sprig|piece|whole|each/.test(raw)) {
    return { ml: 0, pieces: count };
  }

  // Find an explicit unit anywhere after the number.
  const remainder = numeric ? raw.slice(raw.indexOf(numeric[1]) + numeric[1].length).trim() : raw;
  const unitMatch = remainder.match(/^\s*([a-z]+)/);
  const unit = unitMatch?.[1] ?? "";

  if (unit && VOLUME_UNITS[unit] !== undefined) {
    return { ml: count * VOLUME_UNITS[unit], pieces: 0 };
  }

  // Bare numbers ("1", "2") are pieces (olive, cherry…).
  if (!unit) return { ml: 0, pieces: count };

  // Unknown unit: be conservative and ignore it.
  return { ml: 0, pieces: 0 };
}

function toNumber(value: string): number {
  if (value.includes("/")) {
    const [n, d] = value.split("/").map((x) => Number.parseFloat(x));
    if (Number.isFinite(n) && Number.isFinite(d) && d !== 0) return n / d;
    return 0;
  }
  return Number.parseFloat(value.replace(",", ".")) || 0;
}

function roundCalories(value: number): number {
  if (value <= 0) return 0;
  if (value < 10) return Math.round(value);
  return Math.round(value / 5) * 5;
}

/**
 * Estimate per-serving nutrition from canonical ingredient ids + amounts.
 * Returns null when there is nothing to estimate (empty ingredient list).
 */
export function estimateNutrition(ingredients: NutritionIngredient[]): NutritionEstimate | null {
  if (!ingredients || ingredients.length === 0) return null;

  let calories = 0;
  let sugar = 0;
  let volume = 0;
  let known = false;

  for (const item of ingredients) {
    const nutrition = PER_100_ML[item.id];
    if (!nutrition) continue;
    known = true;

    const { ml, pieces } = parseAmount(item.amount, nutrition);
    calories += (ml / 100) * nutrition.kcalPer100Ml + pieces * (nutrition.kcalPerPiece ?? 0);
    sugar += (ml / 100) * nutrition.sugarPer100Ml;
    volume += ml;
  }

  if (!known) return null;

  return {
    calories: roundCalories(calories),
    sugarG: Math.max(0, Math.round(sugar)),
    volumeMl: Math.max(0, Math.round(volume / 5) * 5),
  };
}

/** Human-readable serving size used by the JSON-LD and the visible page. */
export function servingSizeText(volumeMl: number, lang: "en" | "zh-CN"): string {
  const volume = Math.max(0, Math.round(volumeMl));
  if (lang === "zh-CN") {
    return volume > 0 ? `1 杯（约 ${volume} 毫升）` : "1 杯";
  }
  return volume > 0 ? `1 cocktail (about ${volume} ml)` : "1 cocktail";
}
/* ------------------------------------------------------------------ *
 * Estimated strength (alcohol) — the second piece of "information
 * gain" on a recipe page: "how strong is this cocktail?" is a real
 * search question that competitors rarely answer with the site's own
 * numbers. We derive it from the same canonical amounts used for the
 * nutrition estimate, so page and data can never disagree.
 *
 * It is a *pre-dilution* estimate: ice melt adds roughly 20-25 % water
 * to a shaken or stirred drink, which the UI states explicitly.
 * ------------------------------------------------------------------ */

/** Typical ABV (%) for the alcohol-bearing ingredients in the database. */
const ABV_PCT: Record<string, number> = {
  gin: 40, vodka: 40, white_rum: 40, dark_rum: 40, tequila: 40, mezcal: 45,
  bourbon: 45, rye_whiskey: 45, scotch: 43, cognac: 40, brandy: 40, cachaca: 40,
  pisco: 40, absinthe: 60, aquavit: 40,
  triple_sec: 30, cointreau: 40, curacao: 30, grand_marnier: 40, campari: 25,
  aperol: 11, sweet_vermouth: 16, dry_vermouth: 15, lillet_blanc: 17,
  maraschino: 32, amaretto: 28, coffee_liqueur: 20, irish_cream: 17,
  creme_de_cacao: 24, creme_de_violette: 20, benedictine: 40, chartreuse_green: 55,
  cherry_liqueur: 24, creme_de_menthe: 24, pimm_no1: 25, dubonnet: 15,
  port: 20, sherry: 15, prosecco: 11, champagne: 12,
  angostura_bitters: 44.7, orange_bitters: 45, peychauds_bitters: 35,
};

const ETHANOL_G_PER_ML = 0.789;
/** US standard drink: 14 g of pure alcohol. */
const STANDARD_DRINK_G = 14;

export interface StrengthEstimate {
  /** Estimated alcohol by volume of the poured ingredients, in percent. */
  abv: number;
  /** Grams of pure alcohol per serving. */
  alcoholG: number;
  /** alcoholG expressed in US standard drinks (one = 14 g). */
  standardDrinks: number;
}

/**
 * Estimate strength from the canonical ingredient amounts.
 * Returns null when the recipe contains no alcohol-bearing ingredient.
 */
export function estimateStrength(ingredients: NutritionIngredient[]): StrengthEstimate | null {
  if (!ingredients || ingredients.length === 0) return null;

  let alcoholMl = 0;
  let volumeMl = 0;

  for (const item of ingredients) {
    const nutrition = PER_100_ML[item.id];
    const parsed = parseAmount(item.amount, nutrition ?? { kcalPer100Ml: 0, sugarPer100Ml: 0 });
    const abv = ABV_PCT[item.id] ?? 0;

    volumeMl += parsed.ml;
    alcoholMl += (parsed.ml * abv) / 100;
  }

  if (alcoholMl <= 0 || volumeMl <= 0) return null;

  const alcoholG = alcoholMl * ETHANOL_G_PER_ML;
  return {
    abv: Math.round((alcoholMl / volumeMl) * 100 * 10) / 10,
    alcoholG: Math.round(alcoholG),
    standardDrinks: Math.round((alcoholG / STANDARD_DRINK_G) * 10) / 10,
  };
}

/** Human-readable strength line for the visible page. */
export function strengthText(strength: StrengthEstimate, lang: "en" | "zh-CN"): string {
  if (lang === "zh-CN") {
    return `约 ${strength.abv}% ABV（约 ${strength.alcoholG} 克酒精，未计入冰块稀释）`;
  }
  return `About ${strength.abv}% ABV (about ${strength.alcoholG} g of alcohol, before ice dilution)`;
}
/**
 * Nutrition + strength in one object, so callers (and the UI) never have to
 * compute the two independently and risk showing mismatched numbers.
 */
export function estimateServing(
  ingredients: NutritionIngredient[],
): (NutritionEstimate & { abv?: number; alcoholG?: number }) | null {
  const nutrition = estimateNutrition(ingredients);
  if (!nutrition) return null;
  const strength = estimateStrength(ingredients);
  return strength ? { ...nutrition, abv: strength.abv, alcoholG: strength.alcoholG } : nutrition;
}
