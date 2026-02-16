import type { FastMCP } from "fastmcp";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  TOOL_DESCRIPTIONS,
  healthTool,
  scrapeTool,
  summarizeTool,
  toToolTextResult,
} from "./core.js";

export function registerFastMcpTools(server: FastMCP): void {
  server.addTool({
    name: "health",
    description: TOOL_DESCRIPTIONS.health,
    execute: async () => {
      return toToolTextResult(await healthTool());
    },
  });

  server.addTool({
    name: "scrape",
    description: TOOL_DESCRIPTIONS.scrape,
    parameters: z.object({
      url: z.string(),
    }),
    execute: async ({ url }) => {
      return toToolTextResult(await scrapeTool(url));
    },
  });

  server.addTool({
    name: "summarize",
    description: TOOL_DESCRIPTIONS.summarize,
    parameters: z.object({
      url: z.string(),
    }),
    execute: async ({ url }) => {
      return toToolTextResult(await summarizeTool(url));
    },
  });
}

export function registerCloudflareMcpTools(server: McpServer): void {
  server.registerTool(
    "health",
    {
      description: TOOL_DESCRIPTIONS.health,
      inputSchema: {},
    },
    async () => {
      return toToolTextResult(await healthTool());
    },
  );

  server.registerTool(
    "scrape",
    {
      description: TOOL_DESCRIPTIONS.scrape,
      inputSchema: {
        url: z.string(),
      },
    },
    async ({ url }) => {
      return toToolTextResult(await scrapeTool(url));
    },
  );

  server.registerTool(
    "summarize",
    {
      description: TOOL_DESCRIPTIONS.summarize,
      inputSchema: {
        url: z.string(),
      },
    },
    async ({ url }) => {
      return toToolTextResult(await summarizeTool(url));
    },
  );
}
