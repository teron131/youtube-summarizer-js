import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

describe("scraper", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
        fetchMock.mockReset();
        // Keep keys explicitly empty so dotenv does not repopulate them from .env.
        process.env.SCRAPECREATORS_API_KEY = "";
        process.env.SUPADATA_API_KEY = "";
    });

    it("throws when transcript provider keys are missing", async () => {
        const { resetSettingsCache } = await import(
            "../youtube-summarizer/settings.js"
        );
        const { scrapeYoutube } = await import(
            "../youtube-summarizer/scraper/scraper.js"
        );
        resetSettingsCache();
        await expect(
            scrapeYoutube("https://www.youtube.com/watch?v=abc123"),
        ).rejects.toThrow("No API keys found for Scrape Creators or Supadata");
    });

    it("uses scrape creators result when transcript is available", async () => {
        process.env.SCRAPECREATORS_API_KEY = "scrape-key";
        const { resetSettingsCache } = await import(
            "../youtube-summarizer/settings.js"
        );
        const { extractTranscriptText } = await import(
            "../youtube-summarizer/scraper/scraper.js"
        );
        resetSettingsCache();

        fetchMock.mockResolvedValueOnce({
            status: 200,
            ok: true,
            json: async () => ({
                transcript: [{ text: "hello" }, { text: "world" }],
            }),
        });

        const transcript = await extractTranscriptText(
            "https://www.youtube.com/watch?v=abc123&t=1",
        );
        expect(transcript).toBe("hello world");
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
