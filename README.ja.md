<p align="center">
  <a href="README.md">English</a> | <strong>日本語</strong> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats/readme.png" alt="registry-stats logo" width="400" />
</p>

<p align="center">
  One command. Five registries. All your download stats.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml"><img src="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/registry-stats"><img src="https://img.shields.io/npm/v/@mcptoolshop/registry-stats" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/">Docs</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#config-file">Config</a> &middot;
  <a href="#programmatic-api">API</a> &middot;
  <a href="#rest-api-server">REST Server</a> &middot;
  <a href="#license">License</a>
</p>

---

もし、npm、PyPI、NuGet、VS Code Marketplace、またはDocker Hubに公開している場合、現在、"今月ダウンロード数は何件ですか？"という質問に答えるために、5つの異なるAPIが必要になります。このライブラリは、それらすべてに対して、CLIまたはプログラムAPIとして、単一のインターフェースを提供します。

依存関係はゼロです。ネイティブの`fetch()`を使用します。Node 18以降が必要です。

## インストール

```bash
npm install @mcptoolshop/registry-stats
```

## CLI (コマンドラインインターフェース)

```bash
# Query a single registry
registry-stats express -r npm
#  npm     | express
#            month: 283,472,710  week: 67,367,773  day: 11,566,113

# Query all registries at once
registry-stats express

# Time series with monthly breakdown + trend
registry-stats express -r npm --range 2025-01-01:2025-06-30
#  2025-01  142,359,021
#  2025-02  147,522,528
#  ...
#  Total: 448,383,383  Avg/day: 4,982,038  Trend: flat (-0.46%)

# Raw JSON output
registry-stats express -r npm --json

# Other registries
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# Create a config file
registry-stats --init

# Run with config — fetches all tracked packages
registry-stats

# Compare across registries
registry-stats express --compare
#  express — comparison
#
#  Metric        npm         pypi
#  ─────────────────────────────────
#  Total         -           -
#  Month         283,472     47,201
#  Week          67,367      11,800
#  Day           11,566      1,686

# Export as CSV or chart-friendly JSON
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# Start a REST API server
registry-stats serve --port 3000
```

## 設定ファイル

プロジェクトのルートディレクトリに`registry-stats.config.json`を作成します（または、`registry-stats --init`を実行します）。

```json
{
  "registries": ["npm", "pypi", "nuget", "vscode", "docker"],
  "packages": {
    "mcpt": {
      "npm": "mcpt",
      "pypi": "mcpt"
    },
    "tool-compass": {
      "npm": "@mcptoolshop/tool-compass",
      "vscode": "mcp-tool-shop.tool-compass"
    }
  },
  "cache": true,
  "cacheTtlMs": 300000,
  "concurrency": 5
}
```

設定されたすべてのパッケージの統計情報を取得するには、引数なしで`registry-stats`を実行します。CLIは、現在の作業ディレクトリから上位のディレクトリを検索し、最も近い設定ファイルを見つけます。

設定ファイルは、プログラム的に利用することも可能です。

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## プログラムAPI

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Single registry
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');
const nuget = await stats('nuget', 'Newtonsoft.Json');
const vscode = await stats('vscode', 'esbenp.prettier-vscode');
const docker = await stats('docker', 'library/node');

// All registries at once (uses Promise.allSettled — never throws)
const all = await stats.all('express');

// Bulk — multiple packages, concurrency-limited (default: 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Time series (npm + pypi only)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Calculations
calc.total(daily);                         // sum of all downloads
calc.avg(daily);                           // daily average
calc.groupTotals(calc.monthly(daily));     // { '2025-01': 134982, ... }
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // 7-day moving average
calc.popularity(daily);                    // 0-100 log-scale score

// Export formats
calc.toCSV(daily);                         // "date,downloads\n2025-01-01,1234\n..."
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [{ label, data }] }

// Comparison — same package across registries
const comparison = await stats.compare('express');
// → { package: 'express', registries: { npm: {...}, pypi: {...} }, fetchedAt: '...' }
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## レジストリのサポート

| レジストリ | パッケージ形式 | 時系列データ | 利用可能なデータ |
| ---------- | --------------- | ------------- | ---------------- |
| `npm` | `express`, `@scope/pkg` | はい (549日間) | lastDay (直近1日), lastWeek (直近1週間), lastMonth (直近1ヶ月) |
| `pypi` | `requests` | はい (180日間) | lastDay (直近1日), lastWeek (直近1週間), lastMonth (直近1ヶ月), total (合計) |
| `nuget` | `Newtonsoft.Json` | No | total (合計) |
| `vscode` | `publisher.extension` | No | total (インストール数), rating (評価), trends (傾向) |
| `docker` | `namespace/repo` | No | total (ダウンロード数), stars (スター数) |

## 組み込みの信頼性

- 429/5xxエラーが発生した場合、指数関数的なバックオフによる自動再試行
- `Retry-After`ヘッダーを尊重
- 大量リクエストに対する同時実行数の制限
- オプションのTTLキャッシュ (プラグイン可能。`StatsCache`インターフェースを通じて、独自のRedis/ファイルバックエンドを提供)

## REST APIサーバー

マイクロサービスとして実行するか、独自のサーバーに組み込むことができます。

```bash
# CLI
registry-stats serve --port 3000
```

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

カスタムサーバーまたはサーバーレス環境でのプログラム的な利用方法。

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## カスタムレジストリ

```typescript
import { registerProvider, type RegistryProvider } from '@mcptoolshop/registry-stats';

const cargo: RegistryProvider = {
  name: 'cargo',
  async getStats(pkg) {
    const res = await fetch(`https://crates.io/api/v1/crates/${pkg}`);
    const json = await res.json();
    return {
      registry: 'cargo' as any,
      package: pkg,
      downloads: { total: json.crate.downloads },
      fetchedAt: new Date().toISOString(),
    };
  },
};

registerProvider(cargo);
await stats('cargo', 'serde');
```

## ウェブサイト

ドキュメント/ランディングページは`site/`にあります。

- 開発: `npm run site:dev`
- ビルド: `npm run site:build`
- プレビュー: `npm run site:preview`

## ライセンス

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
