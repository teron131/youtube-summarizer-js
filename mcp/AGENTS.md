# MCP Module Codemap

## Scope

`mcp/` hosts runtime adapters and MCP tool registration for Node stdio and Cloudflare Worker environments.

## What Module Is For

- `mcp/`: Defines transport/runtime wiring, OAuth entrypoints, and adapter registration around shared tool logic.

## High-signal Locations

- [`core.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/core.ts): canonical `healthTool`, `scrapeTool`, `summarizeTool`.
- [`tools.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/tools.ts): registers identical tool contracts on FastMCP and Cloudflare MCP SDK.
- [`server.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/server.ts): Node stdio bootstrap.
- [`worker.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/worker.ts): Worker bootstrap with OAuth provider wrapper and env injection.
- [`auth-handler.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/auth-handler.ts): Google OAuth auth-code flow and callback completion.

## Repository Snapshot

- Files: 5 TypeScript files
- TS/JS import edges: 15 (7 relative)
- TS/JS explicit exports: 4
- Entrypoint-like files: 0 inside this folder (entrypoint role is by deployment wiring)

## Symbol Inventory

- Tool-facing exports:
  - `TOOL_DESCRIPTIONS`
  - `toToolTextResult`
  - `healthTool`
  - `scrapeTool`
  - `summarizeTool`
  - `registerFastMcpTools`
  - `registerCloudflareMcpTools`
  - `createMcpServer`
  - `googleOAuthDefaultHandler`
- Internal invariants:
  - `validateUrl` enforces YouTube URL + normalization before any scrape/summarize.
  - `buildSummarySuccessResult` standardizes success envelope shape.
  - OAuth state is short-lived (`AUTH_STATE_TTL_SECONDS = 600`) and stored in `OAUTH_KV`.

## Syntax Relationships

- Imports from summarizer domain:
  - `mcp/core.ts -> youtube-summarizer/settings.ts`
  - `mcp/core.ts -> youtube-summarizer/providerResolver.ts`
  - `mcp/core.ts -> youtube-summarizer/scraper/scraper.ts`
  - `mcp/core.ts -> youtube-summarizer/summarizerGemini.ts`
  - `mcp/core.ts -> youtube-summarizer/summarizerOpenRouter.ts`
- Runtime adapters:
  - `mcp/server.ts -> mcp/tools.ts`
  - `mcp/worker.ts -> mcp/tools.ts`
  - `mcp/worker.ts -> mcp/auth-handler.ts`
- External boundaries:
  - `fastmcp` for Node MCP
  - `@modelcontextprotocol/sdk` + `agents/mcp` for Worker MCP
  - `@cloudflare/workers-oauth-provider` for OAuth flow

## Key Takeaways Per Location

- `core.ts`: all tool behavior changes should happen here first to keep both runtimes aligned.
- `tools.ts`: adapter layer should remain thin and schema-only.
- `worker.ts`: wraps MCP handler in `setRuntimeEnv(...)` lifecycle; always reset in `finally`.
- `auth-handler.ts`: implements callback exchange with Google token endpoint and issues provider completion redirect.

## Project-specific Conventions and Rationale

- Keep tool descriptions and response envelope stable; clients depend on JSON text payload shape.
- Avoid duplicating logic between Node and Worker; register from shared `core.ts`.
- Preserve OAuth health endpoint behavior (`/health`) for deployment diagnostics.
