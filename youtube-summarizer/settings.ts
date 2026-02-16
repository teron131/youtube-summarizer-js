import { config as loadDotEnv } from "dotenv";

loadDotEnv();

export type TargetLanguage = "auto" | "en" | "zh";
export type OpenRouterReasoningEffort = "minimal" | "low" | "medium" | "high";
export type McpAuthMode = "none" | "google_oauth";

export interface AppSettings {
  apiTitle: string;
  defaultTargetLanguage: TargetLanguage;
  scrapeTimeoutSeconds: number;
  llmTimeoutSeconds: number;
  taskTimeoutSeconds: number;
  scrapecreatorsTranscriptUrl: string;
  supadataTranscriptUrl: string;
  openrouterSummaryModel: string;
  openrouterReasoningEffort: OpenRouterReasoningEffort;
  geminiSummaryModel: string;
  geminiThinkingLevel: string;
  mcpAuthMode: McpAuthMode;
  mcpServerBaseUrl: string | null;
  mcpGoogleClientId: string | null;
  mcpGoogleClientSecret: string | null;
  mcpGoogleRequiredScopes: string;
  openrouterApiKey: string | null;
  geminiApiKey: string | null;
  googleApiKey: string | null;
  scrapecreatorsApiKey: string | null;
  supadataApiKey: string | null;
}

const DEFAULTS = {
  apiTitle: "YouTube Summarizer MCP",
  defaultTargetLanguage: "auto" as TargetLanguage,
  scrapeTimeoutSeconds: 60,
  llmTimeoutSeconds: 120,
  taskTimeoutSeconds: 300,
  scrapecreatorsTranscriptUrl:
    "https://api.scrapecreators.com/v1/youtube/video/transcript",
  supadataTranscriptUrl: "https://api.supadata.ai/v1/transcript",
  openrouterSummaryModel: "x-ai/grok-4.1-fast",
  openrouterReasoningEffort: "medium" as OpenRouterReasoningEffort,
  geminiSummaryModel: "gemini-3-flash-preview",
  geminiThinkingLevel: "medium",
  mcpAuthMode: "none" as McpAuthMode,
  mcpGoogleRequiredScopes: "openid",
} as const;

function asOptional(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
}

function asTargetLanguage(value: string | undefined): TargetLanguage {
  if (value === "auto" || value === "en" || value === "zh") {
    return value;
  }
  return DEFAULTS.defaultTargetLanguage;
}

function asReasoningEffort(
  value: string | undefined,
): OpenRouterReasoningEffort {
  if (
    value === "minimal" ||
    value === "low" ||
    value === "medium" ||
    value === "high"
  ) {
    return value;
  }
  return DEFAULTS.openrouterReasoningEffort;
}

function asMcpAuthMode(value: string | undefined): McpAuthMode {
  if (value === "none" || value === "google_oauth") {
    return value;
  }
  return DEFAULTS.mcpAuthMode;
}

let cachedSettings: AppSettings | null = null;

