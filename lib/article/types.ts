import type { BiasLabel, SentimentLabel } from "@/lib/supabase/types";

export type { BiasLabel, SentimentLabel };

/** 首页新闻卡片视图模型（§19：标题/源/图片/日期/情感/框架/百分比/置信度）。 */
export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  sourceName: string;
  imageUrl: string;
  publishedAt: string;
  sentimentLabel: SentimentLabel;
  biasLabel: BiasLabel;
  left: number;
  center: number;
  right: number;
  confidence: number;
}

/** 详情页视图模型（§19 完整分析）。 */
export interface ArticleDetail {
  id: string;
  slug: string;
  title: string;
  sourceName: string;
  imageUrl: string;
  publishedAt: string;
  readMinutes: number;
  paragraphs: string[];
  analysis: ArticleAnalysis;
  /** 当前文章的 embedding（可能为 null，无则隐藏相关文章）。 */
  embedding: number[] | null;
}

export interface ArticleAnalysis {
  summary: string;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  biasLabel: BiasLabel;
  left: number;
  center: number;
  right: number;
  confidence: number;
  framingNotes: string;
  loadedTerms: string[];
  disclaimer: string;
  model: string;
  generatedAt: string;
}

/** AI Summary 卡片输入。 */
export interface AiSummaryView {
  summary: string;
  loadedTerms: string[];
  disclaimer: string;
  generatedAt: string;
}

/** 相关文章卡片（AGENTS.md §20，按余弦相似度返回）。 */
export interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  sourceName: string;
  imageUrl: string;
  publishedAt: string;
  similarity: number;
}

/** Bias Analysis 卡片输入。 */
export interface BiasAnalysisView {
  biasLabel: BiasLabel;
  left: number;
  center: number;
  right: number;
  confidence: number;
  framingNotes: string;
  sentimentLabel: SentimentLabel;
  sentimentScore: number;
}

export const biasLabelDisplay: Record<BiasLabel, string> = {
  left: "Left",
  center: "Center",
  right: "Right",
  mixed: "Mixed",
  unclear: "Unclear",
};

export const biasLabelTextClass: Record<BiasLabel, string> = {
  left: "text-left-bias",
  center: "text-text-secondary",
  right: "text-right-bias",
  mixed: "text-text-secondary",
  unclear: "text-text-secondary",
};
