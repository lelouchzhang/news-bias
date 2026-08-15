import { cache } from "react";
import {
  estimateReadMinutes,
  formatDisplayDate,
  splitParagraphs,
} from "@/lib/article/format";
import type {
  ArticleCard,
  ArticleDetail,
  BiasLabel,
  RelatedArticle,
  SentimentLabel,
} from "@/lib/article/types";
import { createServerDataClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * 首页卡片数据：仅返回已分析文章（analyzed_at 非空），按发布时间倒序，最多 12 篇。
 * 使用 React.cache 保证同一请求内重复调用只查一次库。
 */
export const getHomeArticles = cache(async (): Promise<ArticleCard[]> => {
  const supabase = createServerDataClient();

  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, slug, title, image_url, published_at, sources(name), article_analyses(sentiment_label, bias_label, left_percentage, center_percentage, right_percentage, confidence)",
    )
    .not("analyzed_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(12);

  if (error) {
    throw new Error(`Failed to load home articles: ${error.message}`);
  }

  return (data ?? [])
    .filter((row) => row.article_analyses !== null)
    .map((row) => {
      const analysis = row.article_analyses!;
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        sourceName: row.sources?.name ?? "Unknown source",
        imageUrl: row.image_url,
        publishedAt: formatDisplayDate(row.published_at),
        sentimentLabel: analysis.sentiment_label as SentimentLabel,
        biasLabel: analysis.bias_label as BiasLabel,
        left: Number(analysis.left_percentage),
        center: Number(analysis.center_percentage),
        right: Number(analysis.right_percentage),
        confidence: analysis.confidence,
      };
    });
});

/**
 * 详情页数据：按 slug 查询已分析文章及其完整分析；不存在返回 null。
 */
export const getArticleBySlug = cache(
  async (slug: string): Promise<ArticleDetail | null> => {
    const supabase = createServerDataClient();

    const { data, error } = await supabase
      .from("articles")
      .select(
        "id, slug, title, image_url, published_at, raw_text, sources(name), article_analyses(summary, sentiment_score, sentiment_label, bias_label, left_percentage, center_percentage, right_percentage, confidence, framing_notes, loaded_terms, disclaimer, model, embedding, created_at)",
      )
      .eq("slug", slug)
      .not("analyzed_at", "is", null)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load article "${slug}": ${error.message}`);
    }

    if (!data || !data.article_analyses) {
      return null;
    }

    const analysis = data.article_analyses;
    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      sourceName: data.sources?.name ?? "Unknown source",
      imageUrl: data.image_url,
      publishedAt: formatDisplayDate(data.published_at),
      readMinutes: estimateReadMinutes(data.raw_text),
      paragraphs: splitParagraphs(data.raw_text),
      embedding: analysis.embedding as number[] | null,
      analysis: {
        summary: analysis.summary,
        sentimentScore: analysis.sentiment_score,
        sentimentLabel: analysis.sentiment_label as SentimentLabel,
        biasLabel: analysis.bias_label as BiasLabel,
        left: Number(analysis.left_percentage),
        center: Number(analysis.center_percentage),
        right: Number(analysis.right_percentage),
        confidence: analysis.confidence,
        framingNotes: analysis.framing_notes,
        loadedTerms: analysis.loaded_terms,
        disclaimer: analysis.disclaimer,
        model: analysis.model,
        generatedAt: formatDisplayDate(analysis.created_at),
      },
    };
  },
);

/**
 * 相关文章（AGENTS.md §20）：按余弦相似度返回最多 limit 篇相似文章。
 * 使用服务角色客户端调用 get_related_articles SQL 函数（向量 <=> 运算在 SQL 层）。
 * 仅返回 embedding 非空、已分析且非当前文章的行。
 */
export async function getRelatedArticles(
  articleId: string,
  embedding: number[],
  limit = 5,
): Promise<RelatedArticle[]> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.rpc("get_related_articles", {
    p_article_id: articleId,
    p_embedding: embedding,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to load related articles: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.article_id,
    slug: row.slug,
    title: row.title,
    sourceName: row.source_name,
    imageUrl: row.image_url,
    publishedAt: formatDisplayDate(row.published_at),
    similarity: row.similarity,
  }));
}
