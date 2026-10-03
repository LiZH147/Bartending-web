import type { ScoreWeights } from "./config";
import type { HydratedCocktail } from "./data";
import type { Preferences } from "./schemas";
import { clamp } from "./utils";
import { DIFFICULTIES } from "./constants";

export interface MissingIngredientInfo {
  id: string;
  nameEn: string;
  nameZh: string;
  emoji: string;
  amount: string;
}

export interface ScoredCocktail {
  cocktail: HydratedCocktail;
  ingredientMatch: number;
  preferenceMatch: number;
  difficultyMatch: number;
  score: number;
  available: boolean;
  missing: MissingIngredientInfo[];
  missingCount: number;
}

const difficultyIndex = (d: string) => {
  const i = DIFFICULTIES.indexOf(d as (typeof DIFFICULTIES)[number]);
  return i < 0 ? 1 : i;
};

export function computeDifficultyMatch(
  target: string,
  pref: string | null | undefined,
): number {
  if (!pref) return 1;
  const d = Math.abs(difficultyIndex(target) - difficultyIndex(pref));
  if (d === 0) return 1;
  if (d === 1) return 0.6;
  return 0.2;
}

export function computePreferenceMatch(
  cocktail: HydratedCocktail,
  prefs: Preferences,
): number {
  const dims: number[] = [];

  if (prefs.flavor && prefs.flavor.length > 0) {
    const wanted = new Set(prefs.flavor);
    const overlap = cocktail.flavorProfile.filter((f) => wanted.has(f)).length;
    dims.push(clamp(overlap / prefs.flavor.length));
  }

  if (prefs.strength) {
    dims.push(cocktail.strength === prefs.strength ? 1 : 0);
  }

  if (dims.length === 0) return 1;
  return dims.reduce((a, b) => a + b, 0) / dims.length;
}

export function scoreCocktail(
  cocktail: HydratedCocktail,
  owned: Set<string>,
  prefs: Preferences,
  weights: ScoreWeights,
): ScoredCocktail {
  const required = cocktail.ingredients.filter((ci) => !ci.optional);
  const ownedRequired = required.filter((ci) => owned.has(ci.ingredient.id));

  const ingredientMatch = required.length === 0 ? 1 : ownedRequired.length / required.length;
  const preferenceMatch = computePreferenceMatch(cocktail, prefs);
  const difficultyMatch = computeDifficultyMatch(cocktail.difficulty, prefs.difficulty);

  const score =
    weights.ingredient * ingredientMatch +
    weights.preference * preferenceMatch +
    weights.difficulty * difficultyMatch +
    weights.popularity * clamp(cocktail.popularity) +
    weights.novelty * clamp(cocktail.novelty);

  const missing = required
    .filter((ci) => !owned.has(ci.ingredient.id))
    .map((ci) => ({
      id: ci.ingredient.id,
      nameEn: ci.ingredient.nameEn,
      nameZh: ci.ingredient.nameZh,
      emoji: ci.ingredient.emoji,
      amount: ci.amount,
    }));

  return {
    cocktail,
    ingredientMatch,
    preferenceMatch,
    difficultyMatch,
    score,
    available: missing.length === 0,
    missing,
    missingCount: missing.length,
  };
}

export function rankCocktails(
  cocktails: HydratedCocktail[],
  owned: Set<string>,
  prefs: Preferences,
  weights: ScoreWeights,
): { available: ScoredCocktail[]; almost: ScoredCocktail[] } {
  let scored = cocktails.map((c) => scoreCocktail(c, owned, prefs, weights));

  // Optional preparation-time filter (soft: ignore if it would clear everything).
  if (prefs.maxPrepTime != null && prefs.maxPrepTime > 0) {
    const withinTime = scored.filter((s) => s.cocktail.prepTime <= (prefs.maxPrepTime ?? 0));
    if (withinTime.some((s) => s.available) || withinTime.length > 0) {
      scored = withinTime;
    }
  }

  const available = scored
    .filter((s) => s.available)
    .sort((a, b) => b.score - a.score);

  const almost = scored
    .filter((s) => !s.available)
    .sort(
      (a, b) =>
        a.missingCount - b.missingCount ||
        b.ingredientMatch - a.ingredientMatch ||
        b.score - a.score,
    );

  return { available, almost };
}