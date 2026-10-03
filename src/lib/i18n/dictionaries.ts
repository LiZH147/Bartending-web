import enCommon from "../../../locales/en/common.json";
import enHome from "../../../locales/en/home.json";
import enRecommendation from "../../../locales/en/recommendation.json";
import enCocktail from "../../../locales/en/cocktail.json";
import enCabinet from "../../../locales/en/cabinet.json";
import enFavorites from "../../../locales/en/favorites.json";

import zhCommon from "../../../locales/zh-CN/common.json";
import zhHome from "../../../locales/zh-CN/home.json";
import zhRecommendation from "../../../locales/zh-CN/recommendation.json";
import zhCocktail from "../../../locales/zh-CN/cocktail.json";
import zhCabinet from "../../../locales/zh-CN/cabinet.json";
import zhFavorites from "../../../locales/zh-CN/favorites.json";

export const LOCALES = ["en", "zh-CN"] as const;
export type Locale = (typeof LOCALES)[number];

export type Dictionary = Record<string, string>;

const dictionaries: Record<Locale, Dictionary> = {
  en: {
    ...enCommon,
    ...enHome,
    ...enRecommendation,
    ...enCocktail,
    ...enCabinet,
    ...enFavorites,
  },
  "zh-CN": {
    ...zhCommon,
    ...zhHome,
    ...zhRecommendation,
    ...zhCocktail,
    ...zhCabinet,
    ...zhFavorites,
  },
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.en;
}

export type Interpolation = Record<string, string | number>;

export function translate(
  dict: Dictionary,
  fallback: Dictionary,
  key: string,
  vars?: Interpolation,
): string {
  let template = dict[key] ?? fallback[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      template = template.replaceAll(`{${k}}`, String(v));
    }
  }
  return template;
}

const STORAGE_KEY = "nightcap:lang";
const COOKIE_KEY = "nightcap-lang";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "zh-CN";
}

export function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  // `?lang=` URL variants back the hreflang alternates in sitemap.xml, so a
  // crawler (or a shared link) can address a specific language directly.
  try {
    const q = new URLSearchParams(window.location.search).get("lang");
    if (isLocale(q)) return q;
  } catch {
    /* ignore */
  }
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(saved)) return saved;
  } catch {
    /* ignore */
  }
  try {
    const nav = window.navigator.language || "";
    if (nav.toLowerCase().startsWith("zh")) return "zh-CN";
  } catch {
    /* ignore */
  }
  return "en";
}

export function persistLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  try {
    document.cookie = `${COOKIE_KEY}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
  try {
    document.documentElement.lang = locale;
  } catch {
    /* ignore */
  }
}