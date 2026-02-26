<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <strong>Français</strong> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats/readme.png" alt="registry-stats logo" width="400" />
</p>

<p align="center">
  One command. Five registries. All your download stats.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml"><img src="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/registry-stats"><img src="https://img.shields.io/npm/v/@mcptoolshop/registry-stats" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/">Docs</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#config-file">Config</a> &middot;
  <a href="#programmatic-api">API</a> &middot;
  <a href="#rest-api-server">REST Server</a> &middot;
  <a href="#license">License</a>
</p>

---

Si vous publiez sur npm, PyPI, NuGet, le marché de VS Code ou Docker Hub, vous avez actuellement besoin de cinq API différentes pour répondre à la question : "Combien de téléchargements ai-je eu ce mois-ci ?" Cette bibliothèque vous offre une interface unique pour tous ces services, sous forme d'interface en ligne de commande ou d'API programmatique.

Aucune dépendance. Utilise la fonction native `fetch()`. Compatible avec Node 18 et versions ultérieures.

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
#  2025-01  142,359,021
#  2025-02  147,522,528
#  ...
#  Total: 448,383,383  Avg/day: 4,982,038  Trend: flat (-0.46%)

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
#  express — comparison
#
#  Metric        npm         pypi
#  ─────────────────────────────────
#  Total         -           -
#  Month         283,472     47,201
#  Week          67,367      11,800
#  Day           11,566      1,686

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
// → { package: 'express', registries: { npm: {...}, pypi: {...} }, fetchedAt: '...' }
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Support technique pour les registres

| Registre. | Format du paquet. | Séries temporelles. | Données disponibles. |
| Bien sûr, veuillez me fournir le texte que vous souhaitez que je traduise. | "The quick brown fox jumps over the lazy dog."
"This is a sample text."
"Please provide more context."
"Thank you for your cooperation."
"We look forward to hearing from you soon."
"The meeting will be held on Tuesday."
"The deadline is Friday."
"Please contact us if you have any questions."
"We are committed to providing excellent service."
"Your satisfaction is our priority."
---------------
"Le rapide renard brun saute par-dessus le chien paresseux."
"Ceci est un exemple de texte."
"Veuillez fournir plus de contexte."
"Nous vous remercions de votre coopération."
"Nous espérons avoir de vos nouvelles prochainement."
"La réunion se tiendra le mardi."
"La date limite est le vendredi."
"N'hésitez pas à nous contacter si vous avez des questions."
"Nous nous engageons à fournir un excellent service."
"Votre satisfaction est notre priorité." | "Please provide the text you would like me to translate." | "The company is committed to providing high-quality products and services."

"We are looking for a motivated and experienced candidate."

"The meeting will take place on Tuesday at 2:00 PM."

"Please submit your application by the end of the week."

"For more information, please contact us."
----------------
"L'entreprise s'engage à fournir des produits et services de haute qualité."

"Nous recherchons un candidat motivé et expérimenté."

"La réunion aura lieu mardi à 14h00."

"Veuillez soumettre votre candidature avant la fin de la semaine."

"Pour plus d'informations, veuillez nous contacter." |
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
# CLI
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

## Site web

Les pages de documentation et la page d'accueil se trouvent dans le répertoire `site/`.

- Développement : `npm run site:dev`
- Construction : `npm run site:build`
- Aperçu : `npm run site:preview`

## Licence

MIT.

---

Construit par <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>.
