/**
 * Central SEO configuration and structured-data helpers.
 *
 * Guidance sourced from the project's knowledge base (哥飞 SEO tutorials):
 * unique T/D/H per page, canonical tags, OpenGraph/Twitter cards, robots,
 * sitemap (multi-language hreflang), and Schema.org structured data.
 *
 * Recipe markup follows Google's Recipe structured-data guidelines. The
 * Search Console report for this site flagged five *non-critical* issues
 * (nutrition, keywords, step name, step image/video, aggregateRating); the
 * fixes live here and in `src/lib/nutrition.ts`:
 *
 *   - nutrition  → derived from canonical ingredient amounts (never invented),
 *                  and rendered visibly on the page (markup must match content)
 *   - keywords   → built from name / flavors / method / glass / ingredients
 *   - step name  → the first clause of each instruction, localized
 *   - step image → the recipe photo until real per-step photography exists
 *   - aggregateRating → deliberately omitted unless REAL user ratings exist;
 *                  fabricating ratings violates Google's structured-data policy
 *                  and risks a manual action. See the SEO plan document.
 */

import { FLAVOR_LABELS, METHOD_LABELS, type Flavor, type Method } from "./constants";
import { servingSizeText, type NutritionEstimate } from "./nutrition";

const fallbackUrl = "https://bartending-web.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? fallbackUrl).replace(/\/+$/, "");
export const SITE_NAME = "NIGHTCAP";

export const DEFAULT_TITLE = "NIGHTCAP — AI Cocktail & Drink Recipes";
export const DEFAULT_DESCRIPTION =
  "Tell us what's in your cabinet and instantly get classic cocktails and AI-crafted drinks you can mix tonight. 70+ recipes with step-by-step instructions.";

export const DEFAULT_TITLE_ZH = "NIGHTCAP — AI 鸡尾酒配方与智能推荐";
export const DEFAULT_DESCRIPTION_ZH =
  "告诉 NIGHTCAP 你酒柜里有什么，立刻得到今晚就能调制的经典鸡尾酒和 AI 创意特调。70+ 配方，附带分步调制说明。";

export const DEFAULT_KEYWORDS = [
  "cocktail recipes",
  "drink recipes",
  "AI cocktail",
  "what can I mix",
  "cocktail from ingredients",
  "mixology",
  "home bartending",
  "cocktail finder",
  "drink ideas",
];

export const DEFAULT_KEYWORDS_ZH = [
  "鸡尾酒配方",
  "调酒配方",
  "鸡尾酒推荐",
  "家庭调酒",
  "鸡尾酒配料",
  "调酒入门",
  "今晚喝什么",
  "鸡尾酒做法",
];

/** Per-language default metadata (used by the [lang] root layout). */
export const LOCALE_META = {
  en: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    keywords: DEFAULT_KEYWORDS,
    ogLocale: "en_US",
  },
  "zh-CN": {
    title: DEFAULT_TITLE_ZH,
    description: DEFAULT_DESCRIPTION_ZH,
    keywords: DEFAULT_KEYWORDS_ZH,
    ogLocale: "zh_CN",
  },
} as const;

export type RecipeLocale = "en" | "zh-CN";

