"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { fetchCocktailDetail } from "@/lib/api";
import { useFavorites } from "@/lib/store";
import { CocktailCard } from "@/components/cocktail-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { CocktailResult } from "@/lib/schemas";

export default function FavoritesPage() {
  const { t, locale } = useI18n();
  const favorites = useFavorites();
  const [items, setItems] = useState<CocktailResult[]>([]);
  const [loading, setLoading] = useState(true);

  const idsKey = favorites.items.join(",");

  useEffect(() => {
    let active = true;
    setLoading(true);
    const ids = favorites.items;
    if (ids.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    Promise.allSettled(ids.map((id) => fetchCocktailDetail(id, favorites.items, locale)))
      .then((results) => {
        if (!active) return;
        const loaded = results
          .filter((r): r is PromiseFulfilledResult<CocktailResult> => r.status === "fulfilled")
          .map((r) => r.value);
        setItems(loaded);
        setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, locale]);

  return (
    <div className="container pb-16 pt-10">
      <header className="mb-8">
        <h1 className="flex items-center gap-2.5 font-display text-3xl font-bold text-brand-cream sm:text-4xl">
          <Heart className="h-7 w-7 fill-brand-amber text-brand-amber" />
          {t("favorites.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("favorites.subtitle")}</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="mb-2 text-3xl">🤍</p>
          <p className="mb-1 font-display text-lg font-semibold text-brand-cream">
            {t("favorites.empty.title")}
          </p>
          <p className="mb-4 text-sm text-muted-foreground">{t("favorites.empty.subtitle")}</p>
          <Link href={`/${locale}`}>
            <Button variant="outline">{t("nav.home")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <CocktailCard
              key={c.id}
              cocktail={c}
              index={i}
              isFavorite
              onToggleFavorite={(id) => favorites.toggle(id)}
              ownedIds={favorites.items}
            />
          ))}
        </div>
      )}
    </div>
  );
}