export function getSettings(): AppSettings {
  if (cachedSettings) {
    return cachedSettings;
  }

  cachedSettings = {
    apiTitle: process.env.API_TITLE ?? DEFAULTS.apiTitle,
    defaultTargetLanguage: asTargetLanguage(
      process.env.DEFAULT_TARGET_LANGUAGE,
    ),
    scrapeTimeoutSeconds: asNumber(
      process.env.SCRAPE_TIMEOUT_SECONDS,
      DEFAULTS.scrapeTimeoutSeconds,
    ),
    llmTimeoutSeconds: asNumber(
      process.env.LLM_TIMEOUT_SECONDS,
      DEFAULTS.llmTimeoutSeconds,
    ),
    taskTimeoutSeconds: asNumber(
      process.env.TASK_TIMEOUT_SECONDS,
      DEFAULTS.taskTimeoutSeconds,
    ),
    scrapecreatorsTranscriptUrl:
      process.env.SCRAPECREATORS_TRANSCRIPT_URL ??
      DEFAULTS.scrapecreatorsTranscriptUrl,
    supadataTranscriptUrl:
      process.env.SUPADATA_TRANSCRIPT_URL ?? DEFAULTS.supadataTranscriptUrl,
    openrouterSummaryModel:
      process.env.OPENROUTER_SUMMARY_MODEL ?? DEFAULTS.openrouterSummaryModel,
    openrouterReasoningEffort: asReasoningEffort(
      process.env.OPENROUTER_REASONING_EFFORT,
    ),
    geminiSummaryModel:
      process.env.GEMINI_SUMMARY_MODEL ?? DEFAULTS.geminiSummaryModel,
    geminiThinkingLevel:
      process.env.GEMINI_THINKING_LEVEL ?? DEFAULTS.geminiThinkingLevel,
    mcpAuthMode: asMcpAuthMode(process.env.MCP_AUTH_MODE),
    mcpServerBaseUrl: asOptional(process.env.MCP_SERVER_BASE_URL),
    mcpGoogleClientId: asOptional(process.env.MCP_GOOGLE_CLIENT_ID),
    mcpGoogleClientSecret: asOptional(process.env.MCP_GOOGLE_CLIENT_SECRET),
    mcpGoogleRequiredScopes:
      process.env.MCP_GOOGLE_REQUIRED_SCOPES ??
      DEFAULTS.mcpGoogleRequiredScopes,
    openrouterApiKey: asOptional(process.env.OPENROUTER_API_KEY),
    geminiApiKey: asOptional(process.env.GEMINI_API_KEY),
    googleApiKey: asOptional(process.env.GOOGLE_API_KEY),
    scrapecreatorsApiKey: asOptional(process.env.SCRAPECREATORS_API_KEY),
    supadataApiKey: asOptional(process.env.SUPADATA_API_KEY),
  };

  return cachedSettings;
}

export function resetSettingsCache(): void {
  cachedSettings = null;
}

export function hasOpenRouter(settings: AppSettings = getSettings()): boolean {
  return Boolean(settings.openrouterApiKey);
}

export function hasGemini(settings: AppSettings = getSettings()): boolean {
  return Boolean(settings.geminiApiKey || settings.googleApiKey);
}

export function hasScrapeCreators(
  settings: AppSettings = getSettings(),
): boolean {
  return Boolean(settings.scrapecreatorsApiKey);
}

export function hasSupadata(settings: AppSettings = getSettings()): boolean {
  return Boolean(settings.supadataApiKey);
}

export function hasAnyLlm(settings: AppSettings = getSettings()): boolean {
  return hasOpenRouter(settings) || hasGemini(settings);
}

export function hasAnyTranscriptProvider(
  settings: AppSettings = getSettings(),
): boolean {
  return hasScrapeCreators(settings) || hasSupadata(settings);
}

export function llmTimeoutMilliseconds(
  settings: AppSettings = getSettings(),
): number {
  return settings.llmTimeoutSeconds * 1000;
}

export function mcpGoogleScopes(
  settings: AppSettings = getSettings(),
): string[] {
  return settings.mcpGoogleRequiredScopes
    .split(" ")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
}

export function toPublicConfig(
  settings: AppSettings = getSettings(),
): Record<string, string | number | boolean> {
  return {
    api_title: settings.apiTitle,
    default_target_language: settings.defaultTargetLanguage,
    scrape_timeout_seconds: settings.scrapeTimeoutSeconds,
    llm_timeout_seconds: settings.llmTimeoutSeconds,
    task_timeout_seconds: settings.taskTimeoutSeconds,
    scrapecreators_transcript_url: settings.scrapecreatorsTranscriptUrl,
    supadata_transcript_url: settings.supadataTranscriptUrl,
    openrouter_summary_model: settings.openrouterSummaryModel,
    openrouter_reasoning_effort: settings.openrouterReasoningEffort,
    gemini_summary_model: settings.geminiSummaryModel,
    gemini_thinking_level: settings.geminiThinkingLevel.toLowerCase(),
    mcp_auth_mode: settings.mcpAuthMode,
    mcp_server_base_url_set: Boolean(settings.mcpServerBaseUrl),
    openrouter_configured: hasOpenRouter(settings),
    gemini_configured: hasGemini(settings),
    scrapecreators_configured: hasScrapeCreators(settings),
    supadata_configured: hasSupadata(settings),
    mcp_auth_enabled: settings.mcpAuthMode !== "none",
  };
}
