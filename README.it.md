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

Pubblica i tuoi pacchetti su npm, PyPI, NuGet, il Marketplace di VS Code e Docker Hub. Attualmente, per rispondere alla domanda "come stanno performando i miei pacchetti?", è necessario controllare cinque siti diversi. **registry-stats** è la piattaforma completa: un motore TypeScript (CLI + API + server REST), una dashboard web interattiva e un'applicazione desktop nativa per Windows, il tutto contenuto in un unico repository.

Nessuna dipendenza a runtime. Utilizza la funzione nativa `fetch()`. Node 18+.

## Cosa contiene

| Strato | Cosa fa |
|-------|-------------|
| **Engine** | Libreria TypeScript + CLI + server REST. Interroga cinque registri con un'unica interfaccia. Pubblicato su npm come `@mcptoolshop/registry-stats`. |
| **Dashboard** | Applicazione web alimentata da Astro, con il co-pilota AI Pulse (streaming vocale, ricerca web, schermo intero, connettori dati GitHub), sei grafici interattivi, aggiornamento in tempo reale, esportazione di report (PDF / JSONL / Markdown) e una guida di aiuto organizzata in schede. Ricostruita settimanalmente tramite CI; aggiornabile su richiesta. |
| **Desktop** | Applicazione nativa per Windows realizzata con WinUI 3 + WebView2. Include la dashboard offline e scarica le statistiche in tempo reale su richiesta. |

## Dashboard

Una dashboard con aggiornamento automatico è disponibile all'indirizzo [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interfaccia a schede** — Schede Home, Analytics, Classifica e Aiuto.
- **Co-pilota AI Pulse** — Assistente conversazionale basato su Ollama, con sintesi vocale in streaming (parla mentre l'LLM elabora, 4 voci tramite [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), ricerca web (Wikipedia + SearXNG opzionale), sintesi vocale automatica, modalità schermo intero, connettore dati per organizzazioni GitHub, selettore di modelli e memoria delle conversazioni.
- **Panoramica generale** — Punteggio di salute (0–100), indice di diversità, variazione settimanale, numero totale di download in tutti i registri.
- **Sei grafici interattivi** — Tendenza degli ultimi 30 giorni (aggregata / per registro / top-5), quota di registro (area polare), rischio del portafoglio (istogramma + Gini & P90), top-10 dei più performanti, tracciamento della velocità con grafici a linee, e mappa di calore degli ultimi 30 giorni con rilevamento di picchi (>2σ).
- **Motore di crescita intelligente** — Gestisce le distorsioni dovute a numeri bassi con una soglia di base, un limite percentuale e una formula di velocità smorzata.
- **Informazioni utili** — Raccomandazioni generate automaticamente e avvisi per pacchetti in declino.
- **Pannello Pulse** — Vista divisa tra i pacchetti consolidati (≥ 50 download/settimana) e i pacchetti emergenti e nuovi, con grafici a linee degli ultimi 7 giorni, variazioni assolute e percentuali, contesto di riferimento e un riepilogo esecutivo in una riga.
- **Aggiornamento in tempo reale** — Recupero dei dati da npm e PyPI tramite API direttamente dal client, con indicatore di avanzamento; i risultati vengono memorizzati nella sessionStorage (TTL di 5 minuti) per garantire un cambio di scheda immediato.
- **Esportazione di report** — Menu a tendina accanto al pulsante di aggiornamento, che offre tre formati: **Exec PDF** (tramite jsPDF), **LLM JSONL** (record tipizzati per l'elaborazione da parte dell'AI) e **Dev Markdown** (tabelle GFM).
- **Classifica** — 132 pacchetti classificati in base al numero di download settimanali, con grafici a linee degli ultimi 30 giorni e badge intelligenti per le tendenze.
- **Pagina di configurazione** — Editor del portafoglio con validazione, sezione di sincronizzazione con i registri e panoramica delle pipeline.
- **Scheda di aiuto** — Guida chiara e completa che copre ogni scheda, i concetti chiave, i suggerimenti per l'assistente AI, la pipeline dei dati e link utili.
- **Tema chiaro / scuro** — Segue le preferenze del sistema.

I dati vengono recuperati al momento della compilazione e ricostruiti settimanalmente tramite CI (lunedì alle 06:00 UTC). L'aggiornamento in tempo reale recupera i numeri più recenti direttamente dalle API dei registri. Configura i pacchetti da monitorare in `site/src/data/packages.json` (132 pacchetti su 5 registri).

## Applicazione Desktop

Un'applicazione nativa per Windows che integra la dashboard in un ambiente WebView2 locale:

- **Funziona offline** — include HTML/CSS/JS integrati; funziona senza connessione a Internet
- **Aggiornamento in tempo reale** — recupera `stats.json` da GitHub Pages su richiesta
- **Esportazione CSV** — esporta i dati della classifica con un solo clic
- **Pacchetto MSIX** — creato e firmato tramite CI utilizzando `desktop-ci.yml`

Il codice sorgente dell'applicazione desktop si trova in `desktop/`. Realizzato con .NET 10 MAUI e destinato a WinUI 3.

## Installazione

```bash
npm install @mcptoolshop/registry-stats
```

## CLI (Interfaccia a riga di comando)

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

## File di configurazione

Create un file `registry-stats.config.json` nella directory principale del vostro progetto (oppure eseguite `registry-stats --init`):

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

Eseguite `registry-stats` senza argomenti per ottenere le statistiche per tutti i pacchetti configurati. La CLI cerca il file di configurazione a partire dalla directory corrente.

La configurazione è disponibile anche tramite API programmatica:

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

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Supporto per i registri

| Registro | Formato del pacchetto | Serie temporali | Dati disponibili |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sì (549 giorni) | giorno precedente, settimana precedente, mese precedente |
| `pypi` | `requests` | Sì (180 giorni) | giorno precedente, settimana precedente, mese precedente, totale |
| `nuget` | `Newtonsoft.Json` | No | totale |
| `vscode` | `publisher.extension` | No | totale (installazioni), valutazione, tendenze |
| `docker` | `namespace/repo` | No | totale (download), stelle |

## Affidabilità integrata

- Tentativi automatici con backoff esponenziale in caso di errori 429/5xx
- Rispetta le intestazioni `Retry-After`
- Limitazione della concorrenza per richieste di massa
- Cache TTL opzionale (configurabile: potete fornire la vostra implementazione Redis/file tramite l'interfaccia `StatsCache`)

## Server API REST

Eseguite come microservizio o integrate nel vostro server:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

Utilizzo programmatica per server personalizzati o serverless:

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

## Struttura del Repository

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
| **Data NOT touched** | Nessuna telemetria. Nessuna analisi. Nessun archivio di credenziali. Nessun dato utente. Nessuna scrittura di file. |
| **Permissions** | Lettura: API dei registri pubblici tramite HTTPS. Scrittura: solo stdout/stderr. |
| **Network** | Comunicazione HTTPS in uscita verso le API dei registri pubblici. Server REST localhost opzionale. |
| **Telemetry** | Nessun dato raccolto o trasmesso. |

Consultare [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

## Scheda di valutazione

| Categoria | Punteggio |
|----------|-------|
| A. Sicurezza | 10 |
| B. Gestione degli errori | 10 |
| C. Documentazione per gli operatori | 10 |
| D. Igiene del processo di distribuzione | 10 |
| E. Identità (soft) | 10 |
| **Overall** | **50/50** |

> Analisi completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
