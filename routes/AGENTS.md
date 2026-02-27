# Routes Module Codemap

## Scope

`routes/` currently contains shared HTTP-style error mapping primitives.

## What Module Is For

- `routes/`: Maps unknown failures into normalized application errors with status and type.

## High-signal Locations

- [`errors.ts`](/Users/teron/Projects/youtube-summarizer-js/routes/errors.ts): `AppError` and `asAppError`.

## Repository Snapshot

- Files: 1 TypeScript file
- TS/JS import edges: 0
- TS/JS explicit exports: 0 by script heuristic (module exports classes/functions directly)

## Symbol Inventory

- `AppError`
- `asAppError`

## Syntax Relationships

- No internal imports.
- Intended as shared utility for adapters/handlers that need status-aware error responses.

## Key Takeaways Per Location

- `asAppError` currently categorizes:
  - quota/rate-limit style messages -> `429 quota_exceeded`
  - invalid/bad-request/not-found style messages -> `400 invalid_input`
  - everything else -> `500 processing_failed`

## Project-specific Conventions and Rationale

- Keep classification logic string-based and conservative unless a typed error contract is introduced.
- Keep `AppError` fields (`statusCode`, `errorType`) stable for response compatibility.
