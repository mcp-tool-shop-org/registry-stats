<p align="center">
  <a href="README.md">English</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats/readme.png" alt="registry-stats logo" width="400" />
</p>

<p align="center">
  Six registries. One engine. Dashboard included.
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

npm、PyPI、NuGet、VS Code Marketplace、Docker Hub、GitHub Releasesに公開します。現在、「自分のパッケージの状況はどうなっているか？」という質問に答えるには、6つの異なるサイトを確認する必要があります。**registry-stats**は、TypeScriptエンジン（CLI + API + RESTサーバー）、リアルタイムのWebダッシュボード、ネイティブのWindowsデスクトップアプリを備えた完全なプラットフォームであり、すべて1つのリポジトリから提供されます。

実行時の依存関係はありません。ネイティブの`fetch()`を使用します。Node 18以上。

## 内容

| レイヤー | 機能 |
|-------|-------------|
| **Engine** | TypeScriptライブラリ + CLI + RESTサーバー + AI推論。npm、PyPI、NuGet、VS Code Marketplace、Docker Hub、GitHub Releasesの6つのレジストリを1つのインターフェースでクエリします。プレーンなパッケージ名でnpm、PyPI、NuGet、VS Code Marketplace、Docker Hubをクエリします。GitHub Releasesは、名前がowner/repoの場合、またはレジストリがgithubという名前をリストに含める場合に含めます。npmに`@mcptoolshop/registry-stats`として公開されます。 |
| **Dashboard** | AI推論パネル（健全性スコア、予測、実行可能なアドバイス）、Pulse AI共同パイロット（ストリーミング音声、Web検索、フルスクリーン、GitHubデータコネクタ）、7つのチャート（30日間のトレンドとポートフォリオのトレンドのみでスクロールズームとパンが可能）、リアルタイム更新、レポートのエクスポート（PDF / JSONL / Markdown）、タブ付きのヘルプガイドを備えたAstroベースのWebアプリ。毎日CIがダッシュボードデータを取得します。サイトは毎週月曜日の07:00 UTCに再ビルドされます。 |
| **Desktop** | WinUI 3 + WebView2を使用したネイティブWindowsアプリ。ダッシュボードをオフラインでバンドルし、必要に応じてリアルタイムの統計情報を取得します。 |

## ダッシュボード

