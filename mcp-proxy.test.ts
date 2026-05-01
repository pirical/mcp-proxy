import { describe, expect, test } from "bun:test";
import { spawn } from "bun";
import type { Server } from "bun";

interface Capture {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}

function startFixtureServer(handler: (req: Request, captures: Capture[]) => Response | Promise<Response>): { server: Server; url: string; captures: Capture[] } {
  const captures: Capture[] = [];
  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const body = await req.text();
      const headers: Record<string, string> = {};
      req.headers.forEach((v, k) => { headers[k] = v; });
      captures.push({ method: req.method, url: req.url, headers, body });
      return handler(req, captures);
    },
  });
  return { server, url: `http://localhost:${server.port}/mcp`, captures };
}

const proxyPath = `${import.meta.dir}/mcp-proxy.ts`;

describe("argv handling", () => {
  test("prints usage to stderr and exits 2 when no URL is given", async () => {
    const proc = spawn(["bun", proxyPath], { stderr: "pipe", stdout: "pipe" });
    const code = await proc.exited;
    const stderr = await new Response(proc.stderr).text();
    expect(code).toBe(2);
    expect(stderr).toContain("usage:");
    expect(stderr).toContain("pirical-mcp-proxy <URL>");
  });

  test("prints version to stdout and exits 0 with --version", async () => {
    const proc = spawn(["bun", proxyPath, "--version"], { stderr: "pipe", stdout: "pipe" });
    const code = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    expect(code).toBe(0);
    expect(stdout).toMatch(/^pirical-mcp-proxy \d+\.\d+\.\d+/);
  });

  test("prints help to stdout and exits 0 with --help", async () => {
    const proc = spawn(["bun", proxyPath, "--help"], { stderr: "pipe", stdout: "pipe" });
    const code = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    expect(code).toBe(0);
    expect(stdout).toContain("pirical-mcp-proxy");
    expect(stdout).toContain("usage:");
  });
});

describe("transport: SSE response", () => {
  test("decodes server-sent-event data lines and writes each as a stdout line", async () => {
    const sseBody = [
      "event: message",
      `data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: { partial: 1 } })}`,
      "",
      "event: message",
      `data: ${JSON.stringify({ jsonrpc: "2.0", id: 1, result: { partial: 2 } })}`,
      "",
    ].join("\n") + "\n";

    const { server, url } = startFixtureServer(() =>
      new Response(sseBody, { headers: { "Content-Type": "text/event-stream" } }),
    );

    try {
      const proc = spawn(["bun", proxyPath, url], { stdin: "pipe", stdout: "pipe", stderr: "pipe" });
      const enc = new TextEncoder();
      proc.stdin.write(enc.encode(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" })}\n`));
      proc.stdin.end();

      const code = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(code).toBe(0);
      const lines = stdout.trim().split("\n");
      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0]!)).toEqual({ jsonrpc: "2.0", id: 1, result: { partial: 1 } });
      expect(JSON.parse(lines[1]!)).toEqual({ jsonrpc: "2.0", id: 1, result: { partial: 2 } });
    } finally {
      server.stop(true);
    }
  });
});

describe("transport: single-JSON response", () => {
  test("POSTs each stdin line as JSON; writes server's JSON response to stdout", async () => {
    const { server, url, captures } = startFixtureServer(() =>
      new Response(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { ok: true } }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    try {
      const proc = spawn(["bun", proxyPath, url], { stdin: "pipe", stdout: "pipe", stderr: "pipe" });
      const enc = new TextEncoder();
      proc.stdin.write(enc.encode(`${JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" })}\n`));
      proc.stdin.end();

      const code = await proc.exited;
      const stdout = await new Response(proc.stdout).text();

      expect(code).toBe(0);
      expect(stdout.trim()).toBe(JSON.stringify({ jsonrpc: "2.0", id: 1, result: { ok: true } }));

      expect(captures).toHaveLength(1);
      expect(captures[0]!.method).toBe("POST");
      expect(captures[0]!.headers["content-type"]).toBe("application/json");
      expect(captures[0]!.headers["accept"]).toContain("application/json");
      expect(captures[0]!.headers["accept"]).toContain("text/event-stream");
      expect(JSON.parse(captures[0]!.body)).toEqual({ jsonrpc: "2.0", id: 1, method: "ping" });
    } finally {
      server.stop(true);
    }
  });
});
