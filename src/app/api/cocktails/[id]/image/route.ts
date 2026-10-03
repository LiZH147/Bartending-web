import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateCocktailImage } from "@/lib/ai";
import { isImageGenConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";
// Vercel: image generation is slow (~60-90s). 60s matches the Hobby cap — on
// the free plan keep AI_IMAGE_ENABLED off; raise this to 300 on Pro.
export const maxDuration = 60;

/**
 * Lazily generate (and cache) a unique AI photograph for an AI-created cocktail.
 * Called client-side OUT OF BAND from the detail page so the page renders
 * instantly with its deterministic fallback photo and swaps the generated image
 * in when ready. Off unless AI_IMAGE_ENABLED="true" + a key is set.
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!isImageGenConfigured()) {
      return NextResponse.json({ imageUrl: null, enabled: false });
    }

    const { id } = await context.params;
    const cocktail = await prisma.cocktail.findUnique({
      where: { id },
      include: { ingredients: { include: { ingredient: true } } },
    });
    if (!cocktail) return NextResponse.json({ error: "Cocktail not found" }, { status: 404 });
    if (cocktail.source !== "ai") {
      return NextResponse.json({ error: "Only AI creations are illustrated on demand" }, { status: 400 });
    }

    // Cache hit: the deterministic fallback is always a TheCocktailDB photo, so
    // any other (provider-hosted) imageUrl means this drink was already generated.
    if (cocktail.imageUrl && !cocktail.imageUrl.startsWith("https://www.thecocktaildb.com/")) {
      return NextResponse.json({ imageUrl: cocktail.imageUrl });
    }

    const ingredientList = cocktail.ingredients.map((ci) => ci.ingredient.nameEn).join(", ");
    const prompt =
      `A professional, photorealistic cocktail photograph of "${cocktail.nameEn}" served in ${cocktail.glass}. ` +
      `${cocktail.descriptionEn} Made with ${ingredientList}. Moody low-light bar setting, shallow depth of field, ` +
      `condensation on the glass, tasteful garnish.`;

    const imageUrl = await generateCocktailImage(prompt);
    if (imageUrl) {
      await prisma.cocktail.update({ where: { id }, data: { imageUrl } });
      return NextResponse.json({ imageUrl });
    }

    return NextResponse.json({ imageUrl: null });
  } catch (e) {
    console.error("[cocktail-image] error", e);
    return NextResponse.json({ imageUrl: null });
  }
}