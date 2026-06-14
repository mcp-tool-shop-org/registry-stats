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

你发布到 npm、PyPI、NuGet、VS Code Marketplace 和 Docker Hub。现在，回答“我的软件包表现如何？”意味着需要检查五个不同的网站。《**registry-stats**》是一个完整的平台：一个 TypeScript 引擎（CLI + API + REST 服务器）、一个实时网络仪表板和一个原生 Windows 桌面应用程序——所有这些都来自同一个代码仓库。

零运行时依赖项。使用原生的 `fetch()`。Node 18+。

## 内容

| 层级 | 功能 |
|-------|-------------|
| **Engine** | TypeScript 库 + CLI + REST 服务器 + AI 推理。通过一个界面查询五个注册表。发布到 npm，名称为 `@mcptoolshop/registry-stats`。 |
| **Dashboard** | 基于 Astro 的 Web 应用程序，带有 AI 推理面板（健康评分、预测、可操作的建议）、Pulse AI 协同助手（流式语音、网络搜索、全屏显示、GitHub 数据连接器）、七个交互式图表（带缩放/平移功能、实时刷新、导出报告（PDF / JSONL / Markdown）），以及带有选项卡的帮助指南。每天由 CI 重建；可按需刷新。 |
| **Desktop** | WinUI 3 + WebView2 原生 Windows 应用程序。将仪表板捆绑到离线状态，并按需获取实时统计数据。 |

## 仪表板

一个可自动更新的统计信息仪表板位于 [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/)。

- **选项卡式界面**——主页、分析、排行榜和帮助选项卡
- **Pulse AI 协同助手**——基于 Ollama 的对话式助手，具有流式语音合成功能（LLM 流式传输时进行语音输出，通过 [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) 提供 4 种声音）、网络搜索（Wikipedia + 可选的 SearXNG）、自动语音播报、全屏模式、GitHub 组织数据连接器、模型选择器和对话记忆
- **执行摘要**——健康评分（0–100）、多样性指数、每周变化、所有注册表中总下载量
- **七个交互式图表**——30 天趋势（聚合/每个注册表/前 5 名切换 + 点击以深入查看 + 滚动缩放/平移）、注册表份额（极坐标面积）、投资组合风险（直方图 + 基尼系数和 P90）、前 10 名的动量、带有小线图的速率跟踪器、带有峰值检测 (>2σ) 的 30 天热图，以及投资组合趋势（堆叠区域图，按年）
- **智能增长引擎**——处理小分母扭曲问题，具有基准阈值、百分比上限和阻尼速度公式
- **AI 推理面板**——投资组合动量（-100 到 +100）、风险评分、7 天预测（带有置信区间）、自动推荐、可操作的建议（带有严重程度/紧急程度级别）以及软件包健康评分（A–F 级）
- **可操作的建议**——带有严重程度标签的建议卡片（关键/警告/信息/成功），具有紧急程度和具体的操作步骤，以及受影响的软件包列表
- **软件包健康评分**——0–100 的综合评分（活动 + 一致性 + 增长 + 稳定性），每个软件包都有字母等级
- **年度进度跟踪**——持久的历史记录层累积每月每个软件包和每周投资组合的聚合数据；带有按注册表堆叠的投资组合趋势图
- **Pulse 面板**——“已建立的领先者”（≥ 50 次/周下载）和“新兴”与“新”软件包的分视图，具有内联的 7 天小线图、绝对值 + 百分比变化、基准上下文以及一行执行摘要
- **实时刷新**——按需从 npm 和 PyPI API 获取最新数据，并显示进度指示器；结果缓存在 sessionStorage 中（5 分钟 TTL），因此选项卡切换是即时的
- **导出报告**——“刷新”按钮旁边的下拉菜单提供三种格式：**执行 PDF**（通过 jsPDF）、**LLM JSONL**（用于 AI 摄取的类型化记录）和**开发 Markdown**（GFM 表格）
- **排行榜**——132 个软件包按每周下载量排名，并带有内联的 30 天小线图和智能趋势徽章
- **设置页面**——投资组合编辑器，具有验证功能、注册表同步辅助部分以及流水线概述
- **排行榜搜索**——即时文本过滤器，用于按名称或注册表查找软件包
- **键盘导航**——使用箭头键在选项卡之间循环
- **帮助选项卡**——用户友好的指南，涵盖每个选项卡、关键概念、AI 推理引擎、数据流水线和有用的链接
- **深色/浅色主题**——遵循系统偏好设置
- **移动响应式**——小屏幕上的汉堡菜单

数据每天由 CI 刷新（UTC 时间 06:00），整个站点每周重建一次（周一 UTC 时间 06:00）。实时刷新会直接从注册表 API 中获取最新的数据。在 `site/src/data/packages.json` 中配置要跟踪的软件包。

