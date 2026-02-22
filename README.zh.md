<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <strong>中文</strong> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="registry-stats 标志" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  一个命令。五个注册表。所有下载统计。
</p>

<p align="center">
  <a href="#安装">安装</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#配置文件">配置</a> &middot;
  <a href="#编程接口">API</a> &middot;
  <a href="#rest-api-服务器">REST 服务器</a> &middot;
  <a href="#许可证">许可证</a>
</p>

---

如果你在 npm、PyPI、NuGet、VS Code Marketplace 或 Docker Hub 上发布包，你目前需要五个不同的 API 来回答"这个月我有多少下载量？"这个库提供统一接口 — 支持 CLI 和编程方式。

零依赖。使用原生 `fetch()`。Node 18+。

## 安装

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# 查询单个注册表
registry-stats express -r npm

# 一次查询所有注册表
registry-stats express

# 带月度细分和趋势的时间序列
registry-stats express -r npm --range 2025-01-01:2025-06-30

# JSON 输出
registry-stats express -r npm --json

# 其他注册表
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# 创建配置文件
registry-stats --init

# 从配置运行 — 获取所有跟踪包的统计
registry-stats

# 跨注册表比较
registry-stats express --compare

# 导出为 CSV 或图表友好的 JSON
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# 启动 REST API 服务器
registry-stats serve --port 3000
```

## 配置文件

在项目根目录创建 `registry-stats.config.json`（或运行 `registry-stats --init`）：

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

不带参数运行 `registry-stats` 即可获取所有配置包的统计。CLI 会从当前目录向上查找配置文件。

## 编程接口

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// 单个注册表
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// 所有注册表（使用 Promise.allSettled — 永不抛出）
const all = await stats.all('express');

// 批量 — 多个包，并发限制（默认：5）
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// 时间序列（仅 npm + pypi）
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// 计算
calc.total(daily);                         // 下载总量
calc.avg(daily);                           // 日均量
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // 7天移动平均
calc.popularity(daily);                    // 0-100 对数刻度评分

// 导出格式
calc.toCSV(daily);                         // CSV 字符串
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// 比较 — 跨注册表的同一包
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// 缓存（5分钟 TTL，内存中）
const cache = createCache();
await stats('npm', 'express', { cache });
```

## 注册表支持

| 注册表 | 包格式 | 时间序列 | 可用数据 |
|--------|--------|----------|----------|
| `npm` | `express`, `@scope/pkg` | 支持（549天） | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | 支持（180天） | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | 不支持 | total |
| `vscode` | `publisher.extension` | 不支持 | total（安装数）、rating、trends |
| `docker` | `namespace/repo` | 不支持 | total（拉取数）、stars |

## 内置可靠性

- 429/5xx 错误的指数退避自动重试
- 遵守 `Retry-After` 头部
- 批量请求的并发限制
- 可选的 TTL 缓存（可插拔 — 通过 `StatsCache` 接口使用 Redis/文件后端）

## REST API 服务器

作为微服务运行，或嵌入到自己的服务器中：

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # 所有注册表
GET /stats/:registry/:package    # 单个注册表
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// 快速启动
serve({ port: 3000 });

// 自定义服务器
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

## 许可证

MIT
