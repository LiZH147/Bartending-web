"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const options = [
    { code: "en" as const, label: "EN" },
    { code: "zh-CN" as const, label: "中文" },
  ];

  return (
    <div
      className="flex items-center rounded-full border border-border bg-secondary/60 p-0.5 text-xs"
      role="group"
      aria-label="Language"
    >
      {options.map((o) => (
        <button
          key={o.code}
          type="button"
          onClick={() => setLocale(o.code)}
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