自己更新型の統計ダッシュボードは、[`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/)にあります。

- **タブ付きインターフェース** — ホーム、分析、リーダーボード、ヘルプのタブ
- **Pulse AI共同パイロット** — Ollamaを搭載した会話型アシスタント。ストリーミング音声合成（LLMがストリーミングする際に音声で応答、[mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)経由で4つの音声）、Web検索（Wikipedia + オプションのSearXNG）、自動音声読み上げ、フルスクリーンモード、GitHub組織データコネクタ、モデルセレクター、会話履歴
- **概要スナップショット** — 健全性スコア（0〜100）、多様性指数、週ごとの変化。週ごとおよび月ごとのダウンロード数は、npmとPyPIです。VS Code、NuGet、Docker、GitHubは、合計の2つの数値ではなく、これまでの合計数に貢献します。
- **7つのインタラクティブチャート** — 30日間のトレンド（集計 / レジストリごと / 上位5つの切り替え + クリックして詳細を表示）、レジストリのシェア（極座標）、ポートフォリオのリスク（ヒストグラム + ジニ係数とP90）、上位10の勢い、スパークライン付きの速度トラッカー、スパイク検出（> 2σ）を備えた30日間のヒートマップ、ポートフォリオのトレンド（積み上げ棒グラフ、年間）。スクロールズームとパンは、30日間のトレンドとポートフォリオのトレンドでのみ可能です。
- **スマート成長エンジン** — ベースラインしきい値、パーセンテージ上限、減衰速度式を使用して、小さな分母による歪みを処理します。
- **AI推論パネル** — ポートフォリオの勢い（-100〜+100）、リスクスコア、信頼区間付きの7日間の予測、自動化された推奨事項、重大度/緊急度のレベルを備えた実行可能なアドバイス、パッケージの健全性スコアボード（A〜Fの評価）
- **実行可能なアドバイス** — 重大度タグ付きのアドバイスカード（重大/警告/情報/成功）で、緊急度のレベル、具体的なアクションステップ、および影響を受けるパッケージのリストを表示します。
- **パッケージの健全性スコア** — 0〜100の複合スコア（アクティビティ + 一貫性 + 成長 + 安定性）で、パッケージごとに文字評価を付与します。
- **年間の進捗状況の追跡** — 永続的な履歴レイヤーが、パッケージごとの月次およびポートフォリオごとの週次集計を蓄積します。レジストリごとに積み重ねたポートフォリオのトレンドチャート。
- **Pulseパネル** — 確立された主要パッケージ（≥ 50ダウンロード/週）と、新興および新規パッケージを分割表示し、インラインの7日間のスパークライン、絶対値 + パーセンテージの変化、ベースラインのコンテキスト、および1行の概要を表示します。
- **リアルタイム更新** — ページは、同じオリジンの`data/stats.json`を再取得します。そのファイルがビルドよりも新しい場合にのみ更新されます。ブラウザからnpmまたはPyPI APIを呼び出しません。`sessionStorage`には、オプションのGitHub PATが保存され、統計キャッシュは保存されません。
- **レポートのエクスポート** — 更新ボタンの横にあるドロップダウンメニューから、3つの形式を選択できます。**Exec PDF**（jsPDF経由）、**LLM JSONL**（AIによる取り込み用の型付きレコード）、**Dev Markdown**（GFMテーブル）。
- **リーダーボード** — `packages.json`に追跡されている268個のID（npm 168個、PyPI 43個、VS Code 6個、NuGet 27個、GitHub 24個）。ダウンロード数でランク付けされます。npmとPyPIは週単位、VS Code、NuGet、Docker、GitHubはこれまでの合計です。30日間のスパークラインは、npmシリーズです。スマートなトレンドバッジは、ダウンロード数の少ないパッケージに対して誤解を招く可能性のあるパーセンテージを表示しないようにします。
- **設定ページ** — 検証を備えたポートフォリオエディター、レジストリ同期コンパニオンセクション、パイプラインの概要。
- **リーダーボード検索** — 名前またはレジストリでパッケージを検索するためのインスタントテキストフィルター。
- **キーボードナビゲーション** — タブを切り替えるには、矢印キーを使用します。
- **ヘルプタブ** — すべてのタブ、主要な概念、AI推論エンジン、データパイプライン、および役立つリンクを網羅した、わかりやすいガイド。
- **ダーク/ライトテーマ** — システムの好みを適用します。
- **モバイル対応** — 小さな画面用のハンバーガーメニュー。

データは毎日CI（06:00 UTC）によって更新され、サイト全体は毎週（月曜日07:00 UTC）に再ビルドされます。ダッシュボードは、同じオリジンの`data/stats.json`を再取得します。追跡するパッケージは、`site/src/data/packages.json`で設定します。

## AI推論エンジン

依存関係がなく、純粋な数学的推論であり、ビルド時に実行されます。MLランタイムや外部APIはありません。

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
// → { packages, forecastTotal7, riskScore, diversityTrend, portfolioMomentum, recommendations, healthScores, actionableAdvice }
// diversityTrend is 'improving' | 'stable' | 'declining'
```

| 機能 | 方法 | 機能 |
|-----------|--------|-------------|
| **Forecast** | 重み付き線形回帰 | 指数関数的な最近性バイアス、時間の経過とともに広がる80%の信頼区間 |
| **Anomaly detection** | 適応型ローリングZスコア | 14日間のベースラインウィンドウ、スパイクとドロップを検出 |
| **Trend segmentation** | 区分線形 | 時系列における上昇/下降/平坦なセグメントを識別 |
| **Seasonality** | 曜日分解 | 毎週のパターンを検出し、ピークの曜日を報告 |
| **Momentum** | 複合スコア | 方向 + 加速度 + 一貫性 + ボリューム |
| **Health score** | 多要素複合 | アクティビティ + 一貫性 + 成長 + 安定性（0〜100、A〜Fの評価） |
| **Yearly progress** | 月次集計 | 前年比成長率、年間予測、マイルストーンの追跡 |
| **Actionable advice** | 重大度ルールエンジン | 緊急度と具体的なアクションを備えた、重大/警告/情報/成功 |
| **Recommendations** | ルールエンジン | 成長、リスク、機会、および注目度カテゴリ |

## デスクトップアプリ

ローカルのWebView2シェルにダッシュボードをラップしたネイティブWindowsアプリ。

- **オフライン対応** — バンドルされたHTML/CSS/JSを搭載。インターネット接続なしでも動作します。
- **リアルタイム更新** — 保存されたポートフォリオがない場合、GitHub Pagesの`stats.json`をダウンロードします。保存されたポートフォリオがある場合、各名前をそのレジストリに送信し、ポートフォリオファイルをアップロードしません。
- **CSVエクスポート** — ワンクリックでリーダーボードデータをエクスポートします。
- **MSIXパッケージ化** — CIでビルドおよび署名され、`desktop-ci.yml`を使用します。

デスクトップソースは、`desktop/`にあります。WinUI 3をターゲットとした.NET 10 MAUIで構築されています。

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
registry-stats mcp-tool-shop-org/registry-stats -r github

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

プロジェクトのルートに`registry-stats.config.json`を作成するか（または`registry-stats --init`を実行します）。

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

引数なしで`registry-stats`を実行すると、設定されているすべてのパッケージの統計情報を取得します。CLIは、現在の作業ディレクトリから上位ディレクトリをたどって、最も近い設定ファイルを見つけます。上記の`registries`配列は、デフォルトの5つのパッケージです。GitHubのリリースを含めるには、`"github"`を追加します。これらのパッケージは、`owner/repo`というスラッグを持ちます。設定ファイルがない場合、パッケージのクエリは、名前が「owner/repo」でない限り、GitHubのリリースを除いて、すべての組み込みレジストリを使用します。レジストリのリストにgithubを含めても、クエリは実行され、プレーンな名前の場合、そのレジストリからエラーが発生します。

設定は、プログラムでも利用できます。

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## プログラムによる API

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Single registry
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');
const nuget = await stats('nuget', 'Newtonsoft.Json');
const vscode = await stats('vscode', 'esbenp.prettier-vscode');
const docker = await stats('docker', 'library/node');

// All registries at once. Provider failures stay off the success list
// and are listed on .errors. An invalid name throws RegistryError before any request.
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

## レジストリのサポート

| レジストリ | パッケージ形式 | 時系列 | 利用可能なデータ |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | はい（549 日） | lastDay、lastWeek、lastMonth |
| `pypi` | `requests` | はい（180 日） | lastDay、lastWeek、lastMonth、total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total（インストール数）、評価、トレンド |
| `docker` | `namespace/repo` | No | total（プル数）、スター数 |
| `github` | `owner/repo` | No | 合計（アセットのダウンロード数）、リリース、アセット、最新タグ |

## 組み込みの信頼性

- 429/5xx エラーが発生した場合の指数関数的バックオフによる自動再試行
- `Retry-After` ヘッダーを尊重します
- 30 秒のリクエストタイムアウト（`AbortSignal.timeout` を介して）
- バルクリクエストの同時実行数の制限
- オプションの TTL キャッシュ（プラグイン可能 — `StatsCache` インターフェイスを介して独自の Redis/ファイルバックエンドを使用）
- サプライチェーンのセキュリティのための SHA で固定された GitHub Actions

## REST API サーバー

マイクロサービスとして実行するか、独自のサーバーに組み込みます。

```bash
registry-stats serve --port 3000
```

デフォルトでは、`serve` は `127.0.0.1`（localhost のみ）にバインドされ、CORS を `*` に設定します。ネットワーク上で公開するには `--host 0.0.0.0` を使用し、クロスオリジンアクセスを制限するには `--cors <origin>` を使用します。

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

カスタムサーバーまたはサーバーレスでのプログラムによる使用。

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server.
// listen(port) with no host binds every interface. This sample stays on loopback.
// createHandler defaults Access-Control-Allow-Origin to *. Pass corsOrigin to narrow it.
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000, '127.0.0.1');
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

