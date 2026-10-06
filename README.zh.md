<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.md">English</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

你可以将内容发布到 npm、PyPI、NuGet、VS Code Marketplace、Docker Hub 和 GitHub Releases。现在，回答“我的软件包表现如何？”意味着需要检查六个不同的网站。《registry-stats》是一个完整的平台：一个 TypeScript 引擎（CLI + API + REST 服务器）、一个实时 Web 仪表板和一个本地 Windows 桌面应用程序——所有这些都来自同一个仓库。

零运行时依赖。使用原生 `fetch()`。Node 18+。

## 内部包含的内容

| 层 | 它的作用 |
|-------|-------------|
| **Engine** | TypeScript 库 + CLI + REST 服务器 + AI 推理。通过一个界面查询六个注册表——npm、PyPI、NuGet、VS Code Marketplace、Docker Hub 和 GitHub Releases。只需输入软件包名称，即可查询 npm、PyPI、NuGet、VS Code Marketplace 和 Docker Hub。当名称为 owner/repo 时，或者当注册表列表中包含 github 时，GitHub Releases 也会被包含。已发布到 npm，名称为 `@mcptoolshop/registry-stats`。 |
| **Dashboard** | 基于 Astro 的 Web 应用程序，带有 AI 推理面板（健康评分、预测、可操作的建议）、Pulse AI 协同助手（流式语音、Web 搜索、全屏、GitHub 数据连接器）、七个图表（仅 30 天趋势和投资组合趋势支持滚动缩放和平移）、实时刷新、导出报告（PDF / JSONL / Markdown）和带有标签的帮助指南。每日 CI 获取仪表板数据。该网站每周重建一次，时间为周一 UTC 时间 07:00。 |
| **Desktop** | WinUI 3 + WebView2 本地 Windows 应用程序。捆绑了离线仪表板，并按需获取实时统计数据。 |

## 仪表板

一个自动更新的统计仪表板位于 [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/)。

- **带有标签的界面**——主页、分析、排行榜和帮助标签
- **Pulse AI 协同助手**——基于 Ollama 的对话式助手，具有流式语音合成（LLM 流式传输时进行语音输出，通过 [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) 提供 4 种声音）、Web 搜索（Wikipedia + 可选的 SearXNG）、自动语音、全屏模式、GitHub 组织数据连接器、模型选择器和对话记忆
- **执行摘要**——健康评分（0–100）、多样性指数和每周变化。每周和每月的下载总数来自 npm 和 PyPI。VS Code、NuGet、Docker 和 GitHub 贡献其所有历史总数，而不是这两个总数。
- **七个交互式图表**——30 天趋势（聚合/每个注册表/前 5 名切换 + 点击以深入查看）、注册表份额（极坐标面积）、投资组合风险（直方图 + 基尼系数和 P90）、前 10 名的动量、带有迷你图的速率跟踪器、带有峰值检测（>2σ）的 30 天热图以及投资组合趋势（堆叠面积图，按年）。滚动缩放和平移仅适用于 30 天趋势和投资组合趋势。
- **智能增长引擎**——通过基线阈值、百分比上限和阻尼速率公式来处理小分母扭曲
- **AI 推理面板**——投资组合动量（-100 到 +100）、风险评分、7 天预测（带有置信区间）、自动推荐、带有严重程度/紧急程度级别的可操作建议以及软件包健康评分（A–F 级）
- **可操作的建议**——带有严重程度标签的建议卡（严重/警告/信息/成功），带有紧急程度级别、具体的操作步骤和受影响的软件包列表
- **软件包健康评分**——0–100 综合评分（活动 + 一致性 + 增长 + 稳定性），每个软件包都有一个字母等级
- **年度进度跟踪**——持久的历史记录层会累积每月每个软件包和每周投资组合的聚合数据；带有每个注册表堆叠的投资组合趋势图
- **Pulse 面板**——“已建立的动量软件包”（≥ 50 次下载/周）和“新兴和新软件包”的分割视图，带有内联 7 天迷你图、绝对值 + 百分比变化、基线上下文以及一行执行摘要
- **实时刷新**——页面会重新获取与页面同源的 `data/stats.json`，如果该文件比构建版本更新。它不会从浏览器调用 npm 或 PyPI API。`sessionStorage` 包含可选的 GitHub PAT，而不是统计缓存。
- **导出报告**——刷新按钮旁边的下拉菜单，提供三种格式：**执行 PDF**（通过 jsPDF）、**LLM JSONL**（用于 AI 摄取的类型化记录）和**开发 Markdown**（GFM 表格）
- **排行榜**——在 `packages.json` 中跟踪了 268 个 ID（168 个 npm、43 个 PyPI、6 个 VS Code、27 个 NuGet、24 个 GitHub），按“下载”列进行排名：npm 和 PyPI 为每周，VS Code、NuGet、Docker 和 GitHub 为所有时间。30 天迷你图是 npm 系列。智能趋势徽章可避免低流量软件包的误导性百分比。
- **设置页面**——带有验证的投资组合编辑器、注册表同步伴侣部分和流水线概述
- **排行榜搜索**——即时文本过滤器，用于按名称或注册表查找软件包
- **键盘导航**——使用箭头键在标签之间循环
- **帮助标签**——用户友好的指南，涵盖每个标签、关键概念、AI 推理引擎、数据流水线和有用的链接
- **深色/浅色主题**——遵循系统偏好
- **移动响应式**——小屏幕上的汉堡菜单

