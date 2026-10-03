import { normalizeText } from "./utils";

export interface NormalizableIngredient {
  id: string;
  nameEn: string;
  nameZh: string;
  aliases: string[];
}

type AliasMap = Map<string, string[]>;

/** Build a lowercase alias -> canonical id map. */
export function buildAliasMap(ingredients: NormalizableIngredient[]): AliasMap {
  const map: AliasMap = new Map();
  for (const ing of ingredients) {
    const keys = new Set<string>();
    keys.add(normalizeText(ing.nameEn));
    keys.add(normalizeText(ing.nameZh));
    keys.add(normalizeText(ing.id));
    for (const a of ing.aliases) keys.add(normalizeText(a));
    for (const k of keys) {
      if (!k) continue;
      const arr = map.get(k) ?? [];
      arr.push(ing.id);
      map.set(k, arr);
    }
  }
  return map;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function singularize(word: string): string[] {
  const variants: string[] = [];
  if (word.endsWith("ies") && word.length > 4) variants.push(word.slice(0, -3) + "y");
  if (word.endsWith("ches") || word.endsWith("shes") || word.endsWith("xes") || word.endsWith("zes")) {
    variants.push(word.slice(0, -2));
  }
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 2) {
    variants.push(word.slice(0, -1));
  }
  variants.push(word + "es", word + "s");
  return variants;
}

/**
 * Deterministic alias normalization. Returns canonical id or null.
 * Exact alias -> singular/plural heuristic -> token containment -> edit distance.
 */
export function normalizeOne(input: string, map: AliasMap): string | null {
  const text = normalizeText(input);
  if (!text) return null;

  const direct = map.get(text);
  if (direct && direct.length > 0) return direct[0];

  // plural/singular heuristics on each word
  const tokens = text.split(" ");
  for (const token of tokens) {
    for (const v of singularize(token)) {
      const hit = map.get(v);
      if (hit) {
        // If the whole input equals just this token (plus modifiers), keep it simple.
        if (tokens.length === 1) return hit[0];
        // For multi-word input, require the remaining words to also loosely match.
        const candidate = `${v}`;
        if (candidate === text) return hit[0];
        break;
      }
    }
  }

  // containment: alias inside input or input inside alias (only for short inputs)
  for (const [alias, ids] of map) {
    if (alias.length < 3 || ids.length === 0) continue;
    if (text.includes(alias) || alias.includes(text)) {
      if (alias.length >= 4 || text.length >= 4) return ids[0];
    }
  }

  // edit distance fallback for reasonably short tokens
  let best: { id: string; dist: number } | null = null;
  for (const [alias, ids] of map) {
    if (!alias || ids.length === 0) continue;
    const dist = levenshtein(text, alias);
    const threshold = text.length <= 5 ? 1 : 2;
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { id: ids[0], dist };
    }
  }
  return best ? best.id : null;
}

export function normalizeMany(
  inputs: Iterable<string>,
  map: AliasMap,
): { matched: string[]; unmatched: string[] } {
  const matched: string[] = [];
  const seen = new Set<string>();
  const unmatched: string[] = [];
  for (const raw of inputs) {
    if (!raw || !raw.trim()) continue;
    const id = normalizeOne(raw, map);
    if (id && !seen.has(id)) {
      seen.add(id);
      matched.push(id);
    } else if (!id) {
      const t = raw.trim();
      if (t) unmatched.push(raw.trim());
    }
  }
  return { matched, unmatched };
}