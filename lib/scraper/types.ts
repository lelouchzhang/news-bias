/**
 * 抓取流水线共享类型（AGENTS.md 搂9 / 搂16）。
 * 所有统计字段均为流水线摘要对象的组成部分。
 */

export interface SourceRow {
  id: string;
  name: string;
  listingUrl: string;
  parserStrategy: string | null;
}

export interface ScrapeOptions {
  /** 限定抓取的新闻源 id；缺省为全部活跃源 */
  sourceIds?: string[];
  /** 每源最多保存的有效文章数；缺省 DEFAULT_LIMIT_PER_SOURCE */
  limitPerSource?: number;
}

export interface SourceError {
  sourceName: string;
  error: string;
}

export type RejectionReason =
  | "no_url"
  | "non_article_url"
  | "rejected_candidate"
  | "duplicate"
  | "no_title"
  | "generic_title"
  | "no_date"
  | "no_image"
  | "no_body"
  | "invalid_slug"
  | "insert_error";

export interface ScrapeRunSummary {
  status: "success" | "partial" | "failed";
  sourcesChecked: number;
  candidatesFound: number;
  candidatesRejected: number;
  duplicatesSkipped: number;
  detailsScraped: number;
  articlesInserted: number;
  articlesRejected: number;
  articlesFailed: number;
  totalDurationMs: number;
  rejectionsByReason: Record<string, number>;
  sourceErrors: SourceError[];
}

/** 解析出的文章详情（保存前需通过 validateArticle）。 */
export interface ParsedArticle {
  sourceId: string;
  sourceName: string;
  originalUrl: string;
  canonicalUrl: string;
  title: string;
  imageUrl: string;
  publishedAt: string;
  rawText: string;
}
