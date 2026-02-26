<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <strong>हिन्दी</strong> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
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

यदि आप npm, PyPI, NuGet, VS Code मार्केटप्लेस या डॉकर हब पर कुछ प्रकाशित करते हैं, तो वर्तमान में आपको "इस महीने मुझे कितने डाउनलोड मिले?" यह जानने के लिए पांच अलग-अलग एपीआई की आवश्यकता होती है। यह लाइब्रेरी आपको सभी के लिए एक ही इंटरफ़ेस प्रदान करती है - या तो कमांड-लाइन इंटरफ़ेस (CLI) के रूप में या प्रोग्रामेटिक एपीआई के रूप में।

शून्य निर्भरता। यह मूल `fetch()` का उपयोग करता है। Node 18 या उससे ऊपर।

## इंस्टॉल करें

```bash
npm install @mcptoolshop/registry-stats
```

## कमांड-लाइन इंटरफ़ेस (CLI)

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

## कॉन्फ़िगरेशन फ़ाइल

अपने प्रोजेक्ट के रूट में `registry-stats.config.json` फ़ाइल बनाएं (या `registry-stats --init` कमांड चलाएं):

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

सभी कॉन्फ़िगर किए गए पैकेजों के आंकड़े प्राप्त करने के लिए बिना किसी तर्क के `registry-stats` कमांड चलाएं। CLI, कॉन्फ़िगरेशन फ़ाइल ढूंढने के लिए वर्तमान कार्यशील निर्देशिका (cwd) से ऊपर की ओर खोज करता है।

कॉन्फ़िगरेशन प्रोग्रामेटिक रूप से भी उपलब्ध है:

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## प्रोग्रामेटिक एपीआई

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

## रजिस्ट्री समर्थन

| रजिस्ट्री | पैकेज प्रारूप | समय श्रृंखला | उपलब्ध डेटा |
| ---------- | --------------- | ------------- | ---------------- |
| `npm` | `express`, `@scope/pkg` | हाँ (549 दिन) | अंतिम दिन, अंतिम सप्ताह, अंतिम महीना |
| `pypi` | `requests` | हाँ (180 दिन) | अंतिम दिन, अंतिम सप्ताह, अंतिम महीना, कुल |
| `nuget` | `Newtonsoft.Json` | No | कुल |
| `vscode` | `publisher.extension` | No | कुल (इंस्टॉलेशन), रेटिंग, रुझान |
| `docker` | `namespace/repo` | No | कुल (डाउनलोड), सितारे |

## अंतर्निहित विश्वसनीयता

- 429/5xx त्रुटियों पर स्वचालित पुनः प्रयास, जिसमें घातीय बैकऑफ़ शामिल है।
- `Retry-After` हेडर का सम्मान करता है।
- बल्क अनुरोधों के लिए समवर्ती सीमा।
- वैकल्पिक TTL कैश (प्लग करने योग्य - `StatsCache` इंटरफ़ेस के माध्यम से अपना Redis/फ़ाइल बैकएंड प्रदान करें)।

## REST एपीआई सर्वर

इसे एक माइक्रोसर्विस के रूप में चलाएं या इसे अपने सर्वर में एम्बेड करें:

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

कस्टम सर्वरों या सर्वरलेस वातावरण के लिए प्रोग्रामेटिक उपयोग:

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## कस्टम रजिस्ट्री

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

## वेबसाइट

दस्तावेज़/लैंडिंग पृष्ठ `site/` में स्थित है।

- विकास: `npm run site:dev`
- बिल्ड: `npm run site:build`
- पूर्वावलोकन: `npm run site:preview`

## लाइसेंस

MIT

---

यह <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया है।
