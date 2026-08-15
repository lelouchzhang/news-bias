import type { BiasLabel, SentimentLabel } from "@/lib/supabase/types";

/** 待分析文章（含分析所需的展示上下文）。 */
export interface PendingArticle {
  id: string;
  title: string;
  sourceName: string;
  publishedAt: string;
  rawText: string;
  /**
   * 已存在 analysis 行的 id（回填场景：行已存在但 embedding 为空）。
   * 为 null/undefined 表示需跑完整分析（无 analysis 行）。
   */
  analysisId?: string | null;
}

/** 已通过 Zod 校验并映射到数据库列的分析结果。 */
export interface AnalysisResult {
  summary: string;
  sentimentScore: number;
  sentimentLabel: SentimentLabel;
  biasLabel: BiasLabel;
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  confidence: number;
  framingNotes: string;
  loadedTerms: string[];
  disclaimer: string;
}

export type AnalysisFailureReason =
  | "analysis_failed"
  | "insert_failed"
  | "analyzed_at_failed"
  | "embedding_failed"
  | "embedding_dimension_mismatch";

/** 分析运行摘要对象（§19 必需行为 9）。 */
export interface AnalysisRunSummary {
  status: "success" | "partial" | "failed";
  articlesChecked: number;
  articlesAnalyzed: number;
  skipped: number;
  failed: number;
  embeddingsGenerated: number;
  backfilled: number;
  failuresByReason: Partial<Record<AnalysisFailureReason, number>>;
  totalDurationMs: number;
  model: string;
  embeddingModel: string;
}
export interface AnalyzeOptions {
  /** 限定分析的文章 id；缺省为全部待分析文章。 */
  articleIds?: string[];
  /** 最多处理的文章数。 */
  limit?: number;
}
