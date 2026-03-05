---
title: Registries
description: Supported registries and data available from each.
sidebar:
  order: 6
---

## Supported registries

| Registry | Package format | Time series | Data available |
|----------|---------------|-------------|----------------|
| **npm** | `express`, `@scope/pkg` | Yes (549 days) | lastDay, lastWeek, lastMonth |
| **PyPI** | `requests` | Yes (180 days) | lastDay, lastWeek, lastMonth, total |
| **NuGet** | `Newtonsoft.Json` | No | total |
| **VS Code** | `publisher.extension` | No | total (installs), rating, trends |
| **Docker Hub** | `namespace/repo` | No | total (pulls), stars |

## npm

The npm registry provides the richest data with up to 549 days of daily download history. Package names can be simple (`express`) or scoped (`@scope/pkg`).

Rate limits apply — space out bulk queries or expect 429 responses on large batches.

## PyPI

PyPI provides 180 days of daily download history. Package names are case-insensitive and normalized (hyphens and underscores are equivalent).

## NuGet

NuGet only reports all-time total download counts. No time-series data is available.

## VS Code Marketplace

VS Code extensions use the format `publisher.extension` (e.g., `esbenp.prettier-vscode`). The marketplace reports all-time install totals, rating, and trend indicators. No weekly/monthly breakdowns.

## Docker Hub

Docker Hub images use the format `namespace/repo` (e.g., `library/node`). Reports total pull counts and star counts. GHCR (GitHub Container Registry) doesn't expose public pull counts.

## Adding custom registries

You can register custom providers for registries not built in. See the [Configuration](/registry-stats/handbook/configuration/) page for the `registerProvider` API.
