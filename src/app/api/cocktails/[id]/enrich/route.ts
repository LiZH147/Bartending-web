import { NextResponse } from "next/server";
import { buildCocktailEnrichment } from "@/lib/recommend";
import { LanguageSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";
// Vercel: single-cocktail LLM enrichment (~10-15s).
export const maxDuration = 60;

/**
 * Returns LLM substitutions + explanation for a single cocktail. Called
 * out-of-band by the detail page (non-blocking) so the page renders instantly
 * with deterministic data and fills in the AI text when ready.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await req.json().catch(() => ({}))) as {
      language?: unknown;
      ingredients?: unknown;
    };
    const lang = LanguageSchema.safeParse(body.language ?? "en").success
      ? (body.language as "en" | "zh-CN")
      : "en";
    const ingredients = Array.isArray(body.ingredients)
      ? (body.ingredients as string[])
      : [];

    const enrichment = await buildCocktailEnrichment(id, ingredients, lang);
    if (!enrichment) return NextResponse.json({ enabled: false });

    return NextResponse.json({ enabled: true, ...enrichment });
  } catch (e) {
    console.error("[cocktail-enrich] error", e);
    return NextResponse.json({ enabled: false });
  }
}