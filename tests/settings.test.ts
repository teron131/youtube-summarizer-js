import { afterEach, describe, expect, it } from "vitest";

import {
    getSettings,
    hasAnyLlm,
    hasAnyTranscriptProvider,
    hasGemini,
    hasOpenRouter,
    hasScrapeCreators,
    hasSupadata,
    resetSettingsCache,
    setRuntimeEnv,
} from "../youtube-summarizer/settings.js";

describe("settings", () => {
    afterEach(() => {
        delete process.env.OPENROUTER_API_KEY;
        delete process.env.GEMINI_API_KEY;
        delete process.env.GOOGLE_API_KEY;
        delete process.env.SCRAPECREATORS_API_KEY;
        delete process.env.SUPADATA_API_KEY;
        setRuntimeEnv(null);
        resetSettingsCache();
    });

    it("derives capability flags from env keys", () => {
        process.env.OPENROUTER_API_KEY = "test-openrouter";
        process.env.GEMINI_API_KEY = "";
        process.env.GOOGLE_API_KEY = "google-key";
        process.env.SCRAPECREATORS_API_KEY = "scrape-key";
        process.env.SUPADATA_API_KEY = "";
        resetSettingsCache();

        const settings = getSettings();
        expect(hasOpenRouter(settings)).toBe(true);
        expect(hasGemini(settings)).toBe(true);
        expect(hasScrapeCreators(settings)).toBe(true);
        expect(hasSupadata(settings)).toBe(false);
        expect(hasAnyLlm(settings)).toBe(true);
        expect(hasAnyTranscriptProvider(settings)).toBe(true);
    });

    it("prefers injected runtime env over process env", () => {
        process.env.OPENROUTER_API_KEY = "";
        setRuntimeEnv({
            OPENROUTER_API_KEY: "runtime-openrouter",
        });

        const settings = getSettings();
        expect(settings.openrouterApiKey).toBe("runtime-openrouter");
        expect(hasOpenRouter(settings)).toBe(true);
    });
});
