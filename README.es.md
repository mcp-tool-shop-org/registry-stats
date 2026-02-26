<p align="center">
  <strong>English</strong> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
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

Si publicas en npm, PyPI, NuGet, el Marketplace de VS Code o Docker Hub, actualmente necesitas cinco API diferentes para responder a la pregunta "¿cuántas descargas he tenido este mes?". Esta biblioteca te proporciona una única interfaz para todas ellas, ya sea como una herramienta de línea de comandos (CLI) o como una API programática.

Sin dependencias. Utiliza la función nativa `fetch()`. Node 18+.

## Instalación

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

## Archivo de configuración

Crea un archivo `registry-stats.config.json` en la raíz de tu proyecto (o ejecuta `registry-stats --init`):

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

Ejecuta `registry-stats` sin argumentos para obtener las estadísticas de todos los paquetes configurados. La CLI busca el archivo de configuración desde el directorio actual.

La configuración también está disponible de forma programática:

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## API programática

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

## Soporte para registros

| Registro | Formato del paquete | Series de tiempo | Datos disponibles |
| ---------- | --------------- | ------------- | ---------------- |
| `npm` | `express`, `@scope/pkg` | Sí (549 días) | último día, última semana, último mes |
| `pypi` | `requests` | Sí (180 días) | último día, última semana, último mes, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalaciones), calificación, tendencias |
| `docker` | `namespace/repo` | No | total (descargas), estrellas |

## Fiabilidad integrada

- Reintentos automáticos con retroceso exponencial en caso de errores 429/5xx.
- Respeta los encabezados `Retry-After`.
- Limitación de concurrencia para solicitudes masivas.
- Caché TTL opcional (plug-in: proporciona tu propio backend de Redis/archivo a través de la interfaz `StatsCache`).

## Servidor de API REST

Ejecútalo como un microservicio o intégralo en tu propio servidor:

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

Uso programático para servidores personalizados o sin servidor:

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Registros personalizados

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

## Sitio web

La documentación y la página de inicio se encuentran en el directorio `site/`.

- Desarrollo: `npm run site:dev`
- Compilación: `npm run site:build`
- Previsualización: `npm run site:preview`

## Licencia

MIT

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
