import { getCreativeMinResults, getScoreWeights, isLLMConfigured } from "./config";
import { getCocktail, listCocktails, listIngredients, localizeCocktail, localizeIngredientName } from "./data";
import { buildExplanation, generateCreative, llmExplanations, llmSubstitutions } from "./ai";
import { creativeImageUrl } from "./creative-images";
import { rankCocktails, scoreCocktail, type ScoredCocktail } from "./matching";
import {
  RecommendResponseSchema,
  type AICocktailSpec,
  type CocktailResult,
  type Enrichment,
  type RecommendRequest,
  type RecommendResponse,
} from "./schemas";
import { suggestSubstitutions } from "./substitutions";
import { pct, slugify } from "./utils";
import type { HydratedIngredient } from "./data";
import { prisma } from "./db";

function toResult(
  scored: ScoredCocktail,
  type: CocktailResult["type"],
  owned: Set<string>,
  allIngredients: HydratedIngredient[],
  lang: RecommendRequest["language"],
): CocktailResult {
  const c = scored.cocktail;
  const loc = localizeCocktail(c, lang);
  const ownedRequired = c.ingredients.filter((ci) => !ci.optional && owned.has(ci.ingredient.id)).length;
  const requiredCount = c.ingredients.filter((ci) => !ci.optional).length;

  const ingredients = c.ingredients.map((ci) => ({
    id: ci.ingredient.id,
    name: localizeIngredientName(ci.ingredient, lang),
    nameEn: ci.ingredient.nameEn,
    amount: ci.amount,
    optional: ci.optional,
    have: owned.has(ci.ingredient.id),
    emoji: ci.ingredient.emoji,
  }));

  const missing = scored.missing.map((m) => ({
    id: m.id,
    name: lang === "zh-CN" ? m.nameZh : m.nameEn,
    nameEn: m.nameEn,
    amount: m.amount,
    emoji: m.emoji,
  }));

  const substitutions: CocktailResult["substitutions"] = {};
  if (type === "almost") {
    for (const m of scored.missing.slice(0, 2)) {
      substitutions[m.id] = suggestSubstitutions(m.id, owned, allIngredients, lang);
    }
  }

  const explanation = buildExplanation(
    ownedRequired,
    requiredCount,
    missing.map((m) => m.name),
    lang,
  );

  return {
    type,
    id: c.id,
    name: loc.name,
    nameEn: c.nameEn,
    nameZh: c.nameZh,
    description: loc.description,
    glass: c.glass,
    method: c.method,
    difficulty: c.difficulty,
    strength: c.strength,
    flavors: c.flavorProfile,
    steps: loc.steps,
    imageUrl: c.imageUrl,
    prepTime: c.prepTime,
    popularity: c.popularity,
    novelty: c.novelty,
    source: c.source,
    matchPercent: pct(scored.ingredientMatch),
    missingCount: scored.missingCount,
    ingredients,
    missing,
    substitutions,
    explanation,
    score: scored.score,
  };
}

export function specsToCreativeResults(
  specs: AICocktailSpec[],
  owned: Set<string>,
  allIngredients: HydratedIngredient[],
  lang: RecommendRequest["language"],
): CocktailResult[] {
  const byId = new Map(allIngredients.map((i) => [i.id, i]));

  return specs.map((spec, idx) => {
    const isZh = lang === "zh-CN";
    const name = isZh && spec.name_zh ? spec.name_zh : spec.name;
    const description = isZh && spec.description_zh ? spec.description_zh : spec.description;
    const steps = isZh && spec.steps_zh?.length ? spec.steps_zh : spec.steps;

    const specIngredients = spec.ingredients
      .filter((ci) => byId.has(ci.id))
      .map((ci) => {
        const ing = byId.get(ci.id)!;
        return {
          id: ing.id,
          name: localizeIngredientName(ing, lang),
          nameEn: ing.nameEn,
          amount: ci.amount,
          optional: false,
          have: owned.has(ing.id),
          emoji: ing.emoji,
        };
      });

    const missingForCreative = specIngredients
      .filter((si) => !si.have)
      .map((si) => ({ id: si.id, name: si.name, nameEn: si.nameEn, amount: si.amount, emoji: si.emoji }));

    const matchPercent = specIngredients.length
      ? pct(specIngredients.filter((si) => si.have).length / specIngredients.length)
      : 0;

    return {
      type: "creative" as const,
      id: `ai-${slugify(spec.name)}`,
      name,
      nameEn: spec.name,
      nameZh: spec.name_zh ?? spec.name,
      description,
      glass: spec.glass,
      method: spec.method,
      difficulty: spec.difficulty,
      strength: spec.strength,
      flavors: spec.flavors,
      steps,
      imageUrl: creativeImageUrl(spec.ingredients.map((ci) => ci.id), allIngredients, spec.name),
      prepTime: 5,
      popularity: 0.4,
      novelty: 0.9,
      source: "ai" as const,
      matchPercent,
      missingCount: missingForCreative.length,
      ingredients: specIngredients,
      missing: missingForCreative,
      explanation: isZh ? "由 AI 根据你的酒柜创意生成的配方。" : "An AI-generated recipe inspired by your cabinet.",
      score: 0.5,
    };
  });
}

