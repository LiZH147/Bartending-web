#!/usr/bin/env node
/**
 * Prisma CLI wrapper that picks the right schema file by database provider,
 * so the same project runs on SQLite locally (zero-config) and PostgreSQL on
 * Vercel — without editing files by hand.
 *
 * Selection (highest precedence first):
 *   1. DATABASE_PROVIDER env var ("postgresql" | "sqlite")
 *   2. DATABASE_URL scheme: postgres://…  → postgresql, otherwise sqlite
 *
 * Usage:  node scripts/db.mjs <prisma-command> [...args]
 * e.g.    node scripts/db.mjs generate
 *         node scripts/db.mjs db push
 *         node scripts/db.mjs migrate deploy
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function detectProvider() {
  const explicit = (process.env.DATABASE_PROVIDER || "").toLowerCase();
  if (explicit === "postgres" || explicit === "postgresql") return "postgresql";
  if (explicit === "sqlite") return "sqlite";

  const url = process.env.DATABASE_URL || "";
  if (/^postgres(ql)?:\/\//i.test(url)) return "postgresql";
  return "sqlite";
}

const provider = detectProvider();
const schema =
  provider === "postgresql"
    ? path.join(root, "prisma", "schema.postgresql.prisma")
    : path.join(root, "prisma", "schema.prisma");

if (!existsSync(schema)) {
  console.error(`[db] schema not found: ${schema}`);
  process.exit(1);
}

const cmd = process.argv[2];
if (!cmd) {
  console.error("[db] usage: node scripts/db.mjs <prisma-command> [...args]");
  process.exit(1);
}
const rest = process.argv.slice(3);

let prismaCli;
try {
  // Resolve the Prisma CLI module directly (avoids .cmd/.sh bin shims).
  prismaCli = require.resolve("prisma/build/index.js");
} catch {
  console.error("[db] `prisma` is not installed. Run `pnpm install` first.");
  process.exit(1);
}

const args = [prismaCli, cmd, ...rest, "--schema", schema];
console.log(`[db] provider=${provider} schema=${path.relative(root, schema)}`);
console.log(`[db] prisma ${cmd} ${rest.join(" ")}`.trim());

const result = spawnSync(process.execPath, args, { stdio: "inherit", cwd: root });
process.exit(result.status ?? 1);