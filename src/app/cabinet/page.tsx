"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Martini, Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCabinet } from "@/lib/store";
import { useIngredients } from "@/lib/use-ingredients";
import { CATEGORY_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CabinetPage() {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";
  const router = useRouter();
  const cabinet = useCabinet();
  const { ingredients, loading } = useIngredients();

  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const items = cabinet.items
    .map((id) => byId.get(id))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  function mix() {
    const params = new URLSearchParams();
    for (const id of cabinet.items) params.append("i", id);
    router.push(`/recommend?${params.toString()}`);
  }

  return (
    <div className="container pb-16 pt-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-bold text-brand-cream sm:text-4xl">
          {t("cabinet.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("cabinet.subtitle")}</p>
      </header>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button onClick={mix} disabled={cabinet.items.length === 0}>
          <Martini className="h-4 w-4" />
          {t("cabinet.actions.search")}
        </Button>
        <Link href="/">
          <Button variant="outline">
            <Plus className="h-4 w-4" />
            {t("cabinet.actions.addShortcut")}
          </Button>
        </Link>
        <span className="ml-auto text-sm text-muted-foreground">
          {t("cabinet.count", { count: cabinet.items.length })}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="mb-2 text-3xl">🛒</p>
          <p className="mb-1 font-display text-lg font-semibold text-brand-cream">
            {t("cabinet.empty.title")}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">{t("cabinet.empty.subtitle")}</p>
          <Link href="/">
            <Button variant="outline">{t("cabinet.actions.addShortcut")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((i) => (
            <div
              key={i.id}
              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-brand-amber/40"
            >
              <span className="text-2xl">{i.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-brand-cream">
                  {zh ? i.nameZh : i.nameEn}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {CATEGORY_LABELS[i.category as keyof typeof CATEGORY_LABELS]?.[zh ? "zh" : "en"] ?? i.category}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cabinet.remove(i.id)}
                className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/15 hover:text-destructive group-hover:opacity-100"
                aria-label={t("cabinet.actions.remove")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}