## AI 推理引擎

零依赖、纯数学推理，在构建时运行——没有 ML 运行时，也没有外部 API。

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

| 功能 | 方法 | 功能 |
|-----------|--------|-------------|
| **Forecast** | 加权线性回归 | 指数时间偏差，80% 置信区间随时间推移而扩大 |
| **Anomaly detection** | 自适应滚动 z 分数 | 14 天基准窗口，检测峰值和下降 |
| **Trend segmentation** | 分段线性 | 识别时间序列中的上升/下降/平稳片段 |
| **Seasonality** | 星期几分解 | 检测每周模式，报告高峰日 |
| **Momentum** | 综合评分 | 方向 + 加速度 + 一致性 + 数量 |
| **Health score** | 多因素综合 | 活动 + 一致性 + 增长 + 稳定性（0–100，A–F 级） |
| **Yearly progress** | 每月累积 | 同比增长、预测的年末值、里程碑跟踪 |
| **Actionable advice** | 严重程度规则引擎 | 关键/警告/信息/成功，具有紧急程度和具体的操作 |
| **Recommendations** | 规则引擎 | 增长、风险、机会和关注类别 |

## 桌面应用程序

一个原生 Windows 应用程序，它将仪表板包装在一个本地 WebView2 外壳中：

- **支持离线使用**——打包了 HTML/CSS/JS 文件；无需互联网即可运行。
- **实时刷新**——按需从 GitHub Pages 获取 `stats.json` 数据。
- **CSV 导出**——一键导出排行榜数据。
- **MSIX 打包**——通过 `desktop-ci.yml` 在 CI 环境中构建和签名。

桌面应用程序的源代码位于 `desktop/` 目录中。使用 .NET 10 MAUI 构建，目标平台为 WinUI 3。

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

# Discover all your npm packages by maintainer name
registry-stats --mine mikefrilot

# JSON output for maintainer discovery
registry-stats --mine mikefrilot --format json

# Start a REST API server
registry-stats serve --port 3000
```

## 配置文件

在项目的根目录下创建一个 `registry-stats.config.json` 文件（或者运行 `registry-stats --init`）：

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

不带任何参数地运行 `registry-stats`，以获取所有已配置软件包的统计数据。CLI 会从当前工作目录向上搜索，找到最近的配置文件。

也可以通过编程方式使用该配置：

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

## 注册表支持

| 注册表 | 软件包格式 | 时间序列 | 可用数据 |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | 是（549 天） | lastDay、lastWeek、lastMonth |
| `pypi` | `requests` | 是（180 天） | lastDay、lastWeek、lastMonth、total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total（安装量）、rating、trends |
| `docker` | `namespace/repo` | No | total（拉取量）、stars |

## 内置可靠性

- 发生 429/5xx 错误时，自动重试并采用指数退避策略。
- 遵守 `Retry-After` 标头。
- 通过 `AbortSignal.timeout` 实现 30 秒的请求超时。
- 对批量请求进行并发限制。
- 可选的 TTL 缓存（可插拔——通过 `StatsCache` 接口使用您自己的 Redis/文件后端）。
- 使用 SHA 哈希值验证的 GitHub Actions，以确保供应链安全。

## REST API 服务器

作为微服务运行或嵌入到您自己的服务器中：

```bash
registry-stats serve --port 3000
```

默认情况下，`serve` 绑定到 `127.0.0.1`（仅本地主机），并将 CORS 设置为 `*`。使用 `--host 0.0.0.0` 将其暴露在网络上，并使用 `--cors <origin>` 来限制跨域访问。

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

用于自定义服务器或无服务器环境的程序化用法：

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
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

## 安全性和数据范围

| 方面 | 详情 |
|--------|--------|
| **Data touched** | 从 npm、PyPI、NuGet、VS Code Marketplace 和 Docker Hub 获取公共下载统计信息。内存缓存（可选）。 |
| **Data NOT touched** | 不收集遥测数据，不进行分析，不存储凭据，不存储用户数据，不写入文件。 |
| **Permissions** | 读取：通过 HTTPS 访问公共注册表 API。写入：仅输出到 stdout/stderr。 |
| **Network** | 通过 HTTPS 连接到公共注册表 API。可选的本地 REST 服务器。 |
| **Telemetry** | 不收集或发送任何数据。 |

有关漏洞报告，请参阅 [SECURITY.md](SECURITY.md)。

## 评分卡

| 类别 | 分数 |
|----------|-------|
| A. 安全性 | 10 |
| B. 错误处理 | 10 |
| C. 操作文档 | 10 |
| D. 发布卫生 | 10 |
| E. 身份（软） | 10 |
| **Overall** | **50/50** |

> 完整审计：[SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## 许可证

MIT

---

由 <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> 构建。
