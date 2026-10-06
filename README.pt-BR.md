<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.md">English</a>
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

Você publica no npm, PyPI, NuGet, no VS Code Marketplace, no Docker Hub e no GitHub Releases. Atualmente, responder à pergunta "como estão meus pacotes?" significa verificar seis sites diferentes. O **registry-stats** é a plataforma completa: um motor TypeScript (CLI + API + servidor REST), um painel da web em tempo real e um aplicativo nativo para Windows — tudo em um único repositório.

Sem dependências de tempo de execução. Usa `fetch()` nativo. Node 18+.

## O que há dentro

| Camada | O que faz |
|-------|-------------|
| **Engine** | Biblioteca TypeScript + CLI + servidor REST + inferência de IA. Consulta seis registros — npm, PyPI, NuGet, VS Code Marketplace, Docker Hub e GitHub Releases — com uma única interface. Um nome de pacote simples consulta npm, PyPI, NuGet, VS Code Marketplace e Docker Hub. O GitHub Releases é incluído quando o nome é owner/repo, ou quando os registros listam nomes github. Publicado no npm como `@mcptoolshop/registry-stats`. |
| **Dashboard** | Aplicativo web com tecnologia Astro com painel de inferência de IA (pontuações de saúde, previsões, conselhos práticos), co-piloto Pulse AI (voz em streaming, pesquisa na web, tela cheia, conectores de dados do GitHub), sete gráficos (zoom e panorâmica na tendência de 30 dias e na tendência do portfólio), atualização em tempo real, exportação de relatórios (PDF / JSONL / Markdown) e guia de ajuda em abas. O CI diário busca os dados do painel. O site é reconstruído semanalmente, às segundas-feiras, às 07:00 UTC. |
| **Desktop** | Aplicativo nativo para Windows com WinUI 3 + WebView2. Inclui o painel offline e busca estatísticas em tempo real sob demanda. |

## Painel

