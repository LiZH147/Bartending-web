"use client";

import { useMemo, useState } from "react";
import { X, Search, Sparkles, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CATEGORY_LABELS, CATEGORIES, QUICK_INGREDIENT_IDS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useIngredients } from "@/lib/use-ingredients";
import { parseIngredientsText } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { IngredientSummary } from "@/lib/api";

interface IngredientPanelProps {
  selected: string[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddMany: (ids: string[]) => void;
  onSaveToCabinet?: () => void;
}

export function IngredientPanel({ selected, onToggle, onRemove, onClear, onAddMany, onSaveToCabinet }: IngredientPanelProps) {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";
  const { ingredients, loading, error, retry } = useIngredients();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [natural, setNatural] = useState("");
  const [parsing, setParsing] = useState(false);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const byId = useMemo(() => new Map(ingredients.map((i) => [i.id, i])), [ingredients]);

  const selectedItems = selected
    .map((id) => byId.get(id))
    .filter((x): x is IngredientSummary => Boolean(x));

  const quickIds = QUICK_INGREDIENT_IDS.filter((id) => byId.has(id));

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ingredients
      .filter(
        (i) =>
          i.nameEn.toLowerCase().includes(q) ||
          i.nameZh.toLowerCase().includes(q) ||
          i.aliases.some((a) => a.toLowerCase().includes(q)),
      )
      .slice(0, 24);
  }, [query, ingredients]);

  const categoryItems = useMemo(() => {
    if (category === "all") return [];
    return ingredients.filter((i) => i.category === category);
  }, [category, ingredients]);

  const name = (i: IngredientSummary) => (zh ? i.nameZh : i.nameEn);

  async function handleNatural() {
    const text = natural.trim();
    if (!text || parsing) return;
    setParsing(true);
    setUnmatched([]);
    try {
      const res = await parseIngredientsText(text, locale);
      onAddMany(res.ingredients);
      setUnmatched(res.unmatched);
      setNatural("");
    } catch {
      setUnmatched([]);
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Natural language input */}
      <div className="rounded-xl border border-border bg-card p-4">
        <label className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-cream">
          <Sparkles className="h-4 w-4 text-brand-amber" />
          {t("input.natural.label")}
        </label>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNatural();
          }}
          className="flex gap-2"
        >
          <Input
            value={natural}
            onChange={(e) => setNatural(e.target.value)}
            placeholder={t("input.natural.placeholder")}
            disabled={parsing}
          />
          <Button type="submit" disabled={parsing || !natural.trim()} className="shrink-0">
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t("actions.apply")}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">{t("input.natural.hint")}</p>
        {unmatched.length > 0 && (
          <p className="mt-2 text-xs text-brand-amber">
            {zh ? "未识别：" : "Unmatched:"} {unmatched.join(", ")}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("input.search.placeholder")}
          className="pl-9"
        />
        {query && searchResults.length > 0 && (
          <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-xl">
            {searchResults.map((i) => {
              const active = selected.includes(i.id);
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => {
                    onToggle(i.id);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-accent"
                >
                  <span className="text-lg">{i.emoji}</span>
                  <span className="flex-1 text-sm">{name(i)}</span>
                  <span className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[i.category as keyof typeof CATEGORY_LABELS]?.[zh ? "zh" : "en"] ?? i.category}
                  </span>
                  {active && <span className="h-2 w-2 rounded-full bg-brand-amber" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick ingredients */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-brand-cream">{t("input.quick.title")}</h4>
        <div className="flex flex-wrap gap-2">
          {quickIds.map((id) => {
            const i = byId.get(id);
            if (!i) return null;
            const active = selected.includes(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onToggle(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                    : "border-border bg-card text-foreground hover:border-brand-amber/40",
                )}
              >
                <span>{i.emoji}</span>
                {name(i)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category browse */}
      <div>
        <h4 className="mb-2 text-sm font-medium text-brand-cream">{t("input.browse.title")}</h4>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                category === c
                  ? "bg-brand-amber text-brand-burgundy"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              {c === "all"
                ? zh
                  ? "全部"
                  : "All"
                : CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS]?.[zh ? "zh" : "en"] ?? c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryItems.map((i) => {
            const active = selected.includes(i.id);
            return (
              <button
                key={i.id}
                type="button"
                onClick={() => onToggle(i.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                    : "border-border bg-card text-foreground hover:border-brand-amber/40",
                )}
              >
                <span>{i.emoji}</span>
                {name(i)}
                {active && <X className="h-3 w-3" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected chips */}
      <div className="rounded-xl border border-brand-amber/30 bg-brand-amber/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-medium text-brand-cream">{t("input.selected.title")}</h4>
          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              {onSaveToCabinet && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSaveToCabinet();
                    setSaved(true);
                    window.setTimeout(() => setSaved(false), 1600);
                  }}
                >
                  {saved ? t("input.selected.savedToCabinet") : t("input.selected.saveToCabinet")}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClear}>
                {t("actions.clear")}
              </Button>
            </div>
          )}
        </div>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("input.selected.empty")}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((i) => (
              <Badge key={i.id} variant="amber" className="gap-1.5 py-1.5 pl-2.5 pr-1.5 text-sm">
                <span>{i.emoji}</span>
                {name(i)}
                <button
                  type="button"
                  onClick={() => onRemove(i.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-black/20"
                  aria-label={t("actions.remove")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive-foreground">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={retry}>
            {t("error.retry")}
          </Button>
        </div>
      )}
      {loading && <p className="text-sm text-muted-foreground">{t("loading")}</p>}
    </div>
  );
}