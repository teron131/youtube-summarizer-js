import { getSettings } from "../settings.js";

export interface TranscriptSegment {
  text?: string | null;
  startMs?: number | null;
  endMs?: number | null;
  startTimeText?: string | null;
}

export interface YouTubeScrapperResult {
  success?: boolean | null;
  credits_remaining?: number | null;
  type?: string | null;
  transcript?: TranscriptSegment[] | null;
  transcript_only_text?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  url?: string | null;
  id?: string | null;
  viewCountInt?: number | null;
  likeCountInt?: number | null;
  publishDate?: string | null;
  publishDateText?: string | null;
  channel?: {
    id?: string | null;
    url?: string | null;
    handle?: string | null;
    title?: string | null;
  } | null;
  durationFormatted?: string | null;
  keywords?: string[] | null;
  videoId?: string | null;
  captionTracks?: Array<Record<string, unknown>> | null;
  language?: string | null;
  availableLangs?: string[] | null;
}

export async function fetch_scrape_creators(
  video_url: string,
): Promise<YouTubeScrapperResult | null> {
  const settings = getSettings();
  if (!settings.scrapecreatorsApiKey) {
    return null;
  }

  const query = new URLSearchParams({ url: video_url });
  try {
    const response = await fetch(`${settings.scrapecreatorsTranscriptUrl}?${query.toString()}`, {
      method: "GET",
      headers: {
        "x-api-key": settings.scrapecreatorsApiKey,
      },
      signal: AbortSignal.timeout(settings.scrapeTimeoutSeconds * 1000),
    });

    if (response.status === 401 || response.status === 403 || !response.ok) {
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    return data as YouTubeScrapperResult;
  } catch {
    return null;
  }
}
