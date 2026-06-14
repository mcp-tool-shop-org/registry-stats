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

Você publica no npm, PyPI, NuGet, na VS Code Marketplace e no Docker Hub. Atualmente, responder à pergunta "como estão meus pacotes?" significa verificar cinco sites diferentes. O **registry-stats** é a plataforma completa: um mecanismo TypeScript (CLI + API + servidor REST), um painel da web em tempo real e um aplicativo nativo para desktop Windows — tudo em um único repositório.

Sem dependências de tempo de execução. Usa `fetch()` nativo. Node 18+.

## O que está dentro

| Camada | O que faz |
|-------|-------------|
| **Engine** | Biblioteca TypeScript + CLI + servidor REST + inferência de IA. Consulte cinco registros com uma única interface. Publicado no npm como `@mcptoolshop/registry-stats`. |
| **Dashboard** | Aplicativo web baseado em Astro com painel de inferência de IA (pontuações de saúde, previsões, conselhos práticos), co-piloto Pulse AI (voz em streaming, pesquisa na web, tela cheia, conectores de dados do GitHub), sete gráficos interativos com zoom/pan, atualização ao vivo, relatórios de exportação (PDF / JSONL / Markdown) e guia de ajuda em abas. Reconstruído diariamente pelo CI; atualizável sob demanda. |
| **Desktop** | Aplicativo WinUI 3 + WebView2 nativo para Windows. Inclui o painel offline, busca estatísticas ao vivo sob demanda. |

## Painel

