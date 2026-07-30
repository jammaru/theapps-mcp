import { createMcpHandler } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createRuntime, createServer } from "./server.ts";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (command === "configure") {
    const { configure } = await import("./cli/configure.ts");
    await configure(argv.slice(1));
    return;
  }

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(`Apps-mcp

Usage:
  apps-mcp                 Start MCP server on stdio
  apps-mcp configure       Interactive setup for Cursor / Claude
  apps-mcp configure --force
  apps-mcp --http          Stateless HTTP (Bun only, loopback)
  apps-mcp help
`);
    return;
  }

  const runtime = createRuntime();
  const factory = () => createServer(runtime);
  const mode = argv.includes("--http") ? "http" : "stdio";

  if (mode === "http") {
    if (typeof Bun === "undefined") {
      console.error(
        "HTTP mode requires Bun (Bun.serve). For Node / npx, use the default stdio mode.",
      );
      process.exit(1);
    }

    const port = Number(process.env.PORT ?? process.env.APPS_MCP_PORT ?? "8787");
    const host = process.env.APPS_MCP_HOST ?? "127.0.0.1";
    const allowRemote = ["1", "true", "yes", "on"].includes(
      (process.env.APPS_MCP_HTTP_ALLOW_REMOTE ?? "").trim().toLowerCase(),
    );
    const httpBearer = process.env.APPS_MCP_HTTP_BEARER?.trim() ?? "";
    const loopback = host === "127.0.0.1" || host === "localhost" || host === "::1";
    if (!loopback && !allowRemote) {
      console.error(
        `Refusing to bind HTTP on ${host}. Use 127.0.0.1 or set APPS_MCP_HTTP_ALLOW_REMOTE=true (requires APPS_MCP_HTTP_BEARER).`,
      );
      process.exit(1);
    }
    if (!loopback && !httpBearer) {
      console.error(
        "Remote HTTP bind requires APPS_MCP_HTTP_BEARER (shared secret). Refusing unauthenticated remote MCP.",
      );
      process.exit(1);
    }

    const handler = createMcpHandler(factory);
    Bun.serve({
      hostname: host,
      port,
      fetch(req) {
        if (httpBearer) {
          const header = req.headers.get("authorization") ?? "";
          if (header !== `Bearer ${httpBearer}`) {
            return new Response(JSON.stringify({ error: "unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }
        }
        return handler.fetch(req);
      },
    });

    console.error(
      `Apps-mcp listening on http://${host}:${port} — MCP 2026-07-28 stateless HTTP` +
        (httpBearer ? " (bearer auth required)" : " (loopback)"),
    );
    return;
  }

  serveStdio(factory);
  console.error("Apps-mcp running on stdio — production Apps API only");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
