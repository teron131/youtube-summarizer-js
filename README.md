# YouTube Summarizer MCP (JavaScript)

TypeScript MCP server for YouTube transcript scraping and summarization.

## Runtime

- Node.js 20+
- pnpm
- FastMCP
- Cloudflare Workers
- LangChain
- Google Gemini / OpenRouter

## Project Layout

- `mcp/server.ts`: Node stdio MCP entrypoint
- `mcp/core.ts`: shared MCP tool business logic
- `mcp/tools.ts`: runtime adapters for Node FastMCP and Cloudflare MCP
- `mcp/worker.ts`: OAuth-enabled Cloudflare Worker entrypoint
- `mcp/auth-handler.ts`: Google OAuth authorization-code flow handler
- `youtube-summarizer/*`: core modules
- `tests/*`: test suite

## Setup

```bash
pnpm install
```

## Run

```bash
pnpm dev
```

### Run Worker locally

```bash
pnpm dev:worker
```

## Validate

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Deploy Worker

```bash
pnpm deploy:worker
```

## MCP Tools

- `health`
- `scrape(url)`
- `summarize(url)`
