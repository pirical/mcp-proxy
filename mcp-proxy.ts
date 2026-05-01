#!/usr/bin/env bun
/**
 * pirical-mcp-proxy: stdio↔streamable-HTTP MCP transport.
 *
 * Reads newline-delimited JSON from stdin, POSTs each message to the URL
 * passed as argv[2], decodes single-JSON or SSE responses from the server,
 * and writes each response message as a newline-delimited JSON line to
 * stdout. Logs to stderr only. Tracks Mcp-Session-Id across requests.
 */

import packageJson from "./package.json" with { type: "json" };

const VERSION = packageJson.version;
const NAME = "pirical-mcp-proxy";

const USAGE = `\
${NAME} ${VERSION}

usage:
  ${NAME} <URL>

Reads newline-delimited JSON from stdin, POSTs each message to <URL> over
streamable-HTTP, writes responses to stdout. Exits cleanly on stdin EOF.

flags:
  --version    print version and exit
  --help       print this help and exit
`;

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.includes("--version")) {
    process.stdout.write(`${NAME} ${VERSION}\n`);
    return 0;
  }
  if (args.includes("--help")) {
    process.stdout.write(USAGE);
    return 0;
  }

  const url = args[0];
  if (!url) {
    process.stderr.write(USAGE);
    return 2;
  }

  // Transport loop will go here in subsequent tasks.
  return 0;
}

const exitCode = await main();
process.exit(exitCode);
