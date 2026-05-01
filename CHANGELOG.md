# Changelog

## v1.0.0 — 2026-05-01

Initial release. Static-binary stdio↔streamable-HTTP MCP proxy for
Apple Silicon Mac.

- `pirical-mcp-proxy <URL>` reads newline-delimited JSON from stdin,
  POSTs to `<URL>`, decodes single-JSON or SSE responses to stdout.
- Tracks `Mcp-Session-Id` across requests.
- Zero npm runtime dependencies.
- `--help`, `--version`.
