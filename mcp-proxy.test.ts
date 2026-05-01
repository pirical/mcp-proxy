import { describe, expect, test } from "bun:test";
import { spawn } from "bun";

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
