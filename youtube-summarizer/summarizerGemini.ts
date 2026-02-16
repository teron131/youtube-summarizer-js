import { GoogleGenAI, Type } from "@google/genai";

import { getSettings, llmTimeoutMilliseconds } from "./settings.js";
import { getGeminiSummaryPrompt } from "./prompts.js";
import { Summary, parseSummary, parseSummaryJson } from "./schemas.js";

const USD_PER_M_TOKENS_BY_MODEL: Record<
  string,
  { input: number; output: number }
> = {
  "gemini-3-flash-preview": { input: 0.5, output: 3 },
  "gemini-3-pro-preview": { input: 2, output: 12 },
};

function calculateCost(
  model: string,
  promptTokens: number,
  totalTokens: number,
): number {
  const pricing = USD_PER_M_TOKENS_BY_MODEL[model];
  if (!pricing) {
    return 0;
  }
  const outputTokens = Math.max(0, totalTokens - promptTokens);
  return (
    (promptTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

function extractUsageMetadata(
  model: string,
  usageMetadata:
    | { promptTokenCount?: number; totalTokenCount?: number }
    | undefined,
): Record<string, number> | null {
  if (!usageMetadata?.promptTokenCount || !usageMetadata?.totalTokenCount) {
    return null;
  }
  const tokensInput = usageMetadata.promptTokenCount;
  const tokensTotal = usageMetadata.totalTokenCount;
  const tokensOutput = Math.max(0, tokensTotal - tokensInput);
  const cost = calculateCost(model, tokensInput, tokensTotal);
  return {
    tokens_input: tokensInput,
    tokens_output: tokensOutput,
    tokens_total: tokensTotal,
    cost,
  };
}

export async function summarizerGemini(
  videoUrl: string,
  targetLanguage: string = "auto",
): Promise<{
  summary: Summary | null;
  metadata: Record<string, number> | null;
}> {
  const settings = getSettings();
  const apiKey = settings.googleApiKey ?? settings.geminiApiKey;
  if (!apiKey) {
    throw new Error("API key not found. Set GOOGLE_API_KEY or GEMINI_API_KEY");
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: settings.geminiSummaryModel,
      contents: [
        {
          fileData: {
            fileUri: videoUrl,
          },
        },
        {
          text: getGeminiSummaryPrompt(targetLanguage),
        },
      ],
      config: {
        httpOptions: {
          timeout: llmTimeoutMilliseconds(settings),
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overview: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  start_time: { type: Type.STRING, nullable: true },
                  end_time: { type: Type.STRING, nullable: true },
                },
                required: ["title", "description"],
              },
            },
          },
          required: ["overview", "chapters"],
        },
      },
    });

    const text = response.text ?? "";
    if (!text) {
      return { summary: null, metadata: null };
    }

    let summary: Summary;
    try {
      summary = parseSummaryJson(text);
    } catch {
      summary = parseSummary(JSON.parse(text) as unknown);
    }

    return {
      summary,
      metadata: extractUsageMetadata(
        settings.geminiSummaryModel,
        response.usageMetadata,
      ),
    };
  } catch {
    return { summary: null, metadata: null };
  }
}
