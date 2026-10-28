import Link from "next/link";

/** Localized 404 inside the [lang] segment (so it still gets the site chrome). */
export default function NotFound() {
  return (
    <div className="container py-24 text-center">
      <p className="text-5xl">🍸</p>
      <h1 className="mt-4 font-display text-4xl font-bold text-brand-cream">404</h1>
      <p className="mt-3 text-sm text-muted-foreground" lang="en">
        The page or cocktail you asked for does not exist.
      </p>
      <p className="mt-1 text-sm text-muted-foreground" lang="zh-CN">
        你访问的页面或这款配方不存在。
      </p>
      <div className="mt-6 flex items-center justify-center gap-3">
        <Link
          href="/en/classics"
          className="rounded-full border border-brand-amber/40 bg-brand-amber/10 px-5 py-2.5 text-sm text-brand-amber transition-colors hover:bg-brand-amber/20"
        >
          All classics
        </Link>
        <Link
          href="/zh-CN/classics"
          className="rounded-full border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-brand-amber"
        >
          全部经典配方
        </Link>
      </div>
    </div>
  );
}
