import "server-only";
import { embed, generateText, type EmbeddingModel, type LanguageModel, Output } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  ANALYSIS_MAX_OUTPUT_TOKENS,
  ANALYSIS_RETRY_LIMIT,
  ANALYSIS_TIMEOUT_MS,
  DEFAULT_ANALYSIS_BASE_URL,
  DEFAULT_ANALYSIS_MODEL,
  DEFAULT_BATCH_SIZE,
  DEFAULT_EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MAX_CHARS,
  PROVIDER_NAME,
} from "@/lib/ai/constants";
import { writeLog } from "@/lib/ai/log";
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from "@/lib/ai/prompt";
import { analysisSchema } from "@/lib/ai/schema";
import type {
  AnalysisResult,
  AnalysisRunSummary,
  AnalyzeOptions,
  PendingArticle,
} from "@/lib/ai/types";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ServiceClient = SupabaseClient<Database>;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function getModelName(): string {
  return process.env.ANALYSIS_MODEL_NAME?.trim() || DEFAULT_ANALYSIS_MODEL;
}

function getBatchSize(): number {
  const raw = process.env.ANALYSIS_BATCH_SIZE;
  if (!raw) {
    return DEFAULT_BATCH_SIZE;
  }
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : DEFAULT_BATCH_SIZE;
}

function getEmbeddingModelName(): string {
  return (
    process.env.EMBEDDING_MODEL_NAME?.trim() ||
    DEFAULT_EMBEDDING_MODEL
  );
}

/** 创建千问 AI 平台 OpenAI 兼容语言模型（qwen3.7-plus）。 */
function createAnalysisModel(): LanguageModel {
  const apiKey = requireEnv("ANALYSIS_API_KEY");
  const baseURL =
    process.env.ANALYSIS_BASE_URL?.trim() || DEFAULT_ANALYSIS_BASE_URL;
  const provider = createOpenAICompatible({
    name: PROVIDER_NAME,
    apiKey,
    baseURL,
    supportsStructuredOutputs: true,
  });
  return provider(getModelName());
}

/** 创建千问 AI 平台 OpenAI 兼容 embedding 模型（qwen3.7-text-embedding）。 */
function createEmbeddingModel(): EmbeddingModel {
  const apiKey = requireEnv("EMBEDDING_API_KEY");
  const baseURL =
    process.env.EMBEDDING_BASE_URL?.trim() ||
    process.env.ANALYSIS_BASE_URL?.trim() ||
    DEFAULT_ANALYSIS_BASE_URL;
  const provider = createOpenAICompatible({
    name: PROVIDER_NAME,
    apiKey,
    baseURL,
  });
  return provider.embeddingModel(getEmbeddingModelName());
}

/**
 * 加载待处理文章（§19 必需行为 1 + §20 回填）。
 * 通过 article_analyses 关联行判断：
 *   - 无关联行 → 待分析（需跑完整分析 + embedding）
 *   - 有关联行但 embedding 为空 → 待回填（仅生成 embedding，不重跑分析）
 * 按 AGENTS.md §21，先不加过滤地获取关联数据，再在 JS 中筛选。
 */
async function loadPendingArticles(
  supabase: ServiceClient,
  options: AnalyzeOptions,
): Promise<PendingArticle[]> {
  const { data, error } = await supabase
    .from("articles")
    .select(
      "id, title, raw_text, published_at, sources(name), article_analyses(id, embedding)",
    )
    .order("published_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load articles: ${error.message}`);
  }

  let pending = (data ?? [])
    .filter((row) => {
      const analysis = row.article_analyses;
      // 无 analysis 行 → 待分析；有行但 embedding 为空 → 待回填。
      return analysis === null || analysis.embedding === null;
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      sourceName: row.sources?.name ?? "Unknown source",
      publishedAt: row.published_at,
      rawText: row.raw_text,
      // 已有 analysis 行时携带其 id，用于回填 update；否则为 null。
      analysisId: row.article_analyses?.id ?? null,
    }));

  if (options.articleIds && options.articleIds.length > 0) {
    const requested = new Set(options.articleIds);
    pending = pending.filter((article) => requested.has(article.id));
  }

  if (options.limit !== undefined && options.limit > 0) {
    pending = pending.slice(0, options.limit);
  }

  return pending;
}

