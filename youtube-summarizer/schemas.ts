import { z } from "zod";

import { s2hk } from "./utils.js";

export const ChapterSchema = z.object({
  title: z.string().transform((value) => s2hk(value)),
  description: z.string().transform((value) => s2hk(value)),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
});

export const SummarySchema = z.object({
  overview: z.string().transform((value) => s2hk(value)),
  chapters: z.array(ChapterSchema).min(1),
});

export type Chapter = z.output<typeof ChapterSchema>;
export type Summary = z.output<typeof SummarySchema>;

export function parseSummaryJson(raw: string): Summary {
  const parsed = JSON.parse(raw) as unknown;
  return SummarySchema.parse(parsed);
}

export function parseSummary(input: unknown): Summary {
  return SummarySchema.parse(input);
}
