import "server-only";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  DEFAULT_LIMIT_PER_SOURCE,
  DETAIL_FETCH_CONCURRENCY,
  DETAIL_FETCH_PER_SOURCE_MULTIPLIER,
  HOMEPAGE_FETCH_CONCURRENCY,
} from "@/lib/scraper/constants";
import { extractHomepageCandidates } from "@/lib/scraper/extract-homepage";
import { extractArticle } from "@/lib/scraper/extract-article";
import { writeLog } from "@/lib/scraper/log";
import { fetchPageHtml } from "@/lib/scraper/oxylabs";
import { findExistingUrls, insertArticle } from "@/lib/scraper/store";
import type {
  ParsedArticle,
  ScrapeOptions,
  ScrapeRunSummary,
  SourceError,
  SourceRow,
} from "@/lib/scraper/types";
import { looksLikeArticleUrl, normalizeUrl } from "@/lib/scraper/urls";
import { validateArticle } from "@/lib/scraper/validate";

function createEmptySummary(): ScrapeRunSummary {
  return {
    status: "failed",
    sourcesChecked: 0,
    candidatesFound: 0,
    candidatesRejected: 0,
    duplicatesSkipped: 0,
    detailsScraped: 0,
    articlesInserted: 0,
    articlesRejected: 0,
    articlesFailed: 0,
    totalDurationMs: 0,
    rejectionsByReason: {},
    sourceErrors: [],
  };
}

/** 以固定并发数执行异步任务（顺序保留输入顺序）。 */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await worker(items[index]!);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      () => runWorker(),
    ),
  );
  return results;
}

async function loadSources(
  supabase: Awaited<ReturnType<typeof createServiceRoleClient>>,
  options: ScrapeOptions,
): Promise<SourceRow[]> {
  let query = supabase
    .from("sources")
    .select("id, name, listing_url, parser_strategy")
    .eq("active", true)
    .order("name", { ascending: true });

  if (options.sourceIds && options.sourceIds.length > 0) {
    query = query.in("id", options.sourceIds);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load active sources: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    listingUrl: row.listing_url,
    parserStrategy: row.parser_strategy,
  }));
}

/**
 * Scrape-to-insert 流水线（搂9 / 搂16）。
 * 手动抓取与调度器处理共用此编排；调度器仅替换首页 HTML 来源。
 */
