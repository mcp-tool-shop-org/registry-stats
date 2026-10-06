<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.md">English</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Pubblichi su npm, PyPI, NuGet, il VS Code Marketplace, Docker Hub e GitHub Releases. Attualmente, rispondere alla domanda "come stanno andando i miei pacchetti?" significa controllare sei siti diversi. **registry-stats** è la piattaforma completa: un motore TypeScript (CLI + API + server REST), una dashboard web in tempo reale e un'app desktop nativa per Windows, tutto da un unico repository.

Nessuna dipendenza in fase di esecuzione. Utilizza `fetch()` nativo. Node 18+.

## Cosa contiene

| Livello | Cosa fa |
|-------|-------------|
| **Engine** | Libreria TypeScript + CLI + server REST + inferenza AI. Interroga sei registri: npm, PyPI, NuGet, il VS Code Marketplace, Docker Hub e GitHub Releases, con un'unica interfaccia. Inserendo il nome di un pacchetto, vengono interrogati npm, PyPI, NuGet, il VS Code Marketplace e Docker Hub. GitHub Releases viene incluso quando il nome è nel formato owner/repo, oppure quando l'elenco dei registri contiene nomi di tipo github. Pubblicato su npm come `@mcptoolshop/registry-stats`. |
| **Dashboard** | App web basata su Astro con pannello di inferenza AI (punteggi di salute, previsioni, consigli pratici), co-pilota Pulse AI (voce in streaming, ricerca web, schermo intero, connettori dati GitHub), sette grafici (zoom e panoramica a scorrimento sulla tendenza dei 30 giorni e sulla tendenza del portfolio), aggiornamento in tempo reale, esportazione di report (PDF / JSONL / Markdown) e guida di riferimento suddivisa in schede. Ogni giorno, il CI recupera i dati della dashboard. Il sito viene ricostruito settimanalmente, il lunedì alle 07:00 UTC. |
| **Desktop** | App Windows nativa WinUI 3 + WebView2. Include la dashboard offline e recupera le statistiche in tempo reale su richiesta. |

## Dashboard

