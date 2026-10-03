"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  DIFFICULTIES,
  DIFFICULTY_LABELS,
  FLAVORS,
  FLAVOR_LABELS,
  STRENGTHS,
  STRENGTH_LABELS,
  type Difficulty,
  type Flavor,
  type Strength,
} from "@/lib/constants";
import type { Preferences } from "@/lib/schemas";
import { cn } from "@/lib/utils";

interface PreferenceControlsProps {
  value: Preferences;
  missingLimit: number;
  onChange: (p: Preferences) => void;
  onMissingLimitChange: (n: number) => void;
}

export function PreferenceControls({
  value,
  missingLimit,
  onChange,
  onMissingLimitChange,
}: PreferenceControlsProps) {
  const { t, locale } = useI18n();
  const zh = locale === "zh-CN";

  const toggleFlavor = (f: Flavor) => {
    const has = value.flavor.includes(f);
    const flavor = has ? value.flavor.filter((x) => x !== f) : [...value.flavor, f];
    onChange({ ...value, flavor });
  };

  const strengthOptions: (Strength | null)[] = [null, ...STRENGTHS];
  const difficultyOptions: (Difficulty | null)[] = [null, ...DIFFICULTIES];
  const timeOptions: (number | null)[] = [null, 5, 10, 15, 30];
  const missingOptions = [0, 1, 2, 3];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium text-brand-cream">{t("prefs.flavor")}</p>
        <div className="flex flex-wrap gap-1.5">
          {FLAVORS.map((f) => {
            const active = value.flavor.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFlavor(f)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  active
                    ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {FLAVOR_LABELS[f][zh ? "zh" : "en"]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-sm font-medium text-brand-cream">{t("prefs.strength")}</p>
          <div className="flex flex-wrap gap-1.5">
            {strengthOptions.map((s) => {
              const active = value.strength === s;
              const label = s === null ? t("prefs.strength.any") : STRENGTH_LABELS[s][zh ? "zh" : "en"];
              return (
                <button
                  key={s ?? "any"}
                  type="button"
                  onClick={() => onChange({ ...value, strength: s })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-cream">{t("prefs.difficulty")}</p>
          <div className="flex flex-wrap gap-1.5">
            {difficultyOptions.map((d) => {
              const active = value.difficulty === d;
              const label = d === null ? t("prefs.difficulty.any") : DIFFICULTY_LABELS[d][zh ? "zh" : "en"];
              return (
                <button
                  key={d ?? "any"}
                  type="button"
                  onClick={() => onChange({ ...value, difficulty: d })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-cream">{t("prefs.time")}</p>
          <div className="flex flex-wrap gap-1.5">
            {timeOptions.map((m) => {
              const active = value.maxPrepTime === m;
              const label = m === null ? t("prefs.time.any") : t("prefs.time.minutes", { m });
              return (
                <button
                  key={m ?? "any"}
                  type="button"
                  onClick={() => onChange({ ...value, maxPrepTime: m })}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-brand-cream">{t("prefs.missing")}</p>
          <div className="flex flex-wrap gap-1.5">
            {missingOptions.map((n) => {
              const active = missingLimit === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onMissingLimitChange(n)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-brand-amber bg-brand-amber/15 text-brand-amber"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}