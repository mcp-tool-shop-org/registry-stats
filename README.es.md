<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Publica en npm, PyPI, NuGet, el Marketplace de VS Code y Docker Hub. Actualmente, responder a la pregunta "¿cómo le están yendo a mis paquetes?" implica consultar cinco sitios diferentes. **registry-stats** es la plataforma completa: un motor de TypeScript (CLI + API + servidor REST), un panel web interactivo y una aplicación de escritorio nativa para Windows, todo desde un único repositorio.

No tiene dependencias de tiempo de ejecución. Utiliza `fetch()` nativo. Node 18+.

## ¿Qué hay dentro?

| Capa | ¿Qué hace? |
|-------|-------------|
| **Engine** | Biblioteca de TypeScript + CLI + servidor REST. Consulta cinco registros con una sola interfaz. Publicado en npm como `@mcptoolshop/registry-stats`. |
| **Dashboard** | Aplicación web impulsada por Astro con el copiloto de IA Pulse (salida de voz, pantalla completa, conectores de datos de GitHub), seis gráficos interactivos, actualización en tiempo real, exportación de informes (PDF / JSONL / Markdown) y una guía de ayuda con pestañas. Se reconstruye semanalmente mediante CI; se puede actualizar bajo demanda. |
| **Desktop** | Aplicación nativa para Windows con WinUI 3 + WebView2. Incluye el panel de control sin conexión y descarga las estadísticas en tiempo real bajo demanda. |

## Panel de control

Un panel de control de estadísticas que se actualiza automáticamente se encuentra en [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interfaz con pestañas** — Pestañas de Inicio, Analítica, Clasificación y Ayuda.
- **Copiloto de IA Pulse** — Asistente conversacional impulsado por Ollama con salida de voz (4 voces a través de [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), síntesis de voz automática, modo de pantalla completa, conector de datos de organización de GitHub, respuestas en streaming, selector de modelo y memoria de conversación.
- **Resumen ejecutivo** — puntaje de salud (0–100), índice de diversidad, cambio semanal, descargas totales en todos los registros.
- **Seis gráficos interactivos** — Tendencia de 30 días (agregada / por registro / conmutación de los 5 principales), cuota de registro (área polar), riesgo de la cartera (histograma + Gini y P90), los 10 principales con mayor crecimiento, rastreador de velocidad con gráficos de líneas, y mapa de calor de 30 días con detección de picos (>2σ).
- **Motor de crecimiento inteligente** — maneja la distorsión de denominadores pequeños con un umbral base, un límite porcentual y una fórmula de velocidad amortiguada.
- **Información útil** — Recomendaciones generadas automáticamente y alertas de atención para paquetes en declive.
- **Panel Pulse** — Vista dividida de los "Established Movers" (≥ 50 descargas/semana) y los paquetes "Emerging & New", con gráficos de líneas de 7 días integrados, deltas absolutos + porcentuales, contexto base y un resumen ejecutivo de una línea.
- **Actualización en tiempo real** — Descarga de datos desde las API de npm y PyPI en el lado del cliente bajo demanda con un indicador de progreso; los resultados se almacenan en caché en sessionStorage (TTL de 5 minutos) para que los cambios de pestaña sean instantáneos.
- **Exportación de informes** — Menú desplegable junto al botón de Actualizar que ofrece tres formatos: **Exec PDF** (a través de jsPDF), **LLM JSONL** (registros tipados para la ingesta de IA) y **Dev Markdown** (tablas GFM).
- **Clasificación** — 132 paquetes clasificados por descargas semanales con gráficos de líneas de 30 días integrados y distintivos de tendencia inteligentes.
- **Página de configuración** — Editor de cartera con validación, sección de sincronización de registros y descripción general del flujo de trabajo.
- **Pestaña de ayuda** — Guía fácil de entender que cubre cada pestaña, conceptos clave, consejos para el asistente de IA, flujo de datos y enlaces útiles.
- **Tema claro / oscuro** — Sigue la preferencia del sistema.

Los datos se obtienen en el momento de la compilación y se reconstruyen semanalmente mediante CI (los lunes a las 06:00 UTC). La actualización en tiempo real descarga los últimos números directamente desde las API de los registros. Configure los paquetes rastreados en `site/src/data/packages.json` (132 paquetes en 5 registros).

## Aplicación de escritorio

Una aplicación nativa para Windows que integra el panel de control en un entorno WebView2 local:

- **Funciona sin conexión** — Incluye HTML/CSS/JS empaquetados; funciona sin conexión a Internet.
- **Actualización en tiempo real** — Descarga `stats.json` de GitHub Pages bajo demanda.
- **Exportación a CSV** — Exporta los datos de la clasificación con un solo clic.
- **Empaquetado MSIX** — Se construye y firma en CI mediante `desktop-ci.yml`.

El código fuente de la aplicación de escritorio se encuentra en `desktop/`. Se construyó con .NET 10 MAUI y apunta a WinUI 3.

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
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Soporte para registros

| Registro | Formato del paquete | Series de tiempo | Datos disponibles |
|----------|---------------|-------------|----------------|
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

## Estructura del repositorio

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## Desarrollo

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## Seguridad y alcance de los datos

| Aspecto | Detalle |
|--------|--------|
| **Data touched** | Estadísticas de descargas públicas de npm, PyPI, NuGet, Marketplace de VS Code, Docker Hub. Caché en memoria (opcional). |
| **Data NOT touched** | Sin telemetría. Sin análisis. Sin almacenamiento de credenciales. Sin datos de usuario. Sin escrituras de archivos. |
| **Permissions** | Lectura: APIs de registros públicos a través de HTTPS. Escritura: solo a stdout/stderr. |
| **Network** | Conexiones HTTPS salientes a APIs de registros públicos. Servidor REST local opcional. |
| **Telemetry** | Ninguna información es recopilada o enviada. |

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

## Evaluación

| Categoría | Puntuación |
|----------|-------|
| A. Seguridad | 10 |
| B. Manejo de errores | 10 |
| C. Documentación para el operador | 10 |
| D. Higiene en la entrega | 10 |
| E. Identidad (suave) | 10 |
| **Overall** | **50/50** |

> Auditoría completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licencia

MIT

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
