import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CocktailGrid, type CocktailLink } from "@/components/cocktail-grid";
import { listCocktails, type HydratedCocktail } from "@/lib/data";
import {
  abs,
  breadcrumbJsonLd,
  faqJsonLd,
  itemListJsonLd,
  jsonLdHtml,
  SITE_NAME,
} from "@/lib/seo";

const COPY = {
  en: {
    title: "All Classic Cocktail Recipes",
    description:
      "Every classic cocktail on NIGHTCAP in one place — 38 recipes grouped by base spirit, each with exact ratios, steps, glassware, estimated strength and calories.",
    h1: "All classic cocktail recipes",
    intro:
      "This is the full index of classic cocktails on NIGHTCAP. Each entry is a fixed, testable formula — not a mood board: specific ratios in millilitres and ounces, one named method, the glass it is served in, and an estimate of how strong and how caloric the finished drink is. We group the list by base spirit because that is how people shop and how they decide what to drink tonight.",
    howTo:
      "How to use this list: pick the spirit you already own, open the recipe, and check the estimated ABV before you pour. Every recipe page also shows which ingredients you are missing, and what to substitute if you do not want to buy a bottle for a single drink.",
    whyClassic:
      "What makes a classic: it survived long enough that bartenders stopped arguing about the ratios. That is why the index stays short — a drink only earns a page here when we can show its ingredients, steps, glass, strength and calorie estimate rather than paraphrasing a wiki entry.",
    beginnerHead: "Start here if you are new",
  },
  "zh-CN": {
    title: "全部经典鸡尾酒配方",
    description:
      "NIGHTCAP 的全部经典鸡尾酒索引：38 款配方按基酒分组，含精确比例、步骤、杯型、估算酒精度与热量。",
    h1: "全部经典鸡尾酒配方",
    intro:
      "这是 NIGHTCAP 的经典鸡尾酒总索引。每一条都是可以复现的固定配方，而不是气氛图：明确的毫升/盎司比例、指定的调制手法、使用的杯型，以及这杯酒的估算酒精度与热量。我们按基酒分组，因为大家正是按酒柜里已有的酒，来决定今晚喝什么。",
    howTo:
      "怎么用这份清单：先挑你已经有的基酒，打开配方，倒酒之前看一眼估算酒精度。每个配方页还会告诉你缺哪些配料，以及不想为了一杯酒专门买一瓶时可以用什么替代。",
    whyClassic:
      "什么叫经典：它活得足够久，久到调酒师已经不再争论比例。这也是这份索引保持精简的原因——只有当配方能拿出配料、步骤、杯型、酒精度和热量估算，而不是改写一段百科，它才配拥有一个页面。",
    beginnerHead: "完全新手从这里开始",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang === "zh-CN" ? "zh-CN" : "en";
  const copy = COPY[locale];
  const canonical = abs(`/${locale}/classics`);
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        en: abs("/en/classics"),
        "zh-CN": abs("/zh-CN/classics"),
        "x-default": abs("/en/classics"),
      },
    },
    openGraph: {
      type: "website",
      title: `${copy.title} · ${SITE_NAME}`,
      description: copy.description,
      url: canonical,
      siteName: SITE_NAME,
      locale: locale === "zh-CN" ? "zh_CN" : "en_US",
    },
    twitter: { card: "summary", title: `${copy.title} · ${SITE_NAME}`, description: copy.description },
  };
}

function spiritOf(c: HydratedCocktail): string {
  return c.ingredients.find((i) => i.ingredient.category === "spirit")?.ingredient.id ?? "other";
}