function toAnalysisResult(
  output: z.infer<typeof analysisSchema>,
): AnalysisResult {
  return {
    summary: output.summary,
    sentimentScore: output.sentimentScore,
    sentimentLabel: output.sentimentLabel,
    biasLabel: output.politicalFramingLabel,
    leftPercentage: output.leftPercentage,
    centerPercentage: output.centerPercentage,
    rightPercentage: output.rightPercentage,
    confidence: output.confidence,
    framingNotes: output.framingNotes,
    loadedTerms: output.loadedTerms,
    disclaimer: output.disclaimer,
  };
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 四舍五入到 2 位小数并保证三者之和精确等于 100
 * （数据库 check：left + center + right = 100）。
 */
function roundPercentages(
  left: number,
  center: number,
  right: number,
): { left: number; center: number; right: number } {
  const leftRounded = roundTo2(left);
  const centerRounded = roundTo2(center);
  const rightRounded = roundTo2(right);
  const diff = roundTo2(100 - leftRounded - centerRounded - rightRounded);

  // 将舍入残差加到占比最大的数值上，保证三者之和精确等于 100。
  if (leftRounded >= centerRounded && leftRounded >= rightRounded) {
    return {
      left: roundTo2(leftRounded + diff),
      center: centerRounded,
      right: rightRounded,
    };
  }
  if (centerRounded >= rightRounded) {
    return {
      left: leftRounded,
      center: roundTo2(centerRounded + diff),
      right: rightRounded,
    };
  }
  return {
    left: leftRounded,
    center: centerRounded,
    right: roundTo2(rightRounded + diff),
  };
}

/**
 * 分析单篇文章；无效输出重试一次，仍失败则返回失败原因（§19）。
 * 使用 AI SDK v7 的 generateText + Output.object（结构化输出）。
 */
async function analyzeOne(
  article: PendingArticle,
  model: LanguageModel,
): Promise<
  | { ok: true; result: AnalysisResult }
  | { ok: false; error: string }
> {
  let lastError = "";

  for (let attempt = 0; attempt <= ANALYSIS_RETRY_LIMIT; attempt += 1) {
    try {
      const { output } = await generateText({
        model,
        instructions: ANALYSIS_SYSTEM_PROMPT,
        prompt: buildAnalysisPrompt(article),
        output: Output.object({
          name: "article_analysis",
          description:
            "AI assessment of a news article's sentiment and political framing.",
          schema: analysisSchema,
        }),
        temperature: 0.2,
        timeout: ANALYSIS_TIMEOUT_MS,
        maxOutputTokens: ANALYSIS_MAX_OUTPUT_TOKENS,
        providerOptions: {
          [PROVIDER_NAME]: { enable_thinking: false },
        },
      });

      return { ok: true, result: toAnalysisResult(output) };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < ANALYSIS_RETRY_LIMIT) {
        console.warn(
          `[analyze] Retrying article ${article.id} (attempt ${attempt + 1}): ${lastError}`,
        );
      }
    }
  }

  console.error(`[analyze] Analysis failed for article ${article.id}: ${lastError}`);
  return { ok: false, error: lastError };
}

/** 构建 embedding 输入文本（标题 + 正文，截断至 EMBEDDING_MAX_CHARS）。 */
function buildEmbeddingText(article: PendingArticle): string {
  const text = `${article.title}\n\n${article.rawText}`;
  return text.length > EMBEDDING_MAX_CHARS
    ? text.slice(0, EMBEDDING_MAX_CHARS)
    : text;
}

/**
 * 为文章生成 embedding（AGENTS.md §20）。
 * 返回维度精确为 EMBEDDING_DIMENSIONS 的向量；维度不符返回失败。
 */
async function generateEmbedding(
  article: PendingArticle,
  model: EmbeddingModel,
): Promise<
  | { ok: true; embedding: number[] }
  | { ok: false; error: string }
