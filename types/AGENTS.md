# Types Module Codemap

## Scope

`types/` stores local declaration extensions for dependencies without bundled TypeScript types.

## What Module Is For

- `types/`: Provides ambient type declarations required by this codebase at compile time.

## High-signal Locations

- [`opencc-js.d.ts`](/Users/teron/Projects/youtube-summarizer-js/types/opencc-js.d.ts): declaration shim for `opencc-js`.

## Repository Snapshot

- Files: 1 TypeScript declaration file
- TS/JS import edges: 0
- TS/JS explicit exports: 2 (declaration-level)

## Symbol Inventory

- Ambient declarations for OpenCC converter API used by [`youtube-summarizer/utils.ts`](/Users/teron/Projects/youtube-summarizer-js/youtube-summarizer/utils.ts).

## Syntax Relationships

- Compile-time relationship:
  - `types/opencc-js.d.ts -> youtube-summarizer/utils.ts` usage of `OpenCC.Converter(...)`.

## Key Takeaways Per Location

- This folder is type-surface only; no runtime behavior.

## Project-specific Conventions and Rationale

- Keep external declaration shims minimal and aligned with actual usage in code.
- Prefer adding declarations here over weakening type safety at call sites.