Una dashboard di statistiche ad aggiornamento automatico è disponibile all'indirizzo [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interfaccia a schede:** schede Home, Analytics, Classifica e Guida
- **Co-pilota Pulse AI:** assistente conversazionale basato su Ollama con sintesi vocale in streaming (parla mentre il modello linguistico genera il testo, 4 voci tramite [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), ricerca web (Wikipedia + SearXNG opzionale), riproduzione automatica, modalità a schermo intero, connettore dati dell'organizzazione GitHub, selettore del modello e memoria della conversazione
- **Riepilogo esecutivo:** punteggio di salute (da 0 a 100), indice di diversità e variazione settimanale. I totali settimanali e mensili dei download sono relativi a npm e PyPI. VS Code, NuGet, Docker e GitHub contribuiscono con il loro totale di sempre, non con questi due totali.
- **Sette grafici interattivi:** tendenza dei 30 giorni (aggregato / per registro / attivazione dei primi 5 + clic per approfondire), quota del registro (area polare), rischio del portfolio (istogramma + Gini e P90), primi 10 in termini di crescita, tracciatore di velocità con grafici a barre, mappa di calore dei 30 giorni con rilevamento di picchi (>2σ) e tendenza del portfolio (area impilata, annuale). Zoom e panoramica a scorrimento sono disponibili solo per la tendenza dei 30 giorni e la tendenza del portfolio.
- **Motore di crescita intelligente:** gestisce la distorsione dovuta a piccoli denominatori con una soglia di base, un limite percentuale e una formula di velocità smorzata
- **Pannello di inferenza AI:** slancio del portfolio (da -100 a +100), punteggio di rischio, previsione di 7 giorni con intervalli di confidenza, raccomandazioni automatizzate, consigli pratici con livelli di gravità/urgenza e tabella di valutazione della salute dei pacchetti (voti da A a F)
- **Consigli pratici:** schede di consigli con tag di gravità (critico/avviso/info/successo) e livelli di urgenza, passaggi specifici e elenchi di pacchetti interessati
- **Punteggi di salute dei pacchetti:** punteggio composito da 0 a 100 (attività + coerenza + crescita + stabilità) con voti per ogni pacchetto
- **Monitoraggio dei progressi annuali:** un livello di cronologia persistente accumula i dati mensili per pacchetto e i totali settimanali del portfolio; grafico della tendenza del portfolio con impilamento per registro
- **Pannello Pulse:** visualizzazione divisa di Pacchetti consolidati (≥ 50 download/settimana) e pacchetti emergenti e nuovi, con grafici a barre di 7 giorni, delta assoluti e percentuali, contesto di base e un riepilogo esecutivo di una riga
- **Aggiornamento in tempo reale:** la pagina recupera nuovamente lo stesso file `data/stats.json` quando è più recente della build. Non effettua chiamate alle API di npm o PyPI dal browser. `sessionStorage` contiene il token GitHub PAT opzionale, non una cache di statistiche.
- **Esportazione di report:** menu a tendina accanto al pulsante Aggiorna che offre tre formati: **PDF esecutivo** (tramite jsPDF), **JSONL per LLM** (record tipizzati per l'inserimento nell'AI) e **Markdown per sviluppatori** (tabelle GFM)
- **Classifica:** 268 ID tracciati in `packages.json` (168 npm, 43 PyPI, 6 VS Code, 27 NuGet, 24 GitHub), classificati in base alla colonna Download: settimana per npm e PyPI, totale per VS Code, NuGet, Docker e GitHub. Il grafico a barre dei 30 giorni è la serie npm. I badge di tendenza intelligenti evitano percentuali fuorvianti per i pacchetti con un basso volume.
- **Pagina di configurazione:** editor del portfolio con convalida, sezione complementare per la sincronizzazione con il registro e panoramica della pipeline
- **Ricerca nella classifica:** filtro di testo istantaneo per trovare i pacchetti per nome o registro
- **Navigazione tramite tastiera:** tasti freccia per passare da una scheda all'altra
- **Scheda Guida:** guida di facile comprensione che copre ogni scheda, i concetti chiave, il motore di inferenza AI, la pipeline dei dati e i collegamenti utili
- **Tema scuro/chiaro:** segue le preferenze del sistema
- **Design responsivo per dispositivi mobili:** menu hamburger per schermi piccoli

I dati vengono aggiornati quotidianamente dal CI (06:00 UTC) e l'intero sito viene ricostruito settimanalmente (lunedì alle 07:00 UTC). La dashboard recupera nuovamente lo stesso file `data/stats.json`. Configura i pacchetti tracciati in `site/src/data/packages.json`.

## Motore di inferenza AI

Inferenza pura e matematica senza dipendenze, che viene eseguita in fase di build: nessun runtime ML, nessuna API esterna.

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

| Capacità | Metodo | Cosa fa |
|-----------|--------|-------------|
| **Forecast** | Regressione lineare ponderata | Bias di recenza esponenziale, intervallo di confidenza dell'80% che si allarga nel tempo |
| **Anomaly detection** | Z-score adattivo a finestra mobile | Finestra di base di 14 giorni, rileva picchi e cali |
| **Trend segmentation** | Lineare a tratti | Identifica segmenti in aumento, in diminuzione o piatti nelle serie temporali |
| **Seasonality** | Decomposizione del giorno della settimana | Rileva modelli settimanali, segnala il giorno di picco |
| **Momentum** | Punteggio composito | Direzione + accelerazione + coerenza + volume |
| **Health score** | Punteggio composito multifattoriale | Attività + coerenza + crescita + stabilità (da 0 a 100, valutazione da A a F) |
| **Yearly progress** | Accumulo mensile | Crescita rispetto all'anno precedente, previsione di fine anno, monitoraggio delle tappe fondamentali |
| **Actionable advice** | Motore di regole di gravità | Critico/avviso/informazione/successo con urgenza e azioni specifiche |
| **Recommendations** | Motore di regole | Categorie di crescita, rischio, opportunità e attenzione |

## Applicazione desktop

Un'applicazione Windows nativa che racchiude la dashboard in un ambiente WebView2 locale:

- **Funzionamento offline:** include HTML/CSS/JS; funziona senza Internet
- **Aggiornamento in tempo reale:** senza un portfolio salvato, scarica le pagine di GitHub `stats.json`. Con un portfolio salvato, invia ogni nome al registro che lo contiene e non carica il file del portfolio.
- **Esportazione CSV:** esporta i dati della classifica con un solo clic
- **Pacchetto MSIX:** creato e firmato in CI tramite `desktop-ci.yml`

Il codice sorgente per il desktop si trova in `desktop/`. Creato con .NET 10 MAUI, destinato a WinUI 3.

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

## File di configurazione

Crea un file `registry-stats.config.json` nella directory principale del tuo progetto (o esegui `registry-stats --init`):

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

Esegui `registry-stats` senza argomenti per recuperare le statistiche per tutti i pacchetti configurati. La CLI risale dalla directory corrente per trovare il file di configurazione più vicino. L'array `registries` sopra riportato rappresenta i cinque valori predefiniti. Aggiungi `"github"` per includere le versioni di GitHub; tali pacchetti sono identificati da `owner/repo`. In assenza di un file di configurazione, una query sui pacchetti utilizza tutti i registri integrati, ad eccezione delle versioni di GitHub, a meno che il nome non sia nel formato proprietario/repository. L'inclusione di "github" nell'elenco dei registri esegue comunque una query su di esso e un nome semplice genera un errore da quel registro.

La configurazione è disponibile anche a livello di programma:

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

## Supporto per i registri

| Registro | Formato del pacchetto | Serie temporale | Dati disponibili |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sì (549 giorni) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sì (180 giorni) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installazioni), valutazione, tendenze |
| `docker` | `namespace/repo` | No | total (download), stelle |
| `github` | `owner/repo` | No | total (download di asset), versioni, asset, ultima versione |

