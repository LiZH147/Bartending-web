import { NextResponse } from "next/server";
import { listIngredients } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ingredients = await listIngredients();
    const payload = ingredients.map((i) => ({
      id: i.id,
      nameEn: i.nameEn,
      nameZh: i.nameZh,
      category: i.category,
      flavor: i.flavorProfile,
      emoji: i.emoji,
      aliases: i.aliases,
    }));
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load ingredients" },
      { status: 500 },
    );
  }
}