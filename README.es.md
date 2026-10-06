<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.md">English</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Publicas en npm, PyPI, NuGet, el VS Code Marketplace, Docker Hub y GitHub Releases. Actualmente, responder a la pregunta "¿cómo están mis paquetes?" implica consultar seis sitios diferentes. **registry-stats** es la plataforma completa: un motor TypeScript (CLI + API + servidor REST), un panel web en vivo y una aplicación de escritorio nativa de Windows, todo desde un único repositorio.

Cero dependencias en tiempo de ejecución. Utiliza `fetch()` nativo. Node 18+.

## Qué contiene

| Capa | Qué hace |
|-------|-------------|
| **Engine** | Biblioteca TypeScript + CLI + servidor REST + inferencia de IA. Consulta seis registros: npm, PyPI, NuGet, el VS Code Marketplace, Docker Hub y GitHub Releases, con una única interfaz. Al ingresar el nombre de un paquete, se consultan npm, PyPI, NuGet, el VS Code Marketplace y Docker Hub. GitHub Releases se incluye cuando el nombre es propietario/repositorio o cuando la lista de registros incluye nombres de GitHub. Publicado en npm como `@mcptoolshop/registry-stats`. |
| **Dashboard** | Aplicación web con tecnología Astro con panel de inferencia de IA (puntuaciones de estado, previsiones, consejos prácticos), copiloto de IA Pulse (voz en streaming, búsqueda web, pantalla completa, conectores de datos de GitHub), siete gráficos (zoom y desplazamiento en la tendencia de 30 días y en la tendencia de la cartera), actualización en vivo, exportación de informes (PDF / JSONL / Markdown) y guía de ayuda con pestañas. El CI diario obtiene los datos del panel. El sitio se reconstruye semanalmente, los lunes a las 07:00 UTC. |
| **Desktop** | Aplicación nativa de Windows con WinUI 3 + WebView2. Incluye el panel sin conexión y obtiene estadísticas en vivo bajo demanda. |

## Panel de control

