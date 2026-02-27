# Summarizer Module Codemap

## Scope

`youtube-summarizer/` contains configuration, provider resolution, prompt/schema definitions, transcript ingestion, and summary generation.

## What Module Is For

- `youtube-summarizer/`: Core domain layer for turning a YouTube URL or transcript into validated structured summaries.

## High-signal Locations

- [`settings.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/settings.ts): single configuration authority + env precedence.
- [`providerResolver.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/providerResolver.ts): provider selection policy.
- [`summarizerGemini.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/summarizerGemini.ts): Gemini video-native summarization with token/cost metadata.
- [`summarizerOpenRouter.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/summarizerOpenRouter.ts): transcript-based summarization via LangChain model wrapper.
- [`llmClients.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/llmClients.ts): model routing and base URL selection.
- [`schemas.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/schemas.ts): zod summary schema + parsing helpers.
- [`prompts.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/prompts.ts): language and formatting constraints.
- [`utils.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/utils.ts): URL cleanup, timing, text cleanup, Simplified->HK Traditional conversion.

## Repository Snapshot

- Files: 13 TypeScript files
- TS/JS explicit exports: 11
- TS/JS import edges: 21 (16 relative)
- Re-export edges: 6
- Entrypoint-like files: 2 (`index.ts` and scraper index)

## Symbol Inventory

- Public surface from [`index.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/index.ts):
  - `SummarySchema`, `Summary`
  - `extractTranscriptText`, `hasTranscriptProviderKey`
  - `getSettings`
  - `summarizerGemini`, `summarizerOpenRouter`
  - `ChatOpenRouter`
  - `cleanYoutubeUrl`, `isYoutubeUrl`
- High-value internals:
  - `resolveProvider()` returns `"gemini"` or `"openrouter"` and throws if neither key exists.
  - `parseSummaryJson()` and `parseSummary()` enforce structured output.
  - `mcpGoogleScopes()` normalizes configured scopes for auth wiring.

## Syntax Relationships

- Internal imports:
  - `summarizerGemini.ts -> settings.ts, prompts.ts, schemas.ts`
  - `summarizerOpenRouter.ts -> settings.ts, llmClients.ts, prompts.ts, schemas.ts`
  - `providerResolver.ts -> settings.ts`
  - `schemas.ts -> utils.ts` (language transform)
- Cross-module dependencies:
  - consumed by `mcp/core.ts`
  - scraper submodule under `youtube-summarizer/scraper/` used by both MCP and OpenRouter summarize path
- External boundaries:
  - `@google/genai`, `@langchain/openai`, `@langchain/core/messages`, `opencc-js`, `zod`

## Key Takeaways Per Location

- `settings.ts`: runtime `env` injection is explicit and cache invalidation is mandatory when env changes.
- `providerResolver.ts`: current behavior intentionally prefers Gemini when both providers are configured.
- `summarizerGemini.ts`: catches provider failures and returns `{ summary: null, metadata: null }`; caller must enforce failure semantics.
- `summarizerOpenRouter.ts`: requires non-empty transcript and strict schema output.
- `schemas.ts`: all Chinese output is normalized with `s2hk` transforms at schema boundary.

## Project-specific Conventions and Rationale

- Treat `settings.ts` as the only place for env parsing/defaulting logic.
- Keep prompt and schema changes coordinated so parser expectations match generation requirements.
- Preserve model names unless required by explicit code-reference updates.
