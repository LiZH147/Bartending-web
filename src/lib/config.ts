export interface ScoreWeights {
  ingredient: number;
  preference: number;
  difficulty: number;
  popularity: number;
  novelty: number;
}

function w(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null) return fallback;
  const n = Number(raw);
  if (Number.isNaN(n)) return fallback;
  return n;
}

export function getScoreWeights(): ScoreWeights {
  const weights: ScoreWeights = {
    ingredient: w("SCORE_WEIGHT_INGREDIENT", 0.4),
    preference: w("SCORE_WEIGHT_PREFERENCE", 0.2),
    difficulty: w("SCORE_WEIGHT_DIFFICULTY", 0.15),
    popularity: w("SCORE_WEIGHT_POPULARITY", 0.15),
    novelty: w("SCORE_WEIGHT_NOVELTY", 0.1),
  };

  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1) > 1e-9) {
    // Normalize so weights always sum to 1 regardless of configuration.
    for (const k of Object.keys(weights) as (keyof ScoreWeights)[]) {
      weights[k] = weights[k] / sum;
    }
  }
  return weights;
}

export function getCreativeMinResults(): number {
  const raw = Number(process.env.CREATIVE_MIN_RESULTS ?? 3);
  return Number.isNaN(raw) ? 3 : raw;
}

export function isLLMConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
}

export function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export function getImageModel(): string {
  return process.env.AI_IMAGE_MODEL ?? "gpt-image-1";
}

export function getImageApiKey(): string {
  return process.env.AI_IMAGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "";
}

export function getImageBaseUrl(): string | undefined {
  return process.env.AI_IMAGE_BASE_URL || process.env.OPENAI_BASE_URL || undefined;
}

/**
 * Opt-in AI image generation. OFF by default so every flow stays instant;
 * enable with AI_IMAGE_ENABLED="true" and a key (its own AI_IMAGE_API_KEY, or
 * the shared OPENAI_API_KEY). Generated images are produced lazily on the
 * detail page and cached, never in the instant recommendation response, to keep
 * that response fast.
 */
export function isImageGenConfigured(): boolean {
  return process.env.AI_IMAGE_ENABLED === "true" && getImageApiKey().trim().length > 0;
}