import { Agent, fetch } from "undici";

import { getSettings } from "../settings.js";
import { extractVideoId } from "../utils.js";
import type {
  TranscriptSegment,
  YouTubeScrapperResult,
} from "./scrapeCreators.js";

const HTTP_AGENT = new Agent({ connect: { timeout: 30_000 } });

export async function fetch_supadata(
  video_url: string,
): Promise<YouTubeScrapperResult | null> {
  const settings = getSettings();
  if (!settings.supadataApiKey) {
    return null;
  }

  const query = new URLSearchParams({
    url: video_url,
    lang: "en",
    text: "true",
    mode: "auto",
  });

  try {
    const response = await fetch(
      `${settings.supadataTranscriptUrl}?${query.toString()}`,
      {
        method: "GET",
        headers: {
          "x-api-key": settings.supadataApiKey,
        },
        dispatcher: HTTP_AGENT,
        signal: AbortSignal.timeout(settings.scrapeTimeoutSeconds * 1000),
      },
    );

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 202 ||
      !response.ok
    ) {
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const content = data.content;
    let transcript_only_text: string | null = null;
    let transcript: TranscriptSegment[] | null = null;

    if (typeof content === "string") {
      transcript_only_text = content;
    } else if (Array.isArray(content)) {
      transcript = content
        .filter(
          (item): item is Record<string, unknown> =>
            typeof item === "object" && item !== null,
        )
        .map((item) => {
          const offset = typeof item.offset === "number" ? item.offset : 0;
          const duration =
            typeof item.duration === "number" ? item.duration : 0;
          return {
            text: typeof item.text === "string" ? item.text : null,
            startMs: offset,
            endMs: offset + duration,
            startTimeText: null,
          };
        });
    }

    return {
      url: video_url,
      transcript,
      transcript_only_text,
      videoId: extractVideoId(video_url),
      language: typeof data.lang === "string" ? data.lang : null,
      availableLangs: Array.isArray(data.availableLangs)
        ? data.availableLangs.filter(
            (lang): lang is string => typeof lang === "string",
          )
        : null,
      success: true,
      type: "video",
    };
  } catch {
    return null;
  }
}