async function persistCreative(specs: AICocktailSpec[], allIngredients: HydratedIngredient[]): Promise<void> {
  for (const spec of specs) {
    const id = `ai-${slugify(spec.name)}`;
    const imageUrl = creativeImageUrl(spec.ingredients.map((ci) => ci.id), allIngredients, spec.name);
    await prisma.cocktail.upsert({
      where: { id },
      create: {
        id,
        nameEn: spec.name,
        nameZh: spec.name_zh ?? spec.name,
        descriptionEn: spec.description,
        descriptionZh: spec.description_zh ?? spec.description,
        glass: spec.glass,
        method: spec.method,
        difficulty: spec.difficulty,
        strength: spec.strength,
        flavorProfile: JSON.stringify(spec.flavors),
        stepsEn: JSON.stringify(spec.steps),
        stepsZh: JSON.stringify(spec.steps_zh ?? spec.steps),
        popularity: 0.4,
        novelty: 0.9,
        source: "ai",
        imageUrl,
        prepTime: 5,
      },
      update: {
        nameEn: spec.name,
        nameZh: spec.name_zh ?? spec.name,
        descriptionEn: spec.description,
        descriptionZh: spec.description_zh ?? spec.description,
        glass: spec.glass,
        method: spec.method,
        difficulty: spec.difficulty,
        strength: spec.strength,
        flavorProfile: JSON.stringify(spec.flavors),
        stepsEn: JSON.stringify(spec.steps),
        stepsZh: JSON.stringify(spec.steps_zh ?? spec.steps),
        imageUrl,
      },
    });

    await prisma.cocktailIngredient.deleteMany({ where: { cocktailId: id } });
    await prisma.cocktailIngredient.createMany({
      data: spec.ingredients.map((ci) => ({
        cocktailId: id,
        ingredientId: ci.id,
        amount: ci.amount ?? "",
      })),
    });
  }
}

export async function buildCreativeCocktails(
  ownedIds: string[],
  missingIds: string[],
  allIngredients: HydratedIngredient[],
  lang: RecommendRequest["language"],
  count: number,
): Promise<CocktailResult[]> {
  const specs = await generateCreative(ownedIds, missingIds, allIngredients, lang, count);
  await persistCreative(specs, allIngredients);
  return specsToCreativeResults(specs, new Set(ownedIds), allIngredients, lang);
}

/**
 * Enrichment is delivered as a separate out-of-band event so the classic
 * results render instantly. Returns only the LLM deltas; the client merges
 * them into the results it already shows. Falls back to empty on any failure
 * (the deterministic rule substitutions / template explanations stay in place).
 */
export async function buildRecommendationEnrichment(
  result: RecommendResponse,
  req: RecommendRequest,
): Promise<Enrichment> {
  const substitutions: Enrichment["substitutions"] = {};
  const explanations: Enrichment["explanations"] = {};
  const almost = result.almost;
  if (!isLLMConfigured() || result.available.length + almost.length === 0) {
    return { substitutions, explanations };
  }

  const allIngredients = await listIngredients();
  const ownedIds = req.ingredients ?? [];

  const missingIds = Array.from(new Set(almost.flatMap((r) => r.missing.map((m) => m.id)))).slice(0, 12);
  if (missingIds.length > 0) {
    const aiSubs = await llmSubstitutions(missingIds, ownedIds, allIngredients, req.language);
    for (const r of almost) {
      for (const m of r.missing) {
        const ai = aiSubs.get(m.id);
        if (!ai || ai.length === 0) continue;
        (substitutions[r.id] ??= {})[m.id] = ai;
      }
    }
  }

  const explainTargets = [...result.available.slice(0, 3), ...almost.slice(0, 3)];
  if (explainTargets.length > 0) {
    const exps = await llmExplanations(
      explainTargets.map((r) => ({
        name: r.name,
        owned: r.ingredients.filter((i) => i.have).map((i) => i.nameEn ?? i.name),
        missing: r.missing.map((m) => m.nameEn ?? m.name),
      })),
      req.language,
    );
    exps.forEach((exp, i) => {
      if (exp) explanations[explainTargets[i].id] = exp;
    });
  }

  return { substitutions, explanations };
}

export async function buildCreativeForRecommend(
  req: RecommendRequest,
  result: RecommendResponse,
): Promise<CocktailResult[]> {
  const allIngredients = await listIngredients();
  const ownedIds = req.ingredients ?? [];
  const missingPool = Array.from(new Set(result.almost.flatMap((r) => r.missing.map((m) => m.id)))).slice(0, 4);
  return buildCreativeCocktails(ownedIds, missingPool, allIngredients, req.language, 3);
}