Un panel de control de estadísticas de actualización automática está disponible en [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interfaz con pestañas:** pestañas Inicio, Análisis, Clasificación y Ayuda.
- **Copiloto de IA Pulse:** asistente conversacional con tecnología Ollama y síntesis de voz en streaming (habla mientras el LLM transmite, 4 voces a través de [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), búsqueda web (Wikipedia + SearXNG opcional), función de lectura automática, modo de pantalla completa, conector de datos de la organización de GitHub, selector de modelo y memoria de la conversación.
- **Resumen ejecutivo:** puntuación de estado (0-100), índice de diversidad y cambio semanal. Las sumas semanales y mensuales de descargas son de npm y PyPI. VS Code, NuGet, Docker y GitHub contribuyen con su total histórico, no con esas dos sumas.
- **Siete gráficos interactivos:** tendencia de 30 días (agregado / por registro / alternancia de los 5 primeros + clic para profundizar), cuota de registro (área polar), riesgo de cartera (histograma + Gini y P90), los 10 primeros con mayor impulso, rastreador de velocidad con gráficos de líneas, mapa de calor de 30 días con detección de picos (>2σ) y tendencia de la cartera (área apilada, anual). El zoom y el desplazamiento solo se aplican a la tendencia de 30 días y a la tendencia de la cartera.
- **Motor de crecimiento inteligente:** gestiona la distorsión de los denominadores pequeños con un umbral de referencia, un límite porcentual y una fórmula de velocidad amortiguada.
- **Panel de inferencia de IA:** impulso de la cartera (-100 a +100), puntuación de riesgo, previsión de 7 días con intervalos de confianza, recomendaciones automatizadas, consejos prácticos con niveles de gravedad/urgencia y tabla de puntuación de la salud del paquete (calificaciones de la A a la F).
- **Consejos prácticos:** tarjetas de consejos con etiquetas de gravedad (crítico/advertencia/información/éxito) con niveles de urgencia, pasos de acción específicos y listas de paquetes afectados.
- **Puntuaciones de la salud del paquete:** puntuación compuesta de 0 a 100 (actividad + consistencia + crecimiento + estabilidad) con calificaciones alfabéticas por paquete.
- **Seguimiento del progreso anual:** una capa de historial persistente acumula los agregados mensuales por paquete y semanales de la cartera; gráfico de tendencia de la cartera con apilamiento por registro.
- **Panel Pulse:** vista dividida de paquetes establecidos con mayor actividad (≥ 50 descargas/semana) y paquetes nuevos y emergentes, con gráficos de líneas de 7 días en línea, deltas absolutos y porcentuales, contexto de referencia y un resumen ejecutivo de una línea.
- **Actualización en vivo:** la página vuelve a obtener el archivo `data/stats.json` del mismo origen cuando ese archivo es más reciente que la versión. No realiza llamadas a las API de npm o PyPI desde el navegador. `sessionStorage` contiene el PAT de GitHub opcional, no una caché de estadísticas.
- **Exportación de informes:** menú desplegable junto al botón Actualizar que ofrece tres formatos: **PDF ejecutivo** (a través de jsPDF), **JSONL de LLM** (registros tipados para la ingestión de IA) y **Markdown para desarrolladores** (tablas GFM).
- **Clasificación:** 268 ID rastreados en `packages.json` (168 npm, 43 PyPI, 6 VS Code, 27 NuGet, 24 GitHub), clasificados por la columna Descargas: semana para npm y PyPI, total histórico para VS Code, NuGet, Docker y GitHub. El gráfico de líneas de 30 días es la serie de npm. Los indicadores de tendencia inteligentes evitan porcentajes engañosos para los paquetes de bajo volumen.
- **Página de configuración:** editor de cartera con validación, sección complementaria de sincronización de registros y descripción general de la canalización.
- **Búsqueda en la clasificación:** filtro de texto instantáneo para encontrar paquetes por nombre o registro.
- **Navegación con el teclado:** teclas de flecha para desplazarse entre las pestañas.
- **Pestaña de ayuda:** guía fácil de usar que cubre todas las pestañas, conceptos clave, el motor de inferencia de IA, la canalización de datos y enlaces útiles.
- **Tema oscuro/claro:** sigue la preferencia del sistema.
- **Diseño adaptable para dispositivos móviles:** menú desplegable para pantallas pequeñas.

Los datos se actualizan diariamente mediante CI (06:00 UTC) y todo el sitio se reconstruye semanalmente (lunes a las 07:00 UTC). El panel vuelve a obtener el archivo `data/stats.json` del mismo origen. Configura los paquetes rastreados en `site/src/data/packages.json`.

## Motor de inferencia de IA

Inferencia pura y matemática sin dependencias, que se ejecuta en tiempo de compilación: no hay tiempo de ejecución de ML, ni API externas.

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

| Capacidad | Método | Qué hace |
|-----------|--------|-------------|
| **Forecast** | Regresión lineal ponderada | Sesgo de actualidad exponencial, IC del 80% que se amplía con el tiempo |
| **Anomaly detection** | Puntuación z adaptativa | Ventana de referencia de 14 días, detecta picos y caídas |
| **Trend segmentation** | Lineal por partes | Identifica segmentos ascendentes, descendentes o planos en las series temporales |
| **Seasonality** | Descomposición del día de la semana | Detecta patrones semanales, informa del día de mayor actividad |
| **Momentum** | Puntuación compuesta | Dirección + aceleración + consistencia + volumen |
| **Health score** | Compuesto multifactorial | Actividad + consistencia + crecimiento + estabilidad (0–100, calificación de la A a la F) |
| **Yearly progress** | Acumulación mensual | Crecimiento interanual, proyección del fin de año, seguimiento de hitos |
| **Actionable advice** | Motor de reglas de gravedad | Crítico/advertencia/información/éxito con urgencia y acciones específicas |
| **Recommendations** | Motor de reglas | Categorías de crecimiento, riesgo, oportunidad y atención |

## Aplicación de escritorio

Una aplicación nativa de Windows que incluye el panel en una shell WebView2 local:

- **Capaz de funcionar sin conexión:** incluye HTML/CSS/JS; funciona sin Internet.
- **Actualización en vivo:** sin una cartera guardada, descarga el archivo `stats.json` de GitHub Pages. Con una cartera guardada, envía cada nombre al registro que lo contiene y no carga el archivo de la cartera.
- **Exportación a CSV:** exporta los datos de la clasificación con un solo clic.
- **Empaquetada como MSIX:** se crea y firma en CI mediante `desktop-ci.yml`.

El código fuente de la aplicación de escritorio se encuentra en `desktop/`. Creada con .NET 10 MAUI, dirigida a WinUI 3.

## Instalar

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

## Archivo de configuración

Crea un archivo `registry-stats.config.json` en el directorio raíz de tu proyecto (o ejecuta `registry-stats --init`):

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

Ejecute `registry-stats` sin argumentos para obtener estadísticas de todos los paquetes configurados. La herramienta de línea de comandos recorre el directorio de trabajo actual para encontrar el archivo de configuración más cercano. La matriz `registries` anterior es el valor predeterminado de cinco. Agregue `"github"` para incluir las versiones de GitHub; esos paquetes son identificadores `owner/repo`. Si no hay ningún archivo de configuración, una consulta de paquetes utiliza todos los registros integrados, excepto las versiones de GitHub, a menos que el nombre sea propietario/repositorio. Incluir "github" en la lista de registros sigue consultando ese registro, y un nombre simple genera un error desde ese registro.

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

## Compatibilidad con registros

| Registro | Formato del paquete | Serie temporal | Datos disponibles |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sí (549 días) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sí (180 días) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalaciones), calificación, tendencias |
| `docker` | `namespace/repo` | No | total (descargas), estrellas |
| `github` | `owner/repo` | No | total (descargas de activos), versiones, activos, última etiqueta |

## Fiabilidad integrada

- Reintento automático con retroceso exponencial en errores 429/5xx
- Respeta las cabeceras `Retry-After`
- Tiempos de espera de solicitud de 30 segundos a través de `AbortSignal.timeout`
- Limitación de la concurrencia para solicitudes masivas
- Caché TTL opcional (plugable: use su propio backend de Redis/archivo a través de la interfaz `StatsCache`)
- Acciones de GitHub con firma SHA para la seguridad de la cadena de suministro

## Servidor de API REST

Ejecute como un microservicio o incorpórelo en su propio servidor:

```bash
registry-stats serve --port 3000
```

De forma predeterminada, `serve` se enlaza a `127.0.0.1` (solo localhost) y establece CORS en `*`. Use `--host 0.0.0.0` para exponerlo en la red y `--cors <origin>` para restringir el acceso entre dominios cuando lo haga.

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

// Option 2: Bring your own server.
// listen(port) with no host binds every interface. This sample stays on loopback.
// createHandler defaults Access-Control-Allow-Origin to *. Pass corsOrigin to narrow it.
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000, '127.0.0.1');
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

