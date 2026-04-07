import { getSettings, hasGemini, hasOpenRouter } from "./settings.js";

export type ResolvedProvider = "openrouter" | "gemini";

export function resolveProvider(): ResolvedProvider {
    const settings = getSettings();

    if (hasGemini(settings)) {
        return "gemini";
    }

    if (hasOpenRouter(settings)) {
        return "openrouter";
    }

    throw new Error("Config missing: OPENROUTER_API_KEY or GEMINI_API_KEY");
}
