<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats/readme.png" alt="registry-stats logo" width="400" />
</p>

<p align="center">
  Five registries. One engine. Dashboard included.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml"><img src="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/registry-stats"><img src="https://img.shields.io/npm/v/@mcptoolshop/registry-stats" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/dashboard/"><img src="https://img.shields.io/badge/Dashboard-live-green" alt="Dashboard"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#dashboard">Dashboard</a> &middot;
  <a href="#desktop-app">Desktop App</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#programmatic-api">API</a> &middot;
  <a href="#rest-api-server">REST Server</a> &middot;
  <a href="#config-file">Config</a> &middot;
  <a href="#license">License</a>
</p>

---

npm、PyPI、NuGet、Visual Studio Code Marketplace、Docker Hub などのプラットフォームに公開できます。現在、「私のパッケージの状況はどうなっているか？」を知るには、5つの異なるサイトを確認する必要があります。**registry-stats** は、それらを統合したプラットフォームです。TypeScript で構築されたエンジン（CLI + API + REST サーバー）、リアルタイムの Web ダッシュボード、そしてネイティブの Windows デスクトップ アプリケーション。これらはすべて、1つのリポジトリから提供されます。

実行時の依存関係はありません。ネイティブの `fetch()` を使用します。Node 18 以降が必要です。

## 構成要素

| レイヤー | 機能 |
|-------|-------------|
| **Engine** | TypeScript ライブラリ + CLI + REST サーバー。1つのインターフェースで、5つのレジストリをクエリできます。npm で `@mcptoolshop/registry-stats` として公開されています。 |
| **Dashboard** | Astroで構築されたWebアプリケーション。Pulse AIのコパイロット機能（音声出力、フルスクリーン表示、GitHubデータ連携）、インタラクティブなグラフ6種類、リアルタイム更新、レポートのエクスポート機能（PDF/JSONL/Markdown）、タブ形式のヘルプガイドなどを搭載しています。毎週CIによって再構築され、必要に応じて更新可能です。 |
| **Desktop** | WinUI 3 + WebView2 を使用したネイティブ Windows アプリケーション。ダッシュボードをオフラインで利用できるようにバンドルし、必要に応じてリアルタイムの統計情報を取得します。 |

## ダッシュボード

自己更新型の統計ダッシュボードは、[`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/) にあります。

- **タブインターフェース:** ホーム、分析、ランキング、ヘルプのタブ
- **Pulse AIコパイロット:** Ollamaを搭載した会話アシスタント。音声出力（[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)による4種類の音声）、自動音声再生、フルスクリーンモード、GitHub組織のデータ連携、ストリーミング応答、モデル選択機能、会話履歴機能
- **概要:** ヘルススコア（0～100）、多様性指標、週間変化、すべてのレジストリにおける合計ダウンロード数
- **インタラクティブグラフ6種類:** 30日間のトレンド（集計/レジストリ別/上位5件の切り替え）、レジストリのシェア（極座標グラフ）、ポートフォリオのリスク（ヒストグラム + Gini係数 & P90）、上位10件の動向、速度トラッカー（スパークライン付き）、30日間のヒートマップ（異常値検出（>2σ））
- **スマート成長エンジン:** 小規模なデータにおける歪みを、基準値の閾値、割合制限、および減衰速度の計算式によって処理
- **アクション可能なインサイト:** 減少傾向にあるパッケージに対する自動生成された推奨事項と注意喚起
- **Pulseパネル:** 確立されたパッケージ（週50ダウンロード以上）と、新興・新規パッケージを分割表示。インラインの7日間のスパークライン、絶対値および割合の変化、基準値のコンテキスト、および簡潔な概要を表示
- **リアルタイム更新:** npmおよびPyPIのAPIからクライアント側でオンデマンドでデータを取得し、進捗状況を表示。取得した結果はsessionStorageにキャッシュされ（有効期限5分）、タブの切り替えを高速化
- **レポートのエクスポート:** 更新ボタンの隣にあるドロップダウンメニューから、以下の3つの形式を選択可能：**Exec PDF**（jsPDFを使用）、**LLM JSONL**（AIへのデータ取り込みを考慮した形式）、**Dev Markdown**（GFMテーブル）
- **ランキング:** 132のパッケージを、週ごとのダウンロード数でランキング表示。インラインの30日間のスパークラインと、スマートなトレンドバッジを表示
- **設定ページ:** ポートフォリオエディタ（検証機能付き）、レジストリ同期機能、パイプラインの概要
- **ヘルプ:** すべてのタブ、主要な概念、AIアシスタントのヒント、データパイプライン、および役立つリンクを網羅したユーザーフレンドリーなガイド
- **テーマ:** システムの好みに合わせて、ダーク/ライトテーマを切り替え

データはビルド時に取得され、毎週月曜日の午前6時（UTC）にCIによって再構築されます。リアルタイム更新は、レジストリのAPIから直接最新のデータを取得します。追跡対象のパッケージは、`site/src/data/packages.json`で設定します（5つのレジストリに合計132のパッケージ）。

## デスクトップ アプリケーション

ダッシュボードをローカルの WebView2 シェルでラップした、ネイティブの Windows アプリケーションです。

- **オフライン対応**：HTML/CSS/JS がバンドルされているため、インターネット接続なしで動作します。
- **リアルタイム更新**：GitHub Pages から `stats.json` をオンデマンドで取得します。
- **CSV エクスポート**：ランキングデータをワンクリックで CSV 形式でエクスポートできます。
- **MSIX パッケージ**：CI で `desktop-ci.yml` を使用してビルドおよび署名されます。

デスクトップアプリケーションのソースコードは、`desktop/` にあります。 .NET 10 MAUI を使用して、WinUI 3 をターゲットに構築されています。

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
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## レジストリのサポート

| レジストリ | パッケージ形式 | 時系列データ | 利用可能なデータ |
|----------|---------------|-------------|----------------|
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

## リポジトリの構成

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## 開発

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## セキュリティとデータ範囲

| 側面 | 詳細 |
|--------|--------|
| **Data touched** | npm、PyPI、NuGet、Visual Studio Code Marketplace、Docker Hub から取得する公開ダウンロード統計。オプションで、メモリ内キャッシュを使用します。 |
| **Data NOT touched** | テレメトリー、分析、認証情報の保存、ユーザーデータ、ファイル書き込みは一切行いません。 |
| **Permissions** | 読み込み：HTTPS を使用した公開レジストリ API。書き込み：標準出力/標準エラー出力のみ。 |
| **Network** | HTTPS を使用して公開レジストリ API にアクセスします。オプションで、ローカルの REST サーバーを使用します。 |
| **Telemetry** | 収集または送信されるデータはありません。 |

脆弱性に関する報告については、[SECURITY.md](SECURITY.md) を参照してください。

## スコアカード

| カテゴリ | スコア |
|----------|-------|
| A. セキュリティ | 10 |
| B. エラー処理 | 10 |
| C. 運用ドキュメント | 10 |
| D. ソフトウェアの品質 | 10 |
| E. 識別情報（重要度：低） | 10 |
| **Overall** | **50/50** |

詳細な監査：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## ライセンス

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって作成されました。
