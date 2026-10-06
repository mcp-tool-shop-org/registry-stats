<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.md">English</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

आप npm, PyPI, NuGet, VS Code मार्केटप्लेस, Docker Hub और GitHub रिलीज़ में प्रकाशित करते हैं। अभी, "मेरे पैकेज कैसे कर रहे हैं?" का उत्तर देने का मतलब है छह अलग-अलग साइटों की जांच करना। **registry-stats** एक संपूर्ण प्लेटफ़ॉर्म है: एक TypeScript इंजन (CLI + API + REST सर्वर), एक लाइव वेब डैशबोर्ड और एक मूल Windows डेस्कटॉप ऐप - ये सभी एक ही रिपॉजिटरी से।

शून्य रनटाइम निर्भरताएँ। मूल `fetch()` का उपयोग करता है। Node 18+.

## इसके अंदर क्या है

| लेयर | यह क्या करता है |
|-------|-------------|
| **Engine** | TypeScript लाइब्रेरी + CLI + REST सर्वर + AI अनुमान। छह रजिस्ट्रियों - npm, PyPI, NuGet, VS Code मार्केटप्लेस, Docker Hub और GitHub रिलीज़ - को एक इंटरफ़ेस के साथ क्वेरी करें। एक साधारण पैकेज नाम npm, PyPI, NuGet, VS Code मार्केटप्लेस और Docker Hub को क्वेरी करता है। जब नाम मालिक/रिपॉजिटरी हो, या जब रजिस्ट्रियों की सूची में नाम github हो, तो GitHub रिलीज़ शामिल किया जाता है। npm पर `@mcptoolshop/registry-stats` के रूप में प्रकाशित। |
| **Dashboard** | AI अनुमान पैनल (स्वास्थ्य स्कोर, पूर्वानुमान, कार्रवाई योग्य सलाह), पल्स AI सह-पायलट (स्ट्रीमिंग वॉयस, वेब खोज, फुलस्क्रीन, GitHub डेटा कनेक्टर), सात चार्ट (30-दिवसीय रुझान और पोर्टफोलियो रुझान पर स्क्रॉल ज़ूम और पैन), लाइव रीफ़्रेश, रिपोर्ट निर्यात (PDF / JSONL / Markdown), और टैबयुक्त सहायता मार्गदर्शिका के साथ एस्ट्रो-संचालित वेब ऐप। दैनिक CI डैशबोर्ड डेटा प्राप्त करता है। साइट को साप्ताहिक रूप से, सोमवार को 07:00 UTC पर फिर से बनाया जाता है। |
| **Desktop** | WinUI 3 + WebView2 मूल Windows ऐप। डैशबोर्ड को ऑफ़लाइन बंडल करता है, मांग पर लाइव आंकड़े प्राप्त करता है। |

## डैशबोर्ड

एक स्व-अद्यतन आँकड़ा डैशबोर्ड [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/) पर उपलब्ध है।

