import { ChatOpenAI } from "@langchain/openai";

import { getSettings, type OpenRouterReasoningEffort } from "./settings.js";

function isOpenRouter(model: string): boolean {
  return model.includes("/") && model.split("/").length === 2;
}

function isGemini(model: string): boolean {
  return model.toLowerCase().startsWith("gemini");
}

function getConfig(
  model: string,
  apiKey?: string | null,
): { apiKey: string | null; baseURL: string } {
  const settings = getSettings();
  if (isOpenRouter(model)) {
    return {
      apiKey: apiKey ?? settings.openrouterApiKey,
      baseURL: "https://openrouter.ai/api/v1",
    };
  }

  return {
    apiKey: apiKey ?? settings.geminiApiKey ?? settings.googleApiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  };
}

interface ChatOpenRouterOptions {
  cachedContent?: string;
  model: string;
  providerSort?: "throughput" | "price" | "latency";
  reasoningEffort?: OpenRouterReasoningEffort;
  temperature?: number;
  timeoutMs?: number;
}

export function ChatOpenRouter({
  cachedContent,
  model,
  providerSort = "throughput",
  reasoningEffort,
  temperature = 0,
  timeoutMs,
}: ChatOpenRouterOptions): ChatOpenAI {
  if (!isOpenRouter(model) && !isGemini(model)) {
    throw new Error(`Invalid model: ${model}`);
  }

  const { apiKey, baseURL } = getConfig(model);
  const modelKwargs: Record<string, unknown> = {};

  if (isOpenRouter(model)) {
    modelKwargs.provider = { sort: providerSort };
    if (reasoningEffort) {
      modelKwargs.reasoning_effort = reasoningEffort;
    }
  } else if (cachedContent) {
    modelKwargs.google = { cached_content: cachedContent };
  }

  return new ChatOpenAI({
    model,
    apiKey: apiKey ?? undefined,
    configuration: {
      baseURL,
    },
    temperature,
    timeout: timeoutMs,
    modelKwargs,
  });
}

export function OpenRouterEmbeddingsModel(
  model = "openai/text-embedding-3-small",
): {
  apiKey: string | null;
  baseURL: string;
  model: string;
} {
  if (!isOpenRouter(model)) {
    throw new Error(
      `Invalid OpenRouter model format: ${model}. Expected PROVIDER/MODEL`,
    );
  }

  const settings = getSettings();
  return {
    apiKey: settings.openrouterApiKey,
    baseURL: "https://openrouter.ai/api/v1",
    model,
  };
}

export { isGemini, isOpenRouter };
