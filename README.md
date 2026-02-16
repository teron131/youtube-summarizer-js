# YouTube Summarizer MCP (JavaScript)

TypeScript MCP server for YouTube transcript scraping and summarization.

## Runtime

- Node.js 20+
- pnpm
- FastMCP
- LangChain
- Google Gemini / OpenRouter

## Project Layout

- `mcpServer.ts`: MCP server entrypoint
- `mcpServer.ts`: MCP tool registrations and implementations
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

## Validate

```bash
pnpm typecheck
pnpm test
pnpm build
```

## MCP Tools

- `health`
- `scrape(url)`
- `summarize(url)`
