#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-east1}"
SERVICE_NAME="${SERVICE_NAME:-youtube-summarizer-mcp}"
WORKER_NAME="${WORKER_NAME:-youtube-summarizer-mcp}"
GOOGLE_CLIENT_ID_ENV_KEY="${GOOGLE_CLIENT_ID_ENV_KEY:-MCP_GOOGLE_CLIENT_ID}"
GOOGLE_CLIENT_SECRET_NAME="${GOOGLE_CLIENT_SECRET_NAME:-MCP_GOOGLE_CLIENT_SECRET}"

if [[ -z "${PROJECT_ID}" ]]; then
  echo "Unable to resolve PROJECT_ID. Set PROJECT_ID or run 'gcloud config set project <id>'."
  exit 1
fi

echo "Reading Google OAuth config from Cloud Run service '${SERVICE_NAME}' in ${PROJECT_ID}/${REGION}..."

SERVICE_JSON="$(
  gcloud run services describe "${SERVICE_NAME}" \
    --project "${PROJECT_ID}" \
    --region "${REGION}" \
    --format=json
)"

GOOGLE_CLIENT_ID="$(
  printf "%s" "${SERVICE_JSON}" | GOOGLE_CLIENT_ID_ENV_KEY="${GOOGLE_CLIENT_ID_ENV_KEY}" node -e '
const fs = require("fs");
const service = JSON.parse(fs.readFileSync(0, "utf8"));
const env = service?.spec?.template?.spec?.containers?.[0]?.env ?? [];
const key = process.env.GOOGLE_CLIENT_ID_ENV_KEY;
const item = env.find((entry) => entry?.name === key);
process.stdout.write(item?.value ?? "");
'
)"

if [[ -z "${GOOGLE_CLIENT_ID}" ]]; then
  echo "Missing ${GOOGLE_CLIENT_ID_ENV_KEY} on Cloud Run service '${SERVICE_NAME}'."
  exit 1
fi

echo "Reading secret '${GOOGLE_CLIENT_SECRET_NAME}' from Secret Manager..."
GOOGLE_CLIENT_SECRET="$(
  gcloud secrets versions access latest \
    --project "${PROJECT_ID}" \
    --secret "${GOOGLE_CLIENT_SECRET_NAME}"
)"

if [[ -z "${GOOGLE_CLIENT_SECRET}" ]]; then
  echo "Secret '${GOOGLE_CLIENT_SECRET_NAME}' is empty."
  exit 1
fi

echo "Writing secrets to Cloudflare Worker '${WORKER_NAME}'..."
printf "%s" "${GOOGLE_CLIENT_ID}" | npx wrangler secret put GOOGLE_CLIENT_ID --name "${WORKER_NAME}"
printf "%s" "${GOOGLE_CLIENT_SECRET}" | npx wrangler secret put GOOGLE_CLIENT_SECRET --name "${WORKER_NAME}"

echo
echo "Sync complete."
echo "Ensure Google OAuth redirect URI includes:"
echo "  https://<your-worker-domain>/callback"
echo
echo "Verify:"
echo "  curl -sS https://<your-worker-domain>/health"
