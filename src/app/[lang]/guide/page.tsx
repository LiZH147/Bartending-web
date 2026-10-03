import type { Metadata } from "next";
import { listCocktails } from "@/lib/data";
import { CocktailGrid, type CocktailLink } from "@/components/cocktail-grid";
import { abs, SITE_NAME } from "@/lib/seo";

const TITLE = {
  en: "Home Bartending Guide",
  "zh-CN": "居家调酒入门指南",
} as const;

const DESCRIPTION = {
  en: "Learn the essential spirits, tools and techniques to mix classic cocktails at home — even with a small bar.",
  "zh-CN": "了解调制经典鸡尾酒所需的核心基酒、必备工具与基础技巧，新手也能在家轻松调酒。",
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang === "zh-CN" ? "zh-CN" : "en";
  const canonical = abs(`/${locale}/guide`);
  const title = TITLE[locale];
  const description = DESCRIPTION[locale];
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { en: abs("/en/guide"), "zh-CN": abs("/zh-CN/guide") },
    },
    openGraph: {
      type: "article",
      title: `${title} · ${SITE_NAME}`,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: locale === "zh-CN" ? "zh_CN" : "en_US",
    },
    twitter: { card: "summary", title: `${title} · ${SITE_NAME}`, description },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const isZh = lang === "zh-CN";

  const starters: CocktailLink[] = (await listCocktails())
    .filter((c) => c.source === "classic")
    .slice(0, 6)
    .map((c) => ({
      id: c.id,
      name: isZh ? c.nameZh : c.nameEn,
      imageUrl: c.imageUrl,
      emoji: c.ingredients[0]?.ingredient.emoji ?? "🍸",
    }));

  const spirits = isZh
    ? [
        ["伏特加 Vodka", "口感清淡中性，最不容易出错，非常适合新手入门。"],
        ["金酒 Gin", "带杜松子和植物香气，是金汤力、马天尼的灵魂。"],
        ["朗姆酒 Rum", "甘蔗带来的甜香，成就莫吉托、得其利等清爽酒饮。"],
        ["龙舌兰 Tequila", "龙舌兰植物的清香，是玛格丽特的绝对主角。"],
        ["威士忌 Whisky", "醇厚复杂，撑起古典、曼哈顿等经典款。"],
        ["白兰地 Brandy", "果香圆润，边车等经典以它为基底。"],
      ]
    : [
        ["Vodka", "Neutral and smooth — the most forgiving spirit for a beginner."],
        ["Gin", "Botanical and juniper-forward; the soul of the Gin & Tonic and Martini."],
        ["Rum", "Sugarcane sweetness that powers the Mojito and Daiquiri."],
        ["Tequila", "Earthy agave character; the star of the Margarita."],
        ["Whisky", "Rich and complex — the backbone of the Old Fashioned and Manhattan."],
        ["Brandy", "Round, fruity warmth; the base of classics like the Sidecar."],
      ];

  const tools = isZh
    ? [
        ["摇酒器 Shaker", "混合并冰镇需要摇匀的酒液。"],
        ["量酒器 Jigger", "精确控制比例，是成败的关键。"],
        ["滤冰器 / 滤网 Strainer", "倒酒时滤去冰块与果渣。"],
        ["吧勺 Bar spoon", "搅拌纯烈酒类鸡尾酒，也可用来分层。"],
        ["捣棒 Muddler", "榨出香草、柑橘的香气。"],
        ["榨汁器 Citrus press", "新鲜的柠檬、青柠汁远胜瓶装。"],
      ]
    : [
        ["Shaker", "Mixes and chills anything that needs to be shaken."],
        ["Jigger", "Measures the ratio — the difference between great and average."],
        ["Strainer", "Holds back ice and pulp when you pour."],
        ["Bar spoon", "For stirring spirit-forward drinks and layering."],
        ["Muddler", "Releases the oils from herbs and citrus."],
        ["Citrus press", "Fresh lemon and lime juice beats bottled, always."],
      ];

  const techniques = isZh
    ? [
        ["摇和 Shake", "含果汁、蛋白或利口酒的鸡尾酒，用力摇 10–12 秒。"],
        ["搅拌 Stir", "纯烈酒类（如古典、马天尼）用吧勺搅拌，口感更顺滑。"],
        ["直调 Build", "直接在杯中加冰调制，金汤力就是典型。"],
        ["捣压 Muddle", "轻柔压出香草与柑橘的香气，别捣碎苦味。"],
        ["装饰 Garnish", "一块橙皮或一根薄荷，就能提升香气和观感。"],
      ]
    : [
        ["Shake", "Drinks with juice, egg white or liqueur — shake hard for 10–12 seconds."],
        ["Stir", "Spirit-forward drinks (Old Fashioned, Martini) get a gentler stir."],
        ["Build", "Mix straight in the glass over ice — the Gin & Tonic is the classic example."],
        ["Muddle", "Gently press herbs and citrus to release oils; avoid bitterness."],
        ["Garnish", "A citrus twist or mint sprig lifts both aroma and look."],
      ];

  return (
    <div className="container max-w-3xl pb-16 pt-10">
      <article>
        <h1 className="font-display text-3xl font-bold text-brand-cream sm:text-4xl">
          {isZh ? TITLE["zh-CN"] : TITLE.en}
        </h1>
        <p className="mt-4 leading-relaxed text-muted-foreground">
          {isZh
            ? "调一杯好酒不需要囤满一柜子。了解下面几种核心基酒、必备工具和基础技巧，你就能在家调制几十款经典鸡尾酒。"
            : "You don't need a 20-bottle bar to make great cocktails. Cover the handful of spirits, tools and techniques below and you'll unlock dozens of classic drinks."}
        </p>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-brand-cream">
            {isZh ? "核心基酒" : "Core spirits"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {spirits.map(([name, desc]) => (
              <div key={name} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-brand-cream">{name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-brand-cream">
            {isZh ? "必备工具" : "Essential tools"}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {tools.map(([name, desc]) => (
              <div key={name} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-brand-cream">{name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl font-semibold text-brand-cream">
            {isZh ? "基础技巧" : "Basic techniques"}
          </h2>
          <ul className="mt-4 space-y-3">
            {techniques.map(([name, desc]) => (
              <li key={name} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium text-brand-cream">{name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ul>
        </section>
      </article>

      <CocktailGrid
        lang={lang}
        title={isZh ? "从这 6 款经典开始" : "Start with these six classics"}
        items={starters}
      />
    </div>
  );
}