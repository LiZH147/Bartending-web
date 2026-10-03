import { NextResponse } from "next/server";
import { CreativeRequestSchema } from "@/lib/schemas";
import { listIngredients } from "@/lib/data";
import { buildCreativeCocktails } from "@/lib/recommend";

export const dynamic = "force-dynamic";
// Vercel: creative generation hits the LLM (~15-30s).
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CreativeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const allIngredients = await listIngredients();
    const results = await buildCreativeCocktails(
      parsed.data.ingredients,
      parsed.data.missing,
      allIngredients,
      parsed.data.language,
      parsed.data.count,
    );
    return NextResponse.json(results);
  } catch (e) {
    console.error("[creative] error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}