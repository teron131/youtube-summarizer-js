#!/usr/bin/env bash
set -euo pipefail

WORKER_NAME="${WORKER_NAME:-youtube-summarizer-mcp}"
ENV_FILE="${ENV_FILE:-.env}"

read_env_file_value() {
  local key="$1"
  local file_path="$2"

  if [[ ! -f "${file_path}" ]]; then
    return 0
  fi

  local line
  line="$(grep -E "^${key}=" "${file_path}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    return 0
  fi

  local value
  value="${line#*=}"
  value="${value%$'\r'}"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf "%s" "${value}"
}

resolve_value() {
  local key="$1"
  local explicit_value="$2"

  if [[ -n "${explicit_value}" ]]; then
    printf "%s" "${explicit_value}"
    return 0
  fi

  read_env_file_value "${key}" "${ENV_FILE}"
}

sync_secret_if_present() {
  local key="$1"
  local value="$2"
  if [[ -z "${value}" ]]; then
    echo "Skipping ${key} (not set in env)."
    return 0
  fi
  printf "%s" "${value}" | npx wrangler secret put "${key}" --name "${WORKER_NAME}"
}

echo "Syncing Worker secrets for '${WORKER_NAME}'..."

GEMINI_API_KEY_VALUE="$(resolve_value GEMINI_API_KEY "${GEMINI_API_KEY:-}")"
OPENROUTER_API_KEY_VALUE="$(resolve_value OPENROUTER_API_KEY "${OPENROUTER_API_KEY:-}")"
SCRAPECREATORS_API_KEY_VALUE="$(resolve_value SCRAPECREATORS_API_KEY "${SCRAPECREATORS_API_KEY:-}")"
SUPADATA_API_KEY_VALUE="$(resolve_value SUPADATA_API_KEY "${SUPADATA_API_KEY:-}")"
GOOGLE_CLIENT_ID_VALUE="$(resolve_value GOOGLE_CLIENT_ID "${GOOGLE_CLIENT_ID:-}")"
GOOGLE_CLIENT_SECRET_VALUE="$(resolve_value GOOGLE_CLIENT_SECRET "${GOOGLE_CLIENT_SECRET:-}")"
GOOGLE_REDIRECT_URI_VALUE="$(resolve_value GOOGLE_REDIRECT_URI "${GOOGLE_REDIRECT_URI:-}")"
GOOGLE_SCOPE_VALUE="$(resolve_value GOOGLE_SCOPE "${GOOGLE_SCOPE:-}")"

for secret_key in \
  GEMINI_API_KEY \
  OPENROUTER_API_KEY \
  SCRAPECREATORS_API_KEY \
  SUPADATA_API_KEY; do
  value_key="${secret_key}_VALUE"
  sync_secret_if_present "${secret_key}" "${!value_key}"
done

if [[ -n "${GOOGLE_CLIENT_ID_VALUE}" && -n "${GOOGLE_CLIENT_SECRET_VALUE}" ]]; then
  echo "Using GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET from env."
  for secret_key in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET; do
    value_key="${secret_key}_VALUE"
    sync_secret_if_present "${secret_key}" "${!value_key}"
  done
else
  echo "GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET not fully set in env, using gcloud fallback."
  bash scripts/sync_google_oauth_from_gcloud.sh
fi

sync_secret_if_present GOOGLE_REDIRECT_URI "${GOOGLE_REDIRECT_URI_VALUE}"
sync_secret_if_present GOOGLE_SCOPE "${GOOGLE_SCOPE_VALUE}"

echo
echo "Secret sync completed."
