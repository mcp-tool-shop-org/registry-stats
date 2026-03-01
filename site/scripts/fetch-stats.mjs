#!/usr/bin/env node
// Build-time script: fetches live registry stats and writes site/src/data/stats.json
// Uses @mcptoolshop/registry-stats library API directly.

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { stats, calc, createCache } from "@mcptoolshop/registry-stats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // site/
const DATA_DIR = path.join(ROOT, "src", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "packages.json");
const OUT_PATH = path.join(DATA_DIR, "stats.json");

function safeNumber(n) {
  return Number.isFinite(n) ? n : 0;
}

function pctChange(curr, prev) {
  if (!Number.isFinite(curr) || !Number.isFinite(prev)) return null;
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / prev) * 100;
}

function dateStr(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const errors = [];
  const cache = createCache();
  const opts = { cache, cacheTtlMs: 600_000 };

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));

  // --- npm: discover via maintainer, then merge with explicit list ---
  let npmPackages = [...(manifest.npm ?? [])];
  if (manifest.npmMaintainer) {
    try {
      console.log(`  npm: discovering packages for maintainer "${manifest.npmMaintainer}"...`);
      const discovered = await stats.mine(manifest.npmMaintainer, opts);
      for (const pkg of discovered) {
        if (pkg.package && !npmPackages.includes(pkg.package)) {
          npmPackages.push(pkg.package);
        }
      }
      console.log(`  npm: ${npmPackages.length} packages total (${discovered.length} discovered)`);
    } catch (e) {
      errors.push({ scope: "npm.mine", message: String(e?.message ?? e) });
      console.warn(`  npm.mine failed: ${e?.message}`);
    }
  }

  // --- Fetch all registries ---
  const registryLists = {
    npm: [...new Set(npmPackages)],
    pypi: [...(manifest.pypi ?? [])],
    vscode: [...(manifest.vscode ?? [])],
    nuget: [...(manifest.nuget ?? [])],
    docker: [...(manifest.docker ?? [])],
  };

  const perRegistry = {};

  for (const [registry, packages] of Object.entries(registryLists)) {
    if (!packages.length) {
      perRegistry[registry] = [];
      continue;
    }

    console.log(`  ${registry}: fetching ${packages.length} packages...`);
    const items = [];

    try {
      const results = await stats.bulk(registry, packages, opts);
      for (let i = 0; i < packages.length; i++) {
        const r = results[i];
        items.push({
          registry,
          name: packages[i],
          week: safeNumber(r?.downloads?.lastWeek),
          month: safeNumber(r?.downloads?.lastMonth),
          day: safeNumber(r?.downloads?.lastDay),
          total: safeNumber(r?.downloads?.total),
          extra: r?.extra ?? null,
          range30: null,
          trendPct: null,
          error: r === null,
        });
      }
    } catch (e) {
      errors.push({ scope: `${registry}.bulk`, message: String(e?.message ?? e) });
      console.warn(`  ${registry}.bulk failed, falling back to individual: ${e?.message}`);

      // Fallback: individual calls
      for (const pkg of packages) {
        try {
          const r = await stats(registry, pkg, opts);
          items.push({
            registry,
            name: pkg,
            week: safeNumber(r?.downloads?.lastWeek),
            month: safeNumber(r?.downloads?.lastMonth),
            day: safeNumber(r?.downloads?.lastDay),
            total: safeNumber(r?.downloads?.total),
            extra: r?.extra ?? null,
            range30: null,
            trendPct: null,
            error: r === null,
          });
        } catch (err) {
          errors.push({ scope: `${registry}:${pkg}`, message: String(err?.message ?? err) });
          items.push({ registry, name: pkg, week: 0, month: 0, day: 0, total: 0, extra: null, range30: null, trendPct: null, error: true });
        }
      }
    }

    perRegistry[registry] = items;
    console.log(`  ${registry}: done (${items.filter((i) => !i.error).length}/${items.length} ok)`);
  }

  // --- npm 30-day range for sparklines + trend ---
  const today = dateStr(0);
  const thirtyAgo = dateStr(30);

  console.log("  npm: fetching 30-day ranges for sparklines...");
  for (const item of perRegistry.npm ?? []) {
    try {
      const daily = await stats.range("npm", item.name, thirtyAgo, today, opts);
      const counts = daily.map((d) => safeNumber(d.downloads)).slice(-30);
      while (counts.length < 30) counts.unshift(0);
      item.range30 = counts;

      if (counts.length >= 14) {
        const last7 = counts.slice(-7).reduce((a, b) => a + b, 0);
        const prev7 = counts.slice(-14, -7).reduce((a, b) => a + b, 0);
        if (!item.week) item.week = last7;
        item.trendPct = pctChange(last7, prev7);
      }
    } catch (e) {
      errors.push({ scope: `npm.range:${item.name}`, message: String(e?.message ?? e) });
    }
  }
  console.log("  npm: ranges done");

  // --- Aggregate ---
  const allPackages = Object.values(perRegistry).flat();

  const registryTotals = {};
  for (const [registry, items] of Object.entries(perRegistry)) {
    registryTotals[registry] = {
      packages: items.length,
      week: items.reduce((s, x) => s + safeNumber(x.week), 0),
      month: items.reduce((s, x) => s + safeNumber(x.month), 0),
    };
  }

  const activeRegistries = Object.entries(registryLists)
    .filter(([, names]) => names.length > 0)
    .map(([k]) => k);

  const totals = {
    packages: allPackages.length,
    week: Object.values(registryTotals).reduce((s, r) => s + safeNumber(r.week), 0),
    month: Object.values(registryTotals).reduce((s, r) => s + safeNumber(r.month), 0),
    activeRegistries: activeRegistries.length,
  };

  // Leaderboard (sort by weekly desc, tie-break month desc)
  const leaderboard = allPackages
    .map((x) => ({
      registry: x.registry,
      name: x.name,
      week: safeNumber(x.week),
      month: safeNumber(x.month),
      day: safeNumber(x.day),
      total: safeNumber(x.total),
      trendPct: x.trendPct ?? null,
      range30: x.range30 ?? null,
      extra: x.extra ?? null,
    }))
    .sort((a, b) => b.week - a.week || b.month - a.month)
    .slice(0, 100);

  // Aggregate npm sparkline (sum daily across all npm packages)
  const sparkline30 = new Array(30).fill(0);
  for (const item of perRegistry.npm ?? []) {
    if (!item.range30) continue;
    for (let i = 0; i < 30; i++) sparkline30[i] += safeNumber(item.range30[i]);
  }

  const payload = {
    fetchedAt,
    totals,
    registryTotals,
    leaderboard,
    sparkline30,
    errors,
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf8");

  const errCount = errors.length;
  console.log(`\n  Wrote ${path.relative(ROOT, OUT_PATH)} (${leaderboard.length} packages, ${errCount} errors)`);
  if (errCount) {
    console.warn("  Some fetches failed; see stats.json.errors");
  }
}

main().catch((e) => {
  console.error("fetch-stats failed:", e);
  process.exit(1);
});
