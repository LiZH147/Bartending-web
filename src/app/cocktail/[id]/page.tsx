import { CocktailDetailClient } from "@/components/cocktail-detail";

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default async function CocktailDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const ownedIds = asArray(sp.i);
  return <CocktailDetailClient id={decodeURIComponent(id)} ownedIds={ownedIds} />;
}