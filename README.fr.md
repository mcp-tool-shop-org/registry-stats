<p align="center">
  <a href="README.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <strong>Français</strong> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português</a>
</p>

<p align="center">
  <img src="assets/logo.png" alt="logo registry-stats" width="280" />
</p>

<h1 align="center">@mcptoolshop/registry-stats</h1>

<p align="center">
  Une commande. Cinq registres. Toutes vos statistiques de téléchargement.
</p>

<p align="center">
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/">Docs</a> &middot;
  <a href="#installation">Installation</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#fichier-de-configuration">Configuration</a> &middot;
  <a href="#api-programmatique">API</a> &middot;
  <a href="#serveur-rest-api">Serveur REST</a> &middot;
  <a href="#licence">Licence</a>
</p>

---

Si vous publiez sur npm, PyPI, NuGet, VS Code Marketplace ou Docker Hub, vous avez actuellement besoin de cinq API différentes pour répondre à « combien de téléchargements ce mois-ci ? » Cette bibliothèque offre une interface unifiée — en CLI ou API programmatique.

Zéro dépendance. Utilise `fetch()` natif. Node 18+.

## Installation

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# Interroger un seul registre
registry-stats express -r npm

# Interroger tous les registres
registry-stats express

# Série temporelle avec ventilation mensuelle + tendance
registry-stats express -r npm --range 2025-01-01:2025-06-30

# Sortie JSON
registry-stats express -r npm --json

# Autres registres
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# Créer un fichier de configuration
registry-stats --init

# Exécuter avec la configuration — récupère tous les paquets suivis
registry-stats

# Comparer entre registres
registry-stats express --compare

# Exporter en CSV ou JSON pour graphiques
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# Démarrer un serveur REST API
registry-stats serve --port 3000
```

## Fichier de Configuration

Créez un `registry-stats.config.json` à la racine de votre projet (ou exécutez `registry-stats --init`) :

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

Exécutez `registry-stats` sans arguments pour obtenir les statistiques de tous les paquets configurés. Le CLI remonte les répertoires depuis le dossier courant pour trouver le fichier de configuration.

## API Programmatique

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Registre unique
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');

// Tous les registres (utilise Promise.allSettled — ne lance jamais d'erreur)
const all = await stats.all('express');

// En masse — plusieurs paquets, concurrence limitée (par défaut : 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Série temporelle (npm + pypi uniquement)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Calculs
calc.total(daily);                         // total des téléchargements
calc.avg(daily);                           // moyenne journalière
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // moyenne mobile sur 7 jours
calc.popularity(daily);                    // score 0-100 échelle logarithmique

// Formats d'exportation
calc.toCSV(daily);                         // chaîne CSV
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [...] }

// Comparaison — même paquet entre registres
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);

// Cache (TTL 5 min, en mémoire)
const cache = createCache();
await stats('npm', 'express', { cache });
```

## Support des Registres

| Registre | Format de paquet | Série temporelle | Données disponibles |
|----------|-----------------|-----------------|---------------------|
| `npm` | `express`, `@scope/pkg` | Oui (549 jours) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Oui (180 jours) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | Non | total |
| `vscode` | `publisher.extension` | Non | total (installations), rating, trends |
| `docker` | `namespace/repo` | Non | total (pulls), stars |

## Fiabilité Intégrée

- Réessai automatique avec recul exponentiel sur erreurs 429/5xx
- Respecte les en-têtes `Retry-After`
- Limitation de concurrence pour les requêtes en masse
- Cache TTL optionnel (extensible — utilisez Redis/fichier via l'interface `StatsCache`)

## Serveur REST API

Exécutez comme microservice ou intégrez dans votre propre serveur :

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # tous les registres
GET /stats/:registry/:package    # registre unique
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Démarrage rapide
serve({ port: 3000 });

// Serveur personnalisé
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Registres Personnalisés

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

## Licence

MIT
