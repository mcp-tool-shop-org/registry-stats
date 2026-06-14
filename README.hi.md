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

आप npm, PyPI, NuGet, VS Code मार्केटप्लेस और Docker Hub पर प्रकाशित करते हैं। अभी, "मेरे पैकेज कैसे चल रहे हैं?" का जवाब देने का मतलब है पांच अलग-अलग साइटों की जांच करना। **registry-stats** एक संपूर्ण प्लेटफ़ॉर्म है: एक TypeScript इंजन (CLI + API + REST सर्वर), एक लाइव वेब डैशबोर्ड और एक मूल Windows डेस्कटॉप ऐप - ये सभी एक ही रिपॉजिटरी से।

शून्य रनटाइम निर्भरताएँ। मूल `fetch()` का उपयोग करता है। Node 18+।

## इसके अंदर क्या है

| लेयर | यह क्या करता है |
|-------|-------------|
| **Engine** | TypeScript लाइब्रेरी + CLI + REST सर्वर + AI अनुमान। एक इंटरफ़ेस के साथ पाँच रजिस्ट्रियों से क्वेरी करें। npm पर `@mcptoolshop/registry-stats` के रूप में प्रकाशित। |
| **Dashboard** | AI अनुमान पैनल (स्वास्थ्य स्कोर, पूर्वानुमान, कार्रवाई योग्य सलाह), पल्स AI सह-पायलट (स्ट्रीमिंग वॉयस, वेब खोज, फुलस्क्रीन, GitHub डेटा कनेक्टर), ज़ूम/पैन के साथ सात इंटरैक्टिव चार्ट, लाइव रीफ़्रेश, रिपोर्ट निर्यात करें (PDF / JSONL / Markdown), और टैबयुक्त सहायता मार्गदर्शिका के साथ एस्ट्रो-संचालित वेब ऐप। CI द्वारा दैनिक रूप से पुनर्निर्मित; मांग पर ताज़ा किया जा सकता है। |
| **Desktop** | WinUI 3 + WebView2 मूल Windows ऐप। डैशबोर्ड को ऑफ़लाइन बंडल करता है, मांग पर लाइव आँकड़े प्राप्त करता है। |

## डैशबोर्ड

एक स्व-अद्यतन आँकड़ा डैशबोर्ड [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/) पर उपलब्ध है।

