<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <strong>Español</strong> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="logo de registry-stats" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  Un comando. Cinco registros. Todas tus estadísticas de descargas.
</p>

<p align="center">
  <a href="#instalación">Instalación</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#archivo-de-configuración">Configuración</a> &middot;
  <a href="#api-programática">API</a> &middot;
  <a href="#servidor-rest-api">Servidor REST</a> &middot;
  <a href="#licencia">Licencia</a>
</p>

---

Si publicas en npm, PyPI, NuGet, VS Code Marketplace o Docker Hub, actualmente necesitas cinco APIs diferentes para responder "¿cuántas descargas tuve este mes?" Esta biblioteca te ofrece una interfaz unificada — como CLI o API programática.

Sin dependencias. Usa `fetch()` nativo. Node 18+.

## Instalación

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# Consultar un solo registro
registry-stats express -r npm

# Consultar todos los registros a la vez
registry-stats express

# Serie temporal con desglose mensual + tendencia
registry-stats express -r npm --range 2025-01-01:2025-06-30

# Salida JSON
registry-stats express -r npm --json

# Otros registros
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# Crear archivo de configuración
registry-stats --init

# Ejecutar con configuración — obtiene todos los paquetes rastreados
registry-stats

# Comparar entre registros
registry-stats express --compare

# Exportar como CSV o JSON para gráficos
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# Iniciar servidor REST API
registry-stats serve --port 3000
```

## Archivo de Configuración

Crea un `registry-stats.config.json` en la raíz de tu proyecto (o ejecuta `registry-stats --init`):

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

Ejecuta `registry-stats` sin argumentos para obtener estadísticas de todos los paquetes configurados. El CLI busca el archivo de configuración hacia arriba desde el directorio actual.

## API Programática

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Registro individual
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// Todos los registros (usa Promise.allSettled — nunca lanza error)
const all = await stats.all('express');

// Masivo — múltiples paquetes, concurrencia limitada (por defecto: 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Serie temporal (solo npm + pypi)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Cálculos
calc.total(daily);                         // total de descargas
calc.avg(daily);                           // promedio diario
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // media móvil de 7 días
calc.popularity(daily);                    // puntuación 0-100 escala logarítmica

// Formatos de exportación
calc.toCSV(daily);                         // cadena CSV
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// Comparación — mismo paquete entre registros
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// Caché (TTL 5 min, en memoria)
const cache = createCache();
await stats('npm', 'express', { cache });
```

## Soporte de Registros

| Registro | Formato de paquete | Serie temporal | Datos disponibles |
|----------|-------------------|----------------|-------------------|
| `npm` | `express`, `@scope/pkg` | Sí (549 días) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sí (180 días) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalaciones), rating, trends |
| `docker` | `namespace/repo` | No | total (pulls), stars |

## Fiabilidad Integrada

- Reintento automático con retroceso exponencial en errores 429/5xx
- Respeta las cabeceras `Retry-After`
- Limitación de concurrencia para solicitudes masivas
- Caché TTL opcional (extensible — usa Redis/archivo via interfaz `StatsCache`)

## Servidor REST API

Ejecuta como microservicio o intégralo en tu propio servidor:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # todos los registros
GET /stats/:registry/:package    # registro individual
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Inicio rápido
serve({ port: 3000 });

// Servidor personalizado
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Registros Personalizados

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

## Licencia

MIT
