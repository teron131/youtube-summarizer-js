import { getSettings, hasAnyTranscriptProvider } from "../settings.js";
import { cleanText, cleanYoutubeUrl, isYoutubeUrl } from "../utils.js";
import {
    fetch_scrape_creators,
    type TranscriptSegment,
    type YouTubeScrapperResult,
} from "./scrapeCreators.js";
import { fetch_supadata } from "./supadata.js";

function hasSegmentTranscript(segments: TranscriptSegment[]): boolean {
    return segments.some((segment) =>
        Boolean(segment.text && segment.text.trim()),
    );
}

function hasTranscript(result: YouTubeScrapperResult | null): boolean {
    if (!result) {
        return false;
    }
    if (result.transcript && hasSegmentTranscript(result.transcript)) {
        return true;
    }
    return Boolean(
        result.transcript_only_text && result.transcript_only_text.trim(),
    );
}

function parseTranscript(result: YouTubeScrapperResult): string | null {
    if (result.transcript) {
        const fromSegments = result.transcript
            .map((segment) => segment.text ?? "")
            .filter((text) => text.trim().length > 0)
            .join(" ");
        if (fromSegments.trim()) {
            return cleanText(fromSegments);
        }
    }

    if (result.transcript_only_text && result.transcript_only_text.trim()) {
        return cleanText(result.transcript_only_text);
    }

    return null;
}

export function hasTranscriptProviderKey(): boolean {
    return hasAnyTranscriptProvider(getSettings());
}

export async function scrapeYoutube(
    youtubeUrl: string,
): Promise<YouTubeScrapperResult> {
    if (!isYoutubeUrl(youtubeUrl)) {
        throw new Error("Invalid YouTube URL");
    }

    const normalizedUrl = cleanYoutubeUrl(youtubeUrl);

    const scrapeCreatorsResult = await fetch_scrape_creators(normalizedUrl);
    if (hasTranscript(scrapeCreatorsResult)) {
        return scrapeCreatorsResult as YouTubeScrapperResult;
    }

    const supadataResult = await fetch_supadata(normalizedUrl);
    if (hasTranscript(supadataResult)) {
        return supadataResult as YouTubeScrapperResult;
    }

    if (!hasTranscriptProviderKey()) {
        throw new Error("No API keys found for Scrape Creators or Supadata");
    }

    throw new Error("Failed to fetch transcript from available providers");
}

export async function extractTranscriptText(
    youtubeUrl: string,
): Promise<string> {
    const result = await scrapeYoutube(youtubeUrl);
    const transcript = parseTranscript(result);
    if (!transcript) {
        throw new Error("Transcript is empty");
    }
    return transcript;
}
