"use client";

import Link from "next/link";
import { Heart, Clock, Gauge } from "lucide-react";
import type { CocktailResult } from "@/lib/schemas";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DIFFICULTY_LABELS, FLAVOR_LABELS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { CocktailImage } from "./cocktail-image";
import { cn } from "@/lib/utils";

interface CocktailCardProps {
  cocktail: CocktailResult;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  index?: number;
  ownedIds?: string[];
}

export function CocktailCard({ cocktail: c, isFavorite, onToggleFavorite, index = 0, ownedIds }: CocktailCardProps) {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";

  const qs =
    ownedIds && ownedIds.length > 0
      ? "?i=" + ownedIds.map((id) => encodeURIComponent(id)).join("&i=")
      : "";

  return (
    <Link
      href={`/cocktail/${c.id}${qs}`}
      className={cn(
        "group card-hover relative flex flex-col overflow-hidden rounded-xl border border-border bg-card animate-fade-up",
        index > 0 && `animation-delay-${Math.min(index, 6) * 100}`,
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      <div className="relative aspect-[4/3] w-full">
        <CocktailImage
          src={c.imageUrl}
          alt={c.name}
          seed={c.nameEn}
          emoji={c.ingredients[0]?.emoji ?? "🍸"}
          className="absolute inset-0"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {c.source === "ai" ? (
            <Badge variant="burgundy">{t("badge.ai")}</Badge>
          ) : (
            <Badge variant="amber">{t("badge.classic")}</Badge>
          )}
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            aria-label="favorite"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(c.id);
            }}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/45 backdrop-blur transition-colors hover:bg-black/65"
          >
            <Heart
              className={cn("h-4.5 w-4.5", isFavorite ? "fill-brand-amber text-brand-amber" : "text-white")}
            />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-tight text-brand-cream">
            {c.name}
          </h3>
          <span className="shrink-0 text-sm font-semibold text-brand-amber">{c.matchPercent}%</span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>

        <div className="mt-auto flex flex-wrap gap-1.5">
          {c.flavors.slice(0, 3).map((f) => (
            <Badge key={f} variant="muted" className="capitalize">
              {FLAVOR_LABELS[f]?.[zh ? "zh" : "en"] ?? f}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border/70 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5" />
            {DIFFICULTY_LABELS[c.difficulty][zh ? "zh" : "en"]}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {c.prepTime} {t("card.prep")}
          </span>
          {c.missingCount > 0 ? (
            <span className="font-medium text-brand-amber">
              {c.missingCount === 1 ? t("card.missing.one") : t("card.missing.many", { n: c.missingCount })}
            </span>
          ) : (
            <span className="font-medium text-emerald-400">{t("card.ready")}</span>
          )}
        </div>
      </div>
    </Link>
  );
}