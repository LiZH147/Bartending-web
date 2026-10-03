import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function jsonArray<T = string>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
    return [];
  } catch {
    return [];
  }
}

export function clamp(n: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, n));
}

export function pct(n: number) {
  return Math.round(clamp(n) * 100);
}

/** Remove punctuation, collapse whitespace, lowercase — for alias normalization. */
export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff\u3400-\u4dbf]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function titleCase(input: string): string {
  return input.replace(/\b\w/g, (c) => c.toUpperCase());
}