- **टैबयुक्त इंटरफ़ेस** - होम, एनालिटिक्स, लीडरबोर्ड और सहायता टैब
- **पल्स AI सह-पायलट** - ओलामा-संचालित संवादात्मक सहायक जिसमें स्ट्रीमिंग वॉयस संश्लेषण (LLM स्ट्रीम करते समय बोलता है, [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard) के माध्यम से 4 आवाजें), वेब खोज (विकिपीडिया + वैकल्पिक SearXNG), ऑटो-स्पीक, फुलस्क्रीन मोड, GitHub संगठन डेटा कनेक्टर, मॉडल चयनकर्ता और वार्तालाप स्मृति
- **कार्यकारी स्नैपशॉट** - स्वास्थ्य स्कोर (0-100), विविधता सूचकांक और साप्ताहिक परिवर्तन। साप्ताहिक और मासिक डाउनलोड योग npm और PyPI हैं। VS Code, NuGet, Docker और GitHub अपने सभी समय के कुल योगदान देते हैं, न कि उन दो योगों को।
- **सात इंटरैक्टिव चार्ट** - 30-दिवसीय रुझान (एकत्रित / प्रति-रजिस्ट्री / शीर्ष-5 टॉगल + ड्रिल-डाउन के लिए क्लिक करें), रजिस्ट्री शेयर (ध्रुवीय क्षेत्र), पोर्टफोलियो जोखिम (हिस्टोग्राम + गिनी और P90), शीर्ष-10 गति, स्पार्कलाइन के साथ वेग ट्रैकर, 30-दिवसीय हीटमैप जिसमें स्पाइक का पता लगाया जाता है (>2σ), और पोर्टफोलियो रुझान (स्टैक्ड क्षेत्र, वार्षिक)। स्क्रॉल ज़ूम और पैन केवल 30-दिवसीय रुझान और पोर्टफोलियो रुझान पर हैं।
- **स्मार्ट ग्रोथ इंजन** - बेसलाइन थ्रेशोल्ड, प्रतिशत कैप और डैम्प्ड वेग सूत्र के साथ छोटे-हर विरूपण को संभालता है
- **AI अनुमान पैनल** - पोर्टफोलियो गति (-100 से +100), जोखिम स्कोर, आत्मविश्वास अंतराल के साथ 7-दिवसीय पूर्वानुमान, स्वचालित अनुशंसाएं, गंभीरता/तत्काल स्तरों के साथ कार्रवाई योग्य सलाह और पैकेज स्वास्थ्य स्कोरबोर्ड (A-F ग्रेड)
- **कार्रवाई योग्य सलाह** - गंभीरता-टैग वाली सलाह कार्ड (महत्वपूर्ण/चेतावनी/जानकारी/सफलता) जिसमें तात्कालिकता स्तर, विशिष्ट कार्रवाई चरण और प्रभावित पैकेज सूची शामिल है
- **पैकेज स्वास्थ्य स्कोर** - 0-100 समग्र स्कोर (गतिविधि + स्थिरता + विकास + स्थिरता) जिसमें प्रति पैकेज अक्षर ग्रेड शामिल हैं
- **वार्षिक प्रगति ट्रैकिंग** - लगातार इतिहास परत मासिक प्रति-पैकेज और साप्ताहिक पोर्टफोलियो योगों को जमा करती है; प्रति-रजिस्ट्री स्टैकिंग के साथ पोर्टफोलियो रुझान चार्ट
- **पल्स पैनल** - स्थापित मूवर्स (≥ 50 डाउनलोड/सप्ताह) और उभरते और नए पैकेजों का विभाजित दृश्य, जिसमें इनलाइन 7-दिवसीय स्पार्कलाइन, पूर्ण + प्रतिशत डेल्टा, बेसलाइन संदर्भ और एक-पंक्ति कार्यकारी सारांश शामिल है
- **लाइव रीफ़्रेश** - पृष्ठ उसी मूल `data/stats.json` को फिर से प्राप्त करता है जब वह फ़ाइल बिल्ड से नई होती है। यह ब्राउज़र से npm या PyPI API को कॉल नहीं करता है। `sessionStorage` में वैकल्पिक GitHub PAT होता है, न कि एक सांख्यिकी कैश।
- **रिपोर्ट निर्यात** - रीफ़्रेश बटन के बगल में ड्रॉपडाउन जिसमें तीन प्रारूप दिए गए हैं: **कार्यकारी PDF** (jsPDF के माध्यम से), **LLM JSONL** (AI अंतर्ग्रहण के लिए टाइप किए गए रिकॉर्ड), और **देव मार्कडाउन** (GFM तालिकाएँ)
- **लीडरबोर्ड** - `packages.json` में 268 ट्रैक किए गए आईडी (168 npm, 43 PyPI, 6 VS Code, 27 NuGet, 24 GitHub), डाउनलोड कॉलम द्वारा रैंक किया गया: npm और PyPI के लिए सप्ताह, VS Code, NuGet, Docker और GitHub के लिए सभी समय। 30-दिवसीय स्पार्कलाइन npm श्रृंखला है। स्मार्ट ट्रेंड बैज कम-मात्रा वाले पैकेजों के लिए भ्रामक प्रतिशत से बचते हैं।
- **सेटअप पृष्ठ** - सत्यापन, रजिस्ट्री-सिंक साथी अनुभाग और पाइपलाइन अवलोकन के साथ पोर्टफोलियो संपादक
- **लीडरबोर्ड खोज** - नाम या रजिस्ट्री द्वारा पैकेज खोजने के लिए त्वरित पाठ फ़िल्टर
- **कीबोर्ड नेविगेशन** - टैब के बीच चक्र करने के लिए तीर कुंजियाँ
- **सहायता टैब** - मानव-अनुकूल मार्गदर्शिका जिसमें प्रत्येक टैब, मुख्य अवधारणाएँ, AI अनुमान इंजन, डेटा पाइपलाइन और उपयोगी लिंक शामिल हैं
- **डार्क / लाइट थीम** - सिस्टम प्राथमिकता का पालन करता है
- **मोबाइल उत्तरदायी** - छोटे स्क्रीन के लिए हैमबर्गर मेनू

