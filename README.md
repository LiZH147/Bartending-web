# NIGHTCAP — AI Cocktail Recommendation

> “Given the ingredients I currently have, what cocktails can I make?”
> 「根据我现在手头已有的材料，我可以调什么酒？」

A bilingual (English / 简体中文) web app that answers that question using a
**structured cocktail database + deterministic matching engine** first, and an
**LLM** only for natural-language parsing, substitution, explanation, and
creative generation — never as the source of truth for classic recipes.

---

## Features

- **Ingredient input** — search, browse by category, popular shortcuts, and a
  natural-language parser (“I have gin, tonic, two lemons and simple syrup.”).
- **Deterministic matching** — `ingredient_match = available_required / required`,
  then a configurable weighted score:
  `0.40·ingredient + 0.20·preference + 0.15·difficulty + 0.15·popularity + 0.10·novelty`.
- **Three result sections** — *You can make now* / *Almost there* / *AI creations*.
- **Cocktail detail pages** — amounts, glass, method, steps, difficulty, strength,
  flavor profile, your inventory match, missing ingredients, and **substitutions**
  (clearly separated from canonical recipe ingredients).
- **Bilingual UI** with a global `中文 | EN` switcher, persistence via
  `localStorage` (cookie set for future SSR), and browser-language auto-detection.
- **Classic vs AI labeling** — classics are labeled *Classic/经典*, AI outputs
  *AI Creation/AI 创意*. An AI recipe is never presented as canonical.
- **Cabinet & Favorites** — persist your home bar and saved cocktails.
- **Works fully offline/secrets-free** — every AI feature has a deterministic
  fallback; the app runs immediately without any API key.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router) + React + TypeScript |
| UI | Tailwind CSS + shadcn/ui-style primitives |
| i18n | Lightweight typed dictionary layer (`/locales/en`, `/locales/zh-CN`) |
| Backend | Next.js Route Handlers |
| Database | **SQLite by default** (zero-config) + PostgreSQL schema for Vercel/production |
| ORM | Prisma |
| Validation | Zod (requests, responses, and AI output) |
| AI | OpenAI (`OPENAI_API_KEY`), structured JSON output + schema validation |

---

## Getting started

Requirements: **Node.js ≥ 18.18** and **pnpm**.

```bash
# 1. install dependencies (also generates the Prisma client)
pnpm install

# 2. create the database and seed classic cocktails
pnpm run db:push
pnpm run db:seed
#    (or: pnpm run setup)

# 3. start the dev server
pnpm run dev
```

Open http://localhost:3000.

Production:

```bash
pnpm run build
pnpm run start
```

### Optional: enable the LLM

Copy `.env.example` to `.env` (already present for local dev) and set:

```dotenv
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4o-mini"
# OPENAI_BASE_URL="https://api.openai.com/v1"   # optional custom / OpenAI-compatible endpoint
```

Without a key the app still works — parsing, substitution, explanations and
creative generation use deterministic fallbacks. The key is only read
server-side and never exposed to the browser.

---

## Environment variables

See [`.env.example`](./.env.example):

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `file:./dev.db` | SQLite (or PostgreSQL) connection string |
| `DATABASE_PROVIDER` | auto (from URL) | Force `sqlite` or `postgresql`; selects the Prisma schema |
| `OPENAI_API_KEY` | `""` | Enables LLM features; empty = deterministic fallbacks |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model used for structured LLM calls |
| `OPENAI_BASE_URL` | — | Optional OpenAI-compatible base URL |
| `SCORE_WEIGHT_INGREDIENT` | `0.40` | Configurable scoring weights (normalized to sum 1) |
| `SCORE_WEIGHT_PREFERENCE` | `0.20` | |
| `SCORE_WEIGHT_DIFFICULTY` | `0.15` | |
| `SCORE_WEIGHT_POPULARITY` | `0.15` | |
| `SCORE_WEIGHT_NOVELTY` | `0.10` | |
| `CREATIVE_MIN_RESULTS` | `3` | Minimum classic results before AI creative kicks in |

### PostgreSQL

A second schema ships alongside the SQLite default:

