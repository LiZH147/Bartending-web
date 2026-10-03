import { type Prisma } from "@prisma/client";
import { prisma } from "./db";
import { jsonArray } from "./utils";
import type { Category, Difficulty, Flavor, Method, Source, Strength } from "./constants";
import type { Language } from "./schemas";

export interface HydratedIngredient {
  id: string;
  nameEn: string;
  nameZh: string;
  category: Category;
  flavorProfile: Flavor[];
  emoji: string;
  color: string;
  aliases: string[];
}

export interface HydratedCocktailIngredient {
  ingredient: HydratedIngredient;
  amount: string;
  optional: boolean;
  note: string;
}

export interface HydratedCocktail {
  id: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  glass: string;
  method: Method;
  difficulty: Difficulty;
  strength: Strength;
  flavorProfile: Flavor[];
  stepsEn: string[];
  stepsZh: string[];
  popularity: number;
  novelty: number;
  source: Source;
  imageUrl: string | null;
  prepTime: number;
  ingredients: HydratedCocktailIngredient[];
}

interface IngredientRow {
  id: string;
  nameEn: string;
  nameZh: string;
  category: string;
  flavorProfile: string;
  emoji: string;
  color: string;
  aliases?: { alias: string }[];
}

interface CocktailIngredientRow {
  amount: string;
  optional: boolean;
  note: string;
  ingredient: IngredientRow;
}

interface CocktailRow {
  id: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  glass: string;
  method: string;
  difficulty: string;
  strength: string;
  flavorProfile: string;
  stepsEn: string;
  stepsZh: string;
  popularity: number;
  novelty: number;
  source: string;
  imageUrl: string | null;
  prepTime: number;
  ingredients?: CocktailIngredientRow[];
}

export function hydrateIngredient(row: IngredientRow): HydratedIngredient {
  return {
    id: row.id,
    nameEn: row.nameEn,
    nameZh: row.nameZh,
    category: row.category as Category,
    flavorProfile: jsonArray<Flavor>(row.flavorProfile),
    emoji: row.emoji,
    color: row.color,
    aliases: (row.aliases ?? []).map((a) => a.alias),
  };
}

function hydrateCocktailRow(row: CocktailRow): HydratedCocktail {
  return {
    id: row.id,
    nameEn: row.nameEn,
    nameZh: row.nameZh,
    descriptionEn: row.descriptionEn,
    descriptionZh: row.descriptionZh,
    glass: row.glass,
    method: row.method as Method,
    difficulty: row.difficulty as Difficulty,
    strength: row.strength as Strength,
    flavorProfile: jsonArray<Flavor>(row.flavorProfile),
    stepsEn: jsonArray<string>(row.stepsEn),
    stepsZh: jsonArray<string>(row.stepsZh),
    popularity: row.popularity,
    novelty: row.novelty,
    source: row.source as Source,
    imageUrl: row.imageUrl,
    prepTime: row.prepTime,
    ingredients: (row.ingredients ?? []).map((ci) => ({
      ingredient: hydrateIngredient(ci.ingredient),
      amount: ci.amount,
      optional: ci.optional,
      note: ci.note,
    })),
  };
}

const cocktailInclude = {
  ingredients: {
    include: { ingredient: { include: { aliases: true } } },
    orderBy: { id: "asc" as const },
  },
} satisfies Prisma.CocktailInclude;

export async function listIngredients(): Promise<HydratedIngredient[]> {
  const rows = await prisma.ingredient.findMany({
    include: { aliases: { select: { alias: true } } },
    orderBy: [{ category: "asc" }, { nameEn: "asc" }],
  });
  return rows.map((r) => hydrateIngredient(r));
}

export async function listCocktails(): Promise<HydratedCocktail[]> {
  const rows = await prisma.cocktail.findMany({
    include: cocktailInclude,
    orderBy: { popularity: "desc" },
  });
  return rows.map((r) => hydrateCocktailRow(r as unknown as CocktailRow));
}

export async function getCocktail(id: string): Promise<HydratedCocktail | null> {
  const row = await prisma.cocktail.findUnique({
    where: { id },
    include: cocktailInclude,
  });
  if (!row) return null;
  return hydrateCocktailRow(row as unknown as CocktailRow);
}

export function localizeIngredientName(ing: { nameEn: string; nameZh: string }, lang: Language): string {
  return lang === "zh-CN" ? ing.nameZh : ing.nameEn;
}

export function localizeCocktail(c: HydratedCocktail, lang: Language) {
  return {
    name: lang === "zh-CN" ? c.nameZh : c.nameEn,
    description: lang === "zh-CN" ? c.descriptionZh : c.descriptionEn,
    steps: lang === "zh-CN" ? c.stepsZh : c.stepsEn,
  };
}