डेटा को CI द्वारा दैनिक रूप से ताज़ा किया जाता है (06:00 UTC) और पूरी साइट को साप्ताहिक रूप से फिर से बनाया जाता है (सोमवार को 07:00 UTC)। डैशबोर्ड उसी मूल `data/stats.json` को फिर से प्राप्त करता है। `site/src/data/packages.json` में ट्रैक किए गए पैकेजों को कॉन्फ़िगर करें।

## AI अनुमान इंजन

शून्य-निर्भरता, शुद्ध-गणितीय अनुमान जो निर्माण समय पर चलता है — कोई ML रनटाइम नहीं, कोई बाहरी API नहीं।

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

| क्षमता | विधि | यह क्या करता है |
|-----------|--------|-------------|
| **Forecast** | भारित रैखिक प्रतिगमन | घातीय नवीनता पूर्वाग्रह, 80% CI जो समय के साथ चौड़ा होता है |
| **Anomaly detection** | अनुकूली रोलिंग z-स्कोर | 14-दिन की बेसलाइन विंडो, स्पाइक्स और ड्रॉप्स का पता लगाता है |
| **Trend segmentation** | टुकड़े-टुकड़े रैखिक | समय श्रृंखला में ऊपर/नीचे/समतल खंडों की पहचान करता है |
| **Seasonality** | सप्ताह के दिन का अपघटन | साप्ताहिक पैटर्न का पता लगाता है, चरम दिन की रिपोर्ट करता है |
| **Momentum** | समग्र स्कोर | दिशा + त्वरण + स्थिरता + मात्रा |
| **Health score** | बहु-कारक समग्र | गतिविधि + स्थिरता + वृद्धि + स्थिरता (0–100, A–F ग्रेड) |
| **Yearly progress** | मासिक संचय | YoY वृद्धि, अनुमानित वर्ष-अंत, मील के पत्थर की ट्रैकिंग |
| **Actionable advice** | गंभीरता नियम इंजन | तत्काल और विशिष्ट कार्यों के साथ महत्वपूर्ण/चेतावनी/जानकारी/सफलता |
| **Recommendations** | नियम इंजन | विकास, जोखिम, अवसर और ध्यान श्रेणियाँ |

## डेस्कटॉप ऐप

एक मूल Windows ऐप जो डैशबोर्ड को एक स्थानीय WebView2 शेल में लपेटता है:

- **ऑफ़लाइन-सक्षम** - बंडल किए गए HTML/CSS/JS को शिप करता है; इंटरनेट के बिना काम करता है
- **लाइव रीफ़्रेश** - बिना सहेजे गए पोर्टफोलियो के साथ, GitHub पृष्ठ `stats.json` डाउनलोड करता है। सहेजे गए पोर्टफोलियो के साथ, प्रत्येक नाम को उस रजिस्ट्री में भेजता है जिसमें वह है और पोर्टफोलियो फ़ाइल अपलोड नहीं करता है।
- **CSV निर्यात** - एक क्लिक से लीडरबोर्ड डेटा निर्यात करें
- **MSIX पैकेज** - CI के माध्यम से बनाया और हस्ताक्षरित `desktop-ci.yml`

