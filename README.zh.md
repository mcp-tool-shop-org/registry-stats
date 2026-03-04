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

您可以在 npm、PyPI、NuGet、VS Code Marketplace 以及 Docker Hub 上发布软件包。目前，要了解“我的软件包表现如何？”，您需要查看五个不同的网站。**registry-stats** 是一个完整的平台：一个 TypeScript 引擎（包含命令行工具、API 和 REST 服务器），一个实时 Web 控制面板，以及一个原生 Windows 桌面应用程序——所有这些都来自一个代码仓库。

没有运行时依赖。使用原生的 `fetch()` 方法。Node 18+。

## 内容

| 层 | 功能 |
|-------|-------------|
| **Engine** | TypeScript 库 + 命令行工具 + REST 服务器。使用一个界面查询五个注册中心。已发布到 npm，名为 `@mcptoolshop/registry-stats`。 |
| **Dashboard** | 一个由 Astro 驱动的 Web 应用程序，带有 Pulse AI 辅助功能（语音输出、全屏模式、GitHub 数据连接器），包含六个交互式图表，支持实时刷新，可以导出报告（PDF / JSONL / Markdown），以及一个分栏的帮助指南。每周由 CI 自动构建；可以按需刷新。 |
| **Desktop** | 一个原生 Windows 应用程序，使用 WinUI 3 + WebView2。将控制面板打包在本地，按需获取实时统计数据。 |

## 控制面板

一个自动更新的统计信息控制面板位于 [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/)。

- **分栏界面** — 包含“首页”、“分析”、“排行榜”和“帮助”等选项卡
- **Pulse AI 辅助功能** — 基于 Ollama 的对话式助手，具有语音输出（通过 [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) 提供 4 种声音），自动语音播报，全屏模式，GitHub 组织数据连接器，流式响应，模型选择器，以及对话记忆功能
- **关键指标概览** — 健康评分（0–100），多样性指数，每周变化，所有注册中心的总下载量
- **六个交互式图表** — 30 天趋势图（聚合视图 / 每个注册中心视图 / 前 5 名视图），注册中心份额（极坐标图），投资组合风险（直方图 + Gini 系数和 P90），前 10 名热门软件包，带火花线的速度跟踪器，以及 30 天热力图，并带有异常检测（>2σ）
- **智能增长引擎** — 处理小基数偏差，具有基线阈值、百分比上限和 damped 速度公式
- **可操作的洞察** — 自动生成针对表现不佳软件包的建议和警报
- **Pulse 面板** — 显示已建立的活跃软件包（≥ 50 次/周下载）和新兴软件包，带有内联 7 天火花线，绝对值和百分比变化，基线参考，以及简要概括
- **实时刷新** — 通过客户端从 npm 和 PyPI API 获取最新数据，并显示进度指示器；结果缓存在 sessionStorage 中（5 分钟 TTL），因此切换选项卡非常快速
- **导出报告** — 在“刷新”按钮旁边有一个下拉菜单，提供三种格式：**Exec PDF**（使用 jsPDF），**LLM JSONL**（用于 AI 摄取的类型记录），以及**Dev Markdown**（GFM 表格）
- **排行榜** — 根据每周下载量对 132 个软件包进行排名，并带有内联 30 天火花线和智能趋势标签
- **配置页面** — 包含投资组合编辑器（带验证）、注册中心同步辅助部分，以及流水线概览
- **帮助选项卡** — 提供关于每个选项卡、关键概念、AI 助手技巧、数据流水线以及有用的链接的详细指南
- **深色/浅色主题** — 遵循系统偏好设置

数据在构建时获取，并每周由 CI 自动重建（每周一 06:00 UTC）。实时刷新直接从注册中心 API 获取最新数据。在 `site/src/data/packages.json` 中配置要跟踪的软件包（5 个注册中心，共 132 个软件包）。

## 桌面应用程序

一个原生 Windows 应用程序，它将控制面板封装在一个本地 WebView2 容器中：

- **支持离线使用** — 包含打包的 HTML/CSS/JS；无需互联网连接即可使用
- **实时刷新** — 按需从 GitHub Pages 获取 `stats.json` 文件
- **CSV 导出** — 一键导出排行榜数据
- **MSIX 软件包** — 通过 `desktop-ci.yml` 在 CI 中构建和签名

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

## 安全与数据范围

| 方面 | 详细信息 |
|--------|--------|
| **Data touched** | 从 npm、PyPI、NuGet、VS Code Marketplace、Docker Hub 获取的公开下载统计数据。可选的内存缓存。 |
| **Data NOT touched** | 无遥测。无分析。无凭证存储。无用户数据。无文件写入。 |
| **Permissions** | 读取：通过 HTTPS 访问公共注册表 API。写入：仅限于标准输出/标准错误输出。 |
| **Network** | 通过 HTTPS 访问公共注册表 API。可选的本地 REST 服务器。 |
| **Telemetry** | 未收集或发送任何数据。 |

请参阅 [SECURITY.md](SECURITY.md) 以报告漏洞。

## 评分卡

| 类别 | 评分 |
|----------|-------|
| A. 安全性 | 10 |
| B. 错误处理 | 10 |
| C. 操作文档 | 10 |
| D. 发布规范 | 10 |
| E. 身份验证（软性） | 10 |
| **Overall** | **50/50** |

> 完整审计：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
