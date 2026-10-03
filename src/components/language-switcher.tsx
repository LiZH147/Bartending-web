"use client";

import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { localizePathname } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const options = [
    { code: "en" as const, label: "EN" },
    { code: "zh-CN" as const, label: "中文" },
  ];

  function switchTo(next: Locale) {
    if (next === locale) return;
    setLocale(next);
    const search = typeof window !== "undefined" ? window.location.search : "";
    router.replace(localizePathname(pathname, next) + search);
  }

  return (
    <div
      className="flex items-center rounded-full border border-border bg-secondary/60 p-0.5 text-xs"
      role="group"
      aria-label={t("language.label")}
    >
      {options.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => switchTo(o.code)}
          className={cn(
            "rounded-full px-3 py-1 font-medium transition-colors",
            locale === o.code
              ? "bg-brand-amber text-brand-burgundy"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={locale === o.code}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}