- **टैबयुक्त इंटरफ़ेस** - होम, एनालिटिक्स, लीडरबोर्ड और सहायता टैब
- **पल्स AI सह-पायलट** - ओलामा द्वारा संचालित संवादात्मक सहायक जिसमें स्ट्रीमिंग वॉयस संश्लेषण (LLM स्ट्रीम करते समय बोलता है, [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) के माध्यम से 4 आवाजें), वेब खोज (विकिपीडिया + वैकल्पिक SearXNG), ऑटो-स्पीक, फुलस्क्रीन मोड, GitHub संगठन डेटा कनेक्टर, मॉडल चयनकर्ता और वार्तालाप स्मृति
- **कार्यकारी स्नैपशॉट** - स्वास्थ्य स्कोर (0–100), विविधता सूचकांक, साप्ताहिक परिवर्तन, सभी रजिस्ट्रियों में कुल डाउनलोड
- **सात इंटरैक्टिव चार्ट** - 30-दिन का रुझान (एकत्रित / प्रति-रजिस्ट्री / शीर्ष-5 टॉगल + ड्रिल-डाउन के लिए क्लिक करें + स्क्रॉल ज़ूम/पैन), रजिस्ट्री शेयर (ध्रुवीय क्षेत्र), पोर्टफोलियो जोखिम (हिस्टोग्राम + गिनी और P90), शीर्ष-10 गति, स्पार्कलाइन के साथ वेग ट्रैकर, 30-दिन का हीटमैप जिसमें स्पाइक डिटेक्शन (>2σ) हो, और पोर्टफोलियो रुझान (स्टैक्ड क्षेत्र, वार्षिक)
- **स्मार्ट ग्रोथ इंजन** - बेसलाइन थ्रेशोल्ड, प्रतिशत कैप और डैम्प्ड वेलोसिटी फॉर्मूला के साथ छोटे भाजक विरूपण को संभालता है
- **AI अनुमान पैनल** - पोर्टफोलियो गति (-100 से +100), जोखिम स्कोर, 7-दिन का पूर्वानुमान जिसमें आत्मविश्वास अंतराल हो, स्वचालित अनुशंसाएँ, गंभीरता/तत्काल स्तरों के साथ कार्रवाई योग्य सलाह और पैकेज स्वास्थ्य स्कोरबोर्ड (A–F ग्रेड)
- **कार्रवाई योग्य सलाह** - गंभीरता-टैग की गई सलाह कार्ड (महत्वपूर्ण/चेतावनी/जानकारी/सफलता) जिसमें तात्कालिकता स्तर, विशिष्ट क्रिया चरण और प्रभावित पैकेज सूची हो
- **पैकेज स्वास्थ्य स्कोर** - 0–100 समग्र स्कोर (गतिविधि + स्थिरता + वृद्धि + स्थिरता) जिसमें प्रति पैकेज अक्षर ग्रेड हों
- **वार्षिक प्रगति ट्रैकिंग** - लगातार इतिहास परत मासिक रूप से प्रति-पैकेज और साप्ताहिक पोर्टफोलियो को एकत्रित करती है; प्रति-रजिस्ट्री स्टैकिंग के साथ पोर्टफोलियो रुझान चार्ट
- **पल्स पैनल** - स्थापित मूवर्स (≥ 50 डाउनलोड/सप्ताह) और उभरते और नए पैकेजों का विभाजित दृश्य, जिसमें इनलाइन 7-दिन की स्पार्कलाइन, पूर्ण + प्रतिशत डेल्टा, बेसलाइन संदर्भ और एक पंक्ति में कार्यकारी सारांश हो
- **लाइव रीफ़्रेश** - मांग पर npm और PyPI API से क्लाइंट-साइड फ़ेच, प्रगति संकेतक के साथ; परिणाम sessionStorage में कैश किए जाते हैं (5 मिनट का TTL) ताकि टैब स्विच तत्काल हों
- **रिपोर्ट निर्यात करें** - रीफ़्रेश बटन के बगल में ड्रॉपडाउन जिसमें तीन प्रारूप दिए गए हैं: **कार्यकारी PDF** (jsPDF के माध्यम से), **LLM JSONL** (AI अंतर्ग्रहण के लिए टाइप किए गए रिकॉर्ड), और **देव मार्कडाउन** (GFM तालिकाएँ)
- **लीडरबोर्ड** - 132 पैकेज जिन्हें साप्ताहिक डाउनलोड द्वारा रैंक किया गया है, जिसमें इनलाइन 30-दिन की स्पार्कलाइन और स्मार्ट ट्रेंड बैज हैं
- **सेटअप पृष्ठ** - पोर्टफोलियो संपादक जिसमें सत्यापन हो, रजिस्ट्री-सिंक साथी अनुभाग और पाइपलाइन अवलोकन हो
- **लीडरबोर्ड खोज** - नाम या रजिस्ट्री के आधार पर पैकेज खोजने के लिए तत्काल टेक्स्ट फ़िल्टर
- **कीबोर्ड नेविगेशन** - टैब के बीच चक्र करने के लिए तीर कुंजियाँ
- **सहायता टैब** - मानव-अनुकूल मार्गदर्शिका जिसमें प्रत्येक टैब, मुख्य अवधारणाएँ, AI अनुमान इंजन, डेटा पाइपलाइन और उपयोगी लिंक शामिल हैं
- **अंधेरा / हल्का थीम** - सिस्टम प्राथमिकता का पालन करता है
- **मोबाइल उत्तरदायी** - छोटे स्क्रीन के लिए हैमबर्गर मेनू

डेटा को CI द्वारा दैनिक रूप से ताज़ा किया जाता है (06:00 UTC) और पूरी साइट को साप्ताहिक रूप से पुनर्निर्मित किया जाता है (सोमवार 06:00 UTC)। लाइव रीफ़्रेश मांग पर रजिस्ट्री API से नवीनतम संख्याएँ सीधे प्राप्त करता है। `site/src/data/packages.json` में ट्रैक किए गए पैकेजों को कॉन्फ़िगर करें।

## AI अनुमान इंजन

शून्य-निर्भरता, शुद्ध-गणित अनुमान जो निर्माण समय पर चलता है - कोई ML रनटाइम नहीं, कोई बाहरी API नहीं।

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

| क्षमता | विधि | यह क्या करता है |
|-----------|--------|-------------|
| **Forecast** | भारित रैखिक प्रतिगमन | घातीय नवीनता पूर्वाग्रह, 80% CI जो समय के साथ चौड़ा होता है |
| **Anomaly detection** | अनुकूली रोलिंग z-स्कोर | 14-दिन की बेसलाइन विंडो, स्पाइक्स और ड्रॉप्स का पता लगाता है |
| **Trend segmentation** | टुकड़े-टुकड़े रैखिक | समय श्रृंखला में ऊपर/नीचे/समतल खंडों की पहचान करता है |
| **Seasonality** | दिन-के-सप्ताह अपघटन | साप्ताहिक पैटर्न का पता लगाता है, चरम दिन की रिपोर्ट करता है |
| **Momentum** | समग्र स्कोर | दिशा + त्वरण + स्थिरता + मात्रा |
| **Health score** | बहु-कारक समग्र | गतिविधि + स्थिरता + वृद्धि + स्थिरता (0–100, A–F ग्रेड) |
| **Yearly progress** | मासिक संचय | YoY वृद्धि, अनुमानित वर्ष-अंत, मील के पत्थर की ट्रैकिंग |
| **Actionable advice** | गंभीरता नियम इंजन | तत्काल और विशिष्ट कार्यों के साथ महत्वपूर्ण/चेतावनी/जानकारी/सफलता |
| **Recommendations** | नियम इंजन | वृद्धि, जोखिम, अवसर और ध्यान श्रेणियाँ |

