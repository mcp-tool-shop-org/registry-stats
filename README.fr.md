<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.md">English</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
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

Vous publiez sur npm, PyPI, NuGet, le VS Code Marketplace et Docker Hub. Actuellement, répondre à la question « comment se portent mes paquets ? » implique de consulter cinq sites différents. **registry-stats** est la plateforme complète : un moteur TypeScript (CLI + API + serveur REST), un tableau de bord web en temps réel et une application Windows native, le tout issu d’un seul dépôt.

Aucune dépendance au moment de l’exécution. Utilise `fetch()` natif. Node 18+.

## Ce qu’il contient

| Couche | Ce que cela fait |
|-------|-------------|
| **Engine** | Bibliothèque TypeScript + CLI + serveur REST + inférence IA. Interrogez cinq registres avec une seule interface. Publié sur npm sous le nom `@mcptoolshop/registry-stats`. |
| **Dashboard** | Application web propulsée par Astro, dotée d’un panneau d’inférence IA (scores de santé, prévisions, conseils exploitables), du copilote Pulse AI (voix en streaming, recherche sur le Web, plein écran, connecteurs de données GitHub), de sept graphiques interactifs avec zoom/pan, actualisation en direct, exportation de rapports (PDF / JSONL / Markdown) et guide d’aide à onglets. Reconstruit quotidiennement par CI ; actualisable à la demande. |
| **Desktop** | Application Windows native WinUI 3 + WebView2. Regroupe le tableau de bord hors ligne, récupère les statistiques en direct à la demande. |

## Tableau de bord