> {
  try {
    const { embedding } = await embed({
      model,
      value: buildEmbeddingText(article),
    });

    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      return {
        ok: false,
        error: `Embedding dimension mismatch: got ${
          Array.isArray(embedding) ? embedding.length : "non-array"
        }, expected ${EMBEDDING_DIMENSIONS}`,
      };
    }

    return { ok: true, embedding };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 插入分析行（不含 embedding；不含 analyzed_at）。
 * 唯一冲突视为已分析（跳过）。
 */
async function storeAnalysis(
  supabase: ServiceClient,
  article: PendingArticle,
  result: AnalysisResult,
  modelName: string,
): Promise<
  | { outcome: "saved"; analysisId: string }
  | { outcome: "skipped" }
  | { outcome: "insert_failed"; error: string }
> {
  const { left, center, right } = roundPercentages(
    result.leftPercentage,
    result.centerPercentage,
    result.rightPercentage,
  );

  const { data, error: insertError } = await supabase
    .from("article_analyses")
    .insert({
      article_id: article.id,
      summary: result.summary,
      sentiment_score: result.sentimentScore,
      sentiment_label: result.sentimentLabel,
      bias_label: result.biasLabel,
      left_percentage: left,
      center_percentage: center,
      right_percentage: right,
      confidence: result.confidence,
      framing_notes: result.framingNotes,
      loaded_terms: result.loadedTerms,
      disclaimer: result.disclaimer,
      model: modelName,
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return { outcome: "skipped" };
    }
    return { outcome: "insert_failed", error: insertError.message };
  }

  return { outcome: "saved", analysisId: data.id };
}

/**
 * 将生成的 embedding 写入 analysis 行。
 * - 新文章：insert 后对 analysisId 执行 update 写入 embedding。
 * - 回填：对已有 analysisId 执行 update 写入 embedding。
 */
async function storeEmbedding(
  supabase: ServiceClient,
  analysisId: string,
  embedding: number[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("article_analyses")
    .update({ embedding })
    .eq("id", analysisId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * 仅在分析与 embedding 都保存成功后设置 analyzed_at（§20）。
 */
async function markAnalyzed(
  supabase: ServiceClient,
  articleId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase
    .from("articles")
    .update({ analyzed_at: new Date().toISOString() })
    .eq("id", articleId);

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

/**
 * AI 分析流水线（AGENTS.md §19 + §20）。
 * 默认处理全部待处理文章（待分析 + 待回填 embedding）；
 * 支持 articleIds / limit；分批处理直至无待处理。
 */
export async function runAnalysisPipeline(
  options: AnalyzeOptions = {},
): Promise<AnalysisRunSummary> {
  const startedAt = Date.now();
  const supabase = createServiceRoleClient();
  const modelName = getModelName();
  const embeddingModelName = getEmbeddingModelName();
  const batchSize = getBatchSize();

  const summary: AnalysisRunSummary = {
    status: "failed",
    articlesChecked: 0,
    articlesAnalyzed: 0,
    skipped: 0,
    failed: 0,
    embeddingsGenerated: 0,
    backfilled: 0,
    failuresByReason: {},
    totalDurationMs: 0,
    model: modelName,
    embeddingModel: embeddingModelName,
  };

  await writeLog(supabase, "info", "Analysis run started", {
    articleIds: options.articleIds ?? "all",
    limit: options.limit ?? "all",
    batchSize,
    model: modelName,
    embeddingModel: embeddingModelName,
  });

  let pending: PendingArticle[];
  try {
    pending = await loadPendingArticles(supabase, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    summary.totalDurationMs = Date.now() - startedAt;
    await writeLog(supabase, "error", "Analysis run failed while loading pending articles", {
      error: message,
    });
    console.error("[analyze] Failed to load pending articles:", message);
    return summary;
  }

  summary.articlesChecked = pending.length;
  console.log(`[analyze] Pending articles: ${pending.length} (batch size: ${batchSize})`);
  await writeLog(supabase, "info", "Pending articles loaded", {
    count: pending.length,
  });

  if (pending.length === 0) {
    summary.status = "success";
    summary.totalDurationMs = Date.now() - startedAt;
    await writeLog(supabase, "info", "Analysis run finished: no pending articles", {
      summary,
    });
    console.log("[analyze] Analysis run summary:", JSON.stringify(summary, null, 2));
    return summary;
  }

  const model = createAnalysisModel();
  const embeddingModel = createEmbeddingModel();
  const batchCount = Math.ceil(pending.length / batchSize);

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const batchIndex = Math.floor(i / batchSize) + 1;
    console.log(
      `[analyze] Processing batch ${batchIndex}/${batchCount} (${batch.length} articles)`,
    );

    for (const article of batch) {
      // 回填路径：已有 analysis 行（analysisId 非空），仅生成 embedding。
      if (article.analysisId) {
        const embedding = await generateEmbedding(article, embeddingModel);
        if (!embedding.ok) {
          summary.failed += 1;
          summary.failuresByReason["embedding_failed"] =
            (summary.failuresByReason["embedding_failed"] ?? 0) + 1;
          console.error(
            `[analyze] Failed to generate embedding for article ${article.id}: ${embedding.error}`,
          );
          continue;
        }

        const stored = await storeEmbedding(
          supabase,
          article.analysisId,
          embedding.embedding,
        );
        if (!stored.ok) {
          summary.failed += 1;
          summary.failuresByReason["embedding_failed"] =
            (summary.failuresByReason["embedding_failed"] ?? 0) + 1;
          console.error(
            `[analyze] Failed to store embedding for article ${article.id}: ${stored.error}`,
          );
          continue;
        }

        // 回填后确保 analyzed_at 已设置（覆盖过去 embedding 失败遗留）。
        const marked = await markAnalyzed(supabase, article.id);
        if (!marked.ok) {
          summary.failed += 1;
          summary.failuresByReason["analyzed_at_failed"] =
            (summary.failuresByReason["analyzed_at_failed"] ?? 0) + 1;
          console.error(
            `[analyze] Failed to set analyzed_at for article ${article.id}: ${marked.error}`,
          );
          continue;
        }

        summary.embeddingsGenerated += 1;
        summary.backfilled += 1;
        console.log(`[analyze] Backfilled embedding for article: ${article.id}`);
        continue;
      }

      // 新文章路径：完整分析 → 生成 embedding → 保存两者。
      const analysis = await analyzeOne(article, model);

      if (!analysis.ok) {
        summary.failed += 1;
        summary.failuresByReason["analysis_failed"] =
          (summary.failuresByReason["analysis_failed"] ?? 0) + 1;
        console.error(
          `[analyze] Failed to analyze article ${article.id}: ${analysis.error}`,
        );
        continue;
      }

      const embedding = await generateEmbedding(article, embeddingModel);
      if (!embedding.ok) {
        summary.failed += 1;
        summary.failuresByReason["embedding_failed"] =
          (summary.failuresByReason["embedding_failed"] ?? 0) + 1;
        console.error(
          `[analyze] Failed to generate embedding for article ${article.id}: ${embedding.error}`,
        );
        continue;
      }

      const storedAnalysis = await storeAnalysis(
        supabase,
        article,
        analysis.result,
        modelName,
      );
      if (storedAnalysis.outcome === "saved") {
        const storedEmbedding = await storeEmbedding(
          supabase,
          storedAnalysis.analysisId,
          embedding.embedding,
        );
        if (!storedEmbedding.ok) {
          // analysis 已写入但 embedding 失败：不设置 analyzed_at；
          // 下次运行将自动回填 embedding（§20）。
          summary.failed += 1;
          summary.failuresByReason["embedding_failed"] =
            (summary.failuresByReason["embedding_failed"] ?? 0) + 1;
          console.error(
            `[analyze] Failed to store embedding for article ${article.id}: ${storedEmbedding.error}`,
          );
          continue;
        }

        const marked = await markAnalyzed(supabase, article.id);
        if (!marked.ok) {
          summary.failed += 1;
          summary.failuresByReason["analyzed_at_failed"] =
            (summary.failuresByReason["analyzed_at_failed"] ?? 0) + 1;
          console.error(
            `[analyze] Failed to set analyzed_at for article ${article.id}: ${marked.error}`,
          );
          continue;
        }

        summary.articlesAnalyzed += 1;
        summary.embeddingsGenerated += 1;
        console.log(`[analyze] Analyzed article: ${article.id}`);
      } else if (storedAnalysis.outcome === "skipped") {
        summary.skipped += 1;
        console.log(`[analyze] Skipped already-analyzed article: ${article.id}`);
      } else {
        summary.failed += 1;
        summary.failuresByReason[storedAnalysis.outcome] =
          (summary.failuresByReason[storedAnalysis.outcome] ?? 0) + 1;
        console.error(
          `[analyze] Failed to store analysis for article ${article.id}: ${storedAnalysis.error}`,
        );
      }
    }

    await writeLog(supabase, "info", "Analysis batch finished", {
      batchIndex,
      analyzed: summary.articlesAnalyzed,
      skipped: summary.skipped,
      failed: summary.failed,
      backfilled: summary.backfilled,
    });
  }

  summary.status = summary.failed > 0 ? "partial" : "success";
  summary.totalDurationMs = Date.now() - startedAt;

  await writeLog(supabase, "info", "Analysis run finished", { summary });
  console.log("[analyze] Analysis run summary:", JSON.stringify(summary, null, 2));
  return summary;
}
