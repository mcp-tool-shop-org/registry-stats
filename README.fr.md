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

Vous publiez sur npm, PyPI, NuGet, le Marketplace de VS Code et Docker Hub. Actuellement, répondre à la question "comment vont mes paquets ?" nécessite de consulter cinq sites différents. **registry-stats** est une plateforme complète : un moteur TypeScript (CLI + API + serveur REST), un tableau de bord web interactif et une application de bureau Windows native, le tout regroupé dans un seul dépôt.

Aucune dépendance d'exécution. Utilise la fonction native `fetch()`. Node 18+.

## Contenu

| Couche | Fonctionnalités |
|-------|-------------|
| **Engine** | Bibliothèque TypeScript + CLI + serveur REST. Interrogez cinq registres avec une seule interface. Publié sur npm sous le nom `@mcptoolshop/registry-stats`. |
| **Dashboard** | Application web alimentée par Astro, avec un assistant IA Pulse (reconnaissance vocale, recherche web, mode plein écran, connecteurs de données GitHub), six graphiques interactifs, actualisation en direct, exportation de rapports (PDF / JSONL / Markdown) et un guide d'aide organisé par onglets. Reconstruite chaque semaine par CI ; actualisable à la demande. |
| **Desktop** | Application Windows native utilisant WinUI 3 + WebView2. Inclut le tableau de bord hors ligne et récupère les statistiques en direct à la demande. |

## Tableau de bord

Un tableau de bord de statistiques qui se met à jour automatiquement est disponible à l'adresse [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Interface à onglets** — Onglets Accueil, Analyses, Classement, et Aide.
- **Assistant IA Pulse** — Assistant conversationnel alimenté par Ollama, avec synthèse vocale en continu (parle pendant que le LLM génère du texte, 4 voix via [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), recherche web (Wikipedia + SearXNG optionnel), lecture automatique, mode plein écran, connecteur de données GitHub, sélecteur de modèle, et mémoire de conversation.
- **Aperçu général** — Score de santé (0–100), indice de diversité, variation hebdomadaire, nombre total de téléchargements sur tous les registres.
- **Six graphiques interactifs** — Tendance sur 30 jours (agrégée / par registre / top-5), part de marché (aire polaire), risque du portefeuille (histogramme + Gini & P90), top 10 des tendances, suivi de la vitesse avec des mini-graphiques, et carte thermique sur 30 jours avec détection des pics (>2σ).
- **Moteur de croissance intelligent** — Gère les distorsions liées aux petites bases avec un seuil de référence, un plafond en pourcentage et une formule de vitesse amortie.
- **Informations exploitables** — Recommandations générées automatiquement et alertes pour les paquets en déclin.
- **Tableau de bord Pulse** — Vue divisée des paquets établis (≥ 50 téléchargements/semaine) et des paquets émergents et nouveaux, avec des mini-graphiques sur 7 jours, des variations absolues et en pourcentage, un contexte de référence et un résumé exécutif en une ligne.
- **Actualisation en direct** — Récupération des données les plus récentes directement des API npm et PyPI, avec un indicateur de progression ; les résultats sont mis en cache dans sessionStorage (TTL de 5 minutes) pour des changements d'onglets instantanés.
- **Exportation de rapports** — Menu déroulant à côté du bouton Actualiser, offrant trois formats : **PDF exécutif** (via jsPDF), **JSONL LLM** (enregistrements typés pour l'ingestion par l'IA) et **Markdown pour développeurs** (tableaux GFM).
- **Classement** — 132 paquets classés par nombre de téléchargements hebdomadaires, avec des mini-graphiques sur 30 jours et des badges de tendance intelligents.
- **Page de configuration** — Éditeur de portefeuille avec validation, section de synchronisation des registres et aperçu du pipeline.
- **Onglet Aide** — Guide convivial couvrant chaque onglet, les concepts clés, des conseils pour l'assistant IA, le pipeline de données et des liens utiles.
- **Thème sombre / clair** — Suit les préférences du système.

Les données sont récupérées au moment de la construction et reconstruites chaque semaine par CI (lundi à 06h00 UTC). L'actualisation en direct récupère les dernières données directement à partir des API des registres. Configurez les paquets suivis dans `site/src/data/packages.json` (132 paquets répartis sur 5 registres).

## Application de bureau

Une application Windows native qui intègre le tableau de bord dans un environnement WebView2 local :

- **Fonctionne hors ligne** — inclut les fichiers HTML/CSS/JS ; fonctionne sans connexion Internet.
- **Actualisation en direct** — récupère le fichier `stats.json` depuis GitHub Pages à la demande.
- **Exportation CSV** — exportez les données du classement en un seul clic.
- **Paquet MSIX** — construit et signé par CI via `desktop-ci.yml`.

Le code source de l'application de bureau se trouve dans le répertoire `desktop/`. Développé avec .NET 10 MAUI et ciblant WinUI 3.

## Installer

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

## Fichier de configuration

Créez un fichier `registry-stats.config.json` à la racine de votre projet (ou exécutez la commande `registry-stats --init`) :

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

Exécutez la commande `registry-stats` sans arguments pour obtenir les statistiques de tous les paquets configurés. L'interface en ligne de commande (CLI) remonte à partir du répertoire de travail actuel (cwd) pour trouver le fichier de configuration le plus proche.

La configuration est également accessible par programmation :

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

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Support technique pour les registres

| Registre. | Format du paquet. | Séries temporelles. | Données disponibles. |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Oui (549 jours). | dernier jour, dernière semaine, dernier mois. |
| `pypi` | `requests` | Oui (180 jours). | dernier jour, dernière semaine, dernier mois, total. |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installations), évaluation, tendances. |
| `docker` | `namespace/repo` | No | total (nombre de tirages), étoiles. |

## Fiabilité intégrée

- Nouvelle tentative automatique avec un délai exponentiel en cas d'erreurs 429/5xx.
- Respect des en-têtes "Retry-After".
- Limitation de la concurrence pour les requêtes groupées.
- Cache TTL optionnel (extensible – possibilité d'utiliser votre propre backend Redis ou fichier via l'interface "StatsCache").

## Serveur d'API REST

Fonctionnez en tant que microservice ou intégrez-le à votre propre serveur :

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

Utilisation par programmation pour les serveurs personnalisés ou les environnements sans serveur :

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
| **Data NOT touched** | Aucune télémétrie. Aucune analyse. Aucun stockage d'informations d'identification. Aucune donnée utilisateur. Aucune écriture de fichiers. |
| **Permissions** | Lecture : API publiques des registres via HTTPS. Écriture : uniquement vers la sortie standard/erreur standard. |
| **Network** | Sorties HTTPS vers les API publiques des registres. Serveur REST localhost facultatif. |
| **Telemetry** | Aucune donnée collectée ou envoyée. |

Consultez le fichier [SECURITY.md](SECURITY.md) pour signaler les vulnérabilités.

## Tableau de bord

| Catégorie | Score |
|----------|-------|
| A. Sécurité | 10 |
| B. Gestion des erreurs | 10 |
| C. Documentation pour les administrateurs | 10 |
| D. Bonnes pratiques de déploiement | 10 |
| E. Identité (facultatif) | 10 |
| **Overall** | **50/50** |

> Audit complet : [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## Licence

MIT.

---

Construit par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
