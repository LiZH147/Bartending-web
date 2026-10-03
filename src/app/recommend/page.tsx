import type { Metadata } from "next";
import { RecommendClient } from "@/components/recommend-client";
import type { Preferences } from "@/lib/schemas";

// Query-parameter results page — noindex so only the canonical cocktail pages
// are indexed (avoids duplicate/thin content, per knowledge-base guidance).
export const metadata: Metadata = {
  title: "Your Matches",
  robots: { index: false, follow: false },
};

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function asNumber(v: string | undefined, fallback: number): number {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isNaN(n) ? fallback : n;
}

export default async function RecommendPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const strength = sp.strength as string | undefined;
  const difficulty = sp.difficulty as string | undefined;
  const maxPrep = asNumber(sp.maxPrep as string | undefined, NaN);

  const preferences: Preferences = {
    flavor: asArray(sp.flavor) as Preferences["flavor"],
    strength: (["none", "low", "medium", "high"] as const).includes(strength as never)
      ? (strength as Preferences["strength"])
      : null,
    difficulty: (["easy", "medium", "advanced"] as const).includes(difficulty as never)
      ? (difficulty as Preferences["difficulty"])
      : null,
    maxPrepTime: Number.isNaN(maxPrep) ? null : maxPrep,
  };

  const inputs = {
    ingredientIds: asArray(sp.i),
    preferences,
    missingLimit: asNumber(sp.missingLimit as string | undefined, 1),
  };

  return <RecommendClient inputs={inputs} />;
}