डेस्कटॉप स्रोत `desktop/` में है। .NET 10 MAUI के साथ बनाया गया है जो WinUI 3 को लक्षित करता है।

## इंस्टॉल करें

```bash
npm install @mcptoolshop/registry-stats
```

## सीएलआई

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

## कॉन्फ़िगरेशन फ़ाइल

अपनी प्रोजेक्ट रूट में एक `registry-stats.config.json` बनाएँ (या `registry-stats --init` चलाएँ):

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

सभी कॉन्फ़िगर किए गए पैकेजों के लिए आंकड़े प्राप्त करने के लिए बिना किसी तर्क के `registry-stats` चलाएं। CLI निकटतम कॉन्फ़िग फ़ाइल खोजने के लिए cwd से ऊपर की ओर जाता है। ऊपर दिया गया `registries` सरणी डिफ़ॉल्ट पाँच है। GitHub रिलीज़ को शामिल करने के लिए `"github"` जोड़ें; वे पैकेज `owner/repo` स्लग हैं। यदि कोई कॉन्फ़िग फ़ाइल नहीं है, तो एक पैकेज क्वेरी GitHub रिलीज़ को छोड़कर, सभी अंतर्निहित रजिस्ट्री का उपयोग करती है, जब तक कि नाम मालिक/रिपो न हो। रजिस्ट्री सूची में github का उल्लेख करने पर भी यह क्वेरी की जाती है, और एक साधारण नाम उस रजिस्ट्री से एक त्रुटि उत्पन्न करता है।

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

## रजिस्ट्री समर्थन

| रजिस्ट्री | पैकेज प्रारूप | समय श्रृंखला | उपलब्ध डेटा |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | हाँ (549 दिन) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | हाँ (180 दिन) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (इंस्टॉल), रेटिंग, रुझान |
| `docker` | `namespace/repo` | No | total (पुल), सितारे |
| `github` | `owner/repo` | No | कुल (एसेट डाउनलोड), रिलीज़, एसेट, नवीनतम टैग |

## अंतर्निहित विश्वसनीयता

- 429/5xx त्रुटियों पर घातीय बैकऑफ़ के साथ स्वचालित पुनः प्रयास
- `Retry-After` हेडर का सम्मान करता है
- `AbortSignal.timeout` के माध्यम से 30-सेकंड का अनुरोध टाइमआउट
- बल्क अनुरोधों के लिए समवर्ती सीमा
- वैकल्पिक टीटीएल कैश (प्लग करने योग्य - `StatsCache` इंटरफ़ेस के माध्यम से अपना स्वयं का रेडिस/फ़ाइल बैकएंड लाएं)
- आपूर्ति श्रृंखला सुरक्षा के लिए SHA-पिन्ड GitHub क्रियाएं

## REST API सर्वर

इसे एक माइक्रोसेवा के रूप में चलाएं या इसे अपने स्वयं के सर्वर में एम्बेड करें:

```bash
registry-stats serve --port 3000
```

डिफ़ॉल्ट रूप से `serve` `127.0.0.1` (केवल लोकलहोस्ट) पर बाध्य होता है और CORS को `*` पर सेट करता है। इसे नेटवर्क पर उजागर करने के लिए `--host 0.0.0.0` का उपयोग करें और ऐसा करते समय क्रॉस-ऑरिजिन एक्सेस को प्रतिबंधित करने के लिए `--cors <origin>` का उपयोग करें।

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

कस्टम सर्वर या सर्वर रहित के लिए प्रोग्रामेटिक उपयोग:

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

## रेपो संरचना

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

### डेस्कटॉप ऐप

विंडोज, .NET 10 SDK के साथ। पहले `npm run site:build` चलाएं ताकि `site/dist` मौजूद हो। परियोजना इसे आउटपुट `wwwroot/registry-stats` पर कॉपी करती है।

