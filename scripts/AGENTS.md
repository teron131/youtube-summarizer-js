# Scripts Module Codemap

## Scope

`scripts/` contains operational shell helpers and parity sample payload keys.

## What Module Is For

- `scripts/`: Deployment and secret-sync automation for Cloudflare Worker + Google OAuth wiring.

## High-signal Locations

- [`sync_worker_secrets.sh`](/Users/teron/Projects/youtube-summarizer-js/scripts/sync_worker_secrets.sh): pushes model and OAuth secrets to Worker.
- [`sync_google_oauth_from_gcloud.sh`](/Users/teron/Projects/youtube-summarizer-js/scripts/sync_google_oauth_from_gcloud.sh): copies OAuth credentials from Cloud Run + Secret Manager to Worker.
- [`parity-samples/`](/Users/teron/Projects/youtube-summarizer-js/scripts/parity-samples): expected-key snapshots for payload parity checks.

## Repository Snapshot

- Files: 5 (`2 sh`, `3 json`)
- TS/JS/Python AST symbols: none (shell/json only)

## Symbol Inventory

- Shell entrypoints:
  - `resolve_secret`
  - `sync_secret`
- Environment knobs:
  - `WORKER_NAME`, `ENV_FILE`
  - `PROJECT_ID`, `REGION`, `SERVICE_NAME`
  - `GOOGLE_CLIENT_ID_ENV_KEY`, `GOOGLE_CLIENT_SECRET_NAME`

## Syntax Relationships

- `sync_worker_secrets.sh` may call `sync_google_oauth_from_gcloud.sh` as fallback when OAuth creds are absent locally.
- External boundaries:
  - `npx wrangler secret put`
  - `gcloud run services describe`
  - `gcloud secrets versions access`

## Key Takeaways Per Location

- Worker secret sync tries local env first, then gcloud fallback for OAuth credentials.
- OAuth sync script expects Cloud Run env var + Secret Manager secret to exist and be readable.

## Project-specific Conventions and Rationale

- Keep secret writes idempotent and explicit per key.
- Preserve fallback behavior to avoid half-configured OAuth deployments.