### デスクトップアプリ

.NET 10 SDKを搭載したWindows。最初に`npm run site:build`を実行して、`site/dist`が存在するようにします。プロジェクトは、それを出力の`wwwroot/registry-stats`にコピーします。

```bash
dotnet workload install maui-windows
npm run site:build
dotnet build desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
# or
dotnet publish desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
```

署名されたMSIXは、`desktop-ci.yml`からのCI成果物です。これはGitHubのリリースダウンロードではなく、ストアへのアップロードでもありません。WindowsデスクトップアプリであるRegistry Pulseは、https://apps.microsoft.com/detail/9P9TR0055JG9にリストされています。このリポジトリのパッケージバージョンは3.4.0.0です。パートナーセンターがアップロードするファイルを署名します。

## セキュリティとデータ範囲

| 側面 | 詳細 |
|--------|--------|
| **Data touched** | npm、PyPI、NuGet、VS Code Marketplace、Docker Hub、およびGitHubリリースのパブリックダウンロード統計。オプションのインメモリキャッシュ。`registry-stats --init`は`registry-stats.config.json`に書き込みます。デスクトップアプリは、`packages.json`と`stats.json`を`%LOCALAPPDATA%\RegistryPulse`の下に書き込みます。 |
| **Credentials** | `--init`はトークンを書き込みません。設定ファイルにトークン（`dockerToken`または`githubToken`）を追加すると、その値はファイルに保持されます。CLIは、Docker HubにBearerトークンとして`dockerToken`を送信し、Bearerトークンとして`githubToken`を`api.github.com`にのみ送信します。このツール自体は、どちらのトークンも書き込みません。ダッシュボードは、GitHubのPATを`sessionStorage`に保持し、それを`api.github.com`に送信できます。 |
| **Data NOT touched** | テレメトリなし。分析なし。ユーザーアカウントなし。 |
| **Permissions** | 読み取り：HTTPS経由のパブリックレジストリAPI、およびトークンが提供された場合の認証された呼び出し。書き込み：stdout/stderr、`registry-stats.config.json`を`--init`に、およびデスクトップファイルを`%LOCALAPPDATA%\RegistryPulse`の下に。ユーザーが指定したポートでのオプションのRESTサーバー。 |
| **Network** | `api.npmjs.org`、`registry.npmjs.org`（`--mine`）、`pypistats.org`、`azuresearch-usnc.nuget.org`、`marketplace.visualstudio.com`、`hub.docker.com`、および`api.github.com`（GitHubリリース）へのHTTPSアウトバウンド。デスクトップの更新では、`mcp-tool-shop-org.github.io`からも統計情報をダウンロードします。オプションのローカルホストRESTサーバー。 |
| **Telemetry** | 収集または送信されるものはありません |

脆弱性に関する報告については、[SECURITY.md](SECURITY.md) を参照してください。

## スコアカード

| カテゴリ | スコア |
|----------|-------|
| A. セキュリティ | 10 |
| B. エラー処理 | 8 |
| C. 運用ドキュメント | 10 |
| D. リリースの衛生管理 | 8 |
| E. 識別子（ソフト） | 10 |
| **Overall** | **46/50** |

> 完全な監査: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## ライセンス

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> によって作成されました
