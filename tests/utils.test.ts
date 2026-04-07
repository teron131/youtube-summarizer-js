import { describe, expect, it } from "vitest";

import {
	cleanYoutubeUrl,
	isYoutubeUrl,
	s2hk,
} from "../youtube-summarizer/utils.js";

describe("utils", () => {
	it("normalizes watch URLs", () => {
		const normalized = cleanYoutubeUrl(
			"https://www.youtube.com/watch?v=abc123&t=30",
		);
		expect(normalized).toBe("https://www.youtube.com/watch?v=abc123");
	});

	it("normalizes short URLs", () => {
		const normalized = cleanYoutubeUrl("https://youtu.be/abc123?si=xyz");
		expect(normalized).toBe("https://www.youtube.com/watch?v=abc123");
	});

	it("validates youtube URLs", () => {
		expect(isYoutubeUrl("https://www.youtube.com/watch?v=abc123")).toBe(true);
		expect(isYoutubeUrl("https://youtu.be/abc123")).toBe(true);
		expect(isYoutubeUrl("https://example.com/video")).toBe(false);
	});

	it("converts simplified chinese to hk traditional", () => {
		expect(s2hk("简体中文")).toBe("簡體中文");
	});
});
