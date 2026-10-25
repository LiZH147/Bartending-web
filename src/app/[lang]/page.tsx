import type { Metadata } from "next";
import { listCocktails } from "@/lib/data";
import { HomeClient } from "@/components/home-client";
import { CocktailGrid, type CocktailLink } from "@/components/cocktail-grid";
import { abs, itemListJsonLd, jsonLdHtml, LOCALE_META, SITE_NAME } from "@/lib/seo";

// The localized home pages need their own canonical + hreflang pair; the
// [lang] layout metadata is shared by every route and therefore cannot carry
// a page-specific canonical. (Reported by the SEO verification pass.)
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang === "zh-CN" ? "zh-CN" : "en";
  const meta = LOCALE_META[locale];
  const canonical = abs(`/${locale}`);
  return {
    alternates: {
      canonical,
      languages: { en: abs("/en"), "zh-CN": abs("/zh-CN") },
    },
    openGraph: {
      type: "website",
      locale: meta.ogLocale,
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      url: canonical,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang === "zh-CN" ? "zh-CN" : "en";

  // Featured classics for the home page (internal linking + ItemList schema).
  const classics = (await listCocktails()).filter((c) => c.source === "classic").slice(0, 12);
  const items: CocktailLink[] = classics.map((c) => ({
    id: c.id,
    name: locale === "zh-CN" ? c.nameZh : c.nameEn,
    imageUrl: c.imageUrl,
    emoji: c.ingredients[0]?.ingredient.emoji ?? "🍸",
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            itemListJsonLd(items.map((i) => ({ name: i.name, url: `/${lang}/cocktail/${i.id}` }))),
          ),
        }}
      />
      <HomeClient />
      <CocktailGrid
        lang={lang}
        title={locale === "zh-CN" ? "热门经典鸡尾酒" : "Popular classic cocktails"}
        items={items}
      />
    </>
  );
}