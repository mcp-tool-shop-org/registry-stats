<p align="center">
  <a href="README.md">English</a> | <strong>日本語</strong> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="registry-stats ロゴ" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  1つのコマンド。5つのレジストリ。すべてのダウンロード統計。
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/">ドキュメント</a> &middot;
  <a href="#インストール">インストール</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#設定ファイル">設定</a> &middot;
  <a href="#プログラマティックapi">API</a> &middot;
  <a href="#rest-apiサーバー">RESTサーバー</a> &middot;
  <a href="#ライセンス">ライセンス</a>
</p>

---

npm、PyPI、NuGet、VS Code Marketplace、Docker Hubにパッケージを公開している場合、「今月のダウンロード数は？」という質問に答えるために5つの異なるAPIが必要です。このライブラリは、CLIまたはプログラマティックAPIとして、すべてを1つのインターフェースで提供します。

依存関係ゼロ。ネイティブ`fetch()`を使用。Node 18+。

## インストール

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# 単一レジストリのクエリ
registry-stats express -r npm

# すべてのレジストリを一度にクエリ
registry-stats express

# 月次内訳 + トレンド付き時系列
registry-stats express -r npm --range 2025-01-01:2025-06-30

# JSON出力
registry-stats express -r npm --json

# その他のレジストリ
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# 設定ファイルを作成
registry-stats --init

# 設定から実行 — 追跡パッケージをすべて取得
registry-stats

# レジストリ間の比較
registry-stats express --compare

# CSVまたはチャート用JSONでエクスポート
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# REST APIサーバーを起動
registry-stats serve --port 3000
```

## 設定ファイル

プロジェクトルートに`registry-stats.config.json`を作成します（または`registry-stats --init`を実行）:

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

引数なしで`registry-stats`を実行すると、設定されたすべてのパッケージの統計を取得します。CLIはcwdから上方に設定ファイルを検索します。

## プログラマティックAPI

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// 単一レジストリ
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// すべてのレジストリを一度に（Promise.allSettledを使用 — スローしない）
const all = await stats.all('express');

// 一括 — 複数パッケージ、並行数制限（デフォルト: 5）
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// 時系列（npm + pypiのみ）
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// 計算
calc.total(daily);                         // ダウンロード合計
calc.avg(daily);                           // 日次平均
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // 7日間移動平均
calc.popularity(daily);                    // 0-100 対数スケールスコア

// エクスポート形式
calc.toCSV(daily);                         // CSV文字列
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// 比較 — レジストリ間で同じパッケージ
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// キャッシュ（5分TTL、インメモリ）
const cache = createCache();
await stats('npm', 'express', { cache });
```

## レジストリサポート

| レジストリ | パッケージ形式 | 時系列 | 利用可能データ |
|----------|---------------|--------|----------------|
| `npm` | `express`, `@scope/pkg` | あり（549日） | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | あり（180日） | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | なし | total |
| `vscode` | `publisher.extension` | なし | total（インストール数）、rating、trends |
| `docker` | `namespace/repo` | なし | total（プル数）、stars |

## 組み込みの信頼性

- 429/5xxエラーに対する指数バックオフ付き自動リトライ
- `Retry-After`ヘッダーの尊重
- 一括リクエストの並行数制限
- オプションのTTLキャッシュ（プラグイン可能 — `StatsCache`インターフェースでRedis/ファイルバックエンドを利用可能）

## REST APIサーバー

マイクロサービスとして実行、または独自のサーバーに組み込み:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # すべてのレジストリ
GET /stats/:registry/:package    # 単一レジストリ
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// クイックスタート
serve({ port: 3000 });

// カスタムサーバー
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

## ライセンス

MIT
