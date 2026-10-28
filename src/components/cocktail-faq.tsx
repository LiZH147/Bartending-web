import type { CocktailResult } from "@/lib/schemas";
import { DIFFICULTY_LABELS, METHOD_LABELS } from "@/lib/constants";

export interface FaqItem {
  question: string;
  answer: string;
}

const STANDARD_DRINK_G = 14;

/**
 * Recipe pages should answer questions, not just list steps. Every answer here
 * is derived from data the site already computes server-side (strength,
 * nutrition, glass, method, substitutions) — nothing is invented, and the same
 * array feeds the visible FAQ and its FAQPage JSON-LD, so they cannot drift.
 */
export function buildCocktailFaq(c: CocktailResult, lang: "en" | "zh-CN"): FaqItem[] {
  const isZh = lang === "zh-CN";
  const items: FaqItem[] = [];
  const n = c.nutrition;

  if (n?.abv && n.alcoholG) {
    const drinks = (n.alcoholG / STANDARD_DRINK_G).toFixed(1);
    items.push(
      isZh
        ? {
            question: `${c.name} 的酒精度有多高？`,
            answer: `按配方比例估算约 ${n.abv}% ABV（加冰前的数值，稀释后会低一些），相当于约 ${drinks} 个标准杯（1 标准杯 ≈ 14 克纯酒精）。实际强度取决于你用的酒和倒多满。`,
          }
        : {
            question: `How strong is a ${c.name}?`,
            answer: `About ${n.abv}% ABV as mixed — roughly ${drinks} standard drinks (14 g of pure alcohol each). That figure is before ice dilution, and your own bottles and pour size will move it.`,
          },
    );
  } else if (c.strength === "none") {
    items.push(
      isZh
        ? { question: `${c.name} 含酒精吗？`, answer: "这款配方不含任何酒精配料，适合不喝酒的人。" }
        : { question: `Does a ${c.name} contain alcohol?`, answer: "No — this recipe is mixed without any alcoholic ingredient." },
    );
  }

  if (n) {
    items.push(
      isZh
        ? {
            question: `${c.name} 有多少热量？`,
            answer: `按配方用量估算每杯约 ${n.calories} 千卡、糖 ${n.sugarG} 克，总量约 ${Math.round(n.volumeMl)} 毫升。这是根据配料表推算的参考值，不是实验室检测结果。`,
          }
        : {
            question: `How many calories are in a ${c.name}?`,
            answer: `About ${n.calories} kcal and ${n.sugarG} g of sugar per serving (roughly ${Math.round(n.volumeMl)} ml in the glass). It is estimated from the listed ingredient amounts — useful for comparison, not a lab measurement.`,
          },
    );
  }

  const method = METHOD_LABELS[c.method]?.[isZh ? "zh" : "en"] ?? c.method;
  const difficulty = DIFFICULTY_LABELS[c.difficulty]?.[isZh ? "zh" : "en"] ?? c.difficulty;
  items.push(
    isZh
      ? {
          question: `${c.name} 用什么杯型、怎么调？`,
          answer: `用 ${c.glass} 杯，${method}，难度 ${difficulty}，整套步骤大约 ${c.prepTime} 分钟。`,
        }
      : {
          question: `What glass and method does a ${c.name} use?`,
          answer: `A ${c.glass} glass, ${method}, rated ${difficulty}; the full build takes about ${c.prepTime} minutes.`,
        },
  );

  const firstSubstitution = Object.entries(c.substitutions ?? {}).find(([, options]) => options.length > 0);
  if (firstSubstitution) {
    const [missing, options] = firstSubstitution;
    const names = options.slice(0, 2).map((o) => o.name);
    const reason = options[0]?.reason?.trim();
    items.push(
      isZh
        ? {
            question: `没有 ${missing} 用什么代替？`,
            answer: `可以用 ${names.join(" 或 ")} 代替${reason ? `：${reason}` : "，比例保持不变"}。`,
          }
        : {
            question: `What can I use instead of ${missing}?`,
            answer: `${names.join(" or ")} work in its place${reason ? `: ${reason}` : " in the same amount"}.`,
          },
    );
  }

  return items;
}

/** Server-rendered FAQ block (visible text for users and crawlers). */
export function CocktailFaq({ items, heading }: { items: FaqItem[]; heading: string }) {
  if (items.length === 0) return null;
  return (
    <section className="container max-w-3xl pb-4" aria-labelledby="recipe-faq">
      <h2 id="recipe-faq" className="mb-4 font-display text-2xl font-bold text-brand-cream">
        {heading}
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.question} className="rounded-xl border border-border bg-card p-4">
            <summary className="cursor-pointer font-medium text-brand-cream">{item.question}</summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
