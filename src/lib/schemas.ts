import { z } from "zod";
import { DIFFICULTIES, FLAVORS, METHODS, SOURCES, STRENGTHS } from "./constants";

export const FlavorSchema = z.enum(FLAVORS);
export const StrengthSchema = z.enum(STRENGTHS);
export const DifficultySchema = z.enum(DIFFICULTIES);
export const MethodSchema = z.enum(METHODS);
export const SourceSchema = z.enum(SOURCES);
export const LanguageSchema = z.enum(["en", "zh-CN"]);

export type Language = z.infer<typeof LanguageSchema>;

export const PreferencesSchema = z.object({
  flavor: z.array(FlavorSchema).max(8).optional().default([]),
  strength: StrengthSchema.nullable().optional(),
  difficulty: DifficultySchema.nullable().optional(),
  maxPrepTime: z.number().int().min(0).max(120).nullable().optional(),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

export const RecommendRequestSchema = z.object({
  ingredients: z.array(z.string()).max(200).optional().default([]),
  preferences: PreferencesSchema.optional().default({}),
  missingIngredientLimit: z.number().int().min(0).max(20).optional().default(1),
  language: LanguageSchema.optional().default("en"),
  // When true, skip LLM creative generation (client already has a local cache hit).
  skipCreative: z.boolean().optional().default(false),
});
export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;

export const ParseRequestSchema = z.object({
  text: z.string().min(1).max(2000),
  language: LanguageSchema.optional().default("en"),
});
export type ParseRequest = z.infer<typeof ParseRequestSchema>;

export const ParseResponseSchema = z.object({
  ingredients: z.array(z.string()),
  unmatched: z.array(z.string()),
});
export type ParseResponse = z.infer<typeof ParseResponseSchema>;

export const IngredientRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  amount: z.string().optional(),
  optional: z.boolean().optional(),
  have: z.boolean().optional(),
  emoji: z.string().optional(),
});

export const MissingIngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  amount: z.string().optional(),
  emoji: z.string().optional(),
});

export const SubstitutionSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameEn: z.string().optional(),
  reason: z.string(),
  source: z.enum(["rule", "ai"]),
  availability: z.enum(["owned", "buy"]),
});

export const ResultTypeSchema = z.enum(["available", "almost", "creative"]);

export const CocktailResultSchema = z.object({
  type: ResultTypeSchema,
  id: z.string(),
  name: z.string(),
  nameEn: z.string(),
  nameZh: z.string(),
  description: z.string(),
  glass: z.string(),
  method: MethodSchema,
  difficulty: DifficultySchema,
  strength: StrengthSchema,
  flavors: z.array(FlavorSchema),
  steps: z.array(z.string()),
  imageUrl: z.string().nullable(),
  prepTime: z.number(),
  popularity: z.number(),
  novelty: z.number(),
  source: SourceSchema,
  matchPercent: z.number(),
  missingCount: z.number(),
  ingredients: z.array(IngredientRefSchema),
  missing: z.array(MissingIngredientSchema),
  substitutions: z.record(z.string(), z.array(SubstitutionSchema)).optional(),
  explanation: z.string().optional(),
  score: z.number(),
});
export type CocktailResult = z.infer<typeof CocktailResultSchema>;

export const RecommendMetaSchema = z.object({
  totalCocktails: z.number(),
  aiEnabled: z.boolean(),
  needsCreative: z.boolean(),
  weights: z.record(z.string(), z.number()),
  generatedAt: z.string(),
});

export const RecommendResponseSchema = z.object({
  available: z.array(CocktailResultSchema),
  almost: z.array(CocktailResultSchema),
  creative: z.array(CocktailResultSchema),
  meta: RecommendMetaSchema,
});
export type RecommendResponse = z.infer<typeof RecommendResponseSchema>;

// LLM deltas delivered out-of-band after the instant classic results so the
// recommendation page renders immediately and then fills in progressively.
export const EnrichmentSchema = z.object({
  substitutions: z.record(z.string(), z.record(z.string(), z.array(SubstitutionSchema))),
  explanations: z.record(z.string(), z.string()),
});
export type Enrichment = z.infer<typeof EnrichmentSchema>;

// ------------------------------------------------------------------
// AI creative generation — validated before display. Ingredient ids in
// an AI recipe must resolve to known canonical ids or be dropped.
// ------------------------------------------------------------------
export const AIIngredientSchema = z.object({
  id: z.string(),
  amount: z.string().optional(),
});
export type AIIngredient = z.infer<typeof AIIngredientSchema>;

export const AICocktailSpecSchema = z.object({
  name: z.string(),
  name_zh: z.string().optional(),
  description: z.string(),
  description_zh: z.string().optional(),
  glass: z.string(),
  method: MethodSchema,
  difficulty: DifficultySchema,
  strength: StrengthSchema,
  flavors: z.array(FlavorSchema),
  ingredients: z.array(AIIngredientSchema),
  steps: z.array(z.string()),
  steps_zh: z.array(z.string()).optional(),
});
export type AICocktailSpec = z.infer<typeof AICocktailSpecSchema>;

export const AICreativeResponseSchema = z.object({
  cocktails: z.array(AICocktailSpecSchema).max(6),
});
export type AICreativeResponse = z.infer<typeof AICreativeResponseSchema>;

export const CreativeRequestSchema = z.object({
  ingredients: z.array(z.string()).max(200).optional().default([]),
  missing: z.array(z.string()).max(20).optional().default([]),
  count: z.number().int().min(1).max(6).optional().default(3),
  language: LanguageSchema.optional().default("en"),
});
export type CreativeRequest = z.infer<typeof CreativeRequestSchema>;