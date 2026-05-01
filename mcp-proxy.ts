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

async function* readStdinLines(): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of (process.stdin as unknown as AsyncIterable<Uint8Array>)) {
    buffer += decoder.decode(chunk, { stream: true });
    let newlineIdx = buffer.indexOf("\n");
    while (newlineIdx !== -1) {
      const line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.length > 0) yield line;
      newlineIdx = buffer.indexOf("\n");
    }
  }

  buffer += decoder.decode();
  if (buffer.length > 0) yield buffer;
}

async function* parseSseEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<{ event: string; data: string }> {
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "message";
  let data = "";

  for await (const chunk of body as unknown as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    let newlineIdx = buffer.indexOf("\n");
    while (newlineIdx !== -1) {
      const line = buffer.slice(0, newlineIdx).replace(/\r$/, "");
      buffer = buffer.slice(newlineIdx + 1);

      if (line === "") {
        if (data.length > 0) yield { event, data };
        event = "message";
        data = "";
      } else if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data = data.length > 0 ? `${data}\n${line.slice(5).trim()}` : line.slice(5).trim();
      }
      newlineIdx = buffer.indexOf("\n");
    }
  }
  buffer += decoder.decode();
  if (data.length > 0) yield { event, data };
}

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

  const session: { id?: string } = {};

  for await (const line of readStdinLines()) {
    let message: unknown;
    try {
      message = JSON.parse(line);
    } catch {
      process.stderr.write(`mcp-proxy: skipping malformed JSON on stdin\n`);
      continue;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    };
    if (session.id) headers["Mcp-Session-Id"] = session.id;

    let response: Response;
    try {
      response = await fetch(url, { method: "POST", headers, body: JSON.stringify(message) });
    } catch (err) {
      process.stderr.write(`mcp-proxy: fetch failed: ${(err as Error).message}\n`);
      continue;
    }

    const newSessionId = response.headers.get("Mcp-Session-Id");
    if (newSessionId) session.id = newSessionId;

    if (!response.ok) {
      process.stderr.write(`mcp-proxy: HTTP ${response.status} ${response.statusText}\n`);
      continue;
    }

    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.startsWith("text/event-stream")) {
      if (!response.body) continue;
      for await (const evt of parseSseEvents(response.body)) {
        process.stdout.write(evt.data + "\n");
      }
      continue;
    }

    const body = await response.text();
    process.stdout.write(body.trimEnd() + "\n");
  }

  return 0;
}

const exitCode = await main();
process.exit(exitCode);
