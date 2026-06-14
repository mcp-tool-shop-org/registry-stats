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
  <a href="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/ci.yml"><img src="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml"><img src="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml/badge.svg" alt="Pages"></a>
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

npm、PyPI、NuGet、VS Code Marketplace、Docker Hubに公開します。現在、「自分のパッケージの状況はどうなっているか？」という質問に答えるには、5つの異なるサイトを確認する必要があります。**registry-stats**は完全なプラットフォームです：TypeScriptエンジン（CLI + API + RESTサーバー）、リアルタイムのWebダッシュボード、およびネイティブWindowsデスクトップアプリ—すべて1つのリポジトリから提供されます。

実行時の依存関係はありません。ネイティブの`fetch()`を使用します。Node 18以上が必要です。

## 内容

| レイヤー | 機能 |
|-------|-------------|
| **Engine** | TypeScriptライブラリ + CLI + RESTサーバー + AI推論。単一のインターフェースで5つのレジストリをクエリします。npmに`@mcptoolshop/registry-stats`として公開されています。 |
| **Dashboard** | AI推論パネル（健全性スコア、予測、実行可能なアドバイス）、Pulse AIコパイロット（ストリーミング音声、Web検索、フルスクリーン、GitHubデータコネクタ）、ズーム/パン機能付きの7つのインタラクティブチャート、リアルタイムリフレッシュ、レポートのエクスポート（PDF / JSONL / Markdown）、タブ形式のヘルプガイドを備えたAstroベースのWebアプリ。CIによって毎日再構築され、必要に応じて更新できます。 |
| **Desktop** | WinUI 3 + WebView2を使用したネイティブWindowsアプリ。ダッシュボードをオフラインでバンドルし、必要に応じてリアルタイムの統計情報を取得します。 |

## ダッシュボード

