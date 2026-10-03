/**
 * Central SEO configuration and structured-data helpers.
 *
 * Guidance sourced from the project's knowledge base (哥飞 SEO tutorials):
 * unique T/D/H per page, canonical tags, OpenGraph/Twitter cards, robots,
 * sitemap (multi-language hreflang), and Schema.org structured data.
 */

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
  url: string;
}

/** Build a Schema.org Recipe object for a cocktail detail page. */
export function recipeJsonLd(input: RecipeMarkupInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: input.name,
    description: input.description ?? "",
    image: input.imageUrl ? [abs(input.imageUrl)] : [],
    recipeCategory: "Drink",
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    url: abs(input.url),
    prepTime: `PT${input.prepTime}M`,
    recipeIngredient: input.ingredients.map((ing) =>
      ing.amount ? `${ing.amount} ${ing.name}` : ing.name,
    ),
    recipeInstructions: input.steps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      text: step,
    })),
  };
}

/** Site-wide WebSite schema (Google "site name" signal). */
export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}