Um painel de estatísticas autoatualizável está disponível em [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interface em abas** — Abas Início, Análise, Classificação e Ajuda
- **Co-piloto Pulse AI** — Assistente conversacional com tecnologia Ollama, com síntese de voz em streaming (fala enquanto o LLM transmite, 4 vozes via [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), pesquisa na web (Wikipedia + SearXNG opcional), fala automática, modo de tela cheia, conector de dados do GitHub, seletor de modelo e memória de conversação
- **Visão geral executiva** — pontuação de saúde (0–100), índice de diversidade e variação semanal. Os totais de downloads semanais e mensais são npm e PyPI. VS Code, NuGet, Docker e GitHub contribuem com seus totais de todos os tempos, não com esses dois totais.
- **Sete gráficos interativos** — tendência de 30 dias (agregado / por registro / alternância de top-5 + clique para detalhar), participação do registro (área polar), risco do portfólio (histograma + Gini e P90), top-10 em termos de crescimento, rastreador de velocidade com gráficos de linha, mapa de calor de 30 dias com detecção de picos (>2σ) e tendência do portfólio (área empilhada, anual). O zoom e a panorâmica são apenas na tendência de 30 dias e na tendência do portfólio.
- **Motor de crescimento inteligente** — lida com a distorção de pequeno denominador com limite de base, limite de porcentagem e fórmula de velocidade amortecida
- **Painel de inferência de IA** — crescimento do portfólio (-100 a +100), pontuação de risco, previsão de 7 dias com intervalos de confiança, recomendações automatizadas, conselhos práticos com níveis de gravidade/urgência e tabela de pontuação de saúde do pacote (notas de A a F)
- **Conselhos práticos** — cartões de conselhos com tags de gravidade (crítico/alerta/informação/sucesso) com níveis de urgência, etapas de ação específicas e listas de pacotes afetados
- **Pontuações de saúde do pacote** — pontuação composta de 0 a 100 (atividade + consistência + crescimento + estabilidade) com notas por pacote
- **Rastreamento do progresso anual** — camada de histórico persistente acumula totais mensais por pacote e totais semanais do portfólio; gráfico de tendência do portfólio com empilhamento por registro
- **Painel Pulse** — visão dividida de Pacotes Estabelecidos em Crescimento (≥ 50 downloads/semana) e Pacotes Novos e Emergentes, com gráficos de linha de 7 dias, deltas absolutos e de porcentagem, contexto de linha de base e um resumo executivo de uma linha
- **Atualização em tempo real** — a página busca novamente o `data/stats.json` de mesma origem quando esse arquivo é mais recente do que a versão. Não faz chamadas às APIs do npm ou PyPI a partir do navegador. `sessionStorage` contém o GitHub PAT opcional, não um cache de estatísticas.
- **Exportar relatórios** — menu suspenso ao lado do botão Atualizar, oferecendo três formatos: **Exec PDF** (via jsPDF), **LLM JSONL** (registros tipados para ingestão de IA) e **Dev Markdown** (tabelas GFM)
- **Classificação** — 268 IDs rastreados em `packages.json` (168 npm, 43 PyPI, 6 VS Code, 27 NuGet, 24 GitHub), classificados pela coluna Downloads: semana para npm e PyPI, todos os tempos para VS Code, NuGet, Docker e GitHub. O gráfico de linha de 30 dias é a série npm. Os indicadores de tendência inteligentes evitam porcentagens enganosas para pacotes de baixo volume.
- **Página de configuração** — editor de portfólio com validação, seção de acompanhamento de sincronização de registro e visão geral do pipeline
- **Pesquisa na classificação** — filtro de texto instantâneo para encontrar pacotes por nome ou registro
- **Navegação por teclado** — teclas de seta para alternar entre as abas
- **Aba Ajuda** — guia amigável que cobre todas as abas, conceitos-chave, motor de inferência de IA, pipeline de dados e links úteis
- **Tema escuro/claro** — segue a preferência do sistema
- **Responsivo para dispositivos móveis** — menu hambúrguer para telas pequenas

Os dados são atualizados diariamente pelo CI (06:00 UTC) e todo o site é reconstruído semanalmente (segundas-feiras, 07:00 UTC). O painel busca novamente o `data/stats.json` de mesma origem. Configure os pacotes rastreados em `site/src/data/packages.json`.

## Motor de inferência de IA

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
// → { packages, forecastTotal7, riskScore, diversityTrend, portfolioMomentum, recommendations, healthScores, actionableAdvice }
// diversityTrend is 'improving' | 'stable' | 'declining'
```

| Capacidade | Método | O que faz |
|-----------|--------|-------------|
| **Forecast** | Regressão linear ponderada | Viés de recência exponencial, IC de 80% que se amplia com o tempo |
| **Anomaly detection** | Z-score adaptável e contínuo | Janela de base de 14 dias, detecta picos e quedas |
| **Trend segmentation** | Linear por partes | Identifica segmentos ascendentes, descendentes e planos em séries temporais |
| **Seasonality** | Decomposição do dia da semana | Detecta padrões semanais, relata o dia de pico |
| **Momentum** | Pontuação composta | Direção + aceleração + consistência + volume |
| **Health score** | Composto multifatorial | Atividade + consistência + crescimento + estabilidade (0–100, nota de A–F) |
| **Yearly progress** | Acumulação mensal | Crescimento em relação ao ano anterior, projeção para o final do ano, acompanhamento de marcos |
| **Actionable advice** | Mecanismo de regras de severidade | Crítico/alerta/informação/sucesso com urgência e ações específicas |
| **Recommendations** | Mecanismo de regras | Categorias de crescimento, risco, oportunidade e atenção |

## Aplicativo para desktop

Um aplicativo Windows nativo que envolve o painel em um shell WebView2 local:

- **Capaz de funcionar offline** — inclui HTML/CSS/JS; funciona sem internet
- **Atualização em tempo real** — sem um portfólio salvo, baixa as Páginas do GitHub `stats.json`. Com um portfólio salvo, envia cada nome para o registro que o contém e não carrega o arquivo do portfólio.
- **Exportação para CSV** — exporta os dados da tabela de classificação com um clique
- **Empacotado em MSIX** — criado e assinado no CI via `desktop-ci.yml`

O código-fonte do desktop está em `desktop/`. Criado com .NET 10 MAUI, direcionado para WinUI 3.

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

## Arquivo de configuração

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

Execute `registry-stats` sem argumentos para buscar estatísticas de todos os pacotes configurados. O CLI percorre a partir do diretório de trabalho atual para encontrar o arquivo de configuração mais próximo. A matriz `registries` acima é os cinco padrões. Adicione `"github"` para incluir os lançamentos do GitHub; esses pacotes são slugs `owner/repo`. Sem um arquivo de configuração, uma consulta de pacote usa todos os registros integrados, exceto os lançamentos do GitHub, a menos que o nome seja proprietário/repositório. Nomear github na lista de registros ainda o consulta e um nome simples é, então, um erro desse registro.

A configuração também está disponível programaticamente:

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

## Suporte a registros

| Registro | Formato do pacote | Série temporal | Dados disponíveis |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Sim (549 dias) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Sim (180 dias) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (instalações), classificação, tendências |
| `docker` | `namespace/repo` | No | total (downloads), estrelas |
| `github` | `owner/repo` | No | total (downloads de ativos), lançamentos, ativos, tag mais recente |

## Confiabilidade integrada

- Nova tentativa automática com recuo exponencial em erros 429/5xx
- Respeita os cabeçalhos `Retry-After`
- Tempo limite de solicitação de 30 segundos via `AbortSignal.timeout`
- Limitação de concorrência para solicitações em massa
- Cache TTL opcional (plugável — traga seu próprio backend Redis/arquivo via interface `StatsCache`)
- Ações do GitHub com SHA fixo para segurança da cadeia de suprimentos

## Servidor de API REST

Execute como um microsserviço ou incorpore em seu próprio servidor:

```bash
registry-stats serve --port 3000
```

Por padrão, `serve` vincula-se a `127.0.0.1` (somente localhost) e define o CORS para `*`. Use `--host 0.0.0.0` para expô-lo na rede e `--cors <origin>` para restringir o acesso entre domínios diferentes ao fazê-lo.

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

## Estrutura do repositório

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

### Aplicativo para desktop

Windows, com o SDK .NET 10. Execute `npm run site:build` primeiro para que `site/dist` exista. O projeto copia isso para o diretório de saída `wwwroot/registry-stats`.

```bash
dotnet workload install maui-windows
npm run site:build
dotnet build desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
# or
dotnet publish desktop/RegistryPulse.Desktop/RegistryPulse.Desktop.csproj
```

O MSIX assinado é um artefato de CI de `desktop-ci.yml`. Não é um download do GitHub Release e não é o upload para a loja. O Registry Pulse, o aplicativo de desktop do Windows, está listado em https://apps.microsoft.com/detail/9P9TR0055JG9. A versão do pacote neste repositório é 3.4.0.0. O Partner Center assina o arquivo que você carrega.

## Segurança e escopo de dados

| Aspecto | Detalhe |
|--------|--------|
| **Data touched** | Estatísticas públicas de download do npm, PyPI, NuGet, VS Code Marketplace, Docker Hub e GitHub Releases. Cache opcional na memória. `registry-stats --init` grava `registry-stats.config.json`. O aplicativo de desktop grava `packages.json` e `stats.json` em `%LOCALAPPDATA%\RegistryPulse`. |
| **Credentials** | `--init` não grava um token. O arquivo de configuração pode conter um `dockerToken` ou um `githubToken` se você adicionar um, e esse valor permanece no arquivo. O CLI envia `dockerToken` como um token Bearer para o Docker Hub e `githubToken` como um token Bearer apenas para `api.github.com`. A ferramenta não grava nenhum dos tokens. O painel pode manter um GitHub PAT em `sessionStorage` e enviá-lo para `api.github.com`. |
| **Data NOT touched** | Sem telemetria. Sem análises. Sem contas de usuário. |
| **Permissions** | Leitura: APIs de registro público via HTTPS, mais essas chamadas autenticadas quando um token é fornecido. Gravação: stdout/stderr, `registry-stats.config.json` em `--init` e arquivos de desktop em `%LOCALAPPDATA%\RegistryPulse`. Servidor REST opcional em uma porta especificada pelo usuário. |
| **Network** | HTTPS de saída para `api.npmjs.org`, `registry.npmjs.org` (`--mine`), `pypistats.org`, `azuresearch-usnc.nuget.org`, `marketplace.visualstudio.com`, `hub.docker.com` e `api.github.com` (GitHub Releases). A atualização do desktop também baixa estatísticas de `mcp-tool-shop-org.github.io`. Servidor REST localhost opcional. |
| **Telemetry** | Nenhum coletado ou enviado |

Consulte [SECURITY.md](SECURITY.md) para relatórios de vulnerabilidades.

## Scorecard

| Categoria | Pontuação |
|----------|-------|
| A. Segurança | 10 |
| B. Tratamento de erros | 8 |
| C. Documentação do operador | 10 |
| D. Higiene de envio | 8 |
| E. Identidade (suave) | 10 |
| **Overall** | **46/50** |

> Auditoria completa: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licença

MIT

---

Criado por <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
