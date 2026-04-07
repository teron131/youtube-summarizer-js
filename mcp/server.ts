import { config as loadDotEnv } from "dotenv";
import { FastMCP } from "fastmcp";

import { registerFastMcpTools } from "./tools.js";

export { healthTool, scrapeTool, summarizeTool } from "./core.js";

loadDotEnv();

export function createMcpServer(): FastMCP {
    const server = new FastMCP({
        name: "YouTube Summarizer MCP",
        version: "0.1.0",
    });
    registerFastMcpTools(server);
    return server;
}

async function main(): Promise<void> {
    const server = createMcpServer();
    await server.start({
        transportType: "stdio",
    });
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error("MCP server failed:", error);
        process.exit(1);
    });
}
