import { afterEach, describe, expect, it } from "vitest";

import { resetSettingsCache } from "../youtube-summarizer/settings.js";
import { resolveProvider } from "../youtube-summarizer/providerResolver.js";

describe("provider resolver", () => {
  afterEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    resetSettingsCache();
  });

  it("prefers gemini when both providers are configured", () => {
    process.env.OPENROUTER_API_KEY = "openrouter-key";
    process.env.GEMINI_API_KEY = "gemini-key";
    resetSettingsCache();
    expect(resolveProvider()).toBe("gemini");
  });

  it("falls back to openrouter when only openrouter exists", () => {
    process.env.OPENROUTER_API_KEY = "openrouter-key";
    resetSettingsCache();
    expect(resolveProvider()).toBe("openrouter");
  });

  it("throws when no provider keys are configured", () => {
    resetSettingsCache();
    expect(() => resolveProvider()).toThrow(
      "Config missing: OPENROUTER_API_KEY or GEMINI_API_KEY",
    );
  });
});
