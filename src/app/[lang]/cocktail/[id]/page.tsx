import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CocktailDetailClient } from "@/components/cocktail-detail";
import { buildCocktailFaq, CocktailFaq } from "@/components/cocktail-faq";
import { CocktailGrid, type CocktailLink } from "@/components/cocktail-grid";
import { getCocktail, listCocktails } from "@/lib/data";
import { buildCocktailDetail } from "@/lib/recommend";
import { abs, breadcrumbJsonLd, faqJsonLd, jsonLdHtml, recipeJsonLd, SITE_NAME } from "@/lib/seo";

// Programmatic SEO: every classic cocktail in every language gets a
// pre-rendered, indexable page with its own localized title/description,
// canonical and hreflang alternates (per knowledge base).
export async function generateStaticParams() {
  const cocktails = await listCocktails();
  const langs = ["en", "zh-CN"] as const;
  return langs.flatMap((lang) => cocktails.map((c) => ({ lang, id: c.id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}): Promise<Metadata> {
  const { id, lang: rawLang } = await params;
  const lang: "en" | "zh-CN" = rawLang === "zh-CN" ? "zh-CN" : "en";
  const decoded = decodeURIComponent(id);
  const c = await getCocktail(decoded);
  if (!c) return { title: "Cocktail not found" };

  const isZh = lang === "zh-CN";
  const displayName = isZh ? c.nameZh : c.nameEn;
  const description = isZh ? c.descriptionZh : c.descriptionEn;
  const title = `${displayName} ${isZh ? "配方" : "Cocktail Recipe"}`;
  const canonical = abs(`/${lang}/cocktail/${decoded}`);
  const images = c.imageUrl ? [{ url: c.imageUrl, alt: `${displayName} ${isZh ? "配方" : "recipe"}` }] : undefined;

  return {
    title: `${displayName} ${isZh ? "配方" : "Recipe"}`,
    description,
    // AI-generated recipes are personalized creative output (and often share a
    // photo with a classic). They stay reachable and useful, but must not enter
    // the index: a shelf of thin generated pages is exactly the "crawled, not
    // indexed" trap.
    ...(c.source === "ai" ? { robots: { index: false, follow: true } } : {}),
    alternates: {
      canonical,
      languages: {
        en: abs(`/en/cocktail/${decoded}`),
        "zh-CN": abs(`/zh-CN/cocktail/${decoded}`),
        "x-default": abs(`/en/cocktail/${decoded}`),
      },
    },
    openGraph: {
      type: "article",
      title: `${title} · ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: isZh ? "zh_CN" : "en_US",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: `${title} · ${SITE_NAME}`,
      description,
      images,
    },
  };
}

export default async function CocktailDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { id, lang: rawLang } = await params;
  const lang: "en" | "zh-CN" = rawLang === "zh-CN" ? "zh-CN" : "en";
  const decoded = decodeURIComponent(id);

  // Seeded server-side so crawlers (and the first paint) get full localized
  // content, while the client still re-fetches its personalized "owned" context.
  const initial = await buildCocktailDetail(decoded, [], lang);
  if (!initial) notFound();

  // Internal linking: recommend other classics that share ingredients, so
  // search engines (and users) can keep crawling between recipes.
  const all = await listCocktails();
  const currentIds = new Set(
    (all.find((x) => x.id === decoded)?.ingredients ?? []).map((i) => i.ingredient.id),
  );
  const related: CocktailLink[] = all
    .filter((x) => x.id !== decoded && x.source === "classic")
    .map((x) => ({
      id: x.id,
      name: lang === "zh-CN" ? x.nameZh : x.nameEn,
      imageUrl: x.imageUrl,
      emoji: x.ingredients[0]?.ingredient.emoji ?? "🍸",
      overlap: x.ingredients.filter((i) => currentIds.has(i.ingredient.id)).length,
      popularity: x.popularity,
    }))
    .sort((a, b) => b.overlap - a.overlap || b.popularity - a.popularity)
    .slice(0, 6)
    .map(({ overlap: _overlap, popularity: _popularity, ...rest }) => rest);

  const faq = buildCocktailFaq(initial, lang);
  const isZh = lang === "zh-CN";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            recipeJsonLd({
              name: initial.name,
              description: initial.description,
              steps: initial.steps,
              ingredients: initial.ingredients.map((i) => ({ name: i.name, amount: i.amount })),
              imageUrl: initial.imageUrl,
              prepTime: initial.prepTime,
              url: `/${lang}/cocktail/${decoded}`,
              lang,
              datePublished: initial.datePublished,
              flavors: initial.flavors,
              method: initial.method,
              glass: initial.glass,
              nutrition: initial.nutrition,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            breadcrumbJsonLd([
              { name: isZh ? "首页" : "Home", url: `/${lang}` },
              { name: isZh ? "经典配方" : "Classic cocktails", url: `/${lang}/classics` },
              { name: initial.name, url: `/${lang}/cocktail/${decoded}` },
            ]),
          ),
        }}
      />
      {faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd(faq)) }}
        />
      )}
      <div className="container pt-6">
        <Breadcrumbs
          items={[
            { label: isZh ? "首页" : "Home", href: `/${lang}` },
            { label: isZh ? "经典配方" : "Classic cocktails", href: `/${lang}/classics` },
            { label: initial.name },
          ]}
        />
      </div>
      <CocktailDetailClient id={decoded} initial={initial} />
      <CocktailFaq items={faq} heading={isZh ? "关于这杯酒" : "About this drink"} />
      <CocktailGrid
        lang={lang}
        title={lang === "zh-CN" ? "相关推荐" : "You might also like"}
        items={related}
      />
    </>
  );
}