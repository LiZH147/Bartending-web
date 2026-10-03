import type { MetadataRoute } from "next";
import { listCocktails } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

function alternates(path: string) {
  return {
    languages: {
      en: `${SITE_URL}${path}?lang=en`,
      "zh-CN": `${SITE_URL}${path}?lang=zh-CN`,
    },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cocktails = await listCocktails();

  const home: MetadataRoute.Sitemap[number] = {
    url: `${SITE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1,
    alternates: alternates("/"),
  };

  const cocktailPages: MetadataRoute.Sitemap = cocktails
    .filter((c) => c.source === "classic")
    .map((c) => {
      const path = `/cocktail/${c.id}`;
      return {
        url: `${SITE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: alternates(path),
      };
    });

  return [home, ...cocktailPages];
}