Un tableau de bord de statistiques auto-mis à jour est disponible à l’adresse [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interface à onglets** : onglets Accueil, Analyses, Classement et Aide
- **Copilote Pulse AI** : assistant conversationnel alimenté par Ollama avec synthèse vocale en streaming (parle pendant que le LLM diffuse du contenu, 4 voix via [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), recherche sur le Web (Wikipedia + SearXNG facultatif), lecture automatique, mode plein écran, connecteur de données d’organisation GitHub, sélecteur de modèle et mémoire de conversation
- **Vue d’ensemble** : score de santé (0 à 100), indice de diversité, variation hebdomadaire, nombre total de téléchargements sur tous les registres
- **Sept graphiques interactifs** : tendance sur 30 jours (agrégé / par registre / bascules des 5 premiers + clic pour afficher les détails + zoom/pan en faisant défiler), part du registre (aire polaire), risque de portefeuille (histogramme + Gini et P90), top 10 des dynamiques, suivi de la vitesse avec graphiques miniatures, carte thermique sur 30 jours avec détection des pics (>2σ) et tendance du portefeuille (aire empilée, annuelle)
- **Moteur de croissance intelligent** : gère les distorsions dues aux petits dénominateurs grâce à un seuil de base, une limite en pourcentage et une formule de vitesse amortie
- **Panneau d’inférence IA** : dynamique du portefeuille (-100 à +100), score de risque, prévision sur 7 jours avec intervalles de confiance, recommandations automatisées, conseils exploitables avec niveaux de gravité/urgence et tableau de bord de santé des paquets (notes de A à F)
- **Conseils exploitables** : cartes de conseils étiquetées par niveau de gravité (critique/avertissement/info/succès) avec niveaux d’urgence, étapes d’action spécifiques et listes de paquets concernés
- **Scores de santé des paquets** : score composite de 0 à 100 (activité + cohérence + croissance + stabilité) avec notes pour chaque paquet
- **Suivi annuel des progrès** : une couche d’historique persistante accumule les données mensuelles par paquet et hebdomadaires du portefeuille ; graphique de tendance du portefeuille avec empilement par registre
- **Panneau Pulse** : vue divisée des paquets établis à forte croissance (≥ 50 téléchargements/semaine) et des paquets émergents et nouveaux, avec graphiques miniatures en ligne sur 7 jours, deltas absolus + en pourcentage, contexte de base et un résumé exécutif d’une seule ligne
- **Actualisation en direct** : récupération à la demande côté client à partir des API npm et PyPI avec indicateur de progression ; les résultats sont mis en cache dans sessionStorage (TTL de 5 minutes) afin que le passage d’un onglet à l’autre soit instantané
- **Exportation des rapports** : menu déroulant à côté du bouton Actualiser offrant trois formats : **PDF exécutif** (via jsPDF), **JSONL LLM** (enregistrements typés pour l’ingestion par l’IA) et **Markdown de développement** (tableaux GFM)
- **Classement** : 132 paquets classés par nombre de téléchargements hebdomadaires avec graphiques miniatures sur 30 jours et badges de tendance intelligents
- **Page de configuration** : éditeur de portefeuille avec validation, section compagnon de synchronisation du registre et aperçu du pipeline
- **Recherche dans le classement** : filtre de texte instantané pour trouver des paquets par nom ou par registre
- **Navigation au clavier** : touches fléchées pour passer d’un onglet à l’autre
- **Onglet Aide** : guide convivial couvrant chaque onglet, les concepts clés, le moteur d’inférence IA, le pipeline de données et les liens utiles
- **Thème sombre/clair** : suit la préférence du système
- **Adapté aux mobiles** : menu hamburger pour les petits écrans

Les données sont actualisées quotidiennement par CI (06h00 UTC) et l’ensemble du site est reconstruit chaque semaine (lundi à 06h00 UTC). L’actualisation en direct récupère les derniers chiffres directement à partir des API de registre à la demande. Configurez les paquets suivis dans `site/src/data/packages.json`.

## Moteur d’inférence IA

Inférence purement mathématique sans dépendance, qui s’exécute au moment de la création : pas d’environnement d’exécution ML, pas d’API externes.

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

| Capacité | Méthode | Ce que cela fait |
|-----------|--------|-------------|
| **Forecast** | Régression linéaire pondérée | Biais de récence exponentiel, IC de 80 % qui s’élargit avec le temps |
| **Anomaly detection** | Score z adaptatif et progressif | Fenêtre de base de 14 jours, détecte les pics et les baisses |
| **Trend segmentation** | Linéaire par morceaux | Identifie les segments ascendants/descendants/plats dans les séries chronologiques |
| **Seasonality** | Décomposition du jour de la semaine | Détecte les tendances hebdomadaires, signale le jour de pointe |
| **Momentum** | Score composite | Direction + accélération + cohérence + volume |
| **Health score** | Composite multifactoriel | Activité + cohérence + croissance + stabilité (0 à 100, note de A à F) |
| **Yearly progress** | Accumulation mensuelle | Croissance en glissement annuel, projection de fin d’année, suivi des étapes importantes |
| **Actionable advice** | Moteur de règles de gravité | Critique/avertissement/info/succès avec urgence et actions spécifiques |
| **Recommendations** | Moteur de règles | Catégories : croissance, risque, opportunité et attention |

## Application de bureau

Une application Windows native qui intègre le tableau de bord dans une enveloppe WebView2 locale :

- **Fonctionne hors ligne** : inclut des fichiers HTML/CSS/JS ; fonctionne sans connexion Internet.
- **Actualisation en temps réel** : récupère le fichier `stats.json` depuis GitHub Pages à la demande.
- **Exportation CSV** : exporte les données du tableau de bord avec un seul clic.
- **Package MSIX** : créé et signé dans l’environnement CI via `desktop-ci.yml`.

Le code source pour le bureau se trouve dans `desktop/`. Créé avec .NET 10 MAUI ciblant WinUI 3.

## Installation

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

## Fichier de configuration

Créez un fichier `registry-stats.config.json` dans le répertoire racine de votre projet (ou exécutez `registry-stats --init`) :

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

Exécutez `registry-stats` sans arguments pour récupérer les statistiques de tous les packages configurés. La CLI parcourt l’arborescence à partir du répertoire courant pour trouver le fichier de configuration le plus proche.

La configuration est également disponible par programmation :

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## API programmable

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

## Prise en charge des registres

| Registre | Format du package | Série chronologique | Données disponibles |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Oui (549 jours) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Oui (180 jours) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installations), note, tendances |
| `docker` | `namespace/repo` | No | total (téléchargements), étoiles |

## Fiabilité intégrée

- Nouvelles tentatives automatiques avec un délai exponentiel en cas d’erreurs 429/5xx.
- Respecte les en-têtes `Retry-After`.
- Délai d’attente des requêtes de 30 secondes via `AbortSignal.timeout`.
- Limitation de la concurrence pour les requêtes groupées.
- Cache TTL facultatif (extensible : utilisez votre propre backend Redis/fichier via l’interface `StatsCache`).
- Actions GitHub avec empreinte SHA pour la sécurité de la chaîne d’approvisionnement.

## Serveur API REST

Exécutez-le en tant que microservice ou intégrez-le dans votre propre serveur :

```bash
registry-stats serve --port 3000
```

Par défaut, `serve` se lie à `127.0.0.1` (uniquement localhost) et définit CORS sur `*`. Utilisez `--host 0.0.0.0` pour l’exposer sur le réseau et `--cors <origin>` pour restreindre l’accès inter-domaines dans ce cas.

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

Utilisation programmatique pour les serveurs personnalisés ou sans serveur :

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Registres personnalisés

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

## Structure du dépôt

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## Développement

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## Sécurité et portée des données

| Aspect | Détail |
|--------|--------|
| **Data touched** | Statistiques de téléchargement publiques provenant de npm, PyPI, NuGet, VS Code Marketplace, Docker Hub. Cache en mémoire (facultatif). |
| **Data NOT touched** | Aucune télémétrie. Aucune analyse. Aucun stockage d’informations d’identification. Aucune donnée utilisateur. Aucun écriture dans les fichiers. |
| **Permissions** | Lecture : API de registre publiques via HTTPS. Écriture : uniquement stdout/stderr. |
| **Network** | HTTPS en sortie vers les API de registre publiques. Serveur REST localhost facultatif. |
| **Telemetry** | Aucune donnée n’est collectée ni envoyée. |

Pour signaler les vulnérabilités, consultez le fichier [SECURITY.md](SECURITY.md).

## Évaluation

| Catégorie | Score |
|----------|-------|
| A. Sécurité | 10 |
| B. Gestion des erreurs | 10 |
| C. Documentation pour les opérateurs | 10 |
| D. Bonnes pratiques de publication | 10 |
| E. Identité (atténuée) | 10 |
| **Overall** | **50/50** |

> Audit complet : [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md).

## Licence

MIT

---

Créé par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
