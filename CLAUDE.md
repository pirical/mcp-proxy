---
name: mcp-proxy
description: Static-binary stdio↔streamable-HTTP MCP proxy for Apple Silicon Mac. Lets a local stdio MCP client (Claude Code, Cowork) reach streamable-HTTP MCP servers — in particular ones hosted inside Pirical's VPN. Distributed as a Bun-compiled Mach-O via GH Releases. Consumed by Pirical MCP plugins (e.g. plp-analytics-mcp) at packaging time.
---

# pirical/mcp-proxy

A Pirical-original implementation of the stdio↔streamable-HTTP MCP transport
bridge pattern. Built so Pirical Cowork plugins can ship a self-contained
binary, with no `uv`, Python, or other runtime prerequisites on the user's
Mac.

The primary use case is reaching **streamable-HTTP MCP servers hosted inside
Pirical's VPN** from a local stdio MCP client (Claude Code, Cowork, etc.).
The proxy runs on the user's Mac, so the outbound HTTPS request to the
VPN-internal URL goes through whatever VPN the user already has active —
the proxy itself is transport-agnostic and does not handle VPN setup.

This is **not** a fork of `sparfenyuk/mcp-proxy` (Python),
`tidewave-ai/mcp_proxy_rust` (Rust), or `punkpeye/mcp-proxy` (TypeScript).
It is an independent implementation written for Pirical's static-binary
distribution needs.

## Source

- `mcp-proxy.ts` — single-file transport. ~250 LOC. Zero npm runtime deps.
- `mcp-proxy.test.ts` — `bun:test` against a fixture HTTP server.

## Local development

```bash
bun install --frozen-lockfile
bun test
bun run build              # produces dist/pirical-mcp-proxy (arm64-darwin)
```

The compiled binary only runs on Apple Silicon Mac. On Linux, `bun test`
exercises the source directly via Bun's runtime.

## Releasing

Bump `package.json`'s `version`, update `CHANGELOG.md`, merge to `main`,
then dispatch `release.yml` from the Actions tab with the version in the
`confirm_version` input. The workflow builds the binary on `macos-14`,
attests build provenance, and creates a GH Release with the binary,
`.sha256` sidecar, and the inline release notes.

## Consumers

`pirical/plp-analytics-mcp` consumes a pinned tag via its
`scripts/build-plugin.sh`. Other Pirical MCP plugins can adopt the same
pattern — pin a tag in a repo-root `.pirical-mcp-proxy-version` file
alongside a `.sha256` companion, fetch and verify in the plugin's build
script.
