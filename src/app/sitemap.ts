import type { MetadataRoute } from "next";
import { listCocktails } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

const LANGS = ["en", "zh-CN"] as const;

function languages(id: string) {
  return {
    en: `${SITE_URL}/en${id}`,
    "zh-CN": `${SITE_URL}/zh-CN${id}`,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cocktails = (await listCocktails()).filter((c) => c.source === "classic");
  const lastModified = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const lang of LANGS) {
    // Home page, localized.
    entries.push({
      url: `${SITE_URL}/${lang}`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
      alternates: { languages: { en: `${SITE_URL}/en`, "zh-CN": `${SITE_URL}/zh-CN` } },
    });

    // Beginner's guide, localized.
    entries.push({
      url: `${SITE_URL}/${lang}/guide`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
      alternates: { languages: { en: `${SITE_URL}/en/guide`, "zh-CN": `${SITE_URL}/zh-CN/guide` } },
    });

    // Classic cocktail pages, localized.
    for (const c of cocktails) {
      entries.push({
        url: `${SITE_URL}/${lang}/cocktail/${c.id}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: { languages: languages(`/cocktail/${c.id}`) },
      });
    }
  }

  return entries;
}