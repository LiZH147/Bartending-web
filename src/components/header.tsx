"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Martini } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LanguageSwitcher } from "./language-switcher";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useI18n();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/cabinet", label: t("nav.cabinet") },
    { href: "/favorites", label: t("nav.favorites") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-amber/15 text-brand-amber ring-1 ring-brand-amber/30">
            <Martini className="h-5 w-5" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-[0.18em] text-brand-cream">
              {t("app.name")}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {t("app.tagline")}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-3.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-brand-amber/10 text-brand-amber"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}