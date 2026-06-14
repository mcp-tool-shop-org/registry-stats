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

Publicas en npm, PyPI, NuGet, el VS Code Marketplace y Docker Hub. Ahora mismo, responder a la pregunta "¿cómo están mis paquetes?" implica consultar cinco sitios diferentes. **registry-stats** es la plataforma completa: un motor TypeScript (CLI + API + servidor REST), un panel web interactivo y una aplicación de escritorio nativa para Windows, todo desde un único repositorio.

Cero dependencias en tiempo de ejecución. Utiliza `fetch()` nativo. Node 18+.

## Qué hay dentro

| Capa | Qué hace |
|-------|-------------|
| **Engine** | Biblioteca TypeScript + CLI + servidor REST + inferencia de IA. Consulta cinco registros con una única interfaz. Publicado en npm como `@mcptoolshop/registry-stats`. |
| **Dashboard** | Aplicación web impulsada por Astro con panel de inferencia de IA (puntuaciones de salud, previsiones, consejos prácticos), copiloto Pulse AI (voz en streaming, búsqueda web, pantalla completa, conectores de datos de GitHub), siete gráficos interactivos con zoom/pan, actualización en vivo, informes de exportación (PDF / JSONL / Markdown) y guía de ayuda con pestañas. Reconstruido diariamente por CI; se puede actualizar a petición. |
| **Desktop** | Aplicación nativa de Windows WinUI 3 + WebView2. Incluye el panel de control sin conexión, recupera estadísticas en vivo a petición. |

## Panel de control

