import Link from "next/link";
import { CocktailImage } from "./cocktail-image";

export interface CocktailLink {
  id: string;
  name: string;
  imageUrl: string | null;
  emoji: string;
}

/** Server-rendered grid of cocktail links (used for "related" and "popular" sections). */
export function CocktailGrid({
  lang,
  title,
  items,
}: {
  lang: string;
  title: string;
  items: CocktailLink[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="container pb-16 pt-2">
      {title && (
        <h2 className="mb-5 font-display text-2xl font-bold text-brand-cream">{title}</h2>
      )}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((c) => (
          <Link
            key={c.id}
            href={`/${lang}/cocktail/${c.id}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-brand-amber/40"
          >
            <div className="relative aspect-[4/3] w-full">
              <CocktailImage
                src={c.imageUrl}
                alt={c.name}
                seed={c.name}
                emoji={c.emoji}
                className="absolute inset-0"
              />
            </div>
            <div className="flex items-center gap-2 p-3">
              <p className="truncate font-display text-sm font-semibold text-brand-cream">{c.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}