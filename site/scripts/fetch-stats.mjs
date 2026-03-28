#!/usr/bin/env node
// Build-time script: fetches live registry stats and writes site/src/data/stats.json
// Uses @mcptoolshop/registry-stats library API directly.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { stats, calc, createCache, inferPortfolio } from "@mcptoolshop/registry-stats";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".."); // site/
const DATA_DIR = path.join(ROOT, "src", "data");
const MANIFEST_PATH = path.join(DATA_DIR, "packages.json");
const OUT_PATH = path.join(DATA_DIR, "stats.json");
const HISTORY_PATH = path.join(DATA_DIR, "history.json");

// ── Schema validation helpers ──────────────────────────────────

const KNOWN_REGISTRIES = ["npm", "pypi", "vscode", "nuget", "docker"];

function validateManifest(manifest) {
  if (manifest == null || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("packages.json must be a JSON object");
  }
  if ("npmMaintainer" in manifest && typeof manifest.npmMaintainer !== "string") {
    throw new Error("packages.json: npmMaintainer must be a string");
  }
  for (const reg of KNOWN_REGISTRIES) {
    if (!(reg in manifest)) continue;
    if (!Array.isArray(manifest[reg])) {
      throw new Error(`packages.json: "${reg}" must be an array, got ${typeof manifest[reg]}`);
    }
    for (let i = 0; i < manifest[reg].length; i++) {
      if (typeof manifest[reg][i] !== "string") {
        throw new Error(`packages.json: ${reg}[${i}] must be a string, got ${typeof manifest[reg][i]}`);
      }
    }
  }
}

function validateOutputPayload(payload) {
  const problems = [];
  if (typeof payload.fetchedAt !== "string") problems.push("fetchedAt must be a string");
  if (payload.totals == null || typeof payload.totals !== "object") problems.push("totals must be an object");
  else if (typeof payload.totals.packages !== "number") problems.push("totals.packages must be a number");
  if (!Array.isArray(payload.leaderboard)) problems.push("leaderboard must be an array");
  if (payload.inference == null || typeof payload.inference !== "object") problems.push("inference must be an object");
  else if (!Array.isArray(payload.inference.recommendations)) problems.push("inference.recommendations must be an array");
  if (!Array.isArray(payload.sparkline30)) problems.push("sparkline30 must be an array");
  if (problems.length > 0) {
    throw new Error(`Output payload validation failed:\n  - ${problems.join("\n  - ")}`);
  }
}

// ── Atomic file write (write to temp, then rename) ─────────────