## Affidabilità integrata

- Riprova automatica con aumento esponenziale del tempo di attesa in caso di errori 429/5xx
- Rispetta le intestazioni `Retry-After`
- Timeout di richiesta di 30 secondi tramite `AbortSignal.timeout`
- Limitazione della concorrenza per le richieste in blocco
- Cache TTL opzionale (estensibile: utilizza il tuo backend Redis/file tramite l'interfaccia `StatsCache`)
- Azioni di GitHub con SHA verificato per la sicurezza della catena di approvvigionamento

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

// Option 2: Bring your own server.
// listen(port) with no host binds every interface. This sample stays on loopback.
// createHandler defaults Access-Control-Allow-Origin to *. Pass corsOrigin to narrow it.
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000, '127.0.0.1');
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

### Applicazione desktop

Windows, con l'SDK .NET 10. Esegui prima `npm run site:build` in modo che `site/dist` esista. Il progetto copia questo nell'output `wwwroot/registry-stats`.

```bash
dotnet workload install maui-windows
npm run site:build
dotnet build desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
# or
dotnet publish desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
```

L'MSIX firmato è un artefatto CI da `desktop-ci.yml`. Non è un download di GitHub Release e non è il file caricato sullo Store. Registry Pulse, l'applicazione desktop per Windows, è elencata su https://apps.microsoft.com/detail/9P9TR0055JG9. La versione del pacchetto in questo repository è 3.4.0.0. Partner Center firma il file che carichi.

## Sicurezza e ambito dei dati

| Aspetto | Dettaglio |
|--------|--------|
| **Data touched** | Statistiche di download pubbliche da npm, PyPI, NuGet, il VS Code Marketplace, Docker Hub e GitHub Releases. Cache in memoria opzionale. `registry-stats --init` scrive `registry-stats.config.json`. L'applicazione desktop scrive `packages.json` e `stats.json` in `%LOCALAPPDATA%\RegistryPulse`. |
| **Credentials** | `--init` non scrive un token. Il file di configurazione può contenere un `dockerToken` o un `githubToken` se ne aggiungi uno, e tale valore rimane nel file. La CLI invia `dockerToken` come token Bearer a Docker Hub e `githubToken` come token Bearer solo a `api.github.com`. Lo strumento non scrive nessuno dei due token. La dashboard può memorizzare un token GitHub PAT in `sessionStorage` e inviarlo a `api.github.com`. |
| **Data NOT touched** | Nessun telemetria. Nessuna analisi. Nessun account utente. |
| **Permissions** | Lettura: API dei registri pubblici tramite HTTPS, più tali chiamate autenticate quando viene fornito un token. Scrittura: stdout/stderr, `registry-stats.config.json` su `--init` e file desktop in `%LOCALAPPDATA%\RegistryPulse`. Server REST opzionale su una porta specificata dall'utente. |
| **Network** | HTTPS in uscita verso `api.npmjs.org`, `registry.npmjs.org` (`--mine`), `pypistats.org`, `azuresearch-usnc.nuget.org`, `marketplace.visualstudio.com`, `hub.docker.com` e `api.github.com` (GitHub Releases). L'aggiornamento del desktop scarica anche le statistiche da `mcp-tool-shop-org.github.io`. Server REST localhost opzionale. |
| **Telemetry** | Nessuno raccolto o inviato |

Consulta [SECURITY.md](SECURITY.md) per la segnalazione di vulnerabilità.

## Valutazione

| Categoria | Punteggio |
|----------|-------|
| A. Sicurezza | 10 |
| B. Gestione degli errori | 8 |
| C. Documentazione per gli operatori | 10 |
| D. Igiene della distribuzione | 8 |
| E. Identità (soft) | 10 |
| **Overall** | **46/50** |

> Audit completo: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licenza

MIT

---

Creato da <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
