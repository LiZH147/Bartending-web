"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function Footer() {
  const { t, locale } = useI18n();
  return (
    <footer className="border-t border-border/70 py-8">
      <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
        <span className="font-display tracking-[0.2em] text-brand-cream/70">NIGHTCAP</span>
        {/* Site-wide links to the index pages keep the site flat: every recipe is
            two clicks from the home page (avoid "inner pages buried too deep"). */}
        <nav aria-label={t("nav.menu")} className="flex items-center gap-4">
          <Link href={`/${locale}/classics`} className="transition-colors hover:text-brand-amber">
            {t("nav.classics")}
          </Link>
          <Link href={`/${locale}/guide`} className="transition-colors hover:text-brand-amber">
            {t("nav.guide")}
          </Link>
        </nav>
        <span>{t("footer.note")}</span>
      </div>
    </footer>
  );
}
