"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, Martini, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useCabinet } from "@/lib/store";
import { IngredientPanel } from "@/components/ingredient-panel";
import { PreferenceControls } from "@/components/preferences";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Preferences } from "@/lib/schemas";

const DEFAULT_PREFS: Preferences = {
  flavor: [],
  strength: null,
  difficulty: null,
  maxPrepTime: null,
};

const LAST_SEARCH_KEY = "nightcap:last-search";

export function HomeClient() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const cabinet = useCabinet();

  const [selected, setSelected] = useState<string[]>([]);
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFS);
  const [missingLimit, setMissingLimit] = useState(1);
  const [showPrefs, setShowPrefs] = useState(false);
  const hydratedRef = useRef(false);

  // Restore the last search so navigating away (e.g. to a cocktail detail
  // page) and coming back keeps the user's selections.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_SEARCH_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved.ingredients)) setSelected(saved.ingredients);
        if (saved.preferences && typeof saved.preferences === "object") setPrefs(saved.preferences);
        if (typeof saved.missingLimit === "number") setMissingLimit(saved.missingLimit);
      }
    } catch {
      /* ignore */
    }
    hydratedRef.current = true;
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      window.localStorage.setItem(
        LAST_SEARCH_KEY,
        JSON.stringify({ ingredients: selected, preferences: prefs, missingLimit }),
      );
    } catch {
      /* ignore */
    }
  }, [selected, prefs, missingLimit]);

  const hasCabinet = cabinet.items.length > 0;

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const remove = (id: string) => setSelected((p) => p.filter((x) => x !== id));
  const addMany = (ids: string[]) => setSelected((p) => Array.from(new Set([...p, ...ids])));

  const prefsActive = useMemo(
    () =>
      prefs.flavor.length > 0 ||
      prefs.strength != null ||
      prefs.difficulty != null ||
      prefs.maxPrepTime != null ||
      missingLimit !== 1,
    [prefs, missingLimit],
  );

  function mix() {
    const params = new URLSearchParams();
    for (const id of selected) params.append("i", id);
    for (const f of prefs.flavor) params.append("flavor", f);
    if (prefs.strength) params.set("strength", prefs.strength);
    if (prefs.difficulty) params.set("difficulty", prefs.difficulty);
    if (prefs.maxPrepTime != null) params.set("maxPrep", String(prefs.maxPrepTime));
    params.set("missingLimit", String(missingLimit));
    router.push(`/${locale}/recommend?${params.toString()}`);
  }

  return (
    <div className="container pb-16">
      {/* Hero */}
      <section className="relative py-14 text-center sm:py-20">
        <div className="mx-auto max-w-3xl animate-fade-up">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-amber/30 bg-brand-amber/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-brand-amber">
            <Martini className="h-3.5 w-3.5" />
            {t("app.tagline")}
          </p>
          <h1 className="text-glow font-display text-4xl font-bold leading-[1.1] tracking-tight text-brand-cream sm:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("hero.subtitle")}
          </p>
        </div>
      </section>

      {/* Main input */}
      <section className="mx-auto max-w-3xl">
        <div className="space-y-6">
          {hasCabinet && (
            <button
              type="button"
              onClick={() => setSelected((p) => Array.from(new Set([...p, ...cabinet.items])))}
              className="inline-flex items-center gap-2 self-start rounded-full border border-brand-amber/40 bg-brand-amber/10 px-4 py-2 text-sm text-brand-amber transition-colors hover:bg-brand-amber/20"
            >
              <Sparkles className="h-4 w-4" />
              {t("cabinet.actions.search")}
            </button>
          )}

          <IngredientPanel
            selected={selected}
            onToggle={toggle}
            onRemove={remove}
            onClear={() => setSelected([])}
            onAddMany={addMany}
            onSaveToCabinet={() => selected.forEach((id) => cabinet.add(id))}
          />

          {/* Preferences */}
          <div className="rounded-xl border border-border bg-card/60">
            <button
              type="button"
              onClick={() => setShowPrefs((s) => !s)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-brand-cream">
                <SlidersHorizontal className="h-4 w-4 text-brand-amber" />
                {t("prefs.title")}
                <span className="text-xs font-normal text-muted-foreground">
                  ({t("prefs.optional")})
                </span>
              </span>
              <span
                className={cn(
                  "flex h-2 w-2 rounded-full",
                  prefsActive ? "bg-brand-amber" : "bg-muted-foreground/40",
                )}
              />
            </button>
            {showPrefs && (
              <div className="border-t border-border/70 px-4 py-4">
                <PreferenceControls
                  value={prefs}
                  missingLimit={missingLimit}
                  onChange={setPrefs}
                  onMissingLimitChange={setMissingLimit}
                />
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="pt-2">
            <Button
              size="xl"
              variant="default"
              className="w-full font-display text-lg tracking-[0.15em]"
              onClick={mix}
              disabled={selected.length === 0}
            >
              <Martini className="h-5 w-5" />
              {t("actions.mix")}
            </Button>
            {selected.length === 0 && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t("input.selected.empty")}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}