- `prisma/schema.prisma` → SQLite (local dev)
- `prisma/schema.postgresql.prisma` → PostgreSQL (production / Vercel)

The [`scripts/db.mjs`](./scripts/db.mjs) wrapper selects the correct schema from
`DATABASE_PROVIDER` (or from the `postgres://` scheme of `DATABASE_URL`), so you
don't hand-edit files:

```bash
DATABASE_PROVIDER=postgresql \
DATABASE_URL="postgresql://user:pass@host:5432/nightcap?schema=public" \
pnpm run db:push && pnpm run db:seed
```

Keep the two schema files in sync when you change the data model (only the
datasource `provider` differs).

### Deploying to Vercel

1. Create a hosted PostgreSQL (Vercel Postgres, **Neon**, Supabase) and note the
   `postgresql://` connection string.
2. **Push this repo to GitHub** and import it in Vercel (framework is
   auto-detected as Next.js; install command `pnpm install`).
3. Add these **Environment Variables** in Vercel → Project → Settings:
   - `DATABASE_URL` = your `postgresql://…` string
   - `DATABASE_PROVIDER` = `postgresql`
   - `OPENAI_API_KEY` (optional — enables the LLM)
4. **Create + seed the database once.** From your machine, run:
   ```bash
   DATABASE_PROVIDER=postgresql \
   DATABASE_URL="postgresql://user:pass@host:5432/nightcap?schema=public" \
   pnpm install && pnpm run db:push && pnpm run db:seed
   ```
   (On Windows PowerShell, set `$env:DATABASE_PROVIDER` / `$env:DATABASE_URL`
   first, then run `pnpm install && pnpm run db:push && pnpm run db:seed`.)
5. Deploy. `postinstall` runs `prisma generate` against the PostgreSQL schema,
   so the build produces a PostgreSQL-backed client automatically.

---

## Data model

```
ingredients          — canonical ingredient ids + EN/ZH names + category + flavor profile
ingredient_aliases   — every alias/translation → canonical ingredient id
cocktails            — classic + AI (source column) recipes, EN/ZH steps as JSON
cocktail_ingredients — amounts, optional flag (join table)
users / user_inventory / favorites — provided for future auth (MVP uses localStorage)
```

Ingredient aliases are normalized deterministically
(exact → singular/plural → containment → edit distance), so “gin”, “金酒”,
“琴酒” and “杜松子酒” all resolve to `gin`.

---

## API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/recommend` | Deterministic matching + ranking + (conditional) AI creative |
| `POST` | `/api/parse` | Natural-language ingredient extraction → canonical ids |
| `POST` | `/api/creative` | Explicit AI creative generation (validated + persisted) |
| `GET` | `/api/ingredients` | Full ingredient catalog (for search/browse) |
| `GET` | `/api/cocktails/[id]` | Cocktail detail with match + substitutions |

`POST /api/recommend` request:

```json
{
  "ingredients": ["gin", "lemon", "simple_syrup"],
  "preferences": { "flavor": ["fresh", "sour"], "strength": "medium", "difficulty": "easy" },
  "missingIngredientLimit": 1,
  "language": "en"
}
```

All requests/responses and AI outputs are validated with Zod; invalid AI output
is rejected and falls back to deterministic results.

---

## Pages

- `/` — hero + ingredient input + preferences
- `/recommend` — results (available / almost / AI creations)
- `/cocktail/[id]` — detail page with recipe, match, missing, substitutions
- `/cabinet` — your saved ingredients
- `/favorites` — your saved cocktails

---

## Project structure

```
prisma/            schema.prisma (SQLite), schema.postgresql.prisma, seed.ts
scripts/           db.mjs (provider-aware Prisma CLI wrapper)
locales/           en/ and zh-CN/ (common, home, recommendation, cocktail, cabinet, favorites)
src/
  app/            pages + API route handlers
  components/     UI primitives + feature components
  lib/            db, matching engine, normalization, AI, i18n, schemas, config, creative-images
```

---

## SEO & structured data

