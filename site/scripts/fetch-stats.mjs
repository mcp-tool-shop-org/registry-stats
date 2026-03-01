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

function regLabel(reg) {
  return ({ npm: "npm", pypi: "PyPI", vscode: "VS Code", nuget: "NuGet", docker: "Docker Hub" })[reg] ?? reg;
}

function fmtInt(n) {
  return new Intl.NumberFormat("en-US").format(Math.round(Number(n ?? 0)));
}

function fmtPct(p) {
  if (!Number.isFinite(p)) return null;
  const abs = Math.abs(p);
  const digits = abs >= 100 ? 0 : 1;
  return `${(Math.round(p * (10 ** digits)) / (10 ** digits)).toFixed(digits)}%`;
}

function summarizeConfidence({ confidence, errors }) {
  const missing = Object.entries(confidence ?? {}).filter(([, v]) => v === "missing").map(([k]) => regLabel(k));
  const partial = Object.entries(confidence ?? {}).filter(([, v]) => v === "partial").map(([k]) => regLabel(k));
  if (!errors?.length && missing.length === 0 && partial.length === 0) return "All sources fetched cleanly";
  if (missing.length && partial.length) return `Data is partial (missing: ${missing.join(", ")}; degraded: ${partial.join(", ")})`;
  if (missing.length) return `Data is partial (missing: ${missing.join(", ")})`;
  if (partial.length) return `Data is partial (degraded: ${partial.join(", ")})`;
  return `Data is partial (${errors.length} fetch issues)`;
}

function pickTopGainer(movers) {
  const g = movers?.topGainers?.[0];
  if (g) return { type: "gainer", row: g };
  const n = movers?.newlyActive?.[0];
  if (n) return { type: "new", row: n };
  return null;
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
      trackError(`${registry}.bulk`, String(e?.message ?? e));
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
          trackError(`${registry}:${pkg}`, String(err?.message ?? err));
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
  for (const [registry, items] of Object.entries(perRegistry)) {
    fetchedCounts[registry] = items.filter((x) => !x.error).length;
  }

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
      last7: x.last7 ?? null,
      prev7: x.prev7 ?? null,
      delta7: x.delta7 ?? null,
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

    const opsStr = summarizeConfidence({ confidence, errors });

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
    const opsStr = summarizeConfidence({ confidence, errors });
    const healthIcon = confidence && Object.values(confidence).every(v => v === "ok") ? "✅" : "⚠️";
    lines.push({
      icon: healthIcon,
      label: "Data Health",
      text: opsStr + "."
    });

    return lines;
  })();

  const payload = {
    fetchedAt,
    totals,
    registryTotals,
    manifestCounts,
    fetchedCounts,
    errorsByRegistry,
    confidence,
    narrative,
    narrativeLines,
    movers,
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
