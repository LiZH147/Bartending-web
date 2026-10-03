import type { CocktailResult } from "./schemas";

// Local (browser) cache for AI creative cocktails, keyed by the ingredient
// selection so a repeat search shows the same AI creations instantly instead of
// waiting ~30s for the LLM to regenerate (and burning another call).

const PREFIX = "nightcap:creative:";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface CreativeCacheEntry {
  savedAt: number;
  creative: CocktailResult[];
}

function buildKey(ingredientIds: string[], missingLimit: number, language: string): string {
  const ids = [...new Set(ingredientIds)].sort().join(",");
  return `${PREFIX}${language}:${ids}:${missingLimit}`;
}

export function loadCreativeCache(
  ingredientIds: string[],
  missingLimit: number,
  language: string,
): CocktailResult[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(buildKey(ingredientIds, missingLimit, language));
    if (!raw) return null;
    const entry = JSON.parse(raw) as CreativeCacheEntry;
    if (!entry || !Array.isArray(entry.creative)) return null;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) return null;
    return entry.creative;
  } catch {
    return null;
  }
}

export function saveCreativeCache(
  ingredientIds: string[],
  missingLimit: number,
  language: string,
  creative: CocktailResult[],
): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CreativeCacheEntry = { savedAt: Date.now(), creative };
    window.localStorage.setItem(buildKey(ingredientIds, missingLimit, language), JSON.stringify(entry));
  } catch {
    /* ignore quota / parse errors */
  }
}