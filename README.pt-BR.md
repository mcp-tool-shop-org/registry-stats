<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <strong>Português</strong>
</p>

<p align="center">
  <img src="assets/logo.png" alt="logo registry-stats" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  Um comando. Cinco registros. Todas as suas estatísticas de download.
</p>

<p align="center">
  <a href="#instalação">Instalação</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#arquivo-de-configuração">Configuração</a> &middot;
  <a href="#api-programática">API</a> &middot;
  <a href="#servidor-rest-api">Servidor REST</a> &middot;
  <a href="#licença">Licença</a>
</p>

---

Se você publica no npm, PyPI, NuGet, VS Code Marketplace ou Docker Hub, atualmente precisa de cinco APIs diferentes para responder "quantos downloads eu tive este mês?" Esta biblioteca oferece uma interface unificada — como CLI ou API programática.

Zero dependências. Usa `fetch()` nativo. Node 18+.

## Instalação

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# Consultar um único registro
registry-stats express -r npm

# Consultar todos os registros
registry-stats express

# Série temporal com detalhamento mensal + tendência
registry-stats express -r npm --range 2025-01-01:2025-06-30

# Saída JSON
registry-stats express -r npm --json

# Outros registros
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# Criar arquivo de configuração
registry-stats --init

# Executar com configuração — busca todos os pacotes rastreados
registry-stats

# Comparar entre registros
registry-stats express --compare

# Exportar como CSV ou JSON para gráficos
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# Iniciar servidor REST API
registry-stats serve --port 3000
```

## Arquivo de Configuração

Crie um `registry-stats.config.json` na raiz do projeto (ou execute `registry-stats --init`):

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

Execute `registry-stats` sem argumentos para obter estatísticas de todos os pacotes configurados. O CLI procura o arquivo de configuração subindo a partir do diretório atual.

## API Programática

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Registro único
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// Todos os registros (usa Promise.allSettled — nunca lança erro)
const all = await stats.all('express');

// Em massa — múltiplos pacotes, concorrência limitada (padrão: 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Série temporal (apenas npm + pypi)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Cálculos
calc.total(daily);                         // total de downloads
calc.avg(daily);                           // média diária
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // média móvel de 7 dias
calc.popularity(daily);                    // pontuação 0-100 escala logarítmica

// Formatos de exportação
calc.toCSV(daily);                         // string CSV
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// Comparação — mesmo pacote entre registros
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// Cache (TTL 5 min, em memória)
const cache = createCache();
await stats('npm', 'express', { cache });
```

## Suporte de Registros

| Registro | Formato do pacote | Série temporal | Dados disponíveis |
|----------|------------------|----------------|-------------------|
| `npm` | `express`, `@scope/pkg` | Sim (549 dias) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sim (180 dias) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | Não | total |
| `vscode` | `publisher.extension` | Não | total (instalações), rating, trends |
| `docker` | `namespace/repo` | Não | total (pulls), stars |

## Confiabilidade Integrada

- Retry automático com backoff exponencial em erros 429/5xx
- Respeita os cabeçalhos `Retry-After`
- Limitação de concorrência para requisições em massa
- Cache TTL opcional (extensível — use Redis/arquivo via interface `StatsCache`)

## Servidor REST API

Execute como microsserviço ou integre ao seu servidor:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # todos os registros
GET /stats/:registry/:package    # registro único
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Início rápido
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

## Licença

MIT
