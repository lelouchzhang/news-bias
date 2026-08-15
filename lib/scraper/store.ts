import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { URL_CHECK_BATCH_SIZE } from "@/lib/scraper/constants";
import type { ParsedArticle } from "@/lib/scraper/types";
import { slugifyTitle, slugifyTitleWithSuffix } from "@/lib/scraper/urls";

type ServiceClient = SupabaseClient<Database>;

/**
 * URL existence check（session 9）：分批查询（单次 .in() 不超过 15 个），
 * 返回已存在的 original_url / canonical_url 集合。
 */
export async function findExistingUrls(
  supabase: ServiceClient,
  urls: string[],
): Promise<Set<string>> {
  const existing = new Set<string>();

  for (let i = 0; i < urls.length; i += URL_CHECK_BATCH_SIZE) {
    const batch = urls.slice(i, i + URL_CHECK_BATCH_SIZE);

    const { data: byOriginal, error: originalError } = await supabase
      .from("articles")
      .select("original_url")
      .in("original_url", batch);
    if (originalError) {
      throw new Error(
        `Failed to check existing article URLs: ${originalError.message}`,
      );
    }

    const { data: byCanonical, error: canonicalError } = await supabase
      .from("articles")
      .select("canonical_url")
      .in("canonical_url", batch);
    if (canonicalError) {
      throw new Error(
        `Failed to check existing canonical URLs: ${canonicalError.message}`,
      );
    }

    for (const row of byOriginal ?? []) {
      existing.add(row.original_url);
    }
    for (const row of byCanonical ?? []) {
      existing.add(row.canonical_url);
    }
  }

  return existing;
}

/** 判断 Supabase 唯一约束冲突（PostgREST 错误码 23505）。 */
function isUniqueViolation(code: string | undefined): boolean {
  return code === "23505";
}

/**
 * 仅追加入库（session 10）。slug 唯一冲突时换后缀重试；
 * original_url / canonical_url 冲突视为重复并跳过。
 */
export async function insertArticle(
  supabase: ServiceClient,
  article: ParsedArticle,
): Promise<"inserted" | "duplicate" | "error"> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await supabase.from("articles").insert({
      source_id: article.sourceId,
      original_url: article.originalUrl,
      canonical_url: article.canonicalUrl,
      slug:
        attempt === 0
          ? slugifyTitle(article.title)
          : slugifyTitleWithSuffix(article.title, attempt),
      title: article.title,
      image_url: article.imageUrl,
      published_at: article.publishedAt,
      raw_text: article.rawText,
    });

    if (!error) {
      return "inserted";
    }

    if (isUniqueViolation(error.code)) {
      const message = error.message.toLowerCase();
      const slugConstraint =
        message.includes("slug") || message.includes("articles_slug_key");
      if (slugConstraint && attempt === 0) {
        continue;
      }
      return "duplicate";
    }

    return "error";
  }

  return "error";
}
