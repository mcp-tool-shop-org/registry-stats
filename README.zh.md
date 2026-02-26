<p align="center">
  <strong>English</strong> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
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

如果您将软件包发布到 npm、PyPI、NuGet、VS Code Marketplace 或 Docker Hub，目前您需要使用五个不同的 API 来回答“我这个月下载了多少次？”。这个库为您提供一个统一的接口，用于访问所有这些平台，可以通过命令行界面 (CLI) 或编程 API 使用。

无任何依赖。使用原生的 `fetch()` 方法。Node 18 及以上版本。

## 安装

```bash
npm install @mcptoolshop/registry-stats
```

## 命令行界面 (CLI)

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

## 配置文件

在您的项目根目录下创建一个 `registry-stats.config.json` 文件（或者运行 `registry-stats --init` 命令）：

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

运行 `registry-stats` 命令，不带任何参数，即可获取所有配置软件包的统计数据。命令行界面会从当前工作目录向上查找最近的配置文件。

配置文件也可以通过编程方式访问：

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## 编程 API

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

## 仓库支持

| 仓库 | 软件包格式 | 时间序列 | 可用数据 |
| ---------- | --------------- | ------------- | ---------------- |
| `npm` | `express`, `@scope/pkg` | 是 (549 天) | 最近一天、最近一周、最近一个月 |
| `pypi` | `requests` | 是 (180 天) | 最近一天、最近一周、最近一个月、总数 |
| `nuget` | `Newtonsoft.Json` | No | 总数 |
| `vscode` | `publisher.extension` | No | 总数（安装量）、评分、趋势 |
| `docker` | `namespace/repo` | No | 总数（拉取次数）、星级 |

## 内置可靠性

- 自动重试，并在遇到 429/5xx 错误时采用指数退避策略
- 尊重 `Retry-After` 头部信息
- 批量请求的并发限制
- 可选的 TTL 缓存（可插拔，通过 `StatsCache` 接口，您可以自定义 Redis 或文件后端）

## REST API 服务器

可以作为微服务运行，也可以嵌入到您自己的服务器中：

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

用于自定义服务器或无服务器环境的编程用法：

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## 自定义仓库

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

## 网站

网站和主页位于 `site/` 目录下。

- 开发：`npm run site:dev`
- 构建：`npm run site:build`
- 预览：`npm run site:preview`

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