### Aplicación de escritorio

Windows, con el SDK de .NET 10. Ejecute `npm run site:build` primero para que `site/dist` exista. El proyecto copia eso en el `wwwroot/registry-stats` de salida.

```bash
dotnet workload install maui-windows
npm run site:build
dotnet build desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
# or
dotnet publish desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
```

El MSIX firmado es un artefacto de CI de `desktop-ci.yml`. No es una descarga de versiones de GitHub y no es la carga en la tienda. Registry Pulse, la aplicación de escritorio de Windows, está disponible en https://apps.microsoft.com/detail/9P9TR0055JG9. La versión del paquete en este repositorio es 3.4.0.0. Partner Center firma el archivo que carga.

## Seguridad y alcance de los datos

| Aspecto | Detalle |
|--------|--------|
| **Data touched** | Estadísticas de descarga públicas de npm, PyPI, NuGet, el mercado de VS Code, Docker Hub y las versiones de GitHub. Caché opcional en memoria. `registry-stats --init` escribe `registry-stats.config.json`. La aplicación de escritorio escribe `packages.json` y `stats.json` en `%LOCALAPPDATA%\RegistryPulse`. |
| **Credentials** | `--init` no escribe un token. El archivo de configuración puede contener un `dockerToken` o un `githubToken` si agrega uno, y ese valor permanece en el archivo. La herramienta de línea de comandos envía `dockerToken` como un token Bearer a Docker Hub, y `githubToken` como un token Bearer solo a `api.github.com`. La herramienta no escribe ninguno de los tokens por sí misma. El panel puede mantener un token PAT de GitHub en `sessionStorage` y enviarlo a `api.github.com`. |
| **Data NOT touched** | Sin telemetría. Sin análisis. Sin cuentas de usuario. |
| **Permissions** | Lectura: API de registro público a través de HTTPS, más esas llamadas autenticadas cuando se proporciona un token. Escritura: stdout/stderr, `registry-stats.config.json` en `--init` y archivos de escritorio en `%LOCALAPPDATA%\RegistryPulse`. Servidor REST opcional en un puerto especificado por el usuario. |
| **Network** | Salida HTTPS a `api.npmjs.org`, `registry.npmjs.org` (`--mine`), `pypistats.org`, `azuresearch-usnc.nuget.org`, `marketplace.visualstudio.com`, `hub.docker.com` y `api.github.com` (versiones de GitHub). La actualización de la aplicación de escritorio también descarga estadísticas de `mcp-tool-shop-org.github.io`. Servidor REST opcional en localhost. |
| **Telemetry** | Ninguno recopilado ni enviado |

Consulte [SECURITY.md](SECURITY.md) para informar sobre vulnerabilidades.

## Puntuación

| Categoría | Puntuación |
|----------|-------|
| A. Seguridad | 10 |
| B. Manejo de errores | 8 |
| C. Documentación para operadores | 10 |
| D. Buenas prácticas de envío | 8 |
| E. Identidad (suave) | 10 |
| **Overall** | **46/50** |

> Auditoría completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licencia

MIT

---

Creado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
