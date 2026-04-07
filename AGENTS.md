# AGENTS

## Project Summary

TypeScript MCP server that exposes `health`, `scrape`, and `summarize` tools for YouTube content. The server runs in two runtimes:

- Node stdio (`mcp/server.ts`) for local MCP clients
- Cloudflare Worker (`mcp/worker.ts`) with optional Google OAuth

The core business logic is centralized in [`mcp/core.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/core.ts), while transcript and LLM logic live in [`youtube-summarizer/`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer).

## Structure and Entrypoints

- [`start.sh`](/Users/teron/Projects/youtube-summarizer-js/start.sh): repo start entrypoint, runs `pnpm dev`.
- [`package.json`](/Users/teron/Projects/youtube-summarizer-js/package.json): scripts for `dev`, `dev:worker`, `build`, `typecheck`, `test`, `deploy:worker`.
- [`mcp/server.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/server.ts): Node FastMCP server bootstrap.
- [`mcp/worker.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/worker.ts): Worker MCP + OAuth provider bootstrap.
- [`mcp/core.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/core.ts): tool implementations and response envelope.
- [`youtube-summarizer/index.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/index.ts): top-level exports for reusable library surface.

Module guides:

- [`mcp/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/mcp/AGENTS.md)
- [`youtube-summarizer/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/AGENTS.md)
- [`youtube-summarizer/scraper/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/scraper/AGENTS.md)
- [`routes/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/routes/AGENTS.md)
- [`tests/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/tests/AGENTS.md)
- [`scripts/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/scripts/AGENTS.md)
- [`types/AGENTS.md`](/Users/teron/Projects/youtube-summarizer-js/types/AGENTS.md)

## Core Flows and Rationale

1. MCP request flow:

- Runtime adapter (`mcp/server.ts` or `mcp/worker.ts`) registers tools via [`mcp/tools.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/tools.ts).
- Tool handlers call shared implementations in [`mcp/core.ts`](/Users/teron/Projects/youtube-summarizer-js/mcp/core.ts).
- `summarizeTool` resolves provider via [`providerResolver.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/providerResolver.ts):
  - Prefer Gemini when Gemini keys exist.
  - Else use OpenRouter.

2. Summarization paths:

- Gemini path: [`summarizerGemini.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/summarizerGemini.ts) sends video URL directly to Gemini and parses JSON into [`SummarySchema`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/schemas.ts).
- OpenRouter path: scrape transcript first (`scraper/scraper.ts`), then summarize transcript via [`summarizerOpenRouter.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/summarizerOpenRouter.ts).

3. Transcript path:

- [`scraper/scraper.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/scraper/scraper.ts) tries ScrapeCreators first, then Supadata fallback.
- Empty/invalid transcript is rejected at parse stage, not silently accepted.

4. Config model:

- [`settings.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/settings.ts) is the single settings authority.
- `runtimeEnv` overrides `process.env` for Worker requests.
- Settings are cached and require `resetSettingsCache()` when env changes during tests.

## Always-on Rules

- Keep tool business logic in `mcp/core.ts`; adapters in `mcp/tools.ts`.
- Preserve provider precedence (`gemini` before `openrouter`) unless explicitly changing behavior.
- Do not bypass schema validation in `schemas.ts` for summary outputs.
- Keep URL normalization and YouTube validation in `utils.ts` + `core.ts` validation path.
- For runtime changes, keep both Node (`dotenv` + process env) and Worker (`setRuntimeEnv`) paths working.
- Keep `start.sh` aligned with current local run command.

## Repository Snapshot

- Files: 38 tracked by `rg` in this module scope
- Directories: 9 active source/test/support directories
- File types: 25 `ts`, 5 `json`, 3 `sh`, 3 `png`, 1 `md`, 1 `example`
- TS/JS explicit exports: 17
- TS/JS import edges: 43 (25 relative)
- Entrypoint-like files: 2 (`mcp/server.ts`, `mcp/worker.ts`)