export default async function ClassicsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang === "zh-CN" ? "zh-CN" : "en";
  const copy = COPY[locale];

  const cocktails = (await listCocktails()).filter((c) => c.source === "classic");

  const toLink = (c: HydratedCocktail): CocktailLink => ({
    id: c.id,
    name: locale === "zh-CN" ? c.nameZh : c.nameEn,
    imageUrl: c.imageUrl,
    emoji: c.ingredients[0]?.ingredient.emoji ?? "🍸",
  });

  // Group by base spirit (the ingredient people actually shop for).
  const groups = new Map<string, { label: string; emoji: string; items: CocktailLink[] }>();
  for (const c of cocktails) {
    const key = spiritOf(c);
    const spirit = c.ingredients.find((i) => i.ingredient.category === "spirit")?.ingredient;
    const label = spirit ? (locale === "zh-CN" ? spirit.nameZh : spirit.nameEn) : locale === "zh-CN" ? "其他" : "Other";
    const group = groups.get(key) ?? { label, emoji: spirit?.emoji ?? "🍸", items: [] };
    group.items.push(toLink(c));
    groups.set(key, group);
  }
  const ordered = [...groups.values()].sort((a, b) => b.items.length - a.items.length);

  // Real numbers for the FAQ (no invented statistics).
  const easiest = cocktails
    .filter((c) => c.difficulty === "easy")
    .sort((a, b) => a.ingredients.length - b.ingredients.length || b.popularity - a.popularity)[0];

  const faq =
    locale === "zh-CN"
      ? [
          {
            question: "NIGHTCAP 一共有多少款经典鸡尾酒配方？",
            answer: `目前收录了 ${cocktails.length} 款经典鸡尾酒，分布在 ${ordered.length} 类基酒下，每一款都有完整配料、步骤、杯型、估算酒精度与热量。`,
          },
          {
            question: "完全新手应该先学哪一杯？",
            answer: easiest
              ? `建议从 ${easiest.nameZh} 开始：它只需要 ${easiest.ingredients.length} 种配料，步骤最少，也最容易一次做成功。`
              : "建议从配料最少、步骤最简单的那一杯开始。",
          },
          {
            question: "在家调酒需要准备哪些器具？",
            answer:
              "摇酒壶、量酒器、滤冰器和吧勺基本可以覆盖本页所有经典配方；冰块和新鲜柑橘比昂贵的器具更重要。",
          },
        ]
      : [
          {
            question: "How many classic cocktail recipes are on NIGHTCAP?",
            answer: `${cocktails.length} classics across ${ordered.length} base spirits, each with full ingredients, steps, glassware, an estimated ABV and a calorie estimate.`,
          },
          {
            question: "Which cocktail should a complete beginner make first?",
            answer: easiest
              ? `Start with the ${easiest.nameEn}: it needs only ${easiest.ingredients.length} ingredients and the fewest steps, so it is the easiest to get right on the first try.`
              : "Start with the recipe that has the fewest ingredients and steps.",
          },
          {
            question: "What equipment do I need to make these drinks at home?",
            answer:
              "A shaker, a jigger, a strainer and a bar spoon cover almost every classic on this page. Fresh ice and fresh citrus matter more than expensive tools.",
          },
        ];

  const allLinks = cocktails.map(toLink);

  return (
    <div className="container max-w-5xl pb-16 pt-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            breadcrumbJsonLd([
              { name: locale === "zh-CN" ? "首页" : "Home", url: `/${locale}` },
              { name: copy.h1, url: `/${locale}/classics` },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdHtml(
            itemListJsonLd(allLinks.map((c) => ({ name: c.name, url: `/${locale}/cocktail/${c.id}` }))),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd(faq)) }}
      />

      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: locale === "zh-CN" ? "首页" : "Home", href: `/${locale}` },
            { label: copy.h1 },
          ]}
        />
      </div>

      <header>
        <h1 className="font-display text-4xl font-bold text-brand-cream sm:text-5xl">{copy.h1}</h1>
        <p className="mt-4 text-muted-foreground">{copy.intro}</p>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{copy.howTo}</p>
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{copy.whyClassic}</p>
      </section>

      {easiest && (
        <section className="mt-8 rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-5">
          <h2 className="font-display text-xl font-semibold text-brand-cream">{copy.beginnerHead}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href={`/${locale}/cocktail/${easiest.id}`} className="text-brand-amber underline-offset-4 hover:underline">
              {locale === "zh-CN" ? easiest.nameZh : easiest.nameEn}
            </Link>
            {" — "}
            {locale === "zh-CN"
              ? `${easiest.ingredients.length} 种配料，${easiest.prepTime} 分钟。`
              : `${easiest.ingredients.length} ingredients, ${easiest.prepTime} minutes.`}
          </p>
        </section>
      )}

      <div className="mt-8 space-y-4">
        {ordered.map((group) => (
          <CocktailGrid
            key={group.label}
            lang={lang}
            title={`${group.emoji} ${group.label} (${group.items.length})`}
            items={group.items}
          />
        ))}
      </div>

      <section className="mt-4" aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="mb-4 font-display text-2xl font-bold text-brand-cream">
          {locale === "zh-CN" ? "常见问题" : "Frequently asked questions"}
        </h2>
        <div className="space-y-3">
          {faq.map((item) => (
            <details key={item.question} className="rounded-xl border border-border bg-card p-4">
              <summary className="cursor-pointer font-medium text-brand-cream">{item.question}</summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link href={`/${locale}/guide`} className="text-brand-amber underline-offset-4 hover:underline">
          {locale === "zh-CN" ? "还没有基础工具？先看居家调酒入门指南 →" : "New to the tools? Read the home bartending guide →"}
        </Link>
      </p>
    </div>
  );
}
