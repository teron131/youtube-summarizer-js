#!/usr/bin/env bash
set -euo pipefail

WORKER_NAME="${WORKER_NAME:-youtube-summarizer-mcp}"
ENV_FILE="${ENV_FILE:-.env}"
MODEL_SECRET_KEYS=(GEMINI_API_KEY OPENROUTER_API_KEY SCRAPECREATORS_API_KEY SUPADATA_API_KEY)

resolve_secret() {
  local key="$1"
  local value="${!key:-}"
  [[ -n "${value}" ]] && printf "%s" "${value}" && return 0
  [[ ! -f "${ENV_FILE}" ]] && return 0
  local line
  line="$(grep -E "^${key}=" "${ENV_FILE}" | tail -n 1 || true)"
  [[ -z "${line}" ]] && return 0
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value%\"}"; value="${value#\"}"; value="${value%\'}"; value="${value#\'}"
  printf "%s" "${value}"
}

sync_secret() {
  local key="$1"
  local value
  value="$(resolve_secret "${key}")"
  if [[ -z "${value}" ]]; then
    echo "Skipping ${key} (not set in env)."
    return 0
  fi
  printf "%s" "${value}" | npx wrangler secret put "${key}" --name "${WORKER_NAME}"
}

echo "Syncing Worker secrets for '${WORKER_NAME}'..."

for secret_key in "${MODEL_SECRET_KEYS[@]}"; do
  sync_secret "${secret_key}"
done

GOOGLE_CLIENT_ID_VALUE="$(resolve_secret GOOGLE_CLIENT_ID)"
GOOGLE_CLIENT_SECRET_VALUE="$(resolve_secret GOOGLE_CLIENT_SECRET)"

if [[ -n "${GOOGLE_CLIENT_ID_VALUE}" && -n "${GOOGLE_CLIENT_SECRET_VALUE}" ]]; then
  echo "Using GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET from env."
  sync_secret GOOGLE_CLIENT_ID
  sync_secret GOOGLE_CLIENT_SECRET
else
  echo "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not fully set in env, using gcloud fallback."
  bash scripts/sync_google_oauth_from_gcloud.sh
fi

sync_secret GOOGLE_REDIRECT_URI
sync_secret GOOGLE_SCOPE

echo
echo "Secret sync completed."
