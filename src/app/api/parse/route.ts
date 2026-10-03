import { NextResponse } from "next/server";
import { ParseRequestSchema } from "@/lib/schemas";
import { parseIngredients } from "@/lib/ai";
import { listIngredients } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = ParseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const ingredients = await listIngredients();
    const result = await parseIngredients(parsed.data.text, parsed.data.language, ingredients);
    return NextResponse.json(result);
  } catch (e) {
    console.error("[parse] error", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}