## डेस्कटॉप ऐप

एक मूल Windows ऐप जो डैशबोर्ड को एक स्थानीय WebView2 शेल में लपेटता है:

- **ऑफ़लाइन में उपयोग योग्य** - इसमें पहले से ही HTML/CSS/JS शामिल हैं; यह इंटरनेट के बिना काम करता है।
- **लाइव रीफ्रेश** - मांग पर GitHub पेजों से `stats.json` प्राप्त करता है।
- **CSV निर्यात** - एक क्लिक से लीडरबोर्ड डेटा निर्यात करें।
- **MSIX पैकेज्ड** - `desktop-ci.yml` के माध्यम से CI में बनाया और हस्ताक्षरित किया गया।

डेस्कटॉप स्रोत `desktop/` में मौजूद है। .NET 10 MAUI का उपयोग करके WinUI 3 को लक्षित करते हुए बनाया गया।

## इंस्टॉल करें

```bash
npm install @mcptoolshop/registry-stats
```

## CLI (कमांड-लाइन इंटरफ़ेस)

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

## कॉन्फ़िगरेशन फ़ाइल

अपने प्रोजेक्ट की रूट निर्देशिका में `registry-stats.config.json` बनाएं (या `registry-stats --init` चलाएं):

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

सभी कॉन्फ़िगर किए गए पैकेजों के लिए आंकड़े प्राप्त करने के लिए बिना किसी तर्क के `registry-stats` चलाएं। CLI सबसे नज़दीकी कॉन्फ़िगरेशन फ़ाइल खोजने के लिए cwd से ऊपर की ओर जाता है।

कॉन्फ़िगरेशन प्रोग्रामेटिक रूप से भी उपलब्ध है:

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## प्रोग्रामेटिक API

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

## रजिस्ट्री समर्थन

| रजिस्ट्री | पैकेज प्रारूप | समय श्रृंखला | उपलब्ध डेटा |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | हाँ (549 दिन) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | हाँ (180 दिन) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (इंस्टॉल), रेटिंग, रुझान |
| `docker` | `namespace/repo` | No | total (पुल), सितारे |

## अंतर्निहित विश्वसनीयता

- 429/5xx त्रुटियों पर घातीय बैकऑफ़ के साथ स्वचालित पुनः प्रयास
- `Retry-After` हेडर का सम्मान करता है
- `AbortSignal.timeout` के माध्यम से 30 सेकंड का अनुरोध टाइमआउट
- बल्क अनुरोधों के लिए समवर्ती सीमा
- वैकल्पिक TTL कैश (प्लग करने योग्य - `StatsCache` इंटरफ़ेस के माध्यम से अपना Redis/फ़ाइल बैकएंड लाएं)
- आपूर्ति श्रृंखला सुरक्षा के लिए SHA-पिन्ड GitHub क्रियाएँ

## REST API सर्वर

इसे एक माइक्रोसेवा के रूप में चलाएं या अपने स्वयं के सर्वर में एम्बेड करें:

```bash
registry-stats serve --port 3000
```

डिफ़ॉल्ट रूप से `serve` `127.0.0.1` (केवल लोकलहोस्ट) पर बाध्य होता है और CORS को `*` पर सेट करता है। इसे नेटवर्क पर उजागर करने के लिए `--host 0.0.0.0` का उपयोग करें और क्रॉस-ऑरिजिन एक्सेस को प्रतिबंधित करने के लिए `--cors <origin>` का उपयोग करें।

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

कस्टम सर्वर या सर्वरलेस के लिए प्रोग्रामेटिक उपयोग:

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## कस्टम रजिस्ट्रियां

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

## रिपो संरचना

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
| **Data touched** | npm, PyPI, NuGet, VS Code मार्केटप्लेस, डॉकर हब से सार्वजनिक डाउनलोड आंकड़े। इन-मेमोरी कैश (वैकल्पिक) |
| **Data NOT touched** | कोई टेलीमेट्री नहीं। कोई एनालिटिक्स नहीं। कोई क्रेडेंशियल स्टोरेज नहीं। कोई उपयोगकर्ता डेटा नहीं। कोई फ़ाइल लेखन नहीं |
| **Permissions** | HTTPS के माध्यम से सार्वजनिक रजिस्ट्री API पढ़ें। लिखें: केवल stdout/stderr |
| **Network** | सार्वजनिक रजिस्ट्री API पर HTTPS आउटबाउंड। वैकल्पिक लोकलहोस्ट REST सर्वर |
| **Telemetry** | कोई भी एकत्र या भेजा नहीं गया |

कमज़ोरी रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

## स्कोरकार्ड

| श्रेणी | अंक |
|----------|-------|
| A. सुरक्षा | 10 |
| B. त्रुटि प्रबंधन | 10 |
| C. ऑपरेटर दस्तावेज़ | 10 |
| D. शिपिंग स्वच्छता | 10 |
| E. पहचान (नरम) | 10 |
| **Overall** | **50/50** |

> पूर्ण ऑडिट: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## लाइसेंस

MIT

---

<a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a> द्वारा निर्मित
