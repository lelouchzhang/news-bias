import "server-only";
import { z } from "zod";

/**
 * AI 分析输出 schema（AGENTS.md §19）。
 * 模型输出 camelCase 字段；保存时映射为 snake_case 列。
 */
export const analysisSchema = z
  .object({
    summary: z
      .string()
      .min(1)
      .describe("A neutral, factual summary of the article."),
    sentimentScore: z
      .number()
      .min(-1)
      .max(1)
      .describe("Sentiment score from -1 (very negative) to 1 (very positive)."),
    sentimentLabel: z
      .enum(["positive", "neutral", "negative"])
      .describe("Sentiment label matching sentimentScore."),
    politicalFramingLabel: z
      .enum(["left", "center", "right", "mixed", "unclear"])
      .describe(
        "Political framing label. Usually the side with the highest percentage; use mixed or unclear per the rules.",
      ),
    leftPercentage: z
      .number()
      .min(0)
      .max(100)
      .describe("Estimated left-leaning framing percentage (0-100)."),
    centerPercentage: z
      .number()
      .min(0)
      .max(100)
      .describe("Estimated centrist framing percentage (0-100)."),
    rightPercentage: z
      .number()
      .min(0)
      .max(100)
      .describe("Estimated right-leaning framing percentage (0-100)."),
    confidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Confidence in this assessment, from 0 to 1."),
    framingNotes: z
      .string()
      .min(1)
      .describe(
        "1-3 sentences explaining the textual evidence behind the percentages.",
      ),
    loadedTerms: z
      .array(z.string())
      .describe(
        "Emotionally charged or biased words/phrases found in the article; empty array if none.",
      ),
    disclaimer: z
      .string()
      .min(1)
      .describe(
        "One sentence noting this is an AI-generated assessment that may contain errors.",
      ),
  })
  .refine(
    (data) =>
      Math.abs(
        data.leftPercentage + data.centerPercentage + data.rightPercentage - 100,
      ) <= 0.01,
    {
      message:
        "leftPercentage, centerPercentage and rightPercentage must sum to 100",
    },
  );
