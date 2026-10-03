import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Thin / cookie-local / query-driven pages carry no search value and
        // would only dilute the crawl budget (per knowledge-base robots guidance).
        disallow: [
          "/en/recommend",
          "/zh-CN/recommend",
          "/en/cabinet",
          "/zh-CN/cabinet",
          "/en/favorites",
          "/zh-CN/favorites",
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}