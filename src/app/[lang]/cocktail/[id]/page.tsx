import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CocktailDetailClient } from "@/components/cocktail-detail";
import { getCocktail, listCocktails } from "@/lib/data";
import { buildCocktailDetail } from "@/lib/recommend";
import { abs, recipeJsonLd, SITE_NAME } from "@/lib/seo";

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

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
    alternates: {
      canonical,
      languages: {
        en: abs(`/en/cocktail/${decoded}`),
        "zh-CN": abs(`/zh-CN/cocktail/${decoded}`),
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
  searchParams,
}: {
  params: Promise<{ lang: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, lang: rawLang } = await params;
  const lang: "en" | "zh-CN" = rawLang === "zh-CN" ? "zh-CN" : "en";
  const sp = await searchParams;
  const ownedIds = asArray(sp.i);
  const decoded = decodeURIComponent(id);

  // Seeded server-side so crawlers (and the first paint) get full localized
  // content, while the client still re-fetches its personalized "owned" context.
  const initial = await buildCocktailDetail(decoded, [], lang);
  if (!initial) notFound();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            recipeJsonLd({
              name: initial.name,
              description: initial.description,
              steps: initial.steps,
              ingredients: initial.ingredients.map((i) => ({ name: i.name, amount: i.amount })),
              imageUrl: initial.imageUrl,
              prepTime: initial.prepTime,
              url: `/${lang}/cocktail/${decoded}`,
            }),
          ),
        }}
      />
      <CocktailDetailClient id={decoded} ownedIds={ownedIds} initial={initial} />
    </>
  );
}