Um painel de estatísticas auto-atualizável está disponível em [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interface com abas** — Abas Início, Análise, Classificação e Ajuda
- **Co-piloto Pulse AI** — Assistente conversacional baseado em Ollama com síntese de voz em streaming (fala enquanto o LLM transmite, 4 vozes via [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), pesquisa na web (Wikipedia + SearXNG opcional), fala automática, modo de tela cheia, conector de dados da organização do GitHub, seletor de modelo e memória de conversação
- **Visão geral executiva** — pontuação de saúde (0–100), índice de diversidade, variação semanal, downloads totais em todos os registros
- **Sete gráficos interativos** — tendência de 30 dias (agregado / por registro / alternância dos 5 principais + clique para detalhar + zoom/pan com rolagem), participação do registro (área polar), risco da carteira (histograma + Gini e P90), os 10 principais em termos de crescimento, rastreador de velocidade com gráficos de linha, mapa de calor de 30 dias com detecção de picos (>2σ) e tendência da carteira (área empilhada, anual)
- **Mecanismo de crescimento inteligente** — lida com a distorção de pequenos denominadores com limite de base, limite percentual e fórmula de velocidade amortecida
- **Painel de inferência de IA** — impulso da carteira (-100 a +100), pontuação de risco, previsão de 7 dias com intervalos de confiança, recomendações automatizadas, conselhos práticos com níveis de gravidade/urgência e tabela de classificação da saúde do pacote (notas de A a F)
- **Conselhos práticos** — cartões de aconselhamento marcados por gravidade (crítico/alerta/informação/sucesso) com níveis de urgência, etapas específicas e listas de pacotes afetados
- **Pontuações de saúde dos pacotes** — pontuação composta de 0 a 100 (atividade + consistência + crescimento + estabilidade) com notas por pacote
- **Rastreamento do progresso anual** — camada de histórico persistente acumula agregados mensais por pacote e semanais da carteira; gráfico de tendência da carteira com empilhamento por registro
- **Painel Pulse** — visão dividida de Pacotes Estabelecidos em Crescimento (≥ 50 downloads/semana) e Pacotes Novos e Emergentes, com gráficos de linha de 7 dias integrados, deltas absolutos + percentuais, contexto de base e um resumo executivo de uma linha
- **Atualização ao vivo** — busca sob demanda do lado do cliente das APIs npm e PyPI com indicador de progresso; resultados armazenados em cache no sessionStorage (5 minutos de TTL) para que as trocas de abas sejam instantâneas
- **Relatórios de exportação** — menu suspenso ao lado do botão Atualizar, oferecendo três formatos: **PDF Executivo** (via jsPDF), **JSONL LLM** (registros tipados para ingestão de IA) e **Markdown Dev** (tabelas GFM)
- **Classificação** — 132 pacotes classificados por downloads semanais com gráficos de linha de 30 dias integrados e selos de tendência inteligentes
- **Página de configuração** — editor de carteira com validação, seção complementar de sincronização do registro e visão geral do pipeline
- **Pesquisa na classificação** — filtro de texto instantâneo para encontrar pacotes por nome ou registro
- **Navegação pelo teclado** — teclas de seta para alternar entre as abas
- **Aba Ajuda** — guia amigável que cobre todas as abas, conceitos-chave, mecanismo de inferência de IA, pipeline de dados e links úteis
- **Tema escuro/claro** — segue a preferência do sistema
- **Responsivo para dispositivos móveis** — menu hambúrguer para telas pequenas

Os dados são atualizados diariamente pelo CI (06:00 UTC) e todo o site é reconstruído semanalmente (segundas-feiras, 06:00 UTC). A atualização ao vivo busca os números mais recentes diretamente das APIs de registro sob demanda. Configure os pacotes rastreados em `site/src/data/packages.json`.

## Mecanismo de inferência de IA

Inferência pura e matemática, sem dependências, que é executada no momento da construção — sem tempo de execução de ML, sem APIs externas.

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

| Capacidade | Método | O que faz |
|-----------|--------|-------------|
| **Forecast** | Regressão linear ponderada | Viés de recência exponencial, IC de 80% que se amplia com o tempo |
| **Anomaly detection** | Z-score adaptável e contínuo | Janela de base de 14 dias, detecta picos e quedas |
| **Trend segmentation** | Linear por partes | Identifica segmentos ascendentes/descendentes/planos em séries temporais |
| **Seasonality** | Decomposição do dia da semana | Detecta padrões semanais, relata o dia de pico |
| **Momentum** | Pontuação composta | Direção + aceleração + consistência + volume |
| **Health score** | Composto multifatorial | Atividade + consistência + crescimento + estabilidade (0–100, nota de A a F) |
| **Yearly progress** | Acumulação mensal | Crescimento ano a ano, projeção do final do ano, rastreamento de marcos |
| **Actionable advice** | Mecanismo de regras de gravidade | Crítico/alerta/informação/sucesso com urgência e ações específicas |
| **Recommendations** | Mecanismo de regras | Categorias de crescimento, risco, oportunidade e atenção |

## Aplicativo para desktop

Um aplicativo nativo para Windows que envolve o painel em um shell WebView2 local:

- **Funciona offline** — inclui HTML/CSS/JS; funciona sem internet
- **Atualização em tempo real** — obtém `stats.json` do GitHub Pages sob demanda
- **Exportação para CSV** — exporta dados da tabela de classificação com um clique
- **Empacotado como MSIX** — criado e assinado no CI por meio de `desktop-ci.yml`

O código fonte para desktop está em `desktop/`. Criado com .NET 10 MAUI, direcionado ao WinUI 3.

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

## Arquivo de configuração

Crie um arquivo `registry-stats.config.json` no diretório raiz do seu projeto (ou execute `registry-stats --init`):

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

Execute `registry-stats` sem argumentos para obter estatísticas de todos os pacotes configurados. A CLI percorre a partir do diretório atual para encontrar o arquivo de configuração mais próximo.

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

// Maintainer discovery — find all npm packages by username
const mine = await stats.mine('mikefrilot');
// Returns PackageStats[] sorted by monthly downloads

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Suporte ao Registro

| Registro | Formato do pacote | Série temporal | Dados disponíveis |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sim (549 dias) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sim (180 dias) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalações), classificação, tendências |
| `docker` | `namespace/repo` | No | total (downloads), estrelas |

## Confiabilidade integrada

- Nova tentativa automática com recuo exponencial em erros 429/5xx
- Respeita os cabeçalhos `Retry-After`
- Tempo limite de solicitação de 30 segundos por meio de `AbortSignal.timeout`
- Limitação de concorrência para solicitações em massa
- Cache TTL opcional (plugável — use seu próprio backend Redis/arquivo por meio da interface `StatsCache`)
- Ações do GitHub com SHA fixo para segurança da cadeia de suprimentos

## Servidor REST API

Execute como um microsserviço ou incorpore em seu próprio servidor:

```bash
registry-stats serve --port 3000
```

Por padrão, `serve` é vinculado a `127.0.0.1` (somente localhost) e define CORS para `*`. Use `--host 0.0.0.0` para expô-lo na rede e `--cors <origin>` para restringir o acesso entre domínios diferentes ao fazê-lo.

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
| **Data touched** | Estatísticas públicas de download do npm, PyPI, NuGet, VS Code Marketplace, Docker Hub. Cache na memória (opcional) |
| **Data NOT touched** | Sem telemetria. Sem análise. Sem armazenamento de credenciais. Sem dados do usuário. Sem gravações em arquivos |
| **Permissions** | Leitura: APIs públicas de registro por meio de HTTPS. Escrita: somente stdout/stderr |
| **Network** | HTTPS para APIs públicas de registro. Servidor REST opcional no localhost |
| **Telemetry** | Nenhum dado coletado ou enviado |

Consulte [SECURITY.md](SECURITY.md) para relatar vulnerabilidades.

## Avaliação

| Categoria | Pontuação |
|----------|-------|
| A. Segurança | 10 |
| B. Tratamento de Erros | 10 |
| C. Documentação para Operadores | 10 |
| D. Boas Práticas de Distribuição | 10 |
| E. Identidade (suave) | 10 |
| **Overall** | **50/50** |

> Auditoria completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licença

MIT

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