Every localized cocktail page (/en/cocktail/[id], /zh-CN/cocktail/[id]) is
prerendered at build time (static HTML, `s-maxage=31536000`, no per-request SSR)
with its own canonical, hreflang alternates (incl. `x-default`), OpenGraph/Twitter
cards, a visible breadcrumb trail and Schema.org Recipe + BreadcrumbList JSON-LD
(src/lib/seo.ts).

Two rules keep the markup policy-safe, and both are enforced in code:

1. Structured data must match visible content. The nutrition estimate is computed
   server-side from the canonical ingredient amounts (src/lib/nutrition.ts) and
   rendered in the page's "Estimated nutrition" block; each HowToStep name is
   derived from the visible step text; step URLs deep-link to the visible step
   anchors (#step-N). Step photos are only attached where they truthfully show
   that step (the final presentation step reuses the recipe photo; pass real
   per-step images through the stepImages option, or switch stepImageMode).
2. Never fabricate ratings. aggregateRating is only emitted when a real on-site
   rating aggregate is supplied - inventing one is a structured-data policy
   violation (manual-action risk), so the field stays absent until a real
   ratings feature ships.

Beyond the recipe markup, the site follows the "information gain" rule from the
knowledge base - every page should answer something competitors don't:

- **Estimated strength** (src/lib/nutrition.ts): ABV and grams of alcohol per
  serving, derived from the same canonical amounts (labelled as pre-dilution).
- **Self-hosted photography**: cocktail photos live in `public/images/cocktails/`
  (manifest: `src/data/cocktail-images.json`, generated from the database), are
  served through `next/image` with descriptive alt text, and are listed per URL
  in the image sitemap. No third-party CDN hot-linking.
- **Honest sitemap**: `<lastmod>` uses real content timestamps
  (`SITE_CONTENT_UPDATED` in src/app/sitemap.ts), not the build time.
- **Editorial pages** carry Article + BreadcrumbList JSON-LD (e.g. the guide),
  and utility pages (cabinet / favorites / recommend) stay out of the index.
- **Recipe FAQs**: each cocktail page answers four real questions (strength,
  calories, glass/method, substitution) with server-computed data, rendered
  visibly and mirrored in FAQPage JSON-LD (src/components/cocktail-faq.tsx).
- **An index page instead of orphan recipes**: `/[lang]/classics` groups all 38
  classics by base spirit and is linked from the header, footer, home page and
  every recipe breadcrumb, so no recipe is more than two clicks from the root.
- **AI-generated recipes are `noindex, follow`**: they stay shareable and useful
  but do not fill the index with thin generated pages (the classic
  "crawled, not indexed" trap).
- **`<html lang>` follows the route**: the root layout lives in `[lang]/` so /en
  and /zh-CN declare their own language; `/` is a middleware redirect. There is
  no root `app/layout.tsx` — new top-level pages must live under `[lang]/`.
- **No false promises in markup**: `WebSite.potentialAction` is only emitted
  when a real search endpoint exists (currently it does not, so it is absent).

The remediation plans live in `knowledge-base/work/structured-data/`
(recipe JSON-LD) and `knowledge-base/work/seo-v2/` (second pass, driven by the
updated knowledge base).

---

## Notes

- Classic recipes come from the curated, seeded database — the LLM is never
  asked to rank or invent “classics”.
- AI creative recipes are schema-validated, then persisted with `source = "ai"`
  so they can be opened, favorited, and clearly labeled.
- Classic cocktails ship real photography, originally sourced from TheCocktailDB
  (public, free) and now **self-hosted** in `public/images/cocktails/` (49 files,
  ~3.1 MB) with a manifest at `src/data/cocktail-images.json`. AI creations get a
  photo matched to their base spirit via `src/lib/creative-images.ts` — no emoji
  placeholders; 7 duplicate-photo groups still exist for AI recipes and are
  tracked in `knowledge-base/work/seo-v2/图片自托管报告.md`.
- With `OPENAI_API_KEY` set, substitutions and recommendation explanations are
  generated by the LLM (validated by Zod, batched, capped); without a key the
  deterministic rule/template versions are used automatically.
- The cocktail-bar visual style uses a dark/warm background, cream typography,
  and amber/burgundy accents with serif display headings.