数据由 CI 每天刷新（UTC 时间 06:00），整个站点每周重建一次（周一 UTC 时间 07:00）。仪表板会重新获取与页面同源的 `data/stats.json`。在 `site/src/data/packages.json` 中配置跟踪的软件包。

## AI 推理引擎

零依赖、纯数学推理，在构建时运行——没有 ML 运行时，没有外部 API。

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

| 功能 | 方法 | 它的作用 |
|-----------|--------|-------------|
| **Forecast** | 加权线性回归 | 指数时间偏差，80% 置信区间，随着时间的推移会扩大 |
| **Anomaly detection** | 自适应滚动 z 分数 | 14 天基线窗口，检测峰值和下降 |
| **Trend segmentation** | 分段线性 | 识别时间序列中的上升/下降/平稳段 |
| **Seasonality** | 星期几分解 | 检测每周模式，报告峰值日期 |
| **Momentum** | 综合评分 | 方向 + 加速度 + 一致性 + 数量 |
| **Health score** | 多因素综合 | 活动 + 一致性 + 增长 + 稳定性（0–100，A–F 级） |
| **Yearly progress** | 每月累积 | 同比增长、预测的年末值、里程碑跟踪 |
| **Actionable advice** | 严重程度规则引擎 | 严重/警告/信息/成功，带有紧迫性和具体操作 |
| **Recommendations** | 规则引擎 | 增长、风险、机遇和关注类别 |

## 桌面应用程序

一个本地 Windows 应用程序，它将仪表板包装在本地 WebView2 shell 中：

- **可离线使用**——捆绑了 HTML/CSS/JS；无需互联网即可工作
- **实时刷新**——如果没有保存的投资组合，则下载 GitHub Pages `stats.json`。如果保存了投资组合，则将每个名称发送到包含该名称的注册表，并且不会上传投资组合文件。
- **CSV 导出**——一键导出排行榜数据
- **MSIX 封装**——通过 `desktop-ci.yml` 在 CI 中构建和签名

桌面源代码位于 `desktop/`。使用 .NET 10 MAUI 构建，目标平台为 WinUI 3。

## 安装

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

## 配置文件

在你的项目根目录中创建一个 `registry-stats.config.json`（或运行 `registry-stats --init`）：

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

不带任何参数运行 `registry-stats`，以获取所有已配置软件包的统计信息。命令行工具从当前工作目录开始，向上搜索以找到最近的配置文件。上述 `registries` 数组是默认的五个。添加 `"github"` 以包含 GitHub 发布；这些软件包的标识符是 `owner/repo`。如果没有配置文件，软件包查询将使用所有内置注册表，但 GitHub 发布除外，除非名称为 owner/repo。即使在注册表列表中命名为 github，仍然会对其进行查询，并且如果仅使用名称，则会从该注册表返回错误。

该配置也可以通过编程方式使用：

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## 程序化 API

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

## 注册表支持

