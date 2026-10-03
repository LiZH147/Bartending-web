"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function MobileNav() {
  const { t, locale } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const links = [
    { href: `/${locale}`, label: t("nav.home") },
    { href: `/${locale}/cabinet`, label: t("nav.cabinet") },
    { href: `/${locale}/favorites`, label: t("nav.favorites") },
    { href: `/${locale}/guide`, label: t("nav.guide") },
  ];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("nav.menu")}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <nav
          className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-xl"
          aria-label={t("nav.menu")}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm text-brand-cream transition-colors hover:bg-accent"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}