export async function buildRecommendation(req: RecommendRequest): Promise<RecommendResponse> {
  const [allCocktails, allIngredients] = await Promise.all([listCocktails(), listIngredients()]);
  // Only rank classics here — persisted AI creations must never leak into
  // the "available / almost" sections (they surface in the "creative" section).
  const cocktails = allCocktails.filter((c) => c.source === "classic");
  const weights = getScoreWeights();
  const validIds = new Set(allIngredients.map((i) => i.id));
  const owned = new Set(req.ingredients.filter((id) => validIds.has(id)));

  const prefs = {
    flavor: req.preferences?.flavor ?? [],
    strength: req.preferences?.strength ?? null,
    difficulty: req.preferences?.difficulty ?? null,
    maxPrepTime: req.preferences?.maxPrepTime ?? null,
  };

  const { available, almost } = rankCocktails(cocktails, owned, prefs, weights);

  const limit = req.missingIngredientLimit ?? 1;
  const almostFiltered = limit <= 0 ? [] : almost.filter((s) => s.missingCount <= limit);

  const availableResults = available.map((s) => toResult(s, "available", owned, allIngredients, req.language));
  const almostResults = almostFiltered.map((s) => toResult(s, "almost", owned, allIngredients, req.language));

  const classicCount = availableResults.length + almostResults.length;

  const payload: RecommendResponse = {
    available: availableResults,
    almost: almostResults,
    // Creative recipes are generated out-of-band and streamed in later so the
    // classic results render instantly.
    creative: [],
    meta: {
      totalCocktails: cocktails.length,
      aiEnabled: isLLMConfigured(),
      needsCreative: classicCount < getCreativeMinResults(),
      weights: Object.fromEntries(
        (Object.keys(weights) as (keyof typeof weights)[]).map((k) => [k, weights[k]]),
      ),
      generatedAt: new Date().toISOString(),
    },
  };

  // Validate the exact wire shape before returning (defense in depth).
  return RecommendResponseSchema.parse(payload);
}

/**
 * Adds LLM substitutions + explanation to a single detail-page result (mutates).
 * Keeps the deterministic rule substitutions / template explanation on failure.
 */
async function enrichSingleResult(
  result: CocktailResult,
  ownedIds: string[],
  allIngredients: HydratedIngredient[],
  lang: RecommendRequest["language"],
): Promise<void> {
  if (!isLLMConfigured()) return;
  try {
    if (result.type === "almost") {
      const missingIds = result.missing.map((m) => m.id).slice(0, 12);
      if (missingIds.length > 0) {
        const aiSubs = await llmSubstitutions(missingIds, ownedIds, allIngredients, lang);
        const merged = { ...(result.substitutions ?? {}) };
        for (const m of result.missing) {
          const ai = aiSubs.get(m.id);
          if (!ai || ai.length === 0) continue;
          const existing = merged[m.id] ?? [];
          const seen = new Set(existing.map((s) => s.id));
          const next = [...existing];
          for (const s of ai) {
            if (!seen.has(s.id)) {
              seen.add(s.id);
              next.push(s);
            }
          }
          merged[m.id] = next.slice(0, 4);
        }
        result.substitutions = merged;
      }
    }

    const exps = await llmExplanations(
      [
        {
          name: result.name,
          owned: result.ingredients.filter((i) => i.have).map((i) => i.nameEn ?? i.name),
          missing: result.missing.map((m) => m.nameEn ?? m.name),
        },
      ],
      lang,
    );
    if (exps[0]) result.explanation = exps[0];
  } catch {
    // keep deterministic substitutions / template explanation
  }
}

async function buildCocktailDetailBase(
  id: string,
  ownedIds: string[],
  lang: RecommendRequest["language"],
): Promise<CocktailResult | null> {
  const [cocktail, allIngredients] = await Promise.all([getCocktail(id), listIngredients()]);
  if (!cocktail) return null;

  const weights = getScoreWeights();
  const valid = new Set(allIngredients.map((i) => i.id));
  const owned = new Set(ownedIds.filter((x) => valid.has(x)));

  const scored = scoreCocktail(
    cocktail,
    owned,
    { flavor: [], strength: null, difficulty: null, maxPrepTime: null },
    weights,
  );

  return toResult(scored, scored.available ? "available" : "almost", owned, allIngredients, lang);
}

// Fast path: deterministic result only (no LLM), so the detail page renders instantly.
export async function buildCocktailDetail(
  id: string,
  ownedIds: string[],
  lang: RecommendRequest["language"],
): Promise<CocktailResult | null> {
  return buildCocktailDetailBase(id, ownedIds, lang);
}

// LLM enrichment for the detail page, delivered out-of-band so the page never
// waits on the slow reasoning model.
export async function buildCocktailEnrichment(
  id: string,
  ownedIds: string[],
  lang: RecommendRequest["language"],
): Promise<{ substitutions: CocktailResult["substitutions"]; explanation: string } | null> {
  if (!isLLMConfigured()) return null;
  const result = await buildCocktailDetailBase(id, ownedIds, lang);
  if (!result) return null;

  const allIngredients = await listIngredients();
  const valid = new Set(allIngredients.map((i) => i.id));
  const owned = ownedIds.filter((x) => valid.has(x));
  await enrichSingleResult(result, owned, allIngredients, lang);
  return { substitutions: result.substitutions, explanation: result.explanation ?? "" };
}