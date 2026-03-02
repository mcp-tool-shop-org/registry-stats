<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

आप npm, PyPI, NuGet, VS Code मार्केटप्लेस और डॉकर हब पर सामग्री प्रकाशित करते हैं। वर्तमान में, "मेरे पैकेज कैसा प्रदर्शन कर रहे हैं?" का उत्तर देने का मतलब है कि आपको पांच अलग-अलग साइटों की जांच करनी होगी। **registry-stats** एक संपूर्ण प्लेटफॉर्म है: यह टाइपस्क्रिप्ट इंजन (CLI + API + REST सर्वर), एक लाइव वेब डैशबोर्ड और एक देशी विंडोज डेस्कटॉप ऐप है - और ये सभी एक ही रिपॉजिटरी से उपलब्ध हैं।

इसमें कोई रनटाइम निर्भरता नहीं है। यह देशी `fetch()` का उपयोग करता है। Node 18+।

## इसके अंदर क्या है

| लेयर | यह क्या करता है |
|-------|-------------|
| **Engine** | टाइपस्क्रिप्ट लाइब्रेरी + CLI + REST सर्वर। एक ही इंटरफ़ेस के साथ पांच रजिस्ट्री को क्वेरी करें। इसे npm पर `@mcptoolshop/registry-stats` के रूप में प्रकाशित किया गया है। |
| **Dashboard** | एस्ट्रो-संचालित वेब ऐप। AI चैट सहायक, 6 इंटरैक्टिव चार्ट, स्मार्ट ग्रोथ इंजन और टैब वाली सहायता गाइड। CI द्वारा साप्ताहिक रूप से पुनर्निर्मित। |
| **Desktop** | WinUI 3 + WebView2 वाला देशी विंडोज ऐप। डैशबोर्ड को ऑफ़लाइन उपलब्ध कराता है और आवश्यकता पड़ने पर लाइव आँकड़े प्राप्त करता है। |

## डैशबोर्ड

एक स्व-अपडेट करने वाला आँकड़े डैशबोर्ड [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/) पर उपलब्ध है।

- **टैब इंटरफ़ेस** — Home, Analytics, Leaderboard और Help टैब
- **AI चैट सहायक** — Ollama-संचालित Registry Assistant जिसमें RAG संदर्भ, स्ट्रीमिंग प्रतिक्रियाएँ, मॉडल चयनकर्ता और वार्तालाप स्मृति शामिल है
- **कार्यकारी सारांश** — हेल्थ स्कोर (0–100), विविधता सूचकांक, साप्ताहिक परिवर्तन, सभी रजिस्ट्री से कुल डाउनलोड
- **6 इंटरैक्टिव चार्ट** — 30-दिन ट्रेंड (समष्टि / रजिस्ट्री अनुसार / शीर्ष 5 टॉगल), रजिस्ट्री शेयर (पोलर एरिया), पोर्टफोलियो जोखिम (वितरण हिस्टोग्राम + Gini & P90), शीर्ष 10 मोमेंटम, स्पार्कलाइन युक्त वेलोसिटी ट्रैकर, और 30-दिन हीटमैप (स्पाइक डिटेक्शन >2σ)
- **स्मार्ट ग्रोथ इंजन** — कम विभाजक विकृति को संभालता है। बेसलाइन थ्रेशोल्ड, प्रतिशत सीमा और अवमंदित वेग सूत्र
- **कार्ययोग्य अंतर्दृष्टि** — स्वचालित सिफारिशें और गिरावट वाले पैकेजों के लिए चेतावनी
- **लीडरबोर्ड** — सभी पैकेज साप्ताहिक डाउनलोड के अनुसार रैंक किए गए, 30-दिन स्पार्कलाइन और स्मार्ट ट्रेंड बैज के साथ
- **सेटअप पेज** — पोर्टफोलियो संपादक, सत्यापन, registry-sync सहयोगी अनुभाग, और पाइपलाइन अवलोकन
- **सहायता टैब** — प्रत्येक टैब, मुख्य अवधारणाएँ, AI सहायक सुझाव, डेटा पाइपलाइन, और उपयोगी लिंक को कवर करने वाली सरल गाइड
- **डार्क / लाइट थीम** — सिस्टम वरीयता का पालन करता है।

डेटा निर्माण के समय प्राप्त किया जाता है और CI (सोमवार सुबह 6:00 UTC) द्वारा साप्ताहिक रूप से पुनर्निर्मित किया जाता है। ट्रैक किए गए पैकेजों को `site/src/data/packages.json` में कॉन्फ़िगर करें।

## डेस्कटॉप ऐप

एक देशी विंडोज ऐप जो डैशबोर्ड को एक स्थानीय WebView2 शेल में लपेटता है:

- **ऑफ़लाइन उपयोग** — बंडल किए गए HTML/CSS/JS के साथ आता है; इंटरनेट के बिना काम करता है।
- **लाइव रिफ्रेश** — GitHub Pages से `stats.json` प्राप्त करता है।
- **CSV निर्यात** — लीडरबोर्ड डेटा को एक क्लिक में निर्यात करें।
- **MSIX पैकेज्ड** — CI के माध्यम से `desktop-ci.yml` का उपयोग करके बनाया और हस्ताक्षरित।

डेस्कटॉप का स्रोत `desktop/` में है। .NET 10 MAUI के साथ बनाया गया है, जो WinUI 3 को लक्षित करता है।

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
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## रजिस्ट्री समर्थन

| रजिस्ट्री | पैकेज प्रारूप | समय श्रृंखला | उपलब्ध डेटा |
|----------|---------------|-------------|----------------|
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

## रिपॉजिटरी संरचना

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## विकास

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## सुरक्षा और डेटा दायरा

| पहलू | विवरण |
|--------|--------|
| **Data touched** | npm, PyPI, NuGet, VS Code मार्केटप्लेस, डॉकर हब से सार्वजनिक डाउनलोड आँकड़े। इन-मेमोरी कैश (वैकल्पिक)। |
| **Data NOT touched** | कोई टेलीमेट्री नहीं। कोई एनालिटिक्स नहीं। कोई क्रेडेंशियल स्टोरेज नहीं। कोई उपयोगकर्ता डेटा नहीं। कोई फ़ाइल लेखन नहीं। |
| **Permissions** | पढ़ें: सार्वजनिक रजिस्ट्री API HTTPS के माध्यम से। लिखें: केवल stdout/stderr। |
| **Network** | HTTPS सार्वजनिक रजिस्ट्री API पर। वैकल्पिक लोकलहोस्ट REST सर्वर। |
| **Telemetry** | कोई भी डेटा एकत्र या भेजा नहीं जाता है। |

भेद्यता रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

## स्कोरकार्ड

| श्रेणी | स्कोर |
|----------|-------|
| A. सुरक्षा | 10 |
| B. त्रुटि प्रबंधन | 10 |
| C. ऑपरेटर दस्तावेज़ | 10 |
| D. शिपिंग स्वच्छता | 10 |
| E. पहचान (सॉफ्ट) | 10 |
| **Overall** | **50/50** |

> पूर्ण ऑडिट: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## लाइसेंस

MIT

---

यह <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा बनाया गया है।
