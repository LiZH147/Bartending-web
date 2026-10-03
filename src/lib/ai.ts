import OpenAI from "openai";
import { z } from "zod";
import { isLLMConfigured, getModel, getImageModel, isImageGenConfigured, getImageApiKey, getImageBaseUrl } from "./config";
import type { HydratedIngredient } from "./data";
import { buildAliasMap, normalizeOne } from "./normalize";
import {
  AICreativeResponseSchema,
  type AICocktailSpec,
  type Language,
  ParseResponseSchema,
} from "./schemas";
import { FLAVORS, type Flavor } from "./constants";
import { slugify } from "./utils";

const ALLOWED_FLAVORS = new Set<string>(FLAVORS);

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
      // Reasoning models (deepseek-v4-flash-0731) are slow on structured output;
      // no auto-retry so a timeout fails fast into the deterministic fallback.
      maxRetries: 0,
      timeout: 45_000,
    });
  }
  return _client;
}

// Image generation may use a different provider/key than the chat LLM and can
// legitimately take 60s+, so it gets its own client with a longer timeout.
let _imageClient: OpenAI | null = null;
function imageClient(): OpenAI {
  if (!_imageClient) {
    _imageClient = new OpenAI({
      apiKey: getImageApiKey(),
      baseURL: getImageBaseUrl(),
      maxRetries: 0,
      timeout: 180_000,
    });
  }
  return _imageClient;
}

export { isLLMConfigured as aiEnabled };

const PARSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    ingredients: {
      type: "array",
      items: { type: "string" },
      description: "Canonical ingredient ids detected in the sentence.",
    },
    unmatched: {
      type: "array",
      items: { type: "string" },
      description: "Mentioned items that could not be mapped to a known ingredient id.",
    },
  },
  required: ["ingredients", "unmatched"],
};

const CREATIVE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    cocktails: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          name_zh: { type: "string" },
          description: { type: "string" },
          description_zh: { type: "string" },
          glass: { type: "string" },
          method: { type: "string", enum: ["shaken", "stirred", "built", "muddled", "blended"] },
          difficulty: { type: "string", enum: ["easy", "medium", "advanced"] },
          strength: { type: "string", enum: ["none", "low", "medium", "high"] },
          flavors: { type: "array", items: { type: "string" } },
          ingredients: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                id: { type: "string" },
                amount: { type: "string" },
              },
              required: ["id"],
            },
          },
          steps: { type: "array", items: { type: "string" } },
          steps_zh: { type: "array", items: { type: "string" } },
        },
        required: ["name", "description", "glass", "method", "difficulty", "strength", "flavors", "ingredients", "steps"],
      },
    },
  },
  required: ["cocktails"],
};

