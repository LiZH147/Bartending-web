import type { HydratedIngredient } from "./data";
import type { SubstitutionSchema } from "./schemas";

type Substitution = { id: string; name: string; nameEn: string; reason: string; source: "rule"; availability: "owned" | "buy" };

/** Curated classic swaps keyed by canonical ingredient id. */
const CURATED_SWAPS: Record<string, string[]> = {
  simple_syrup: ["honey_syrup", "agave_syrup", "maple_syrup", "grenadine"],
  honey_syrup: ["simple_syrup", "agave_syrup", "maple_syrup"],
  agave_syrup: ["simple_syrup", "honey_syrup"],
  lemon_juice: ["lime_juice", "orange_juice"],
  lime_juice: ["lemon_juice"],
  orange_juice: ["lime_juice", "lemon_juice"],
  triple_sec: ["cointreau", "curacao", "grand_marnier"],
  cointreau: ["triple_sec", "curacao", "grand_marnier"],
  curacao: ["triple_sec", "cointreau"],
  sweet_vermouth: ["dry_vermouth", "lillet_blanc", "cocchi_americano"],
  dry_vermouth: ["sweet_vermouth", "lillet_blanc"],
  campari: ["aperol", "select"],
  aperol: ["campari", "select"],
  angostura_bitters: ["orange_bitters", "peychauds_bitters"],
  orange_bitters: ["angostura_bitters", "peychauds_bitters"],
  club_soda: ["tonic_water", "ginger_ale"],
  tonic_water: ["club_soda", "ginger_ale"],
  ginger_beer: ["ginger_ale", "club_soda"],
  white_rum: ["dark_rum", "cachaca"],
  dark_rum: ["white_rum", "bourbon"],
  bourbon: ["rye_whiskey", "scotch"],
  rye_whiskey: ["bourbon", "scotch"],
  tequila: ["mezcal"],
  mezcal: ["tequila"],
  cognac: ["brandy"],
  brandy: ["cognac"],
  maraschino: ["cherry_liqueur", "triple_sec"],
  grenadine: ["simple_syrup", "cranberry_juice"],
  egg_white: ["aquafaba"],
  aquafaba: ["egg_white"],
  mint: ["basil"],
  basil: ["mint"],
};

function categoryRank(category: string): number {
  const order = ["spirit", "liqueur", "juice", "fresh", "sweetener", "bitters", "mixer", "dairy", "other"];
  const i = order.indexOf(category);
  return i < 0 ? order.length : i;
}

/** Shared flavor overlap count. */
function flavorOverlap(a: string[], b: string[]): number {
  const s = new Set(b);
  return a.filter((x) => s.has(x)).length;
}

export function suggestSubstitutions(
  missingId: string,
  ownedIds: Set<string>,
  allIngredients: HydratedIngredient[],
  lang: "en" | "zh-CN" = "en",
): Substitution[] {
  const results: Substitution[] = [];
  const seen = new Set<string>([missingId]);

  const curated = CURATED_SWAPS[missingId] ?? [];
  for (const id of curated) {
    if (seen.has(id)) continue;
    const ing = allIngredients.find((i) => i.id === id);
    if (ing) {
      seen.add(id);
      results.push({
        id,
        name: lang === "zh-CN" ? ing.nameZh : ing.nameEn,
        nameEn: ing.nameEn,
        reason: lang === "zh-CN" ? "经典替代" : "classic swap",
        source: "rule",
        availability: ownedIds.has(id) ? "owned" : "buy",
      });
    }
  }

  const target = allIngredients.find((i) => i.id === missingId);
  const candidates = allIngredients
    .filter((i) => i.id !== missingId)
    .map((i) => {
      const sameCategory = target && i.category === target.category;
      const overlap = target ? flavorOverlap(target.flavorProfile, i.flavorProfile) : 0;
      const catDistance = target ? Math.abs(categoryRank(target.category) - categoryRank(i.category)) : 2;
      const isOwned = ownedIds.has(i.id) ? 3 : 0;
      const score = (sameCategory ? 5 : 0) + overlap * 2 + (catDistance === 0 ? 2 : 0) + isOwned;
      return { i, score };
    })
    .sort((a, b) => b.score - a.score);

  for (const { i } of candidates) {
    if (results.length >= 3) break;
    if (seen.has(i.id)) continue;
    seen.add(i.id);
    const owned = ownedIds.has(i.id);
    results.push({
      id: i.id,
      name: lang === "zh-CN" ? i.nameZh : i.nameEn,
      nameEn: i.nameEn,
      reason: owned
        ? lang === "zh-CN"
          ? "你已经有的替代"
          : "you already own this"
        : lang === "zh-CN"
          ? "相近风味"
          : "similar profile",
      source: "rule",
      availability: owned ? "owned" : "buy",
    });
  }

  return results;
}