# pirical-mcp-proxy

A static-binary stdio↔streamable-HTTP MCP proxy. Apple Silicon Mac.

A Pirical-original implementation of the
[MCP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports)
bridge pattern. Compiled with [Bun](https://bun.sh) into a single Mach-O
executable so it can be dropped into a Cowork plugin's `bin/` directory
with no `uv`, Python, or other runtime prerequisites on the user's Mac.

This is **not** a fork of:
- [`sparfenyuk/mcp-proxy`](https://github.com/sparfenyuk/mcp-proxy) (Python)
- [`tidewave-ai/mcp_proxy_rust`](https://github.com/tidewave-ai/mcp_proxy_rust) (Rust)
- [`punkpeye/mcp-proxy`](https://github.com/punkpeye/mcp-proxy) (TypeScript)

It is an independent implementation written for Pirical's static-binary
distribution needs.

## What it does

Reads newline-delimited JSON from stdin, POSTs each message to the URL
passed as argv, decodes the server's single-JSON or SSE response, writes
each decoded message as a newline-delimited JSON line to stdout. Tracks
`Mcp-Session-Id` across requests. Logs to stderr only.

## Usage

```sh
pirical-mcp-proxy <URL>
```

In a Cowork plugin's `.mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/pirical-mcp-proxy",
      "args": ["https://my-mcp-server.example.com/mcp"]
    }
  }
}
```

## Consuming a release in another repo

```sh
VERSION=v1.0.0
SHA256=$(curl -fsSL https://github.com/pirical/mcp-proxy/releases/download/${VERSION}/pirical-mcp-proxy-aarch64-apple-darwin.tar.gz.sha256)
curl -fsSL -o /tmp/mcp-proxy.tar.gz \
  https://github.com/pirical/mcp-proxy/releases/download/${VERSION}/pirical-mcp-proxy-aarch64-apple-darwin.tar.gz
echo "$SHA256  /tmp/mcp-proxy.tar.gz" | sha256sum -c -
tar -xzf /tmp/mcp-proxy.tar.gz -C bin/
```

Optionally also verify the SLSA build-provenance attestation:

```sh
gh attestation verify --owner pirical /tmp/mcp-proxy.tar.gz
```

## Development

See `CLAUDE.md`.

## Security

See `SECURITY.md`.