async function structuredJSON<T>(
  schema: Record<string, unknown>,
  name: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  zodSchema: { parse: (v: unknown) => T },
): Promise<T> {
  const completion = await client().chat.completions.create({
    model: getModel(),
    messages,
    temperature: 0.7,
    response_format: {
      type: "json_schema",
      json_schema: { name, schema: schema as never, strict: false },
    },
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  const json = JSON.parse(raw);
  return zodSchema.parse(json);
}

// ------------------------------------------------------------------
// 1. Natural-language ingredient parsing
// ------------------------------------------------------------------
const CHUNK_DELIMITERS = /[,\n;、，。；\u3001]+|\band\b|\bor\b|和|还有|以及|加上/g;

export async function parseIngredients(
  text: string,
  language: Language,
  ingredients: HydratedIngredient[],
): Promise<{ ingredients: string[]; unmatched: string[] }> {
  if (!isLLMConfigured()) {
    return deterministicParse(text, ingredients);
  }

  const idHint = ingredients
    .map((i) => `${i.id} (${i.nameEn} / ${i.nameZh})`)
    .join(", ");

  try {
    const result = await structuredJSON(
      PARSE_SCHEMA,
      "ingredient_parse",
      [
        {
          role: "system",
          content:
            `You map user-provided drink ingredients to canonical ids. ` +
            `Available canonical ids (with EN / ZH names): ${idHint}. ` +
            `Respond only with the canonical ids you find, and list anything you cannot map in "unmatched". ` +
            `Respond in JSON. Do not invent ids outside the list.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      ParseResponseSchema,
    );

    // Re-validate ids against the real database on the server (defense in depth).
    const valid = new Set(ingredients.map((i) => i.id));
    const cleaned = Array.from(new Set(result.ingredients)).filter((id) => valid.has(id));
    return { ingredients: cleaned, unmatched: result.unmatched.slice(0, 20) };
  } catch {
    return deterministicParse(text, ingredients);
  }
}

export function deterministicParse(
  text: string,
  ingredients: HydratedIngredient[],
): { ingredients: string[]; unmatched: string[] } {
  const map = buildAliasMap(ingredients);
  // Split into chunks on natural delimiters.
  const chunks = text
    .split(CHUNK_DELIMITERS)
    .map((c) => c.trim())
    .filter((c) => c.length >= 2);

  const matched: string[] = [];
  const seen = new Set<string>();
  const unmatched: string[] = [];

  // Try whole chunks first, then individual words.
  for (const chunk of chunks) {
    const id = normalizeOne(chunk, map);
    if (id) {
      if (!seen.has(id)) {
        seen.add(id);
        matched.push(id);
      }
    } else {
      // try shortening: remove leading quantities like "two ", "2 "
      const short = chunk.replace(/^(two|three|four|five|a couple of|some|a|an|2|3|4|5|6|两|三|四|五|几)\s+/i, "");
      const id2 = normalizeOne(short, map);
      if (id2) {
        if (!seen.has(id2)) {
          seen.add(id2);
          matched.push(id2);
        }
      } else {
        unmatched.push(chunk);
      }
    }
  }

  // For single contiguous phrases without delimiters, scan word-by-word.
  if (matched.length === 0) {
    const words = text.split(/\s+|[\s\u3000]+/);
    for (const word of words) {
      const id = normalizeOne(word, map);
      if (id && !seen.has(id)) {
        seen.add(id);
        matched.push(id);
      }
    }
  }

  return { ingredients: matched, unmatched };
}

// ------------------------------------------------------------------
// 2. Creative cocktail generation
// ------------------------------------------------------------------

function pick(owned: Set<string>, ing: HydratedIngredient[], category: string, fallbackIds: string[]) {
  const ownedMatches = ing.filter((i) => owned.has(i.id) && i.category === category);
  if (ownedMatches.length > 0) return ownedMatches[0];
  for (const fid of fallbackIds) {
    const f = ing.find((i) => i.id === fid);
    if (f) return f;
  }
  return ing.find((i) => i.category === category) ?? null;
}

const NAME_EN = ["Golden", "Midnight", "Sunset", "Velvet", "Driftwood", "Juniper", "Citrus", "Amber", "Copper", "Flora"];
const NAME_ZH = ["金色", "午夜", "落日", "丝绒", "漂木", "杜松", "柑橘", "琥珀", "铜色", "花语"];
const STYLE_EN = ["Sour", "Fizz", "Collins", "Spritz", "Refresher", "Tonic"];
const STYLE_ZH = ["酸酒", "菲士", "柯林斯", "气泡调酒", "清爽特调", "汤力"];

export function generateCreativeDeterministic(
  ownedIds: string[],
  allIngredients: HydratedIngredient[],
  language: Language,
  count = 3,
): AICocktailSpec[] {
  const owned = new Set(ownedIds);
  const specs: AICocktailSpec[] = [];

  const spirits = allIngredients.filter((i) => i.category === "spirit" && owned.has(i.id));
  const citrus = ["lemon_juice", "lime_juice", "orange_juice", "grapefruit_juice"];
  const sweeteners = ["simple_syrup", "honey_syrup", "agave_syrup", "maple_syrup"];
  const modifiers = allIngredients.filter((i) => i.category === "liqueur" && owned.has(i.id));
  const mixers = ["club_soda", "tonic_water", "ginger_beer", "prosecco"];

  for (let k = 0; k < Math.max(1, count); k++) {
    const spirit = spirits[k % Math.max(1, spirits.length)] ?? allIngredients.find((i) => i.id === "vodka") ?? allIngredients.find((i) => i.category === "spirit");
    const citrusIng = pick(owned, allIngredients, "juice", citrus);
    const sweet = pick(owned, allIngredients, "sweetener", sweeteners);
    const modifier = modifiers[k % Math.max(1, modifiers.length)] ?? null;
    const mixer = allIngredients.find((i) => i.id === mixers[k % mixers.length]);
    const variation = k % 3;

    const nameEn = `${NAME_EN[(k * 3) % NAME_EN.length]} ${STYLE_EN[k % STYLE_EN.length]}`;
    const nameZh = `${NAME_ZH[(k * 3) % NAME_ZH.length]}${STYLE_ZH[k % STYLE_ZH.length]}`;

    const ings: AICocktailSpec["ingredients"] = [];
    if (spirit) ings.push({ id: spirit.id, amount: "45 ml" });
    if (citrusIng) ings.push({ id: citrusIng.id, amount: "20 ml" });
    if (modifier && variation === 1) ings.push({ id: modifier.id, amount: "15 ml" });
    if (sweet) ings.push({ id: sweet.id, amount: "15 ml" });
    if (variation === 2 && mixer) ings.push({ id: mixer.id, amount: "to top" });

    const flavors = new Set<Flavor>(["fresh", "citrus"]);
    if (spirit) spirit.flavorProfile.forEach((f) => flavors.add(f));
    if (citrusIng) citrusIng.flavorProfile.forEach((f) => flavors.add(f));
    if (sweet) flavors.add("sweet");

    const parts = [spirit?.nameEn, citrusIng?.nameEn, modifier?.nameEn, sweet?.nameEn].filter(Boolean);
    const descEn = `A crisp, well-balanced mix of ${parts.join(", ")} — bright, refreshing, and easy to love.`;
    const descZh = `以 ${[spirit?.nameZh, citrusIng?.nameZh, modifier?.nameZh, sweet?.nameZh].filter(Boolean).join("、")} 调和而成，明亮清爽、酸甜平衡。`;

    const stepsEn = [
      `Fill a shaker with ice.`,
      `Add the ${[spirit?.nameEn, citrusIng?.nameEn, modifier?.nameEn, sweet?.nameEn].filter(Boolean).join(", ")}.`,
      variation === 2 && mixer ? `Shake well and strain over fresh ice; top with ${mixer.nameEn}.` : `Shake hard for 12 seconds and double-strain into a chilled glass.`,
      `Garnish with a citrus twist.`,
    ];
    const stepsZh = [
      `在摇壶中加满冰块。`,
      `加入 ${[spirit?.nameZh, citrusIng?.nameZh, modifier?.nameZh, sweet?.nameZh].filter(Boolean).join("、")}。`,
      variation === 2 && mixer ? `充分摇匀后滤入加冰的杯中，倒入 ${mixer.nameZh} 补满。` : `用力摇 12 秒，双重过滤至冰镇杯中。`,
      `以柑橘皮装饰。`,
    ];

    specs.push({
      name: nameEn,
      name_zh: nameZh,
      description: descEn,
      description_zh: descZh,
      glass: variation === 2 ? "Highball glass" : "Coupe glass",
      method: "shaken",
      difficulty: "easy",
      strength: spirit && spirit.flavorProfile.includes("strong") ? "medium" : "medium",
      flavors: Array.from(flavors)
        .filter((f) => ALLOWED_FLAVORS.has(f))
        .slice(0, 6),
      ingredients: ings,
      steps: stepsEn,
      steps_zh: stepsZh,
    });
  }

  return specs;
}

export async function generateCreative(
  ownedIds: string[],
  missingIds: string[],
  allIngredients: HydratedIngredient[],
  language: Language,
  count = 3,
): Promise<AICocktailSpec[]> {
  if (!isLLMConfigured()) {
    return generateCreativeDeterministic(ownedIds, allIngredients, language, count);
  }

  const pool = new Set([...ownedIds, ...missingIds]);
  const ids = Array.from(pool).filter((id) => allIngredients.some((i) => i.id === id));
  const idHint = allIngredients
    .filter((i) => ids.includes(i.id))
    .map((i) => `${i.id} (${i.nameEn} / ${i.nameZh})`)
    .join(", ");

  const lang = language === "zh-CN" ? "Simplified Chinese" : "English";

  try {
    const result = await structuredJSON(
      CREATIVE_SCHEMA,
      "creative_cocktails",
      [
        {
          role: "system",
          content:
            `You are a professional bartender. Create ${count} original cocktails. ` +
            `You may ONLY use these canonical ingredient ids: ${idHint}. ` +
            `Respond in ${lang}. Provide name, name_zh, description, description_zh, glass, method (shaken/stirred/built/muddled/blended), ` +
            `difficulty (easy/medium/advanced), strength (none/low/medium/high), flavors (subset of sour/sweet/bitter/fresh/smoky/fruity/herbal/dry/floral/spicy/creamy/citrus/botanical/strong), ` +
            `ingredients (id + amount using ml or "to top"), steps, steps_zh. ` +
            `Only valid JSON.`,
        },
        { role: "user", content: `Available: ${ownedIds.join(", ")}. Missing: ${missingIds.join(", ")}.` },
      ],
      AICreativeResponseSchema,
    );

    // Validate ingredient ids exist server-side; drop invalid entries.
    const valid = new Set(allIngredients.map((i) => i.id));
    return result.cocktails
      .filter((c) => c.ingredients.length > 0)
      .map((c) => ({
        ...c,
        ingredients: c.ingredients.filter((ci) => valid.has(ci.id)),
      }))
      .filter((c) => c.ingredients.length > 0)
      .slice(0, count);
  } catch {
    return generateCreativeDeterministic(ownedIds, allIngredients, language, count);
  }
}

// ------------------------------------------------------------------
// 3. Recommendation explanation (deterministic, localized)
// ------------------------------------------------------------------
export function buildExplanation(
  ownedCount: number,
  requiredCount: number,
  missingNames: string[],
  language: Language,
): string {
  if (language === "zh-CN") {
    if (missingNames.length === 0) return `你有全部 ${requiredCount} 种材料，随时可以调制。`;
    return `你有 ${ownedCount}/${requiredCount} 种材料，还缺：${missingNames.join("、")}。`;
  }
  if (missingNames.length === 0) return `You own all ${requiredCount} ingredients — ready to make.`;
  return `You have ${ownedCount}/${requiredCount} ingredients. Missing: ${missingNames.join(", ")}.`;
}

export function slugForSpec(name: string, index: number): string {
  return `ai-${slugify(name)}-${index}-${Date.now().toString(36)}`;
}

// ------------------------------------------------------------------
// 4. LLM ingredient substitution (with deterministic fallback)
// ------------------------------------------------------------------
export type AISubstitution = {
  id: string;
  name: string;
  nameEn: string;
  reason: string;
  source: "ai";
  availability: "owned" | "buy";
};

const SUBSTITUTION_LLM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    substitutions: {
      type: "object",
      description: "Map from each missing ingredient id to an array of { id, reason } substitution suggestions.",
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["id", "reason"],
        },
      },
    },
  },
  required: ["substitutions"],
};

const LLMSubstitutionsResultSchema = z.record(
  z.string(),
  z.array(z.object({ id: z.string(), reason: z.string() })),
);

export async function llmSubstitutions(
  missingIds: string[],
  ownedIds: string[],
  allIngredients: HydratedIngredient[],
  lang: Language,
): Promise<Map<string, AISubstitution[]>> {
  const result = new Map<string, AISubstitution[]>();
  if (!isLLMConfigured() || missingIds.length === 0) return result;

  const byId = new Map(allIngredients.map((i) => [i.id, i]));
  const ownedSet = new Set(ownedIds);
  const langName = lang === "zh-CN" ? "Simplified Chinese" : "English";
  const catalogHint = allIngredients.map((i) => `${i.id} (${i.nameEn} / ${i.nameZh})`).join(", ");
  const ownedHint = allIngredients.filter((i) => ownedSet.has(i.id));

  const merge = (batch: string[], parsed: Record<string, { id: string; reason: string }[]>) => {
    for (const id of batch) {
      const suggestion = parsed[id];
      if (!suggestion) continue;
      const mapped: AISubstitution[] = [];
      const seen = new Set<string>([id]);
      for (const s of suggestion) {
        const ing = byId.get(s.id);
        if (!ing || seen.has(s.id)) continue;
        seen.add(s.id);
        mapped.push({
          id: ing.id,
          name: lang === "zh-CN" ? ing.nameZh : ing.nameEn,
          nameEn: ing.nameEn,
          reason: s.reason,
          source: "ai",
          availability: ownedSet.has(ing.id) ? "owned" : "buy",
        });
        if (mapped.length >= 3) break;
      }
      if (mapped.length) result.set(id, mapped);
    }
  };

  // The reasoning model is slow on large prompts and the relay returns 504 past
  // ~10 items in one shot, so request substitutions in small batches, in parallel.
  const CHUNK = 6;
  const batches: string[][] = [];
  for (let start = 0; start < missingIds.length; start += CHUNK) {
    batches.push(missingIds.slice(start, start + CHUNK));
  }

  await Promise.all(
    batches.map(async (batch) => {
      const batchHint = batch.map((id) => byId.get(id)).filter((i): i is HydratedIngredient => Boolean(i));
      if (batchHint.length === 0) return;
      try {
        const parsed = await structuredJSON(
          SUBSTITUTION_LLM_SCHEMA,
          "ingredient_substitutions",
          [
            {
              role: "system",
              content:
                `You are a bartender suggesting substitutions. For each missing ingredient id, propose 1-3 substitute ingredient ids ` +
                `chosen from this catalog: ${catalogHint}. Prefer substitutes the user already owns. ` +
                `Respond in ${langName} with a JSON object mapping each missing ingredient id to an array of { id, reason }, ` +
                `where reason is a short justification. Only use ids from the catalog.`,
            },
            {
              role: "user",
              content:
                `Missing: ${batchHint.map((i) => `${i.id} (${i.nameEn} / ${i.nameZh})`).join(", ")}.\n` +
                `User owns: ${ownedHint.map((i) => `${i.id} (${i.nameEn})`).join(", ") || "(nothing)"}.`,
            },
          ],
          LLMSubstitutionsResultSchema,
        );
        merge(batch, parsed);
      } catch {
        // keep deterministic fallback substitutions for this batch
      }
    }),
  );
  return result;
}

// ------------------------------------------------------------------
// 5. LLM recommendation explanation (with deterministic fallback)
// ------------------------------------------------------------------
const EXPLAIN_LLM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    explanations: {
      type: "array",
      items: { type: "string" },
      description: "One short explanation per cocktail, in the same order as provided.",
    },
  },
  required: ["explanations"],
};

const LLMExplanationsSchema = z.object({ explanations: z.array(z.string()) });

export async function llmExplanations(
  items: { name: string; owned: string[]; missing: string[] }[],
  lang: Language,
): Promise<string[]> {
  if (!isLLMConfigured() || items.length === 0) return [];

  const langName = lang === "zh-CN" ? "Simplified Chinese" : "English";
  try {
    const completion = await client().chat.completions.create({
      model: getModel(),
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            `You write concise, friendly, one-sentence recommendations for cocktails given a user's ingredients. ` +
            `Respond in ${langName}. Return a JSON object with a single key "explanations" whose value is an array of strings, ` +
            `one per cocktail, in the same order given. Mention what is already owned and what is still missing.`,
        },
        {
          role: "user",
          content: items
            .map((it) => `- ${it.name}: owned=[${it.owned.join(", ")}], missing=[${it.missing.join(", ")}]`)
            .join("\n"),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "recommendation_explanations", schema: EXPLAIN_LLM_SCHEMA as never, strict: false },
      },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const data: unknown = JSON.parse(raw);
    // Some reasoning models return a bare array instead of the wrapped object —
    // tolerate both shapes.
    const arr = Array.isArray(data)
      ? data
      : Array.isArray((data as { explanations?: unknown })?.explanations)
        ? (data as { explanations: string[] }).explanations
        : [];
    return LLMExplanationsSchema.parse({ explanations: arr }).explanations;
  } catch {
    return [];
  }
}

// ------------------------------------------------------------------
// 6. AI cocktail photograph (opt-in; see config.isImageGenConfigured)
// ------------------------------------------------------------------
export async function generateCocktailImage(prompt: string): Promise<string | null> {
  if (!isImageGenConfigured()) return null;
  try {
    const res = await imageClient().images.generate({
      model: getImageModel(),
      prompt,
      size: "1024x1024",
      n: 1,
      response_format: "url",
    });
    return res.data?.[0]?.url ?? null;
  } catch {
    return null;
  }
}