自己更新型の統計ダッシュボードは[`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/)にあります。

- **タブインターフェース** — ホーム、分析、リーダーボード、ヘルプのタブ
- **Pulse AIコパイロット** — Ollamaを搭載した会話型アシスタントで、ストリーミング音声合成（LLMがストリームする際に話します。4つの音声は[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)経由）、Web検索（Wikipedia +オプションのSearXNG）、自動発声、フルスクリーンモード、GitHub組織データコネクタ、モデルセレクター、および会話メモリを備えています。
- **概要スナップショット** — 健全性スコア（0〜100）、多様性指数、週ごとの変化、すべてのレジストリにおける合計ダウンロード数
- **7つのインタラクティブチャート** — 30日間のトレンド（集計/レジストリごと/上位5つの切り替え+クリックしてドリルダウン+スクロールによるズーム/パン）、レジストリのシェア（極座標）、ポートフォリオのリスク（ヒストグラム+GiniとP90）、上位10の勢い、スパークライン付きの速度トラッカー、30日間のヒートマップ（2σ以上のスパイク検出）、およびポートフォリオのトレンド（積み上げ棒グラフ、年間）
- **スマート成長エンジン** — 小さな分母による歪みを、ベースラインしきい値、パーセンテージ上限、および減衰速度式を使用して処理します。
- **AI推論パネル** — ポートフォリオの勢い（-100〜+100）、リスクスコア、7日間の予測と信頼区間、自動化された推奨事項、重大度/緊急度のレベルを備えた実行可能なアドバイス、およびパッケージの健全性スコアボード（A〜Fのグレード）
- **実行可能なアドバイス** — 重大度タグ付きのアドバイスカード（クリティカル/警告/情報/成功）、緊急度レベル、具体的なアクションステップ、および影響を受けるパッケージリスト
- **パッケージの健全性スコア** — 0〜100の複合スコア（アクティビティ+一貫性+成長+安定性）で、パッケージごとにグレードが割り当てられます。
- **年間の進捗状況追跡** — 永続的な履歴レイヤーは、月ごとのパッケージおよび週ごとのポートフォリオ集計を蓄積します。レジストリごとに積み重ねたポートフォリオのトレンドチャートを表示します。
- **Pulseパネル** — 確立された主要パッケージ（≥50ダウンロード/週）と新興パッケージを分割表示し、インラインの7日間のスパークライン、絶対値+パーセンテージの変化、ベースラインコンテキスト、および1行の概要を表示します。
- **リアルタイムリフレッシュ** — npmおよびPyPI APIから必要に応じて最新の数値をクライアント側で取得します。結果は`sessionStorage`（5分のTTL）にキャッシュされるため、タブを切り替えても即座に表示されます。
- **レポートのエクスポート** — リフレッシュボタンの横にあるドロップダウンメニューから、3つの形式を選択できます：**Exec PDF**（jsPDF経由）、**LLM JSONL**（AIによる取り込み用の型付きレコード）、および**Dev Markdown**（GFMテーブル）。
- **リーダーボード** — 132個のパッケージが週ごとのダウンロード数でランク付けされ、インラインの30日間のスパークラインとスマートなトレンドバッジが表示されます。
- **設定ページ** — バリデーションを備えたポートフォリオエディター、レジストリ同期コンパニオンセクション、およびパイプライン概要があります。
- **リーダーボード検索** — 名前またはレジストリでパッケージをすばやく見つけるためのインスタントテキストフィルター。
- **キーボードナビゲーション** — タブ間を移動するための矢印キー。
- **ヘルプタブ** — すべてのタブ、主要な概念、AI推論エンジン、データパイプライン、および役立つリンクについて説明する、わかりやすいガイド。
- **ダーク/ライトテーマ** — システム設定に従います。
- **モバイル対応** — 小さな画面用のハンバーガーメニュー。

データは毎日CI（06:00 UTC）によって更新され、サイト全体は毎週再構築されます（月曜日06:00 UTC）。リアルタイムリフレッシュでは、必要に応じてレジストリAPIから最新の数値が直接取得されます。追跡するパッケージは`site/src/data/packages.json`で設定します。

## AI推論エンジン

実行時の依存関係がなく、純粋な数学的推論であり、ビルド時に実行されます—MLランタイムや外部APIはありません。

```typescript
import {
  forecast, detectAnomalies, segmentTrends,
  detectSeasonality, computeMomentum,
  generateRecommendations, computeHealthScore,
  generateActionableAdvice, computeYearlyProgress,
  inferPortfolio,
} from '@mcptoolshop/registry-stats';

// 7-day forecast with 80% confidence intervals
const predictions = forecast(dailySeries, 7);
// → [{ day: 1, predicted: 142, lower: 98, upper: 186 }, ...]

// Anomaly detection (adaptive rolling z-score, 14-day window)
const anomalies = detectAnomalies(dailySeries);
// → [{ day: 20, value: 1500, expected: 120, zscore: 4.2, type: 'spike' }]

// Composite momentum score (-100 to +100)
const momentum = computeMomentum(dailySeries);

// Package health score (0-100 with A-F grade)
const health = computeHealthScore('my-pkg', 'npm', dailySeries, momentum);
// → { score: 72, grade: 'B', components: { activity: 20, consistency: 18, growth: 16, stability: 18 } }

// Yearly progress from monthly history
const progress = computeYearlyProgress('my-pkg', 'npm', monthlyHistory);
// → { currentYearTotal, yoyGrowthPct, projectedYearEnd, milestones, ... }

// Full portfolio analysis (now includes health scores + actionable advice)
const result = inferPortfolio(leaderboard, { gini: 0.6, npmPct: 85 });
// → { packages, forecastTotal7, riskScore, portfolioMomentum, recommendations, healthScores, actionableAdvice }
```

| 機能 | 方法 | 機能 |
|-----------|--------|-------------|
| **Forecast** | 重み付き線形回帰 | 指数関数的な最近性バイアス、時間の経過とともに広がる80%の信頼区間 |
| **Anomaly detection** | 適応型ローリングzスコア | 14日間のベースラインウィンドウで、スパイクとドロップを検出します。 |
| **Trend segmentation** | 区分線形 | 時系列における上昇/下降/平坦なセグメントを識別します。 |
| **Seasonality** | 曜日分解 | 毎週のパターンを検出し、ピーク日を報告します。 |
| **Momentum** | 複合スコア | 方向+加速度+一貫性+ボリューム |
| **Health score** | 多要素複合 | アクティビティ+一貫性+成長+安定性（0〜100、A〜Fのグレード） |
| **Yearly progress** | 月次集計 | 前年比成長率、年間予測、マイルストーン追跡 |
| **Actionable advice** | 重大度ルールエンジン | 緊急度と具体的なアクションを備えたクリティカル/警告/情報/成功 |
| **Recommendations** | ルールエンジン | 成長、リスク、機会、および注意のカテゴリ |

## デスクトップアプリ

ダッシュボードをローカルのWebView2シェルにラップしたネイティブWindowsアプリ。

* **オフライン対応:** バンドルされたHTML/CSS/JSを搭載。インターネット接続なしで動作します。
* **ライブリフレッシュ:** 必要に応じてGitHub Pagesから`stats.json`を取得します。
* **CSVエクスポート:** ワンクリックでリーダーボードデータをエクスポートできます。
* **MSIXパッケージ化:** `desktop-ci.yml`を使用してCIでビルドおよび署名されます。

デスクトップソースは`desktop/`にあります。WinUI 3をターゲットとした.NET 10 MAUIで構築されています。

## インストール

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

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

# Discover all your npm packages by maintainer name
registry-stats --mine mikefrilot

# JSON output for maintainer discovery
registry-stats --mine mikefrilot --format json

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

引数なしで`registry-stats`を実行すると、構成されたすべてのパッケージの統計情報が取得されます。CLIは現在の作業ディレクトリから設定ファイルを見つけます。

設定はプログラムでも利用できます。

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## プログラムによるAPI

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

// Maintainer discovery — find all npm packages by username
const mine = await stats.mine('mikefrilot');
// Returns PackageStats[] sorted by monthly downloads

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## レジストリサポート

| レジストリ | パッケージ形式 | 時系列データ | 利用可能なデータ |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | はい（549日） | lastDay、lastWeek、lastMonth |
| `pypi` | `requests` | はい（180日） | lastDay、lastWeek、lastMonth、total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total（インストール数）、評価、トレンド |
| `docker` | `namespace/repo` | No | total（プル数）、スター数 |

## 組み込みの信頼性

- 429/5xxエラー発生時に指数関数的なバックオフで自動再試行
- `Retry-After`ヘッダーを尊重します。
- `AbortSignal.timeout`を使用して30秒のリクエストタイムアウトを設定します。
- 大量のリクエストに対する同時実行数の制限
- オプションのTTLキャッシュ（プラグイン可能 - 独自のRedis/ファイルバックエンドを`StatsCache`インターフェース経由で提供）
- サプライチェーンセキュリティのためのSHAピン留めされたGitHub Actions

## REST APIサーバー

マイクロサービスとして実行するか、独自のサーバーに組み込みます。

```bash
registry-stats serve --port 3000
```

デフォルトでは、`serve`は`127.0.0.1`（ローカルホストのみ）にバインドし、CORSを`*`に設定します。ネットワーク上で公開するには`--host 0.0.0.0`を使用し、クロスオリジンアクセスを制限するには`--cors <origin>`を使用します。

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

カスタムサーバーまたはサーバーレス環境でのプログラムによる使用：

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

## リポジトリ構造

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
| **Data touched** | npm、PyPI、NuGet、VS Code Marketplace、Docker Hubからのパブリックダウンロード統計。インメモリキャッシュ（オプション） |
| **Data NOT touched** | テレメトリなし。分析なし。認証情報ストレージなし。ユーザーデータなし。ファイル書き込みなし |
| **Permissions** | 読み取り：HTTPS経由のパブリックレジストリAPI。書き込み：stdout/stderrのみ |
| **Network** | パブリックレジストリAPIへのHTTPSアウトバウンド。オプションのローカルホストRESTサーバー |
| **Telemetry** | 収集または送信されるデータはありません |

脆弱性報告については、[SECURITY.md](SECURITY.md)を参照してください。

## スコアカード

| カテゴリ | スコア |
|----------|-------|
| A. セキュリティ | 10 |
| B. エラー処理 | 10 |
| C. 運用ドキュメント | 10 |
| D. リリース衛生管理 | 10 |
| E. ID（ソフト） | 10 |
| **Overall** | **50/50** |

> 完全な監査：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## ライセンス

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>によって構築されました。