async function atomicWrite(filePath, content) {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp.${process.pid}`);
  await fs.writeFile(tmpPath, content, "utf8");
  await fs.rename(tmpPath, filePath);
}

// ── History version check ──────────────────────────────────────

const HISTORY_VERSION = 1;

function safeNumber(n) {
  return Number.isFinite(n) ? n : 0;
}

// ── History accumulator ──────────────────────────────────────
// Appends monthly per-package aggregates and weekly portfolio totals
// to history.json. Idempotent — same month/week won't duplicate.

async function loadHistory() {
  try {
    const history = JSON.parse(await fs.readFile(HISTORY_PATH, "utf8"));
    if (history.version != null && history.version !== HISTORY_VERSION) {
      console.warn(`  WARNING: history.json version is ${history.version}, expected ${HISTORY_VERSION}. Data may need migration.`);
    }
    return history;
  } catch {
    return { version: HISTORY_VERSION, lastUpdated: null, monthly: {}, weeklyPortfolio: [] };
  }
}

function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

async function updateHistory(leaderboard, registryTotals, totals) {
  const history = await loadHistory();
  const now = new Date();
  const monthKey = now.toISOString().slice(0, 7); // "2026-03"
  const weekKey = getISOWeek(now);

  // --- Monthly per-package aggregates ---
  for (const row of leaderboard) {
    const pkgKey = `${row.registry}:${row.name}`;
    if (!history.monthly[pkgKey]) history.monthly[pkgKey] = {};

    const existing = history.monthly[pkgKey][monthKey];
    // Accumulate: keep the highest weekly value seen this month (build runs daily)
    history.monthly[pkgKey][monthKey] = {
      week: Math.max(safeNumber(row.week), safeNumber(existing?.week)),
      month: Math.max(safeNumber(row.month), safeNumber(existing?.month)),
      total: Math.max(safeNumber(row.total), safeNumber(existing?.total)),
      lastUpdated: now.toISOString(),
    };
  }

  // --- Weekly portfolio aggregates ---
  const weekEntry = history.weeklyPortfolio.find((e) => e.week === weekKey);
  const portfolioWeek = Object.values(registryTotals).reduce((s, r) => s + safeNumber(r.week), 0);
  const portfolioMonth = Object.values(registryTotals).reduce((s, r) => s + safeNumber(r.month), 0);

  const regBreakdown = {};
  for (const [reg, rt] of Object.entries(registryTotals)) {
    regBreakdown[reg] = safeNumber(rt.week);
  }

  if (weekEntry) {
    // Update in place — keep highest values
    weekEntry.totalWeek = Math.max(weekEntry.totalWeek, portfolioWeek);
    weekEntry.totalMonth = Math.max(weekEntry.totalMonth, portfolioMonth);
    weekEntry.packages = totals.packages;
    weekEntry.registries = regBreakdown;
    weekEntry.updatedAt = now.toISOString();
  } else {
    history.weeklyPortfolio.push({
      week: weekKey,
      totalWeek: portfolioWeek,
      totalMonth: portfolioMonth,
      packages: totals.packages,
      registries: regBreakdown,
      updatedAt: now.toISOString(),
    });
    // Keep max 104 weeks (2 years)
    if (history.weeklyPortfolio.length > 104) {
      history.weeklyPortfolio = history.weeklyPortfolio.slice(-104);
    }
  }

  history.lastUpdated = now.toISOString();
  await atomicWrite(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n");
  console.log(`  History updated: ${Object.keys(history.monthly).length} packages, ${history.weeklyPortfolio.length} weekly entries`);
  return history;
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

function regLabel(reg) {
  return ({ npm: "npm", pypi: "PyPI", vscode: "VS Code", nuget: "NuGet", docker: "Docker Hub" })[reg] ?? reg;
}

// Cumulative-only registries (no native weekly/monthly breakdowns)
const CUMULATIVE_REGISTRIES = new Set(["docker", "vscode", "nuget"]);

function fmtInt(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(n ?? 0)));
}

function fmtPct(p) {
  if (!Number.isFinite(p)) return null;
  const abs = Math.abs(p);
  const digits = abs >= 100 ? 0 : 1;
  return `${(Math.round(p * (10 ** digits)) / (10 ** digits)).toFixed(digits)}%`;
}

function summarizeConfidence({ confidence, errors, staleCounts }) {
  const missing = Object.entries(confidence ?? {}).filter(([, v]) => v === "missing").map(([k]) => regLabel(k));
  const partial = Object.entries(confidence ?? {}).filter(([, v]) => v === "partial").map(([k]) => regLabel(k));
  const totalStale = Object.values(staleCounts ?? {}).reduce((s, n) => s + n, 0);
  const staleNote = totalStale > 0 ? ` (${totalStale} packages used cached previous data)` : "";
  if (!errors?.length && missing.length === 0 && partial.length === 0) return "All sources fetched cleanly" + staleNote;
  if (missing.length && partial.length) return `Data is partial (missing: ${missing.join(", ")}; degraded: ${partial.join(", ")})${staleNote}`;
  if (missing.length) return `Data is partial (missing: ${missing.join(", ")})${staleNote}`;
  if (partial.length) return `Data is partial (degraded: ${partial.join(", ")})${staleNote}`;
  return `Data is partial (${errors.length} fetch issues)${staleNote}`;
}

function pickTopGainer(movers) {
  const g = movers?.topGainers?.[0];
  if (g) return { type: "gainer", row: g };
  const n = movers?.newlyActive?.[0];
  if (n) return { type: "new", row: n };
  return null;
}

// ── Extracted helpers for main() decomposition ─────────────────

async function fetchAllRegistries(registryLists, prevLeaderboard, trackError, opts) {
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
        if (r === null) {
          const prev = prevLeaderboard[`${registry}:${packages[i]}`];
          if (prev) {
            console.warn(`  ${registry}:${packages[i]} — bulk returned null, using previous stats (stale)`);
            items.push({ registry, name: packages[i], week: safeNumber(prev.week), month: safeNumber(prev.month), day: safeNumber(prev.day), total: safeNumber(prev.total), extra: prev.extra ?? null, range30: prev.range30 ?? null, trendPct: prev.trendPct ?? null, error: false, stale: true });
          } else {
            items.push({ registry, name: packages[i], week: 0, month: 0, day: 0, total: 0, extra: null, range30: null, trendPct: null, error: true });
          }
        } else {
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
            error: false,
          });
        }
      }
    } catch (e) {
      trackError(`${registry}.bulk`, String(e?.message ?? e));
      console.warn(`  ${registry}.bulk failed, falling back to individual: ${e?.message}`);

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
          trackError(`${registry}:${pkg}`, String(err?.message ?? err));
          const prev = prevLeaderboard[`${registry}:${pkg}`];
          if (prev) {
            console.warn(`  ${registry}:${pkg} — using previous stats (stale)`);
            items.push({ registry, name: pkg, week: safeNumber(prev.week), month: safeNumber(prev.month), day: safeNumber(prev.day), total: safeNumber(prev.total), extra: prev.extra ?? null, range30: prev.range30 ?? null, trendPct: prev.trendPct ?? null, error: false, stale: true });
          } else {
            items.push({ registry, name: pkg, week: 0, month: 0, day: 0, total: 0, extra: null, range30: null, trendPct: null, error: true });
          }
        }
      }
    }

    perRegistry[registry] = items;
    const staleCount = items.filter((i) => i.stale).length;
    const okCount = items.filter((i) => !i.error).length;
    console.log(`  ${registry}: done (${okCount}/${items.length} ok${staleCount ? `, ${staleCount} stale` : ""})`);
  }

  return perRegistry;
}

function runInference(leaderboard, registryTotals) {
  console.log("  Running AI inference pipeline...");
  const inferenceInput = leaderboard.map((r) => ({
    name: r.name,
    registry: r.registry,
    week: r.week,
    range30: r.range30,
    trendPct: r.trendPct,
  }));

  const npmWeekTotal = Number((registryTotals.npm ?? {}).week ?? 0);
  const allWeekTotal = Object.values(registryTotals).reduce((s, r) => s + Number(r?.week ?? 0), 0);
  const npmPctInf = allWeekTotal > 0 ? Math.round((npmWeekTotal / allWeekTotal) * 100) : 0;

  const weeklyDls = leaderboard.map((r) => Number(r.week ?? 0)).sort((a, b) => a - b);
  const giniN = weeklyDls.length;
  const giniTotal = weeklyDls.reduce((a, b) => a + b, 0);
  let giniNumerator = 0;
  weeklyDls.forEach((x, i) => { giniNumerator += (2 * (i + 1) - giniN - 1) * x; });
  const giniCoeff = giniN > 1 && giniTotal > 0 ? giniNumerator / (giniN * giniTotal) : 0;

  const result = inferPortfolio(inferenceInput, {
    gini: giniCoeff,
    npmPct: npmPctInf,
    totalWeekly: allWeekTotal,
  });

  console.log(`  Inference: ${result.packages.length} packages analyzed, ${result.recommendations.length} recommendations, risk=${result.riskScore}, momentum=${result.portfolioMomentum}`);
  return result;
}

async function main() {
  const fetchedAt = new Date().toISOString();
  const errors = [];
  const errorsByRegistry = {};
  const cache = createCache();

  function trackError(scope, message) {
    errors.push({ scope, message });
    const reg = scope.split(".")[0].split(":")[0];
    errorsByRegistry[reg] = (errorsByRegistry[reg] ?? 0) + 1;
  }
  const opts = { cache, cacheTtlMs: 600_000 };

  const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
  validateManifest(manifest);

  // --- Load previous stats for fallback on fetch failures ---
  let prevLeaderboard = {};
  try {
    const prevStats = JSON.parse(await fs.readFile(OUT_PATH, "utf8"));
    for (const row of prevStats.leaderboard ?? []) {
      prevLeaderboard[`${row.registry}:${row.name}`] = row;
    }
  } catch {
    // First run — no previous stats
  }

  // --- Load previous snapshot for cumulative-only delta tracking ---
  const SNAPSHOT_PATH = path.join(DATA_DIR, "snapshots.json");
  let prevSnapshots = {};
  try {
    const raw = JSON.parse(await fs.readFile(SNAPSHOT_PATH, "utf8"));
    // Support versioned envelope: { version, snapshots: { ... } }
    if (raw && typeof raw === "object" && raw.version != null && raw.snapshots) {
      prevSnapshots = raw.snapshots;
    } else {
      // Legacy flat format — migrate on next write
      prevSnapshots = raw;
    }
  } catch {
    // First run — no snapshots yet
  }

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
      trackError("npm.mine", String(e?.message ?? e));
      console.warn(`  npm.mine failed: ${e?.message}`);
    }
  }

  // --- Fetch all registries ---
  const registryLists = {
    npm: [...new Set(npmPackages)],
    pypi: [...(manifest.pypi ?? [])],
    vscode: [...(manifest.vscode ?? [])],
    nuget: [...(manifest.nuget ?? [])],
    ...(manifest.docker?.length ? { docker: [...manifest.docker] } : {}),
  };

  const perRegistry = await fetchAllRegistries(registryLists, prevLeaderboard, trackError, opts);

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
        item.last7 = last7;
        item.prev7 = prev7;
        item.delta7 = last7 - prev7;
        item.isNew = prev7 === 0 && last7 > 0;
        item.trendPct = item.isNew ? null : pctChange(last7, prev7);
      } else {
        item.last7 = null;
        item.prev7 = null;
        item.delta7 = null;
        item.isNew = false;
        item.trendPct = null;
      }
    } catch (e) {
      trackError(`npm.range:${item.name}`, String(e?.message ?? e));
    }
  }
  console.log("  npm: ranges done");

  // --- Snapshot-delta for cumulative-only registries ---
  const newSnapshots = { ...prevSnapshots };
  for (const item of Object.values(perRegistry).flat()) {
    if (!CUMULATIVE_REGISTRIES.has(item.registry) || item.error) continue;
    const key = `${item.registry}:${item.name}`;
    const prev = prevSnapshots[key];
    if (prev && Number.isFinite(prev.total) && item.total > 0) {
      const delta = item.total - prev.total;
      item.snapshotDelta = Math.max(0, delta);
    } else {
      item.snapshotDelta = null;
    }
    // Store current snapshot
    newSnapshots[key] = { total: item.total, fetchedAt };
  }

  // --- Ensure non-npm rows have growth fields ---
  for (const item of Object.values(perRegistry).flat()) {
    if (item.registry !== "npm") {
      item.last7 = null;
      item.prev7 = null;
      item.delta7 = null;
      item.isNew = false;
      item.trendPct = item.trendPct ?? null;
    }
  }

  // --- Manifest / fetched counts ---
  const manifestCounts = Object.fromEntries(
    Object.entries(registryLists).map(([reg, names]) => [reg, names.length])
  );
  const fetchedCounts = {};
  const staleCounts = {};
  for (const [registry, items] of Object.entries(perRegistry)) {
    fetchedCounts[registry] = items.filter((x) => !x.error).length;
    staleCounts[registry] = items.filter((x) => x.stale).length;
  }

  // --- Aggregate ---
  const allPackages = Object.values(perRegistry).flat();

  const registryTotals = {};
  for (const [registry, items] of Object.entries(perRegistry)) {
    registryTotals[registry] = {
      packages: items.length,
      week: items.reduce((s, x) => s + safeNumber(x.week), 0),
      month: items.reduce((s, x) => s + safeNumber(x.month), 0),
      total: items.reduce((s, x) => s + safeNumber(x.total), 0),
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
      last7: x.last7 ?? null,
      prev7: x.prev7 ?? null,
      delta7: x.delta7 ?? null,
      range30: x.range30 ?? null,
      extra: x.extra ?? null,
      ...(x.stale ? { stale: true } : {}),
    }))
    .sort((a, b) => b.week - a.week || b.month - a.month || b.total - a.total)
    .slice(0, 250);

  // Aggregate npm sparkline (sum daily across all npm packages)
  const sparkline30 = new Array(30).fill(0);
  for (const item of perRegistry.npm ?? []) {
    if (!item.range30) continue;
    for (let i = 0; i < 30; i++) sparkline30[i] += safeNumber(item.range30[i]);
  }

  // --- Confidence per registry ---
  const confidence = Object.fromEntries(
    Object.keys(registryLists).map((reg) => {
      const expected = manifestCounts[reg] ?? 0;
      const fetched = fetchedCounts[reg] ?? 0;
      const err = errorsByRegistry[reg] ?? 0;
      if (expected === 0) return [reg, "missing"];
      if (err === 0 && fetched === expected) return [reg, "ok"];
      if (fetched > 0) return [reg, "partial"];
      return [reg, "missing"];
    })
  );

  // --- Top Movers (precomputed) ---
  const npmWithRange = (perRegistry.npm ?? []).filter((r) => r.range30);

  const topGainers = [...npmWithRange]
    .filter((r) => r.trendPct !== null && !r.isNew)
    .sort((a, b) => b.trendPct - a.trendPct)
    .slice(0, 5)
    .map((r) => ({ name: r.name, registry: "npm", week: r.week, month: r.month, trendPct: r.trendPct, delta7: r.delta7 }));

  const topDecliners = [...npmWithRange]
    .filter((r) => r.trendPct !== null && !r.isNew)
    .sort((a, b) => a.trendPct - b.trendPct)
    .slice(0, 5)
    .map((r) => ({ name: r.name, registry: "npm", week: r.week, month: r.month, trendPct: r.trendPct, delta7: r.delta7 }));

  const newlyActive = [...npmWithRange]
    .filter((r) => r.isNew)
    .sort((a, b) => b.week - a.week)
    .slice(0, 5)
    .map((r) => ({ name: r.name, registry: "npm", week: r.week, month: r.month, trendPct: r.trendPct, delta7: r.delta7 }));

  // Concentration: top 5 share of weekly
  const top5Weekly = [...allPackages].sort((a, b) => b.week - a.week).slice(0, 5).reduce((s, x) => s + safeNumber(x.week), 0);
  const concentrationTop5Pct = totals.week ? (top5Weekly / totals.week) * 100 : 0;

  // Registry share breakdown
  const regShares = Object.entries(registryTotals)
    .map(([reg, r]) => ({ reg, week: safeNumber(r.week), sharePct: totals.week ? (safeNumber(r.week) / totals.week) * 100 : 0 }))
    .sort((a, b) => b.week - a.week);

  const leadReg = regShares[0];
  const leadPkg = leaderboard[0];

  // --- Executive Narrative (rich) ---
  const movers = { topGainers, topDecliners, newlyActive, concentrationTop5Pct };

  const narrative = (() => {
    const leadRegStr = leadReg
      ? `${regLabel(leadReg.reg)} led with ${Math.round(leadReg.sharePct)}% of weekly downloads`
      : "Weekly downloads updated";

    const leadPkgStr = leadPkg
      ? `Top package: ${leadPkg.name} (${fmtInt(leadPkg.week)} this week)`
      : "Top package unavailable";

    const conc = Number(concentrationTop5Pct ?? 0);
    const concStr = conc > 0 ? `Concentration: top 5 = ${fmtPct(conc)}` : "Concentration unavailable";

    const g = pickTopGainer(movers);
    let moverStr = "Mover: none detected";
    if (g?.type === "gainer") {
      moverStr = `Top gainer: ${g.row.name} (+${fmtPct(g.row.trendPct)}; \u0394${fmtInt(g.row.delta7)})`;
    } else if (g?.type === "new") {
      moverStr = `Newly active: ${g.row.name} (${fmtInt(g.row.week)} this week)`;
    }

    const opsStr = summarizeConfidence({ confidence, errors, staleCounts });

    return `${leadRegStr}. ${leadPkgStr}. ${moverStr}. ${concStr}. ${opsStr}.`;
  })();

  // Structured narrative lines for dashboard rendering
  const narrativeLines = (() => {
    const lines = [];

    // Registry lead
    if (leadReg) {
      const others = regShares.slice(1).filter(r => r.week > 0);
      const othersStr = others.length
        ? ` followed by ${others.slice(0, 2).map(r => `${regLabel(r.reg)} (${Math.round(r.sharePct)}%)`).join(" and ")}`
        : "";
      lines.push({
        icon: "📊",
        label: "Registry Lead",
        text: `${regLabel(leadReg.reg)} led with ${Math.round(leadReg.sharePct)}% of ${fmtInt(totals.week)} weekly downloads${othersStr}.`
      });
    }

    // Top package
    if (leadPkg) {
      const runner = leaderboard[1];
      const runnerStr = runner
        ? ` Runner-up: ${runner.name} (${fmtInt(runner.week)}).`
        : "";
      lines.push({
        icon: "🏆",
        label: "Top Package",
        text: `${leadPkg.name} with ${fmtInt(leadPkg.week)} downloads this week.${runnerStr}`
      });
    }

    // Top mover
    const g = pickTopGainer(movers);
    if (g?.type === "gainer") {
      lines.push({
        icon: "🚀",
        label: "Top Mover",
        text: `${g.row.name} surged ${fmtPct(g.row.trendPct)} week-over-week (${fmtInt(g.row.delta7)} additional downloads).`
      });
    } else if (g?.type === "new") {
      lines.push({
        icon: "✨",
        label: "Newly Active",
        text: `${g.row.name} appeared this week with ${fmtInt(g.row.week)} downloads (not tracked in prior period).`
      });
    }

    // Decliners
    if (topDecliners.length > 0) {
      const top = topDecliners[0];
      lines.push({
        icon: "📉",
        label: "Decline",
        text: `${top.name} dropped ${fmtPct(Math.abs(top.trendPct))} week-over-week (${fmtInt(Math.abs(top.delta7))} fewer downloads).`
      });
    }

    // Concentration
    const conc = Number(concentrationTop5Pct ?? 0);
    if (conc > 0) {
      const verdict = conc > 50 ? "Portfolio is top-heavy — diversification may reduce risk." :
                      conc > 30 ? "Moderate concentration in top packages." :
                                  "Downloads are well-distributed across the portfolio.";
      lines.push({
        icon: "📈",
        label: "Concentration",
        text: `Top 5 packages account for ${fmtPct(conc)} of weekly downloads. ${verdict}`
      });
    }

    // Data health
    const opsStr = summarizeConfidence({ confidence, errors, staleCounts });
    const healthIcon = confidence && Object.values(confidence).every(v => v === "ok") ? "✅" : "⚠️";
    lines.push({
      icon: healthIcon,
      label: "Data Health",
      text: opsStr + "."
    });

    return lines;
  })();

  // --- AI Inference Pipeline ---
  const inference = runInference(leaderboard, registryTotals);

  // --- Update historical data ---
  console.log("  Updating history...");
  const history = await updateHistory(leaderboard, registryTotals, totals);

  const payload = {
    fetchedAt,
    totals,
    registryTotals,
    manifestCounts,
    fetchedCounts,
    staleCounts,
    errorsByRegistry,
    confidence,
    narrative,
    narrativeLines,
    movers,
    leaderboard,
    sparkline30,
    errors,
    history: {
      weeklyPortfolio: history.weeklyPortfolio.slice(-52), // last year
      packageCount: Object.keys(history.monthly).length,
      lastUpdated: history.lastUpdated,
    },
    inference: {
      forecastTotal7: inference.forecastTotal7,
      riskScore: inference.riskScore,
      portfolioMomentum: inference.portfolioMomentum,
      diversityTrend: inference.diversityTrend,
      recommendations: inference.recommendations,
      actionableAdvice: inference.actionableAdvice,
      healthScores: inference.healthScores.slice(0, 50),
      packages: inference.packages.filter((p) => p.forecast7.length > 0).slice(0, 30).map((p) => ({
        name: p.name,
        registry: p.registry,
        forecast7: p.forecast7,
        anomalies: p.anomalies,
        momentum: p.momentum,
        seasonality: p.seasonality,
      })),
    },
  };

  // --- Validate output payload before writing ---
  validateOutputPayload(payload);

  // --- Warn if all data is zero/stale ---
  const allMissing = Object.values(confidence).every((v) => v === "missing");
  if (totals.week === 0 && allMissing) {
    console.warn("\n  *** WARNING: All registry data is zero or missing. Output may be unusable. ***");
    payload.dataQuality = "unusable";
  } else if (totals.week === 0) {
    console.warn("\n  *** WARNING: Total weekly downloads is zero. Data may be stale. ***");
    payload.dataQuality = "degraded";
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  // Save snapshots for next run's delta computation (versioned envelope)
  const snapshotEnvelope = { version: 1, snapshots: newSnapshots };
  await atomicWrite(SNAPSHOT_PATH, JSON.stringify(snapshotEnvelope, null, 2) + "\n");

  const jsonStr = JSON.stringify(payload, null, 2) + "\n";
  await atomicWrite(OUT_PATH, jsonStr);

  // Also copy to public/data/ so it's available as a static file at runtime
  const publicDataDir = path.join(ROOT, "public", "data");
  await fs.mkdir(publicDataDir, { recursive: true });
  await atomicWrite(path.join(publicDataDir, "stats.json"), jsonStr);

  // Also copy the package manifest so the live refresh engine can discover all packages
  const manifestStr = await fs.readFile(MANIFEST_PATH, "utf8");
  await atomicWrite(path.join(publicDataDir, "packages.json"), manifestStr);

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
