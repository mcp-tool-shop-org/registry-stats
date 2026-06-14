<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Pubblichi su npm, PyPI, NuGet, il VS Code Marketplace e Docker Hub. Attualmente, rispondere alla domanda "come stanno andando i miei pacchetti?" significa controllare cinque siti diversi. **registry-stats** è la piattaforma completa: un motore TypeScript (CLI + API + server REST), una dashboard web interattiva e un'app desktop Windows nativa, tutto da un unico repository.

Nessuna dipendenza in fase di esecuzione. Utilizza `fetch()` nativo. Node 18+.

## Cosa contiene

| Livello | A cosa serve |
|-------|-------------|
| **Engine** | Libreria TypeScript + CLI + server REST + inferenza AI. Interroga cinque registri con un'unica interfaccia. Pubblicato su npm come `@mcptoolshop/registry-stats`. |
| **Dashboard** | App web basata su Astro con pannello di inferenza AI (punteggi di salute, previsioni, consigli pratici), co-pilota Pulse AI (voce in streaming, ricerca sul web, schermo intero, connettori dati GitHub), sette grafici interattivi con zoom/pan, aggiornamento in tempo reale, esportazione di report (PDF / JSONL / Markdown) e guida contestuale. Ricostruita quotidianamente tramite CI; ricaricabile su richiesta. |
| **Desktop** | App Windows nativa WinUI 3 + WebView2. Include la dashboard offline e recupera le statistiche in tempo reale su richiesta. |

## Dashboard

Una dashboard di statistiche ad aggiornamento automatico è disponibile all'indirizzo [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interfaccia a schede:** Home, Analisi, Classifica e Guida
- **Co-pilota Pulse AI:** assistente conversazionale basato su Ollama con sintesi vocale in streaming (parla mentre il modello linguistico genera l'output, 4 voci tramite [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), ricerca sul web (Wikipedia + SearXNG opzionale), riproduzione automatica, modalità a schermo intero, connettore dati dell'organizzazione GitHub, selettore del modello e memoria della conversazione
- **Riepilogo esecutivo:** punteggio di salute (0–100), indice di diversità, variazione settimanale, download totali su tutti i registri
- **Sette grafici interattivi:** tendenza a 30 giorni (aggregato / per registro / top-5 con possibilità di attivare/disattivare + clic per approfondire + scorrimento zoom/pan), quota del registro (area polare), rischio del portafoglio (istogramma + Gini e P90), top 10 in termini di crescita, tracciatore della velocità con grafici a barre, mappa termica a 30 giorni con rilevamento dei picchi (>2σ) e tendenza del portafoglio (area impilata, annuale)
- **Motore di crescita intelligente:** gestisce la distorsione dovuta ai piccoli denominatori con una soglia di base, un limite percentuale e una formula di velocità smorzata
- **Pannello di inferenza AI:** slancio del portafoglio (-100 a +100), punteggio di rischio, previsione a 7 giorni con intervalli di confidenza, raccomandazioni automatizzate, consigli pratici con livelli di gravità/urgenza e tabella dei punteggi sulla salute dei pacchetti (voti da A a F)
- **Consigli pratici:** schede di consiglio contrassegnate per gravità (critico/avviso/info/successo) con livelli di urgenza, passaggi specifici e elenchi di pacchetti interessati
- **Punteggi sulla salute dei pacchetti:** punteggio composito da 0 a 100 (attività + coerenza + crescita + stabilità) con voti per ogni pacchetto
- **Monitoraggio dell'andamento annuale:** un livello di cronologia persistente accumula dati mensili per pacchetto e aggregati settimanali del portafoglio; grafico della tendenza del portafoglio con impilamento per registro
- **Pannello Pulse:** vista divisa dei "Established Movers" (≥ 50 download a settimana) e dei pacchetti "Emergenti e Nuovi", con grafici a barre inline di 7 giorni, delta assoluti + percentuali, contesto di base e un riepilogo esecutivo in una riga
- **Aggiornamento in tempo reale:** recupero su richiesta lato client dalle API npm e PyPI con indicatore di avanzamento; i risultati vengono memorizzati nella cache in sessionStorage (TTL di 5 minuti) in modo che il passaggio tra le schede sia istantaneo
- **Esportazione dei report:** menu a tendina accanto al pulsante Aggiorna che offre tre formati: **Exec PDF** (tramite jsPDF), **LLM JSONL** (record tipizzati per l'inserimento nell'AI) e **Dev Markdown** (tabelle GFM)
- **Classifica:** 132 pacchetti classificati in base ai download settimanali con grafici a barre inline di 30 giorni e badge di tendenza intelligenti
- **Pagina di configurazione:** editor del portafoglio con convalida, sezione complementare per la sincronizzazione dei registri e panoramica della pipeline
- **Ricerca nella classifica:** filtro di testo istantaneo per trovare i pacchetti per nome o registro
- **Navigazione tramite tastiera:** tasti freccia per passare tra le schede
- **Scheda Guida:** guida intuitiva che copre ogni scheda, concetti chiave, motore di inferenza AI, pipeline dei dati e collegamenti utili
- **Tema scuro/chiaro:** segue le preferenze del sistema
- **Design reattivo per dispositivi mobili:** menu hamburger per schermi piccoli

I dati vengono aggiornati quotidianamente tramite CI (06:00 UTC) e l'intero sito viene ricostruito settimanalmente (lunedì alle 06:00 UTC). L'aggiornamento in tempo reale recupera gli ultimi numeri direttamente dalle API dei registri su richiesta. Configura i pacchetti tracciati in `site/src/data/packages.json`.

## Motore di inferenza AI

Inferenza pura basata sulla matematica, senza dipendenze, che viene eseguita al momento della compilazione: nessun runtime ML, nessuna API esterna.

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

| Capacità | Metodo | A cosa serve |
|-----------|--------|-------------|
| **Forecast** | Regressione lineare ponderata | Bias di recenza esponenziale, intervallo di confidenza dell'80% che si allarga nel tempo |
| **Anomaly detection** | Punteggio z adattivo a finestra mobile | Finestra di base di 14 giorni, rileva picchi e cali |
| **Trend segmentation** | Lineare a tratti | Identifica segmenti in aumento/in diminuzione/piatti nelle serie temporali |
| **Seasonality** | Decomposizione del giorno della settimana | Rileva modelli settimanali, segnala il giorno di picco |
| **Momentum** | Punteggio composito | Direzione + accelerazione + coerenza + volume |
| **Health score** | Composito multifattoriale | Attività + coerenza + crescita + stabilità (da 0 a 100, voto da A a F) |
| **Yearly progress** | Accumulo mensile | Crescita YoY, proiezione di fine anno, monitoraggio delle pietre miliari |
| **Actionable advice** | Motore di regole di gravità | Critico/avviso/info/successo con urgenza e azioni specifiche |
| **Recommendations** | Motore di regole | Categorie: crescita, rischio, opportunità e attenzione |

## App desktop

Un'app Windows nativa che racchiude la dashboard in un contenitore WebView2 locale:

- **Funzionamento offline:** include HTML/CSS/JS; funziona senza internet.
- **Aggiornamento in tempo reale:** recupera `stats.json` da GitHub Pages su richiesta.
- **Esportazione CSV:** esporta i dati della classifica con un clic.
- **Pacchetto MSIX:** creato e firmato tramite CI utilizzando `desktop-ci.yml`.

Il codice sorgente per desktop si trova in `desktop/`. Creato con .NET 10 MAUI, destinato a WinUI 3.

## Installazione

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

## File di configurazione

Crea un file `registry-stats.config.json` nella directory principale del tuo progetto (oppure esegui `registry-stats --init`):

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

Esegui `registry-stats` senza argomenti per recuperare le statistiche per tutti i pacchetti configurati. La CLI risale dalla directory corrente per trovare il file di configurazione più vicino.

La configurazione è disponibile anche a livello programmatico:

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## API programmatica

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

## Supporto dei registri

| Registro | Formato del pacchetto | Serie temporale | Dati disponibili |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sì (549 giorni) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sì (180 giorni) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installazioni), rating, tendenze |
| `docker` | `namespace/repo` | No | total (download), stelle |

