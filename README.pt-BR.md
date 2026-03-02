<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

Você publica no npm, PyPI, NuGet, na loja do VS Code e no Docker Hub. Atualmente, responder à pergunta "como estão indo meus pacotes?" significa verificar cinco sites diferentes. **registry-stats** é a plataforma completa: um motor TypeScript (CLI + API + servidor REST), um painel web interativo e um aplicativo nativo para Windows — tudo em um único repositório.

Sem dependências de tempo de execução. Utiliza a função nativa `fetch()`. Node 18+.

## O que está incluído

| Camada | O que ele faz |
|-------|-------------|
| **Engine** | Biblioteca TypeScript + CLI + servidor REST. Consulte cinco registros com uma única interface. Publicado no npm como `@mcptoolshop/registry-stats`. |
| **Dashboard** | Aplicativo web alimentado por Astro. Assistente de chat com IA, seis gráficos interativos, motor de crescimento inteligente e guia de ajuda com abas. Reconstruído semanalmente pelo CI. |
| **Desktop** | Aplicativo nativo para Windows, construído com WinUI 3 + WebView2. Inclui o painel offline e busca as estatísticas em tempo real sob demanda. |

## Painel

Um painel de estatísticas que se atualiza automaticamente está disponível em [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interface com abas** — Abas Home, Analytics, Leaderboard e Help
- **Assistente de chat com IA** — Registry Assistant alimentado por Ollama com contexto RAG, respostas em streaming, seletor de modelos e memória de conversação
- **Resumo executivo** — pontuação de saúde (0–100), índice de diversidade, variação semanal, downloads totais de todos os registros
- **Seis gráficos interativos** — tendência de 30 dias (vista agregada / por registro / top 5), participação do registro (área polar), risco do portfólio (histograma + Gini & P90), top 10 momentum, rastreador de velocidade com sparklines e mapa de calor de 30 dias com detecção de picos (>2σ)
- **Motor de crescimento inteligente** — lida com a distorção de denominadores pequenos com limite base, teto de porcentagem e fórmula de velocidade amortecida
- **Insights acionáveis** — recomendações autogeradas e alertas de atenção para pacotes em declínio
- **Tabela de classificação** — todos os pacotes classificados por downloads semanais com sparklines de 30 dias e badges de tendência inteligentes
- **Página de configuração** — editor de portfólio com validação, seção registry-sync e visão geral do pipeline
- **Aba de ajuda** — guia amigável cobrindo cada aba, conceitos-chave, dicas do assistente de IA, pipeline de dados e links úteis
- **Tema claro/escuro** — segue a preferência do sistema

Os dados são buscados durante a compilação e reconstruídos semanalmente pelo CI (segundas-feiras às 06:00 UTC). Configure os pacotes a serem monitorados em `site/src/data/packages.json`.

## Aplicativo para Desktop

Um aplicativo nativo para Windows que encapsula o painel em um shell WebView2 local:

- **Funciona offline** — inclui HTML/CSS/JS empacotados; funciona sem internet.
- **Atualização em tempo real** — busca o arquivo `stats.json` do GitHub Pages sob demanda.
- **Exportação para CSV** — exporte os dados da tabela de classificação com um clique.
- **Empacotado como MSIX** — construído e assinado no CI via `desktop-ci.yml`.

O código-fonte do aplicativo para desktop está localizado em `desktop/`. Construído com .NET 10 MAUI, direcionado para WinUI 3.

## Instalação

```bash
npm install @mcptoolshop/registry-stats
```

## Interface de Linha de Comando (CLI)

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

## Arquivo de Configuração

Crie um arquivo `registry-stats.config.json` na raiz do seu projeto (ou execute `registry-stats --init`):

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

Execute `registry-stats` sem argumentos para obter as estatísticas de todos os pacotes configurados. A CLI procura o arquivo de configuração a partir do diretório atual.

A configuração também está disponível programaticamente:

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## API Programática

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

## Suporte a Registros

| Registro | Formato do pacote | Séries temporais | Dados disponíveis |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sim (549 dias) | último dia, última semana, último mês |
| `pypi` | `requests` | Sim (180 dias) | último dia, última semana, último mês, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalações), avaliação, tendências |
| `docker` | `namespace/repo` | No | total (downloads), estrelas |

## Confiabilidade Integrada

- Tentativa automática com retrocesso exponencial em caso de erros 429/5xx
- Respeita os cabeçalhos `Retry-After`
- Limitação de concorrência para solicitações em lote
- Cache TTL opcional (plugável — utilize seu próprio backend Redis/arquivo através da interface `StatsCache`)

## Servidor de API REST

Execute como um microserviço ou incorpore em seu próprio servidor:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

Uso programático para servidores personalizados ou sem servidor:

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
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

## Estrutura do Repositório

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## Desenvolvimento

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## Segurança e Escopo de Dados

| Aspecto | Detalhe |
|--------|--------|
| **Data touched** | Estatísticas de download públicas do npm, PyPI, NuGet, VS Code Marketplace, Docker Hub. Cache na memória (opcional). |
| **Data NOT touched** | Sem telemetria. Sem análises. Sem armazenamento de credenciais. Sem dados do usuário. Sem gravações de arquivos. |
| **Permissions** | Leitura: APIs públicas de registros via HTTPS. Escrita: apenas stdout/stderr. |
| **Network** | Saída HTTPS para APIs públicas de registros. Servidor REST local opcional. |
| **Telemetry** | Nenhum dado coletado ou enviado. |

Consulte [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

## Tabela de Pontuação

| Categoria | Pontuação |
|----------|-------|
| A. Segurança | 10 |
| B. Tratamento de Erros | 10 |
| C. Documentação para Operadores | 10 |
| D. Higiene de Distribuição | 10 |
| E. Identidade (suave) | 10 |
| **Overall** | **50/50** |

> Auditoria completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licença

MIT

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
