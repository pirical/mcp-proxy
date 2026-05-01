# Security

## Reporting

Email security@pirical.com with a description and reproduction steps.
Do not file public issues for security-relevant defects.

## Threat model

This binary is bundled inside Pirical Cowork plugins and runs on
end-user Macs with the user's privileges. The relevant attack surfaces
and mitigations are documented in
[`docs/superpowers/specs/2026-05-01-pirical-mcp-proxy-design.md`](https://github.com/pirical/plp-analytics-mcp/blob/main/docs/superpowers/specs/2026-05-01-pirical-mcp-proxy-design.md)
in the `plp-analytics-mcp` repo (the spec that drove this design).

## Supply-chain posture

- Zero npm runtime dependencies. Compiled binary contains only Bun's
  stdlib + this repo's source.
- Bun runtime version pinned in `.bun-version`. Bumped only via PR with
  a CHANGELOG entry.
- All third-party GitHub Actions pinned to major-version tags (e.g.
  `actions/checkout@v4`); a follow-up will move them to full commit SHAs.
- Releases ship SHA-256 sums + SLSA build-provenance attestations
  (signed via sigstore using GitHub OIDC).
- Branch protection on `main`: required PR review + passing CI.

## Capability surface at runtime

The compiled binary's only capabilities are:

- Reads stdin, writes stdout/stderr.
- Outbound HTTPS to the URL passed as argv.

It does not write to the filesystem, spawn subprocesses, or accept
inbound network connections.