```bash
dotnet workload install maui-windows
npm run site:build
dotnet build desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
# or
dotnet publish desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
```

हस्ताक्षरित MSIX, `desktop-ci.yml` से एक CI कलाकृति है। यह GitHub रिलीज़ डाउनलोड नहीं है और न ही यह स्टोर अपलोड है। रजिस्ट्री पल्स, विंडोज डेस्कटॉप ऐप, https://apps.microsoft.com/detail/9P9TR0055JG9 पर सूचीबद्ध है। इस रिपो में पैकेज संस्करण 3.4.0.0 है। पार्टनर सेंटर आपके द्वारा अपलोड की गई फ़ाइल पर हस्ताक्षर करता है।

## सुरक्षा और डेटा दायरा

| पहलू | विवरण |
|--------|--------|
| **Data touched** | npm, PyPI, NuGet, VS कोड मार्केटप्लेस, डॉकर हब और GitHub रिलीज़ से सार्वजनिक डाउनलोड आंकड़े। वैकल्पिक इन-मेमोरी कैश। `registry-stats --init`, `registry-stats.config.json` लिखता है। डेस्कटॉप ऐप `%LOCALAPPDATA%\RegistryPulse` के अंतर्गत `packages.json` और `stats.json` लिखता है। |
| **Credentials** | `--init` कोई टोकन नहीं लिखता है। यदि आप एक जोड़ते हैं, तो कॉन्फ़िग फ़ाइल में `dockerToken` या `githubToken` हो सकता है, और वह मान फ़ाइल में बना रहता है। CLI डॉकर हब पर `dockerToken` को एक बेयरर टोकन के रूप में और केवल `api.github.com` पर `githubToken` को एक बेयरर टोकन के रूप में भेजता है। उपकरण स्वयं कोई भी टोकन नहीं लिखता है। डैशबोर्ड `sessionStorage` में एक GitHub PAT रख सकता है और इसे `api.github.com` पर भेज सकता है। |
| **Data NOT touched** | कोई टेलीमेट्री नहीं। कोई एनालिटिक्स नहीं। कोई उपयोगकर्ता खाते नहीं। |
| **Permissions** | पढ़ें: HTTPS के माध्यम से सार्वजनिक रजिस्ट्री API, साथ ही उन प्रमाणित कॉल जब एक टोकन प्रदान किया जाता है। लिखें: stdout/stderr, `--init` पर `registry-stats.config.json`, और `%LOCALAPPDATA%\RegistryPulse` के अंतर्गत डेस्कटॉप फ़ाइलें। उपयोगकर्ता द्वारा निर्दिष्ट पोर्ट पर वैकल्पिक REST सर्वर। |
| **Network** | `api.npmjs.org`, `registry.npmjs.org` (`--mine`), `pypistats.org`, `azuresearch-usnc.nuget.org`, `marketplace.visualstudio.com`, `hub.docker.com` और `api.github.com` (GitHub रिलीज़) पर HTTPS आउटबाउंड। डेस्कटॉप रीफ़्रेश भी `mcp-tool-shop-org.github.io` से आंकड़े डाउनलोड करता है। वैकल्पिक लोकलहोस्ट REST सर्वर। |
| **Telemetry** | कोई भी एकत्र या भेजा नहीं गया |

भेद्यता रिपोर्टिंग के लिए [SECURITY.md](SECURITY.md) देखें।

## स्कोरकार्ड

| श्रेणी | स्कोर |
|----------|-------|
| ए. सुरक्षा | 10 |
| बी. त्रुटि प्रबंधन | 8 |
| सी. ऑपरेटर दस्तावेज़ | 10 |
| डी. शिपिंग स्वच्छता | 8 |
| ई. पहचान (सॉफ्ट) | 10 |
| **Overall** | **46/50** |

> पूर्ण ऑडिट: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## लाइसेंस

एमआईटी

---

<a href="https://mcp-tool-shop.github.io/">MCP टूल शॉप</a> द्वारा निर्मित
