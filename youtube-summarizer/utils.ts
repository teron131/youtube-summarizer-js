import * as OpenCC from "opencc-js";

const YOUTUBE_PATTERNS = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
    /youtube\.com\/v\//,
];

const SIMPLIFIED_TO_HK = OpenCC.Converter({ from: "cn", to: "hk" });

export function cleanText(text: string): string {
    const trimmedNewlines = text.replace(/\n{3,}/g, "\n\n");
    const trimmedSpaces = trimmedNewlines.replace(/ {2,}/g, " ");
    return trimmedSpaces.trim();
}

export function cleanYoutubeUrl(url: string): string {
    if (url.includes("youtube.com/watch")) {
        const match = /v=([a-zA-Z0-9_-]+)/.exec(url);
        if (match) {
            return `https://www.youtube.com/watch?v=${match[1]}`;
        }
    } else if (url.includes("youtu.be/")) {
        const match = /youtu\.be\/([a-zA-Z0-9_-]+)/.exec(url);
        if (match) {
            return `https://www.youtube.com/watch?v=${match[1]}`;
        }
    }
    return url;
}

export function isYoutubeUrl(url: string): boolean {
    return YOUTUBE_PATTERNS.some((pattern) => pattern.test(url));
}

export function extractVideoId(url: string): string | null {
    const watchMatch = /v=([a-zA-Z0-9_-]+)/.exec(url);
    if (watchMatch) {
        return watchMatch[1];
    }

    const shortMatch = /youtu\.be\/([a-zA-Z0-9_-]+)/.exec(url);
    if (shortMatch) {
        return shortMatch[1];
    }

    return null;
}

export function s2hk(content: string): string {
    return SIMPLIFIED_TO_HK(content);
}

export function safeTruncate(text: string, maxLength = 100): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength);
}

export function processingTime(startTime: Date): string {
    const seconds = (Date.now() - startTime.getTime()) / 1000;
    return `${seconds.toFixed(1)}s`;
}
