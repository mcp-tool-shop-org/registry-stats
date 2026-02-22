<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <strong>Italiano</strong> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="logo registry-stats" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  Un comando. Cinque registri. Tutte le tue statistiche di download.
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/">Docs</a> &middot;
  <a href="#installazione">Installazione</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#file-di-configurazione">Configurazione</a> &middot;
  <a href="#api-programmatica">API</a> &middot;
  <a href="#server-rest-api">Server REST</a> &middot;
  <a href="#licenza">Licenza</a>
</p>

---

Se pubblichi su npm, PyPI, NuGet, VS Code Marketplace o Docker Hub, attualmente hai bisogno di cinque API diverse per rispondere a "quanti download ho avuto questo mese?" Questa libreria offre un'interfaccia unificata — come CLI o API programmatica.

Zero dipendenze. Usa `fetch()` nativo. Node 18+.

## Installazione

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# Interrogare un singolo registro
registry-stats express -r npm

# Interrogare tutti i registri
registry-stats express

# Serie temporale con ripartizione mensile + tendenza
registry-stats express -r npm --range 2025-01-01:2025-06-30

# Output JSON
registry-stats express -r npm --json

# Altri registri
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# Creare file di configurazione
registry-stats --init

# Eseguire con configurazione — recupera tutti i pacchetti tracciati
registry-stats

# Confrontare tra registri
registry-stats express --compare

# Esportare come CSV o JSON per grafici
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# Avviare server REST API
registry-stats serve --port 3000
```

## File di Configurazione

Crea un `registry-stats.config.json` nella root del progetto (o esegui `registry-stats --init`):

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

Esegui `registry-stats` senza argomenti per ottenere le statistiche di tutti i pacchetti configurati. Il CLI cerca il file di configurazione risalendo dalla directory corrente.

## API Programmatica

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Registro singolo
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// Tutti i registri (usa Promise.allSettled — non lancia mai errori)
const all = await stats.all('express');

// In massa — più pacchetti, concorrenza limitata (predefinito: 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Serie temporale (solo npm + pypi)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Calcoli
calc.total(daily);                         // totale download
calc.avg(daily);                           // media giornaliera
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // media mobile 7 giorni
calc.popularity(daily);                    // punteggio 0-100 scala logaritmica

// Formati di esportazione
calc.toCSV(daily);                         // stringa CSV
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// Confronto — stesso pacchetto tra registri
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// Cache (TTL 5 min, in memoria)
const cache = createCache();
await stats('npm', 'express', { cache });
```

## Supporto Registri

| Registro | Formato pacchetto | Serie temporale | Dati disponibili |
|----------|------------------|-----------------|-----------------|
| `npm` | `express`, `@scope/pkg` | Sì (549 giorni) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sì (180 giorni) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installazioni), rating, trends |
| `docker` | `namespace/repo` | No | total (pull), stars |

## Affidabilità Integrata

- Retry automatico con backoff esponenziale su errori 429/5xx
- Rispetta le intestazioni `Retry-After`
- Limitazione della concorrenza per richieste in massa
- Cache TTL opzionale (estensibile — usa Redis/file tramite interfaccia `StatsCache`)

## Server REST API

Esegui come microservizio o integra nel tuo server:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # tutti i registri
GET /stats/:registry/:package    # registro singolo
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Avvio rapido
serve({ port: 3000 });

// Server personalizzato
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Registri Personalizzati

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

## Licenza

MIT
