import { listCocktails } from "@/lib/data";
import { HomeClient } from "@/components/home-client";
import { CocktailGrid, type CocktailLink } from "@/components/cocktail-grid";
import { itemListJsonLd } from "@/lib/seo";

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
          __html: JSON.stringify(
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