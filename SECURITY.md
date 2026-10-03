# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x     | Yes       |
| 2.x     | No        |
| 1.x     | No        |

## Reporting a Vulnerability

The reporting channel is a private GitHub security advisory:

https://github.com/mcp-tool-shop-org/registry-stats/security/advisories/new

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

registry-stats is a **multi-registry download statistics library and CLI** using native `fetch()`, plus a web dashboard and a Windows desktop app.

- **Data touched:** Public download statistics from npm, PyPI, NuGet, the VS Code Marketplace, Docker Hub, and GitHub Releases. Optional in-memory TTL cache. `registry-stats --init` writes `registry-stats.config.json` in the working directory. The desktop app writes `config\packages.json` and cached `data\stats.json` under `%LOCALAPPDATA%\RegistryPulse`.
- **Credentials:** The tool does not write a token. `registry-stats.config.json` can hold a `dockerToken` if you add one; the CLI reads it and sends `Authorization: Bearer` to Docker Hub. `--init` does not put a token in that file. A caller-supplied `githubToken` (`StatsOptions`) is sent as `Authorization: Bearer` to `api.github.com` and is not written to disk. The dashboard can keep a GitHub PAT in `sessionStorage` and send it to `api.github.com`.
- **Data NOT touched:** No telemetry. No analytics. No user accounts.
- **Permissions:** Read: public registry APIs via HTTPS, plus the authenticated calls above when a token is supplied. Write: stdout/stderr, `registry-stats.config.json` on `--init`, and (desktop app) files under `%LOCALAPPDATA%\RegistryPulse`. Optional REST server on a user-specified port.
- **Network:** HTTPS outbound to `api.npmjs.org`, `registry.npmjs.org` (`--mine`), `pypistats.org`, `azuresearch-usnc.nuget.org`, `marketplace.visualstudio.com`, `hub.docker.com`, and `api.github.com` (GitHub Releases). Desktop refresh also downloads `https://mcp-tool-shop-org.github.io/registry-stats/data/stats.json`. Optional localhost HTTP server.
- **Telemetry:** None collected or sent