/** Build an absolute site URL from a path or pathname. */
export function abs(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export interface RecipeMarkupIngredient {
  name: string;
  amount?: string;
}

export interface RecipeMarkupInput {
  name: string;
  description?: string;
  steps: string[];
  ingredients: RecipeMarkupIngredient[];
  imageUrl?: string | null;
  prepTime: number;
  /** Canonical path, e.g. `/en/cocktail/margarita`. */
  url: string;
  lang?: RecipeLocale;
  datePublished?: string;
  flavors?: Flavor[];
  method?: Method;
  glass?: string;
  /** Optional genuine per-step photography (highest priority). */
  stepImages?: (string | null | undefined)[];
  /**
   * Fallback for the step `image` property when no per-step photography exists.
   * "final" (default) attaches the recipe photo only to the last step, where it
   * truthfully shows the finished drink; "all" attaches it to every step (the
   * GSC warning disappears, but the photo does not depict each step); "none"
   * omits step images entirely.
   */
  stepImageMode?: "final" | "all" | "none";
  nutrition?: NutritionEstimate | null;
  /**
   * Aggregate of real user ratings only. Leave unset unless the number comes
   * from actual on-site ratings — never synthesize it.
   */
  rating?: { value: number; count: number } | null;
}

/**
 * Recipe image URL(s). Google needs at least one crawlable image; when a
 * cocktail has no photography yet we fall back to the site's generated OG
 * image so the page never ships an empty `image` array (which is reported as
 * a *critical* missing field).
 */
function recipeImages(input: RecipeMarkupInput): string[] {
  if (input.imageUrl) return [abs(input.imageUrl)];
  return [abs("/opengraph-image")];
}

/**
 * A short, human-readable step title built from the instruction itself, so the
 * HowToStep `name` always matches what the user sees on the page.
 */
function stepTitle(step: string, lang: RecipeLocale): string {
  const isZh = lang === "zh-CN";
  // Split on sentence terminators; `\.\s` keeps decimals like "7.5 ml" intact.
  const firstClause = step.split(/[。！？]|\.\s|[!?]\s/)[0] ?? step;
  let title = firstClause.replace(/[。！？.!?]+$/, "").trim();

  const max = isZh ? 26 : 72;
  if (title.length > max) {
    if (isZh) {
      title = `${title.slice(0, max)}…`;
    } else {
      const cut = title.slice(0, max);
      const lastSpace = cut.lastIndexOf(" ");
      title = `${(lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
    }
  }
  return title;
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.trim());
  }
  return out;
}

/**
 * Recipe keywords: searchable, honest phrases that describe this exact drink.
 * Schema.org expects a single Text value, so the list is joined by commas.
 */
export function recipeKeywords(input: RecipeMarkupInput): string[] {
  const isZh = (input.lang ?? "en") === "zh-CN";
  const words: string[] = [
    input.name,
    isZh ? "鸡尾酒配方" : "cocktail recipe",
    isZh ? "调酒配方" : "drink recipe",
    isZh ? "家庭调酒" : "home bartending",
    isZh ? "今晚喝什么" : "what to drink tonight",
  ];

  if (input.glass) words.push(isZh ? `${input.glass} 鸡尾酒` : `${input.glass} cocktail`);

  for (const flavor of input.flavors ?? []) {
    words.push(FLAVOR_LABELS[flavor]?.[isZh ? "zh" : "en"] ?? flavor);
  }
  if (input.method) {
    words.push(METHOD_LABELS[input.method]?.[isZh ? "zh" : "en"] ?? input.method);
  }
  for (const ingredient of input.ingredients) {
    words.push(ingredient.name);
  }

  return dedupe(words).slice(0, 12);
}

/**
 * Serialize JSON-LD for inline <script> injection. Escaping `<` keeps a
 * recipe step that happens to contain `</script>` from terminating the tag.
 */
export function jsonLdHtml(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/** Build a Schema.org Recipe object for a cocktail detail page. */
export function recipeJsonLd(input: RecipeMarkupInput): Record<string, unknown> {
  const lang: RecipeLocale = input.lang ?? "en";
  const isZh = lang === "zh-CN";
  const recipeUrl = abs(input.url);
  const images = recipeImages(input);
  const nutrition = input.nutrition ?? null;
  const stepImageMode = input.stepImageMode ?? "final";

  const markup: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: input.name,
    ...(input.description?.trim() ? { description: input.description } : {}),
    image: images,
    url: recipeUrl,
    mainEntityOfPage: recipeUrl,
    recipeCategory: isZh ? "鸡尾酒" : "Cocktail",
    inLanguage: lang,
    keywords: recipeKeywords(input).join(", "),
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    prepTime: `PT${input.prepTime}M`,
    totalTime: `PT${input.prepTime}M`,
    recipeYield: isZh ? "1 杯" : "1 drink",
    recipeIngredient: input.ingredients.map((ing) =>
      ing.amount ? `${ing.amount} ${ing.name}` : ing.name,
    ),
    recipeInstructions: input.steps.map((step, i) => {
      const supplied = input.stepImages?.[i];
      const isFinalStep = i === input.steps.length - 1;
      const useRecipeImage =
        input.imageUrl != null &&
        (stepImageMode === "all" || (stepImageMode === "final" && isFinalStep));
      const stepImage = supplied ? abs(supplied) : useRecipeImage ? abs(input.imageUrl as string) : null;
      return {
        "@type": "HowToStep",
        position: i + 1,
        // Never ship an empty step name (AI-generated recipes may contain one).
        name: stepTitle(step, lang) || (isZh ? `第 ${i + 1} 步` : `Step ${i + 1}`),
        text: step,
        url: `${recipeUrl}#step-${i + 1}`,
        ...(stepImage ? { image: stepImage } : {}),
      };
    }),
  };

  if (input.datePublished) markup.datePublished = input.datePublished;

  if (nutrition) {
    markup.nutrition = {
      "@type": "NutritionInformation",
      // Schema.org/Google expect a human-readable string here.
      calories: `${nutrition.calories} calories`,
      sugarContent: `${nutrition.sugarG} g`,
      servingSize: servingSizeText(nutrition.volumeMl, lang),
    };
  }

  // Only emitted when a real aggregate exists — see the note at the top.
  if (input.rating && input.rating.count > 0) {
    markup.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: input.rating.value,
      ratingCount: input.rating.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return markup;
}

/** Site-wide WebSite schema (Google "site name" signal). */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    // No potentialAction/SearchAction: the site has no site-search endpoint, and
    // declaring one that 404s is a false capability claim (structured data must
    // only describe features that actually exist). Add it back together with a
    // real /search page if site search ever ships.
  };
}

/** Schema.org ItemList for the home page's featured classic cocktails. */
export function itemListJsonLd(items: { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Popular Cocktail Recipes",
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: abs(item.url),
    })),
  };
}

/** Breadcrumb trail for cocktail pages (Home › Cocktail). */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}
/**
 * Schema.org Article for editorial pages such as the beginner's guide.
 * Deliberately omits datePublished/dateModified: the guide is evergreen, and
 * stamping it with the build date would be the same "always now" lie that
 * Google flags in sitemaps. Add real dates when the content is dated.
 */
export function articleJsonLd(input: {
  headline: string;
  description: string;
  url: string;
  lang?: RecipeLocale;
  image?: string | null;
  datePublished?: string;
  dateModified?: string;
}): Record<string, unknown> {
  const lang: RecipeLocale = input.lang ?? "en";
  const url = abs(input.url);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    inLanguage: lang,
    url,
    mainEntityOfPage: url,
    isPartOf: { "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    ...(input.image ? { image: [abs(input.image)] } : {}),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}
/** FAQPage JSON-LD. Answers must match the visible FAQ text on the page. */
export function faqJsonLd(
  items: { question: string; answer: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
