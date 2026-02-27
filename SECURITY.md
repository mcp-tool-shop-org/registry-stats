# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a Vulnerability

Email: **64996768+mcp-tool-shop@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Version affected
- Potential impact

### Response timeline

| Action | Target |
|--------|--------|
| Acknowledge report | 48 hours |
| Assess severity | 7 days |
| Release fix | 30 days |

## Scope

registry-stats is a **multi-registry download statistics library and CLI** using native `fetch()`.

- **Data touched:** Public download statistics from npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub registries. In-memory cache (optional, TTL-based)
- **Data NOT touched:** No telemetry. No analytics. No credential storage. No user data. No file writes beyond stdout
- **Permissions:** Read: public registry APIs via HTTPS. Write: stdout/stderr only. Optional REST server on user-specified port
- **Network:** HTTPS outbound to public registry APIs (registry.npmjs.org, pypi.org, api.nuget.org, marketplace.visualstudio.com, hub.docker.com). Optional localhost HTTP server
- **Telemetry:** None collected or sent
