import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="text-5xl">🍸</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-brand-cream">404</h1>
      <p className="mt-3 text-sm text-muted-foreground">Cocktail not found.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-full border border-brand-amber/40 bg-brand-amber/10 px-5 py-2.5 text-sm text-brand-amber transition-colors hover:bg-brand-amber/20"
      >
        ← Back home
      </Link>
    </div>
  );
}