Un panel de control de estadísticas que se actualiza automáticamente está disponible en [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interfaz con pestañas**: pestañas Inicio, Análisis, Clasificación y Ayuda
- **Copiloto Pulse AI**: asistente conversacional impulsado por Ollama con síntesis de voz en streaming (habla mientras el LLM transmite, 4 voces a través de [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), búsqueda web (Wikipedia + SearXNG opcional), activación automática del habla, modo de pantalla completa, conector de datos de la organización de GitHub, selector de modelo y memoria de conversación
- **Resumen ejecutivo**: puntuación de salud (0–100), índice de diversidad, cambio semanal, descargas totales en todos los registros
- **Siete gráficos interactivos**: tendencia de 30 días (agregado / por registro / alternancia de los 5 principales + clic para profundizar + desplazamiento con zoom/pan), cuota del registro (área polar), riesgo de la cartera (histograma + Gini y P90), impulso de los 10 primeros, rastreador de velocidad con gráficos sparkline, mapa de calor de 30 días con detección de picos (>2σ) y tendencia de la cartera (área apilada, anual)
- **Motor de crecimiento inteligente**: gestiona la distorsión del pequeño denominador con un umbral base, un límite porcentual y una fórmula de velocidad amortiguada
- **Panel de inferencia de IA**: impulso de la cartera (-100 a +100), puntuación de riesgo, previsión de 7 días con intervalos de confianza, recomendaciones automatizadas, consejos prácticos con niveles de gravedad/urgencia y tabla de resultados de salud del paquete (calificaciones de A a F)
- **Consejos prácticos**: tarjetas de consejos etiquetadas por gravedad (crítico/advertencia/información/éxito) con niveles de urgencia, pasos de acción específicos y listas de paquetes afectados
- **Puntuaciones de salud del paquete**: puntuación compuesta de 0 a 100 (actividad + consistencia + crecimiento + estabilidad) con calificaciones por letra para cada paquete
- **Seguimiento del progreso anual**: una capa de historial persistente acumula agregados mensuales por paquete y semanales de la cartera; gráfico de tendencia de la cartera con apilamiento por registro
- **Panel Pulse**: vista dividida de paquetes establecidos en crecimiento (≥ 50 descargas/semana) y paquetes nuevos y emergentes, con gráficos sparkline en línea de 7 días, deltas absolutos y porcentuales, contexto base y un resumen ejecutivo de una línea
- **Actualización en vivo**: recuperación a petición desde las API de npm y PyPI con indicador de progreso; los resultados se almacenan en caché en sessionStorage (TTL de 5 minutos) para que el cambio de pestaña sea instantáneo
- **Informes de exportación**: menú desplegable junto al botón Actualizar que ofrece tres formatos: **PDF ejecutivo** (a través de jsPDF), **JSONL LLM** (registros tipados para la ingestión por IA) y **Markdown para desarrolladores** (tablas GFM)
- **Clasificación**: 132 paquetes clasificados por descargas semanales con gráficos sparkline de 30 días en línea e insignias de tendencia inteligentes
- **Página de configuración**: editor de cartera con validación, sección complementaria de sincronización del registro y descripción general de la canalización
- **Búsqueda en la clasificación**: filtro de texto instantáneo para encontrar paquetes por nombre o registro
- **Navegación con el teclado**: teclas de flecha para desplazarse entre las pestañas
- **Pestaña Ayuda**: guía fácil de usar que cubre cada pestaña, conceptos clave, motor de inferencia de IA, canalización de datos y enlaces útiles
- **Tema oscuro/claro**: sigue la preferencia del sistema
- **Diseño adaptable**: menú hamburguesa para pantallas pequeñas

Los datos se actualizan diariamente mediante CI (06:00 UTC) y todo el sitio se reconstruye semanalmente (lunes a las 06:00 UTC). La actualización en vivo recupera los últimos números directamente de las API del registro a petición. Configura los paquetes rastreados en `site/src/data/packages.json`.

## Motor de inferencia de IA

Inferencia pura y matemática sin dependencias que se ejecuta en tiempo de compilación: no hay entorno de ejecución de ML, ni API externas.

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

| Capacidad | Método | Qué hace |
|-----------|--------|-------------|
| **Forecast** | Regresión lineal ponderada | Sesgo de recencia exponencial, IC del 80% que se amplía con el tiempo |
| **Anomaly detection** | Puntuación z adaptativa y móvil | Ventana base de 14 días, detecta picos y caídas |
| **Trend segmentation** | Lineal por partes | Identifica segmentos ascendentes/descendentes/planos en las series temporales |
| **Seasonality** | Descomposición del día de la semana | Detecta patrones semanales, informa sobre el día pico |
| **Momentum** | Puntuación compuesta | Dirección + aceleración + consistencia + volumen |
| **Health score** | Compuesto multifactorial | Actividad + consistencia + crecimiento + estabilidad (0–100, calificación de A a F) |
| **Yearly progress** | Acumulación mensual | Crecimiento interanual, proyección del final del año, seguimiento de hitos |
| **Actionable advice** | Motor de reglas de gravedad | Crítico/advertencia/información/éxito con urgencia y acciones específicas |
| **Recommendations** | Motor de reglas | Categorías de crecimiento, riesgo, oportunidad y atención |

## Aplicación de escritorio

Una aplicación nativa de Windows que incluye el panel de control en una shell WebView2 local:

- **Funciona sin conexión:** incluye archivos HTML/CSS/JS; funciona sin internet.
- **Actualización en vivo:** obtiene `stats.json` de GitHub Pages según demanda.
- **Exportación a CSV:** exporta los datos del marcador de récords con un solo clic.
- **Empaquetado MSIX:** se crea y firma en CI mediante `desktop-ci.yml`.

El código fuente para escritorio se encuentra en `desktop/`. Creado con .NET 10 MAUI, dirigido a WinUI 3.

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

# Discover all your npm packages by maintainer name
registry-stats --mine mikefrilot

# JSON output for maintainer discovery
registry-stats --mine mikefrilot --format json

# Start a REST API server
registry-stats serve --port 3000
```

## Archivo de configuración

Cree un archivo `registry-stats.config.json` en el directorio raíz de su proyecto (o ejecute `registry-stats --init`):

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

Ejecute `registry-stats` sin argumentos para obtener estadísticas de todos los paquetes configurados. La CLI recorre el árbol de directorios desde el directorio actual para encontrar el archivo de configuración más cercano.

La configuración también está disponible mediante programación:

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

// Maintainer discovery — find all npm packages by username
const mine = await stats.mine('mikefrilot');
// Returns PackageStats[] sorted by monthly downloads

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Compatibilidad con registros

| Registro | Formato de paquete | Serie temporal | Datos disponibles |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sí (549 días) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sí (180 días) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalaciones), calificación, tendencias |
| `docker` | `namespace/repo` | No | total (descargas), estrellas |

## Fiabilidad integrada

- Reintento automático con retroceso exponencial en caso de errores 429/5xx.
- Respeta las cabeceras `Retry-After`.
- Tiempo de espera de solicitud de 30 segundos mediante `AbortSignal.timeout`.
- Limitación de la concurrencia para solicitudes masivas.
- Caché TTL opcional (se puede personalizar: utilice su propio backend Redis/archivo a través de la interfaz `StatsCache`).
- Acciones de GitHub con SHA fijado para la seguridad de la cadena de suministro.

## Servidor API REST

Ejecute como un microservicio o incorpórelo en su propio servidor:

```bash
registry-stats serve --port 3000
```

De forma predeterminada, `serve` se vincula a `127.0.0.1` (solo localhost) y establece CORS en `*`. Utilice `--host 0.0.0.0` para exponerlo en la red y `--cors <origin>` para restringir el acceso entre dominios cuando lo haga.

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
| **Data touched** | Estadísticas públicas de descargas de npm, PyPI, NuGet, VS Code Marketplace, Docker Hub. Caché en memoria (opcional). |
| **Data NOT touched** | Sin telemetría. Sin análisis. Sin almacenamiento de credenciales. Sin datos de usuario. Sin escritura de archivos. |
| **Permissions** | Lectura: API públicas de registro a través de HTTPS. Escritura: solo stdout/stderr. |
| **Network** | HTTPS saliente hacia las API públicas de registro. Servidor REST opcional en localhost. |
| **Telemetry** | Ninguno recopilado ni enviado. |

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

## Puntuación

| Categoría | Puntuación |
|----------|-------|
| A. Seguridad | 10 |
| B. Manejo de errores | 10 |
| C. Documentación para operadores | 10 |
| D. Buenas prácticas de envío | 10 |
| E. Identidad (suave) | 10 |
| **Overall** | **50/50** |

> Auditoría completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licencia

MIT

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
