import manifest from "@/data/cocktail-images.json";

interface SelfHostedImage {
  file: string;
  bytes: number;
  sha256: string;
}

const IMAGES = manifest as Record<string, SelfHostedImage>;

/**
 * Cocktail photos are self-hosted (public/images/cocktails/<id>.jpg) instead of
 * hot-linked from a third-party CDN: it removes an external dependency, lets us
 * serve them through next/image, and lets image search associate a stable,
 * descriptive URL with each recipe. The manifest is generated from the database
 * (see knowledge-base/work/seo-v2/图片自托管报告.md).
 */
export function localCocktailImage(id: string): string | null {
  return IMAGES[id]?.file ?? null;
}

/** Prefer the self-hosted photo, fall back to whatever URL the row stores. */
export function cocktailHeroImage(id: string, fallback?: string | null): string | null {
  return localCocktailImage(id) ?? fallback ?? null;
}

export function hasLocalCocktailImage(id: string): boolean {
  return Boolean(IMAGES[id]);
}

export function countLocalCocktailImages(): number {
  return Object.keys(IMAGES).length;
}
