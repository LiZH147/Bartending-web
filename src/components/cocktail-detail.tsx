"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Gauge, Heart, Check, Copy, AlertTriangle, FlaskConical } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { enrichCocktailDetail, fetchCocktailDetail } from "@/lib/api";
import { useCabinet, useFavorites } from "@/lib/store";
import { CocktailImage } from "@/components/cocktail-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DIFFICULTY_LABELS, FLAVOR_LABELS, METHOD_LABELS, STRENGTH_LABELS } from "@/lib/constants";
import type { CocktailResult } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function CocktailDetailClient({
  id,
  ownedIds = [],
  initial = null,
}: {
  id: string;
  ownedIds?: string[];
  initial?: CocktailResult | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const zh = locale === "zh-CN";
  const cabinet = useCabinet();
  const favorites = useFavorites();

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.back();
    else router.push(`/${locale}`);
  };

  const [cocktail, setCocktail] = useState<CocktailResult | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const cabinetKey = cabinet.items.join(",");
  const ownedIdsKey = ownedIds.join(",");

  // The "you own it" context is the union of the persistent cabinet and the
  // ingredient selection that produced the surrounding recommendation, so the
  // detail view stays consistent with the results page's match/owned badges.
  const owned = useMemo(
    () => Array.from(new Set([...cabinet.items, ...ownedIds])),
    [cabinetKey, ownedIdsKey],
  );

  useEffect(() => {
    let active = true;
    setError(null);
    setNotFound(false);
    fetchCocktailDetail(id, owned, locale)
      .then((c) => {
        if (active) setCocktail(c);
      })
      .catch((e) => {
        if (active) {
          if (e instanceof Error && e.message.includes("404")) setNotFound(true);
          else setError(e instanceof Error ? e.message : String(e));
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, cabinetKey, ownedIdsKey, locale]);

  // Out-of-band LLM enrichment (AI substitutions + explanation) for classics so
  // the page renders instantly with deterministic data and fills in the AI text
  // when the slow reasoning model finishes.
  useEffect(() => {
    if (!cocktail || cocktail.source !== "classic") return;
    let active = true;
    enrichCocktailDetail(cocktail.id, owned, locale)
      .then((e) => {
        if (active && e.enabled) {
          setCocktail((prev) =>
            prev
              ? {
                  ...prev,
                  substitutions: e.substitutions ?? prev.substitutions,
                  explanation: e.explanation || prev.explanation,
                }
              : prev,
          );
        }
      })
      .catch(() => {
        /* keep deterministic substitution/explanation */
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cocktail?.id, cabinetKey, ownedIdsKey, locale]);

  // Show a skeleton only while there is no content for the *requested* id (e.g.
  // client-side navigation to a different cocktail). With server-seeded `initial`
  // data the page renders fully on first paint instead of flashing a skeleton.
  if (!cocktail || cocktail.id !== id) {
    if (notFound) {
      return (
        <div className="container py-16">
          <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
            <p className="mb-4 text-4xl">🍸</p>
            <h1 className="font-display text-2xl font-semibold text-brand-cream">404</h1>
            <p className="mb-6 text-sm text-muted-foreground">Cocktail not found</p>
            <Button variant="outline" onClick={goBack}>{t("actions.back")}</Button>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="container py-16">
          <div className="mx-auto max-w-md rounded-xl border border-destructive/40 bg-destructive/10 p-8 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <p className="mb-1 font-medium">{t("error.title")}</p>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={goBack}>{t("actions.back")}</Button>
          </div>
        </div>
      );
    }

    return <DetailSkeleton />;
  }

  const c = cocktail;
  const isFavorite = favorites.items.includes(c.id);

  const copyRecipe = async () => {
    const text = [
      c.name,
      "",
      ...c.ingredients.map((ing) => (ing.amount ? `${ing.amount} ${ing.name}` : ing.name)),
      "",
      ...c.steps.map((step, i) => `${i + 1}. ${step}`),
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="container pb-16 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("cocktail.back")}
        </button>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={copyRecipe} aria-label={t("actions.copy")}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t("actions.copied") : t("actions.copy")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => favorites.toggle(c.id)}
            className={cn(isFavorite && "text-brand-amber")}
            aria-pressed={isFavorite}
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-brand-amber text-brand-amber")} />
            {isFavorite ? t("favorites.actions.remove") : t("favorites.actions.add")}
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Image */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-border">
            <CocktailImage
              src={c.imageUrl}
              alt={c.name}
              seed={c.nameEn}
              emoji={c.ingredients[0]?.emoji ?? "🍸"}
              className="aspect-[4/5] w-full"
              priority
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.source === "ai" ? (
              <Badge variant="burgundy">
                <FlaskConical className="mr-1 h-3.5 w-3.5" />
                {t("badge.ai")}
              </Badge>
            ) : (
              <Badge variant="amber">{t("badge.classic")}</Badge>
            )}
            <Badge variant="success" className="font-semibold">
              {t("cocktail.match", { pct: c.matchPercent })}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <header className="animate-fade-up">
            <h1 className="text-glow font-display text-4xl font-bold text-brand-cream sm:text-5xl">
              {c.name}
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">{c.description}</p>
            {c.explanation && (
              <p className="mt-3 inline-block rounded-lg bg-brand-amber/10 px-3 py-1.5 text-sm text-brand-amber">
                {c.explanation}
              </p>
            )}
          </header>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <MetaItem icon={<FlaskConical className="h-4 w-4" />} label={t("cocktail.glass")} value={c.glass} />
            <MetaItem icon={<Gauge className="h-4 w-4" />} label={t("cocktail.difficulty")} value={DIFFICULTY_LABELS[c.difficulty][zh ? "zh" : "en"]} />
            <MetaItem icon={<Clock className="h-4 w-4" />} label={t("cocktail.prepTime")} value={`${c.prepTime} ${t("cocktail.minutes")}`} />
            <MetaItem label={t("cocktail.strength")} value={STRENGTH_LABELS[c.strength][zh ? "zh" : "en"]} />
            <MetaItem label={t("cocktail.method")} value={METHOD_LABELS[c.method][zh ? "zh" : "en"]} />
            <div className="rounded-lg border border-border bg-card p-3">
              <p className="mb-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("cocktail.flavors")}
              </p>
              <div className="flex flex-wrap gap-1">
                {c.flavors.map((f) => (
                  <Badge key={f} variant="muted" className="capitalize">
                    {FLAVOR_LABELS[f]?.[zh ? "zh" : "en"] ?? f}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-brand-cream">
              {t("cocktail.ingredients")}
            </h2>
            <ul className="space-y-2 rounded-xl border border-border bg-card p-4">
              {c.ingredients.map((ing) => (
                <li key={ing.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span>{ing.emoji}</span>
                    <span className={cn(!ing.have && "text-muted-foreground")}>{ing.name}</span>
                    {ing.optional && (
                      <span className="text-xs text-muted-foreground">({t("cocktail.ingredients.optional")})</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{ing.amount}</span>
                    {ing.have ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] text-emerald-300">
                        <Check className="h-3 w-3" /> {t("cocktail.ingredients.owned")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-brand-amber/15 px-2 py-0.5 text-[11px] text-brand-amber">
                        {t("cocktail.missing.badge")}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Missing */}
          {c.missing.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-xl font-semibold text-brand-cream">
                {t("cocktail.missing.title")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {c.missing.map((m) => (
                  <Badge key={m.id} variant="amber" className="gap-1 py-1.5 pl-2 text-sm">
                    <span>{m.emoji}</span>
                    {m.name}
                    {m.amount ? <span className="text-xs opacity-80">· {m.amount}</span> : null}
                  </Badge>
                ))}
              </div>
            </section>
          )}

          {/* Substitutions */}
          {c.substitutions && Object.keys(c.substitutions).length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-xl font-semibold text-brand-cream">
                {t("cocktail.substitutes.title")}
              </h2>
              <p className="mb-3 text-xs text-muted-foreground">{t("cocktail.substitutes.note")}</p>
              <div className="space-y-3">
                {Object.entries(c.substitutions).map(([missingId, subs]) => (
                  <div key={missingId} className="rounded-lg border border-border bg-card p-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      {t("cocktail.missing.label", { n: 1 })}:{" "}
                      <span className="text-foreground">
                        {c.missing.find((m) => m.id === missingId)?.name ?? missingId}
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subs.map((s) => (
                        <Badge
                          key={s.id}
                          variant={s.availability === "owned" ? "success" : "outline"}
                          className="gap-1 py-1 text-xs"
                        >
                          {s.name}
                          <span className="opacity-80">
                            {s.availability === "owned" ? `· ${t("cocktail.substitutes.owned")}` : `· ${t("cocktail.substitutes.buy")}`}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Steps */}
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold text-brand-cream">{t("cocktail.steps")}</h2>
            <ol className="space-y-3">
              {c.steps.map((step, i) => (
                <li key={i} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-amber/15 font-display text-sm font-semibold text-brand-amber">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-relaxed text-foreground/90">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-brand-cream">{value}</p>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="container pb-16 pt-6">
      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}