| 注册表 | 包格式 | 时间序列 | 可用数据 |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | 是（549 天） | lastDay、lastWeek、lastMonth |
| `pypi` | `requests` | 是（180 天） | lastDay、lastWeek、lastMonth、total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total（安装量）、评分、趋势 |
| `docker` | `namespace/repo` | No | total（拉取量）、星级 |
| `github` | `owner/repo` | No | 总下载量（资产下载量）、发布版本、资产、最新标签 |

## 内置可靠性

- 429/5xx 错误时，自动重试并采用指数退避策略
- 尊重 `Retry-After` 标头
- 通过 `AbortSignal.timeout` 实现 30 秒的请求超时
- 限制批量请求的并发量
- 可选的 TTL 缓存（可插拔——通过 `StatsCache` 接口使用您自己的 Redis/文件后端）
- SHA 绑定的 GitHub Actions，用于保障供应链安全

## REST API 服务器

作为微服务运行或嵌入到您自己的服务器中：

```bash
registry-stats serve --port 3000
```

默认情况下，`serve` 绑定到 `127.0.0.1`（仅限本地主机），并将 CORS 设置为 `*`。使用 `--host 0.0.0.0` 在网络上公开它，并使用 `--cors <origin>` 在这样做时限制跨域访问。

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

用于自定义服务器或无服务器环境的程序化使用：

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

## 自定义注册表

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

## 仓库结构

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

### 桌面应用程序

Windows，使用 .NET 10 SDK。首先运行 `npm run site:build`，以便 `site/dist` 存在。该项目会将它复制到输出 `wwwroot/registry-stats`。

```bash
dotnet workload install maui-windows
npm run site:build
dotnet build desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
# or
dotnet publish desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
```

签名的 MSIX 是来自 `desktop-ci.yml` 的 CI 构建产物。它不是 GitHub 发布下载，也不是 Store 上传。Registry Pulse，Windows 桌面应用程序，可在 https://apps.microsoft.com/detail/9P9TR0055JG9 找到。此仓库中的软件包版本为 3.4.0.0。合作伙伴中心会对您上传的文件进行签名。

## 安全性和数据范围

| 方面 | 详细信息 |
|--------|--------|
| **Data touched** | 来自 npm、PyPI、NuGet、VS Code Marketplace、Docker Hub 和 GitHub 发布的可公开访问的下载统计信息。可选的内存缓存。`registry-stats --init` 写入 `registry-stats.config.json`。桌面应用程序在 `%LOCALAPPDATA%\RegistryPulse` 下写入 `packages.json` 和 `stats.json`。 |
| **Credentials** | `--init` 不会写入令牌。配置文件可以包含一个 `dockerToken` 或一个 `githubToken`（如果您添加了它），并且该值将保留在文件中。命令行工具将 `dockerToken` 作为 Bearer 令牌发送到 Docker Hub，并将 `githubToken` 作为 Bearer 令牌仅发送到 `api.github.com`。该工具本身不会写入任何令牌。仪表板可以在 `sessionStorage` 中保存 GitHub PAT，并将其发送到 `api.github.com`。 |
| **Data NOT touched** | 没有遥测数据。没有分析数据。没有用户帐户。 |
| **Permissions** | 读取：通过 HTTPS 访问公共注册表 API，以及在提供令牌时进行身份验证的调用。写入：stdout/stderr、`registry-stats.config.json` 到 `--init`，以及桌面文件到 `%LOCALAPPDATA%\RegistryPulse`。可选的、在用户指定的端口上运行的 REST 服务器。 |
| **Network** | 通过 HTTPS 向 `api.npmjs.org`、`registry.npmjs.org`（`--mine`）、`pypistats.org`、`azuresearch-usnc.nuget.org`、`marketplace.visualstudio.com`、`hub.docker.com` 和 `api.github.com`（GitHub 发布）发送数据。桌面应用程序刷新还会从 `mcp-tool-shop-org.github.io` 下载统计信息。可选的本地 REST 服务器。 |
| **Telemetry** | 没有收集或发送 |

有关漏洞报告，请参阅 [SECURITY.md](SECURITY.md)。

## 评分

| 类别 | 分数 |
|----------|-------|
| A. 安全性 | 10 |
| B. 错误处理 | 8 |
| C. 操作文档 | 10 |
| D. 发布卫生 | 8 |
| E. 身份（软性） | 10 |
| **Overall** | **46/50** |

> 完整审计：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建
