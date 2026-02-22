<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <strong>हिन्दी</strong> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="registry-stats लोगो" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  एक कमांड। पाँच रजिस्ट्री। आपके सभी डाउनलोड आँकड़े।
</p>

<p align="center">
  <a href="#इंस्टॉल">इंस्टॉल</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#कॉन्फ़िग-फ़ाइल">कॉन्फ़िग</a> &middot;
  <a href="#प्रोग्रामैटिक-api">API</a> &middot;
  <a href="#rest-api-सर्वर">REST सर्वर</a> &middot;
  <a href="#लाइसेंस">लाइसेंस</a>
</p>

---

यदि आप npm, PyPI, NuGet, VS Code Marketplace, या Docker Hub पर पैकेज प्रकाशित करते हैं, तो "इस महीने मेरे कितने डाउनलोड हुए?" का जवाब देने के लिए आपको पाँच अलग-अलग API की आवश्यकता होती है। यह लाइब्रेरी सभी के लिए एक इंटरफ़ेस प्रदान करती है — CLI या प्रोग्रामैटिक API के रूप में।

शून्य निर्भरता। नेटिव `fetch()` का उपयोग। Node 18+.

## इंस्टॉल

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# एकल रजिस्ट्री क्वेरी
registry-stats express -r npm

# सभी रजिस्ट्री एक साथ क्वेरी
registry-stats express

# मासिक ब्रेकडाउन + ट्रेंड के साथ टाइम सीरीज़
registry-stats express -r npm --range 2025-01-01:2025-06-30

# JSON आउटपुट
registry-stats express -r npm --json

# अन्य रजिस्ट्री
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# कॉन्फ़िग फ़ाइल बनाएँ
registry-stats --init

# कॉन्फ़िग से चलाएँ — सभी ट्रैक किए गए पैकेज प्राप्त करें
registry-stats

# रजिस्ट्री में तुलना करें
registry-stats express --compare

# CSV या चार्ट-फ्रेंडली JSON में एक्सपोर्ट
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# REST API सर्वर शुरू करें
registry-stats serve --port 3000
```

## कॉन्फ़िग फ़ाइल

अपने प्रोजेक्ट रूट में `registry-stats.config.json` बनाएँ (या `registry-stats --init` चलाएँ):

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

बिना तर्क के `registry-stats` चलाएँ और सभी कॉन्फ़िगर किए गए पैकेजों के आँकड़े प्राप्त करें। CLI वर्तमान डायरेक्टरी से ऊपर की ओर कॉन्फ़िग फ़ाइल खोजता है।

## प्रोग्रामैटिक API

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// एकल रजिस्ट्री
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// सभी रजिस्ट्री (Promise.allSettled का उपयोग — कभी एरर नहीं फेंकता)
const all = await stats.all('express');

// बल्क — कई पैकेज, सीमित कंकरेंसी (डिफ़ॉल्ट: 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// टाइम सीरीज़ (केवल npm + pypi)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// गणनाएँ
calc.total(daily);                         // कुल डाउनलोड
calc.avg(daily);                           // दैनिक औसत
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // 7-दिन मूविंग एवरेज
calc.popularity(daily);                    // 0-100 लॉग-स्केल स्कोर

// एक्सपोर्ट फ़ॉर्मेट
calc.toCSV(daily);                         // CSV स्ट्रिंग
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// तुलना — रजिस्ट्री में एक ही पैकेज
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// कैश (5 मिनट TTL, इन-मेमोरी)
const cache = createCache();
await stats('npm', 'express', { cache });
```

## रजिस्ट्री सपोर्ट

| रजिस्ट्री | पैकेज फ़ॉर्मेट | टाइम सीरीज़ | उपलब्ध डेटा |
|-----------|---------------|------------|-------------|
| `npm` | `express`, `@scope/pkg` | हाँ (549 दिन) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | हाँ (180 दिन) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | नहीं | total |
| `vscode` | `publisher.extension` | नहीं | total (इंस्टॉल), rating, trends |
| `docker` | `namespace/repo` | नहीं | total (पुल), stars |

## अंतर्निर्मित विश्वसनीयता

- 429/5xx त्रुटियों पर एक्सपोनेंशियल बैकऑफ़ के साथ स्वचालित रीट्राई
- `Retry-After` हेडर का सम्मान
- बल्क अनुरोधों के लिए कंकरेंसी सीमा
- वैकल्पिक TTL कैश (प्लगेबल — `StatsCache` इंटरफ़ेस के माध्यम से Redis/फ़ाइल बैकएंड)

## REST API सर्वर

माइक्रोसर्विस के रूप में चलाएँ, या अपने सर्वर में एम्बेड करें:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # सभी रजिस्ट्री
GET /stats/:registry/:package    # एकल रजिस्ट्री
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// क्विक स्टार्ट
serve({ port: 3000 });

// कस्टम सर्वर
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

## लाइसेंस

MIT
