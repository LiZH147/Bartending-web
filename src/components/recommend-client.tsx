"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { requestCreative, requestRecommend } from "@/lib/api";
import { loadCreativeCache, saveCreativeCache } from "@/lib/creative-cache";
import { useFavorites } from "@/lib/store";
import { CocktailCard } from "@/components/cocktail-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CocktailResult, Enrichment, Preferences, RecommendResponse } from "@/lib/schemas";

export interface RecommendInputs {
  ingredientIds: string[];
  preferences: Preferences;
  missingLimit: number;
}

export function RecommendClient({ inputs }: { inputs: RecommendInputs }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const favorites = useFavorites();

  const [data, setData] = useState<RecommendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extraCreative, setExtraCreative] = useState<CocktailResult[]>([]);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [cachedCreative, setCachedCreative] = useState<CocktailResult[]>([]);

  const key = useMemo(
    () => JSON.stringify([inputs.ingredientIds, inputs.preferences, inputs.missingLimit, locale]),
    [inputs, locale],
  );

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setExtraCreative([]);
    setDone(false);

    // Local cache: show the previous AI creations instantly and skip the slow
    // regeneration on a repeat search for the same ingredients.
    const cached = loadCreativeCache(inputs.ingredientIds, inputs.missingLimit, locale);
    setCachedCreative(cached ?? []);

    requestRecommend(
      {
        ingredients: inputs.ingredientIds,
        preferences: inputs.preferences,
        missingIngredientLimit: inputs.missingLimit,
        language: locale,
        skipCreative: Boolean(cached && cached.length > 0),
      },
      (event) => {
        if (!active) return;
        switch (event.type) {
          case "result":
            if (event.result) {
              setData(event.result);
              setLoading(false);
            }
            break;
          case "enrich":
            setData((prev) =>
              prev
                ? applyEnrichment(prev, {
                    substitutions: event.substitutions ?? {},
                    explanations: event.explanations ?? {},
                  })
                : prev,
            );
            break;
          case "creative":
            saveCreativeCache(inputs.ingredientIds, inputs.missingLimit, locale, event.creative ?? []);
            setCachedCreative([]);
            setData((prev) => (prev ? { ...prev, creative: event.creative ?? [] } : prev));
            break;
          case "error":
            if (event.error) setError(event.error);
            setLoading(false);
            break;
          case "done":
            setDone(true);
            setLoading(false);
            break;
        }
      },
      controller.signal,
    ).catch((e) => {
      if (active) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const creative = useMemo(() => {
    const seen = new Set<string>();
    const out: CocktailResult[] = [];
    for (const list of [data?.creative ?? [], cachedCreative, extraCreative]) {
      for (const c of list) {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          out.push(c);
        }
      }
    }
    return out;
  }, [data?.creative, cachedCreative, extraCreative]);

  const creativePending = data !== null && creative.length === 0 && !done && !error;

  const handleInvent = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const missingPool = (data?.almost ?? []).flatMap((c) => c.missing.map((m) => m.id));
      const res = await requestCreative({
        ingredients: inputs.ingredientIds,
        missing: missingPool.slice(0, 4),
        count: 2,
        language: locale,
      });
      setExtraCreative((prev) => {
        const seen = new Set([...prev, ...(data?.creative ?? [])].map((c) => c.id));
        return [...prev, ...res.filter((c) => !seen.has(c.id))];
      });
    } finally {
      setGenerating(false);
    }
  }, [generating, data, inputs.ingredientIds, locale]);

  return (
    <div className="container pb-16 pt-8">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("actions.newSearch")}
        </button>
        <Button variant="outline" size="sm" onClick={handleInvent} disabled={generating}>
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-brand-amber" />
          )}
          {t("actions.invent")}
        </Button>
      </div>

      {loading && (
        <div className="space-y-6">
          <Skeleton className="h-10 w-72 max-w-full" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="mx-auto max-w-md rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="mb-1 text-sm font-medium">{t("error.title")}</p>
          <p className="mb-4 text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push("/")}>
            {t("actions.newSearch")}
          </Button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <Header data={data} />

          {/* Available */}
          <Section
            title={t("section.available")}
            summary={t("summary.available", { count: data.available.length })}
            accent="amber"
          >
            <Grid
              items={data.available}
              favorites={favorites.items}
              onToggleFavorite={favorites.toggle}
              ownedIds={inputs.ingredientIds}
              empty={t("section.available.empty")}
            />
          </Section>

          {/* Almost */}
          <Section
            title={t("section.almost")}
            summary={t("summary.almost", { count: data.almost.length })}
            accent="burgundy"
          >
            <Grid
              items={data.almost}
              favorites={favorites.items}
              onToggleFavorite={favorites.toggle}
              ownedIds={inputs.ingredientIds}
              empty={t("section.almost.empty")}
            />
          </Section>

          {/* Creative */}
          {(creative.length > 0 || creativePending || generating) && (
            <Section
              title={t("section.creative")}
              summary={creative.length > 0 ? t("summary.creative", { count: creative.length }) : ""}
              accent="amber"
              note={t("creative.note")}
            >
              {creative.length > 0 ? (
                <Grid
                  items={creative}
                  favorites={favorites.items}
                  onToggleFavorite={favorites.toggle}
                  ownedIds={inputs.ingredientIds}
                  empty={t("section.creative.empty")}
                />
              ) : (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/40 p-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-amber" />
                  {t("creative.generating")}
                </div>
              )}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function applyEnrichment(data: RecommendResponse, enrichment: Enrichment): RecommendResponse {
  const patch = (r: CocktailResult): CocktailResult => {
    const subs = { ...(r.substitutions ?? {}) };
    const delta = enrichment.substitutions[r.id];
    if (delta) {
      for (const [missingId, aiSubs] of Object.entries(delta)) {
        const existing = subs[missingId] ?? [];
        const seen = new Set(existing.map((s) => s.id));
        const next = [...existing];
        for (const s of aiSubs) {
          if (!seen.has(s.id)) {
            seen.add(s.id);
            next.push(s);
          }
        }
        subs[missingId] = next.slice(0, 4);
      }
    }
    return { ...r, substitutions: subs, explanation: enrichment.explanations[r.id] ?? r.explanation };
  };

  return {
    ...data,
    available: data.available.map(patch),
    almost: data.almost.map(patch),
  };
}

function Header({ data }: { data: RecommendResponse }) {
  const { t } = useI18n();
  const available = data.available.length;

  let title: string;
  if (available === 0) title = t("count.title.zero");
  else if (available === 1) title = t("count.title.singular", { count: available });
  else title = t("count.title", { count: available });

  return (
    <div className="mb-8 animate-fade-up">
      <h1 className="font-display text-3xl font-bold text-brand-cream sm:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("summary.available", { count: data.available.length })} ·{" "}
        {t("summary.almost", { count: data.almost.length })}
        {data.creative.length > 0 ? ` · ${t("summary.creative", { count: data.creative.length })}` : ""}
      </p>
    </div>
  );
}

function Section({
  title,
  summary,
  accent,
  note,
  children,
}: {
  title: string;
  summary: string;
  accent: "amber" | "burgundy";
  note?: string;
  children: React.ReactNode;
}) {
  const dot = accent === "amber" ? "bg-brand-amber" : "bg-brand-burgundy";
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <h2 className="font-display text-xl font-semibold text-brand-cream sm:text-2xl">{title}</h2>
      </div>
      <p className="mb-4 -mt-2 text-xs uppercase tracking-wider text-muted-foreground">{summary}</p>
      {note && (
        <p className="mb-4 text-xs text-muted-foreground">
          <Sparkles className="mr-1 inline h-3 w-3 text-brand-amber" />
          {note}
        </p>
      )}
      {children}
    </section>
  );
}

function Grid({
  items,
  favorites,
  onToggleFavorite,
  ownedIds,
  empty,
}: {
  items: CocktailResult[];
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  ownedIds: string[];
  empty: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c, i) => (
        <CocktailCard
          key={c.id}
          cocktail={c}
          index={i}
          isFavorite={favorites.includes(c.id)}
          onToggleFavorite={onToggleFavorite}
          ownedIds={ownedIds}
        />
      ))}
    </div>
  );
}