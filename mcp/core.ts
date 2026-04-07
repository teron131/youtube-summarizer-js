import { resolveProvider } from "../youtube-summarizer/providerResolver.js";
import {
    extractTranscriptText,
    hasTranscriptProviderKey,
} from "../youtube-summarizer/scraper/scraper.js";
import {
    getSettings,
    hasGemini,
    hasOpenRouter,
    hasScrapeCreators,
    hasSupadata,
} from "../youtube-summarizer/settings.js";
import { summarizerGemini } from "../youtube-summarizer/summarizerGemini.js";
import { summarizerOpenRouter } from "../youtube-summarizer/summarizerOpenRouter.js";
import {
    cleanYoutubeUrl,
    isYoutubeUrl,
    processingTime,
} from "../youtube-summarizer/utils.js";

export const TOOL_DESCRIPTIONS = {
    health: "Return MCP server health and provider key availability.",
    scrape: "Fetch normalized transcript text from a YouTube URL.",
    summarize:
        "Generate summary from a YouTube URL using internal provider fallback.",
} as const;

export type ToolResult = Record<string, unknown>;

function validateUrl(url: string): string {
    const normalized = url.trim();
    if (!normalized) {
        throw new Error("URL required");
    }
    if (!isYoutubeUrl(normalized)) {
        throw new Error("Invalid YouTube URL");
    }
    return cleanYoutubeUrl(normalized);
}

function buildMetadata(
    startTime: Date,
    extraMetadata?: Record<string, number>,
): Record<string, string | number> {
    return { processing_time: processingTime(startTime), ...extraMetadata };
}

function buildSummarySuccessResult(
    provider: "openrouter" | "gemini",
    summary: unknown,
    targetLanguage: string,
    metadata: Record<string, string | number>,
): ToolResult {
    return {
        status: "success",
        message: `Summary completed successfully via ${provider}`,
        summary,
        metadata,
        iteration_count: 1,
        target_language: targetLanguage,
    };
}

export function toToolTextResult(payload: ToolResult): {
    content: { type: "text"; text: string }[];
} {
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify(payload),
            },
        ],
    };
}

export async function healthTool(): Promise<ToolResult> {
    const settings = getSettings();
    return {
        status: "healthy",
        message: `${settings.apiTitle} MCP server is running`,
        timestamp: new Date().toISOString(),
        environment: {
            gemini_configured: hasGemini(settings),
            openrouter_configured: hasOpenRouter(settings),
            scrapecreators_configured: hasScrapeCreators(settings),
            supadata_configured: hasSupadata(settings),
        },
    };
}

export async function scrapeTool(url: string): Promise<ToolResult> {
    const start = new Date();
    const normalizedUrl = validateUrl(url);
    if (!hasTranscriptProviderKey()) {
        throw new Error(
            "Config missing: SCRAPECREATORS_API_KEY or SUPADATA_API_KEY",
        );
    }
    const transcript = await extractTranscriptText(normalizedUrl);
    return {
        status: "success",
        message: "Video scraped successfully",
        url: normalizedUrl,
        transcript,
        metadata: buildMetadata(start),
    };
}

export async function summarizeTool(url: string): Promise<ToolResult> {
    const start = new Date();
    const normalizedUrl = validateUrl(url);
    const resolvedTargetLanguage = getSettings().defaultTargetLanguage;
    const provider = resolveProvider();

    if (provider === "gemini") {
        const { summary, metadata } = await summarizerGemini(
            normalizedUrl,
            resolvedTargetLanguage,
        );
        if (!summary) {
            throw new Error("Gemini summarization returned no content");
        }
        return buildSummarySuccessResult(
            provider,
            summary,
            resolvedTargetLanguage,
            buildMetadata(start, metadata ?? undefined),
        );
    }

    const transcript = await extractTranscriptText(normalizedUrl);
    const summary = await summarizerOpenRouter(
        transcript,
        resolvedTargetLanguage,
    );
    return buildSummarySuccessResult(
        provider,
        summary,
        resolvedTargetLanguage,
        buildMetadata(start),
    );
}
