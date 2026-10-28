import type { MetadataRoute } from "next";
import { listCocktails } from "@/lib/data";
import { abs, SITE_URL } from "@/lib/seo";

const LANGS = ["en", "zh-CN"] as const;

/**
 * <lastmod> is a real signal for Google and Search Console flags sitemaps whose
 * lastmod is always "now" (the previous implementation used new Date(), i.e. the
 * build time of every deploy). We now use real content timestamps: each recipe
 * page reports its own creation date, the pages that list recipes report the
 * newest recipe date. When a template-wide change actually alters the rendered
 * HTML (like the nutrition/strength blocks), bump SITE_CONTENT_UPDATED.
 */
const SITE_CONTENT_UPDATED = new Date("2026-10-28T00:00:00+08:00");

function latest(dates: Date[]): Date {
  return dates.reduce((a, b) => (a > b ? a : b), SITE_CONTENT_UPDATED);
}

function alternates(path: string) {
  return {
    languages: {
      en: `${SITE_URL}/en${path}`,
      "zh-CN": `${SITE_URL}/zh-CN${path}`,
      "x-default": `${SITE_URL}/en${path}`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cocktails = (await listCocktails()).filter((c) => c.source === "classic");
  const newestRecipe = latest(cocktails.map((c) => new Date(c.createdAt)));
  const entries: MetadataRoute.Sitemap = [];

  for (const lang of LANGS) {
    entries.push({
      url: `${SITE_URL}/${lang}`,
      lastModified: newestRecipe,
      changeFrequency: "weekly",
      priority: 1,
      alternates: alternates(""),
    });

    entries.push({
      url: `${SITE_URL}/${lang}/classics`,
      lastModified: newestRecipe,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: alternates("/classics"),
    });

    entries.push({
      url: `${SITE_URL}/${lang}/guide`,
      lastModified: newestRecipe,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: alternates("/guide"),
    });

    for (const c of cocktails) {
      const images = c.imageUrl ? [abs(c.imageUrl)] : undefined;
      entries.push({
        url: `${SITE_URL}/${lang}/cocktail/${c.id}`,
        lastModified: latest([new Date(c.createdAt)]),
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: alternates(`/cocktail/${c.id}`),
        // Image sitemap entries: tells Google which photo belongs to which
        // recipe page, which is how image search discovers the recipe photos.
        ...(images ? { images } : {}),
      });
    }
  }

  return entries;
}
