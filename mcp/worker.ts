import { OAuthProvider } from "@cloudflare/workers-oauth-provider";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { setRuntimeEnv } from "../youtube-summarizer/settings.js";
import { googleOAuthDefaultHandler } from "./auth-handler.js";
import { registerCloudflareMcpTools } from "./tools.js";

const MCP_ROUTE = "/";

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
    const entries = Object.entries(env).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
    );
    return Object.fromEntries(entries);
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
            const handler = createMcpHandler(server, { route: MCP_ROUTE });
            return await handler(request, env, ctx);
        } finally {
            setRuntimeEnv(null);
        }
    },
};

export default new OAuthProvider({
    apiRoute: MCP_ROUTE,
    apiHandler,
    authorizeEndpoint: "/authorize",
    tokenEndpoint: "/token",
    clientRegistrationEndpoint: "/register",
    // Keep tokens stable for clients and avoid refresh-token renewal cycles.
    accessTokenTTL: 60 * 60 * 24 * 30,
    refreshTokenTTL: 0,
    defaultHandler: googleOAuthDefaultHandler,
});
