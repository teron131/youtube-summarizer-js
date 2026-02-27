# Tests Module Codemap

## Scope

`tests/` contains focused Vitest coverage for config resolution, provider selection, URL utilities, scraper behavior, and MCP tool contracts.

## What Module Is For

- `tests/`: Validates core behavioral invariants without broad end-to-end orchestration.

## High-signal Locations

- [`settings.test.ts`](/Users/teron/Projects/youtube-summarizer-js/tests/settings.test.ts): env parsing and runtime env precedence.
- [`providerResolver.test.ts`](/Users/teron/Projects/youtube-summarizer-js/tests/providerResolver.test.ts): provider choice order.
- [`scraper.test.ts`](/Users/teron/Projects/youtube-summarizer-js/tests/scraper.test.ts): transcript provider key and transcript extraction behavior.
- [`utils.test.ts`](/Users/teron/Projects/youtube-summarizer-js/tests/utils.test.ts): URL normalization and language conversion.
- [`mcpTools.test.ts`](/Users/teron/Projects/youtube-summarizer-js/tests/mcpTools.test.ts): health and URL validation behavior at tool layer.

## Repository Snapshot

- Files: 5 TypeScript files
- TS/JS import edges: 7 (2 relative + vitest imports)
- TS/JS explicit exports: 0 (test-only modules)

## Symbol Inventory

- Test groups:
  - `describe("settings", ...)`
  - `describe("provider resolver", ...)`
  - `describe("scraper", ...)`
  - `describe("utils", ...)`
  - `describe("mcp tools", ...)`
- Shared patterns:
  - explicit env cleanup in `afterEach`
  - `resetSettingsCache()` after env mutations
  - mocked `fetch` for scraper tests

## Syntax Relationships

- Imports from:
  - `youtube-summarizer/settings.ts`
  - `youtube-summarizer/providerResolver.ts`
  - `youtube-summarizer/scraper/scraper.ts`
  - `youtube-summarizer/utils.ts`
  - `mcp/server.ts` re-exported tools
- External boundary:
  - `vitest` as test framework

## Key Takeaways Per Location

- Settings tests enforce runtime env override behavior (`setRuntimeEnv` over `process.env`).
- Provider resolver tests lock in Gemini-first precedence.
- Scraper tests assert explicit failure on missing transcript provider keys.
- MCP tests assert health envelope and URL validation error path.

## Project-specific Conventions and Rationale

- Keep tests focused on invariants and public behavior, not implementation details.
- Always reset settings cache when changing env values in tests.
