<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

您可以在 npm、PyPI、NuGet、VS Code Marketplace 以及 Docker Hub 上发布。目前，要了解“我的软件包表现如何？”，您需要查看五个不同的网站。**registry-stats** 是一个完整的平台：一个 TypeScript 引擎（命令行工具 + API + REST 服务器），一个实时 Web 控制面板，以及一个原生 Windows 桌面应用程序——所有这些都来自一个代码仓库。

没有运行时依赖。使用原生的 `fetch()` 方法。Node 18 或更高版本。

## 包含内容

| 层级 | 功能 |
|-------|-------------|
| **Engine** | TypeScript 库 + 命令行工具 + REST 服务器。使用一个界面查询五个注册中心。已在 npm 上发布为 `@mcptoolshop/registry-stats`。 |
| **Dashboard** | 基于 Astro 的 Web 应用程序。提供 AI 聊天助手、6 个交互式图表、智能增长引擎和带选项卡的帮助指南。每周通过 CI 自动重建。 |
| **Desktop** | 基于 WinUI 3 + WebView2 的原生 Windows 应用程序。将控制面板打包到本地，按需获取实时统计数据。 |

## 控制面板

一个自动更新的统计信息控制面板位于 [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/)。

- **选项卡界面** — Home、Analytics、Leaderboard 和 Help 选项卡
- **AI 聊天助手** — 基于 Ollama 的 Registry Assistant，支持 RAG 上下文注入、流式响应、模型选择器和对话记忆
- **执行摘要** — 健康分数（0–100）、多样性指数、周变化、所有注册中心的总下载量
- **6 个交互式图表** — 30 天趋势（汇总 / 按注册中心 / Top 5 切换）、注册中心份额（极坐标图）、组合风险（分布直方图 + Gini & P90）、Top 10 动量、带迷你图的速度追踪器、以及 30 天热力图（尖峰检测 >2σ）
- **智能增长引擎** — 处理小分母失真，提供基线阈值、百分比上限和阻尼速度公式
- **可操作洞察** — 自动生成的建议和下降软件包的注意警报
- **排行榜** — 所有软件包按周下载量排序，带有 30 天迷你图和智能趋势标记
- **设置页面** — 组合编辑器、验证功能、registry-sync 配套部分和管道概览
- **帮助选项卡** — 涵盖每个选项卡、关键概念、AI 助手使用技巧、数据管道和有用链接的友好指南
- **深色/浅色主题** — 根据系统偏好设置自动切换

数据在构建时获取，并每周通过 CI 自动重建（每周一 06:00 UTC）。在 `site/src/data/packages.json` 文件中配置要跟踪的软件包。

## 桌面应用程序

一个原生 Windows 应用程序，它将控制面板封装在一个本地 WebView2 容器中：

- **离线可用**：包含打包的 HTML/CSS/JS 文件；无需互联网连接即可使用。
- **实时刷新**：从 GitHub Pages 上的 `stats.json` 文件获取实时统计数据。
- **CSV 导出**：一键导出排行榜数据。
- **MSIX 软件包**：通过 `desktop-ci.yml` 在 CI 环境中构建和签名。

桌面应用程序的源代码位于 `desktop/` 目录中。使用 .NET 10 MAUI 构建，目标是 WinUI 3。

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
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## 仓库支持

| 仓库 | 软件包格式 | 时间序列 | 可用数据 |
|----------|---------------|-------------|----------------|
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

## 代码仓库结构

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## 开发

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## 安全性和数据范围

| 方面 | 详细信息 |
|--------|--------|
| **Data touched** | 从 npm、PyPI、NuGet、VS Code Marketplace 和 Docker Hub 获取公开的下载统计数据。可选的内存缓存。 |
| **Data NOT touched** | 没有遥测。没有分析。没有凭证存储。没有用户数据。没有文件写入。 |
| **Permissions** | 读取：通过 HTTPS 的公开注册中心 API。写入：仅 stdout/stderr。 |
| **Network** | 向公开注册中心 API 的 HTTPS 出站连接。可选的本地 REST 服务器。 |
| **Telemetry** | 未收集或发送任何数据。 |

请参阅 [SECURITY.md](SECURITY.md) 以获取漏洞报告。

## 评分卡

| 类别 | 评分 |
|----------|-------|
| A. 安全性 | 10 |
| B. 错误处理 | 10 |
| C. 运维文档 | 10 |
| D. 发布规范 | 10 |
| E. 身份验证（软性） | 10 |
| **Overall** | **50/50** |

> 完整审计：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