## Affidabilità integrata

- Riprova automatica con backoff esponenziale in caso di errori 429/5xx.
- Rispetta le intestazioni `Retry-After`.
- Timeout delle richieste di 30 secondi tramite `AbortSignal.timeout`.
- Limitazione della concorrenza per le richieste in blocco.
- Cache TTL opzionale (estensibile: utilizza il tuo backend Redis/file tramite l'interfaccia `StatsCache`).
- Azioni GitHub con SHA fissato per la sicurezza della supply chain.

## Server API REST

Esegui come microservizio o incorporalo nel tuo server:

```bash
registry-stats serve --port 3000
```

Per impostazione predefinita, `serve` si associa a `127.0.0.1` (solo localhost) e imposta CORS su `*`. Utilizza `--host 0.0.0.0` per esporlo sulla rete e `--cors <origin>` per limitare l'accesso tra domini diversi quando lo fai.

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

Utilizzo programmatico per server personalizzati o serverless:

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Registri personalizzati

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

## Struttura del repository

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## Sviluppo

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## Sicurezza e ambito dei dati

| Aspetto | Dettaglio |
|--------|--------|
| **Data touched** | Statistiche di download pubbliche da npm, PyPI, NuGet, VS Code Marketplace, Docker Hub. Cache in memoria (opzionale). |
| **Data NOT touched** | Nessuna telemetria. Nessuna analisi. Nessun archivio credenziali. Nessun dato utente. Nessuna scrittura su file. |
| **Permissions** | Lettura: API dei registri pubblici tramite HTTPS. Scrittura: solo stdout/stderr. |
| **Network** | HTTPS in uscita verso le API dei registri pubblici. Server REST localhost opzionale. |
| **Telemetry** | Nessuno raccolto o inviato. |

Consulta [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

## Valutazione

| Categoria | Punteggio |
|----------|-------|
| A. Sicurezza | 10 |
| B. Gestione degli errori | 10 |
| C. Documentazione per gli operatori | 10 |
| D. Igiene della distribuzione | 10 |
| E. Identità (soft) | 10 |
| **Overall** | **50/50** |

> Audit completo: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md).

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
