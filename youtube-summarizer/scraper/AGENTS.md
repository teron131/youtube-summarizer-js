# Scraper Submodule Codemap

## Scope

`youtube-summarizer/scraper/` handles transcript retrieval, fallback logic, and transcript normalization into plain text.

## What Module Is For

- `youtube-summarizer/scraper/`: Fetches transcripts from external providers and returns usable transcript text for summarization.

## High-signal Locations

- [`scraper.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/scraper/scraper.ts): provider fallback flow and transcript extraction.
- [`scrapeCreators.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/scraper/scrapeCreators.ts): ScrapeCreators API integration and response typing.
- [`supadata.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/scraper/supadata.ts): Supadata API integration and transcript shape adaptation.
- [`index.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/scraper/index.ts): re-export surface.

## Repository Snapshot

- Files: 4 TypeScript files
- TS/JS explicit exports: 2
- TS/JS import edges: 6 (all relative)
- Entrypoint-like files: 1 (re-export index)

## Symbol Inventory

- Exports:
  - `fetch_scrape_creators`
  - `fetch_supadata`
  - `scrapeYoutube`
  - `extractTranscriptText`
  - `hasTranscriptProviderKey`
  - `TranscriptSegment`
  - `YouTubeScrapperResult`
- Internal parsing helpers:
  - `hasSegmentTranscript`
  - `hasTranscript`
  - `parseTranscript`

## Syntax Relationships

- Dependencies:
  - `scraper.ts -> ../settings.ts`
  - `scraper.ts -> ../utils.ts`
  - `scraper.ts -> scrapeCreators.ts`
  - `scraper.ts -> supadata.ts`
  - `supadata.ts -> ../utils.ts` (`extractVideoId`)
- Call chain from MCP:
  - `mcp/core.ts -> extractTranscriptText() -> scrapeYoutube() -> fetch_scrape_creators()/fetch_supadata()`
- External boundaries:
  - ScrapeCreators transcript endpoint via `x-api-key`
  - Supadata transcript endpoint via `x-api-key`

## Key Takeaways Per Location

- `scraper.ts`: fallback order is fixed (ScrapeCreators first, Supadata second).
- `scraper.ts`: if neither provider yields transcript and keys are missing, throws explicit missing-key error.
- `scrapeCreators.ts` and `supadata.ts`: network/provider errors collapse to `null`, letting orchestrator decide fallback.
- `supadata.ts`: normalizes both string and segment-array transcript payloads.

## Project-specific Conventions and Rationale

- Keep network failure handling provider-local (`null` return) and decision logic centralized in `scraper.ts`.
- Preserve YouTube URL validation/normalization before external calls.
- Do not return empty transcript strings; fail fast with explicit error.