export async function runScrapePipeline(
  options: ScrapeOptions = {},
): Promise<ScrapeRunSummary> {
  const startedAt = Date.now();
  const summary = createEmptySummary();
  const supabase = createServiceRoleClient();
  const limitPerSource = options.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE;
  const sourceErrors: SourceError[] = [];

  await writeLog(supabase, "info", "Scrape run started", {
    sourceIds: options.sourceIds ?? "all",
    limitPerSource,
  });

  const sources = await loadSources(supabase, options);
  summary.sourcesChecked = sources.length;

  if (sources.length === 0) {
    summary.status = "failed";
    summary.totalDurationMs = Date.now() - startedAt;
    await writeLog(supabase, "warn", "Scrape run finished: no active sources", {
      summary,
    });
    return summary;
  }

  console.log(
    `[scraper] Scraping ${sources.length} source(s): ${sources
      .map((source) => source.name)
      .join(", ")}`,
  );

  // 1. 首页抓取（搂9 步骤 2）
  await writeLog(supabase, "info", "Fetching homepages", {
    sources: sources.map((source) => source.name),
  });

  const homepageResults = await mapWithConcurrency(
    sources,
    HOMEPAGE_FETCH_CONCURRENCY,
    async (source) => {
      console.log(`[scraper] Fetching homepage: ${source.name}`);
      try {
        const { html } = await fetchPageHtml(source.listingUrl);
        console.log(`[scraper] Homepage fetched: ${source.name}`);
        return { source, html, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[scraper] Homepage fetch failed: ${source.name}: ${message}`);
        return { source, html: "", error: message };
      }
    },
  );

  const homepagePages: { source: SourceRow; html: string }[] = [];
  for (const result of homepageResults) {
    if (result.error) {
      sourceErrors.push({ sourceName: result.source.name, error: result.error });
      continue;
    }
    homepagePages.push({ source: result.source, html: result.html });
  }

  // 2. 候选提取 + URL 过滤（搂9 步骤 3/4，搂11/搂12）
  const candidateUrlsBySource = new Map<string, string[]>();
  for (const page of homepagePages) {
    const candidates = extractHomepageCandidates(
      page.html,
      page.source.listingUrl,
    );
    const filtered = candidates.filter((url) => {
      const normalized = normalizeUrl(url);
      if (!normalized) {
        return false;
      }
      return looksLikeArticleUrl(normalized);
    });
    candidateUrlsBySource.set(page.source.id, filtered);
    summary.candidatesFound += candidates.length;
    summary.candidatesRejected += candidates.length - filtered.length;
  }

  const allCandidates = Array.from(candidateUrlsBySource.values()).flat();
  const uniqueCandidates = Array.from(new Set(allCandidates));

  console.log(
    `[scraper] Candidates found: ${summary.candidatesFound}, rejected: ${summary.candidatesRejected}, unique: ${uniqueCandidates.length}`,
  );
  await writeLog(supabase, "info", "Candidates extracted", {
    candidatesFound: summary.candidatesFound,
    candidatesRejected: summary.candidatesRejected,
    uniqueCandidates: uniqueCandidates.length,
  });

  // 3. URL existence check（搂9 步骤 5；分批 ≤15）
  let existingUrls: Set<string>;
  try {
    existingUrls = await findExistingUrls(supabase, uniqueCandidates);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sourceErrors.push({ sourceName: "pipeline", error: message });
    summary.status = "failed";
    summary.totalDurationMs = Date.now() - startedAt;
    summary.sourceErrors = sourceErrors;
    await writeLog(supabase, "error", "Scrape run failed during URL existence check", {
      error: message,
    });
    return summary;
  }

  const newCandidatesBySource = new Map<string, string[]>();
  for (const [sourceId, urls] of candidateUrlsBySource) {
    const fresh = urls.filter((url) => !existingUrls.has(url));
    summary.duplicatesSkipped += urls.length - fresh.length;
    if (fresh.length > 0) {
      newCandidatesBySource.set(sourceId, fresh);
    }
  }

  console.log(`[scraper] Duplicates skipped: ${summary.duplicatesSkipped}`);
  await writeLog(supabase, "info", "URL existence check completed", {
    duplicatesSkipped: summary.duplicatesSkipped,
  });

  // 4. 详情抓取（搂9 步骤 6；并发受限）
  const detailJobs: { source: SourceRow; url: string }[] = [];
  for (const page of homepagePages) {
    const candidatesForSource = newCandidatesBySource.get(page.source.id) ?? [];
    const detailLimit = limitPerSource * DETAIL_FETCH_PER_SOURCE_MULTIPLIER;
    for (const url of candidatesForSource.slice(0, detailLimit)) {
      detailJobs.push({ source: page.source, url });
    }
  }

  const detailResults = await mapWithConcurrency(
    detailJobs,
    DETAIL_FETCH_CONCURRENCY,
    async (job) => {
      try {
        const { html } = await fetchPageHtml(job.url);
        return { ...job, html, error: null };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ...job, html: "", error: message };
      }
    },
  );

  const detailPages: { source: SourceRow; url: string; html: string }[] = [];
  for (const result of detailResults) {
    if (result.error) {
      summary.articlesFailed += 1;
      sourceErrors.push({
        sourceName: `${result.source.name}: ${result.url}`,
        error: result.error,
      });
      continue;
    }
    detailPages.push({
      source: result.source,
      url: result.url,
      html: result.html,
    });
  }
  summary.detailsScraped = detailPages.length;

  // 5. 解析 + 验证（搂9 步骤 7，搂13）
  const parsedBySource = new Map<string, ParsedArticle[]>();
  for (const page of detailPages) {
    const parsed = extractArticle(page.html, page.source, page.url);
    if (!parsed.ok) {
      summary.articlesRejected += 1;
      summary.rejectionsByReason[parsed.reason] =
        (summary.rejectionsByReason[parsed.reason] ?? 0) + 1;
      continue;
    }

    const validated = validateArticle(parsed.article, page.source);
    if (!validated.ok) {
      summary.articlesRejected += 1;
      summary.rejectionsByReason[validated.reason] =
        (summary.rejectionsByReason[validated.reason] ?? 0) + 1;
      continue;
    }

    const bySource = parsedBySource.get(page.source.id) ?? [];
    bySource.push(parsed.article);
    parsedBySource.set(page.source.id, bySource);
  }

  // 6. 仅追加写入（搂9 步骤 8，搂10；每源受 limitPerSource 限制）
  for (const page of homepagePages) {
    const source = page.source;
    const articles = parsedBySource.get(source.id) ?? [];
    let insertedForSource = 0;
    for (const article of articles) {
      if (insertedForSource >= limitPerSource) {
        break;
      }
      const result = await insertArticle(supabase, article);
      if (result === "inserted") {
        insertedForSource += 1;
        summary.articlesInserted += 1;
        console.log(`[scraper] Inserted article: ${article.title} (${source.name})`);
      } else if (result === "duplicate") {
        summary.duplicatesSkipped += 1;
      } else {
        summary.articlesRejected += 1;
        summary.rejectionsByReason["insert_error"] =
          (summary.rejectionsByReason["insert_error"] ?? 0) + 1;
      }
    }
  }

  summary.sourceErrors = sourceErrors;
  summary.status =
    sourceErrors.length > 0
      ? "partial"
      : summary.articlesInserted > 0
        ? "success"
        : summary.articlesRejected + summary.articlesFailed > 0
          ? "partial"
          : "success";
  summary.totalDurationMs = Date.now() - startedAt;

  await writeLog(supabase, "info", "Scrape run finished", { summary });
  console.log("[scraper] Scrape run summary:", JSON.stringify(summary, null, 2));
  return summary;
}
