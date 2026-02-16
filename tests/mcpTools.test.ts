import { afterEach, describe, expect, it, vi } from "vitest";

describe("mcp tools", () => {
  afterEach(async () => {
    vi.resetModules();
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.SCRAPECREATORS_API_KEY;
    delete process.env.SUPADATA_API_KEY;
    const { resetSettingsCache } =
      await import("../youtube-summarizer/settings.js");
    resetSettingsCache();
  });

  it("health includes environment flags", async () => {
    process.env.GEMINI_API_KEY = "gemini-key";
    const { resetSettingsCache } =
      await import("../youtube-summarizer/settings.js");
    resetSettingsCache();
    const { healthTool } = await import("../mcpServer.js");

    const result = await healthTool();
    expect(result.status).toBe("healthy");
    expect(result).toHaveProperty("environment");
    expect(
      (result.environment as Record<string, unknown>).gemini_configured,
    ).toBe(true);
  });

  it("scrape validates URL", async () => {
    const { scrapeTool } = await import("../mcpServer.js");
    await expect(scrapeTool("https://example.com/video")).rejects.toThrow(
      "Invalid YouTube URL",
    );
  });
});
