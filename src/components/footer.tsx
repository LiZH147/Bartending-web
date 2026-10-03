"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border/70 py-8">
      <div className="container flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
        <span className="font-display tracking-[0.2em] text-brand-cream/70">NIGHTCAP</span>
        <span>{t("footer.note")}</span>
      </div>
    </footer>
  );
}