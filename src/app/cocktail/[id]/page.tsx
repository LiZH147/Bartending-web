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

// Programmatic SEO: every classic cocktail gets a pre-rendered, indexable page
// with its own title/description/canonical/structured data (per knowledge base).
export async function generateStaticParams() {
  const cocktails = await listCocktails();
  return cocktails.map((c) => ({ id: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const decoded = decodeURIComponent(id);
  const c = await getCocktail(decoded);
  if (!c) return { title: "Cocktail not found" };

  const title = `${c.nameEn} Cocktail Recipe`;
  const description = c.descriptionEn;
  const canonical = abs(`/cocktail/${decoded}`);
  const images = c.imageUrl ? [{ url: c.imageUrl, alt: title }] : undefined;

  return {
    title: `${c.nameEn} Recipe`,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: `${title} · ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: "en_US",
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
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ownedIds = asArray(sp.i);
  const decoded = decodeURIComponent(id);

  // Seeded server-side so crawlers (and the first paint) get full content,
  // while the client still re-fetches its personalized "owned" context on mount.
  const initial = await buildCocktailDetail(decoded, [], "en");
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
              url: `/cocktail/${decoded}`,
            }),
          ),
        }}
      />
      <CocktailDetailClient id={decoded} ownedIds={ownedIds} initial={initial} />
    </>
  );
}