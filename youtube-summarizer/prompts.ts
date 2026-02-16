function buildContextBlock(
  title?: string | null,
  description?: string | null,
): string {
  const parts: string[] = [];
  if (title) {
    parts.push(`Video Title: ${title}`);
  }
  if (description) {
    parts.push(`Video Description: ${description}`);
  }
  if (parts.length === 0) {
    return "";
  }
  return `\n# CONTEXTUAL INFORMATION:\n${parts.join("\n")}\n`;
}

export function getGeminiSummaryPrompt(
  targetLanguage = "auto",
  title?: string | null,
  description?: string | null,
): string {
  const languageDescriptions: Record<string, string> = {
    auto: "Use the same language as the video, or English if the language is unclear",
    en: "English (US)",
    zh: "Traditional Chinese (繁體中文)",
  };

  const normalizedLanguage =
    targetLanguage === "auto" ||
    targetLanguage === "en" ||
    targetLanguage === "zh"
      ? targetLanguage
      : "auto";
  const languageDescription = languageDescriptions[normalizedLanguage];
  const instruction =
    normalizedLanguage === "auto"
      ? languageDescription
      : `Write ALL output in ${languageDescription}. Do not use English or any other language.`;

  const languageInstruction = `- OUTPUT LANGUAGE (REQUIRED): ${instruction}`;
  const metadata = buildContextBlock(title, description);

  return [
    "Create a grounded, chronological summary.",
    metadata,
    languageInstruction,
    "",
    "SOURCE: You are given the full video. Use BOTH spoken content and visuals (on-screen text/slides/charts/code/UI). Do not invent details that are not clearly supported by what you can see/hear.",
    "",
    "Return JSON only (no extra text) with:",
    "- overview: string",
    "- chapters: array of { title: string, description: string, start_time?: string, end_time?: string }",
    "(start_time/end_time are optional MM:SS; omit if unsure)",
    "",
    "Rules:",
    "- Chapters must be chronological and non-overlapping",
    "- Avoid meta-language (no 'this video...' framing)",
    "- Exclude sponsors/promos/calls to action entirely",
  ].join("\n");
}

export function getLangchainSummaryPrompt(
  targetLanguage?: string | null,
  title?: string | null,
  description?: string | null,
): string {
  const metadata = buildContextBlock(title, description);

  const promptParts = [
    "Create a grounded, chronological summary of the transcript.",
    metadata,
    "Rules:",
    "- Ground every claim in the transcript; do not add unsupported details",
    "- Exclude sponsors/ads/promos/calls to action entirely",
    "- Avoid meta-language (no 'this video...', 'the speaker...', etc.)",
    "- Prefer concrete facts, names, numbers, and steps when present",
    "- Ensure output matches the provided response schema",
    "- Return JSON only with overview + chapters",
  ];

  if (targetLanguage) {
    const languageInstruction =
      (
        {
          auto: "Use the same language as the transcript, or English if unclear",
          en: "English (US)",
          zh: "Traditional Chinese (繁體中文). Convert all Chinese text to Traditional Chinese.",
        } as Record<string, string>
      )[targetLanguage] ??
      "Use the same language as the transcript, or English if unclear";
    promptParts.push(`\nOUTPUT LANGUAGE (REQUIRED): ${languageInstruction}`);
  }

  return promptParts.join("\n");
}
