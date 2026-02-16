import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";

import { accessDefaultHandler } from "./auth-handler.js";
import { registerCloudflareMcpTools } from "./tools.js";
import { setRuntimeEnv } from "../youtube-summarizer/settings.js";

function buildServer(): McpServer {
  const server = new McpServer({
    name: "YouTube Summarizer MCP",
    version: "0.1.0",
  });
  registerCloudflareMcpTools(server);
  return server;
}

function toStringEnv(
  env: Record<string, unknown>,
): Record<string, string | undefined> {
  const runtimeEnv: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") {
      runtimeEnv[key] = value;
    }
  }
  return runtimeEnv;
}

const apiHandler = {
  async fetch(
    request: Request,
    env: Record<string, unknown>,
    ctx: any,
  ): Promise<Response> {
    setRuntimeEnv(toStringEnv(env));
    try {
      const server = buildServer();
      const handler = createMcpHandler(server, { route: "/mcp" });
      return await handler(request, env, ctx);
    } finally {
      setRuntimeEnv(null);
    }
  },
};

export default new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  // Keep tokens stable for clients and avoid refresh-token renewal cycles.
  accessTokenTTL: 60 * 60 * 24 * 30,
  refreshTokenTTL: 0,
  defaultHandler: accessDefaultHandler,
});
