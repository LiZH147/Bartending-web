import { NextResponse } from "next/server";
import { buildCocktailDetail } from "@/lib/recommend";
import { LanguageSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const url = new URL(req.url);
    const langRaw = url.searchParams.get("lang") ?? "en";
    const lang = LanguageSchema.safeParse(langRaw).success
      ? (langRaw as "en" | "zh-CN")
      : "en";
    const ingredients = (url.searchParams.get("ingredients") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const detail = await buildCocktailDetail(id, ingredients, lang);
    if (!detail) {
      return NextResponse.json({ error: "Cocktail not found" }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (e) {
    console.error("[cocktail] error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}