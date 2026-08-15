import type {
  ParsedArticle,
  RejectionReason,
  SourceRow,
} from "@/lib/scraper/types";

const GENERIC_TITLES: readonly string[] = [
  "home",
  "news",
  "world news",
  "us news",
  "uk news",
  "latest",
  "latest news",
  "top stories",
  "breaking news",
  "headlines",
  "politics",
  "business",
  "sports",
  "sport",
  "entertainment",
  "culture",
  "opinion",
  "live",
  "video",
  "podcast",
  "podcasts",
  "about us",
  "contact us",
  "subscribe",
  "newsletters",
  "sign up",
  "register",
  "login",
];

function looksGenericTitle(title: string): boolean {
  const lower = title.toLowerCase().trim();
  if (GENERIC_TITLES.includes(lower)) {
    return true;
  }
  return lower.split(/\s+/).filter(Boolean).length < 4;
}

function isSourceNameOnly(title: string, source: SourceRow): boolean {
  return (
    title.toLowerCase().trim() === source.name.toLowerCase().trim() ||
    title.toLowerCase().trim() === source.listingUrl
  );
}

/**
 * Article content gate（session 13）：标题特定、正文有意义、图片与日期必填。
 */
export function validateArticle(
  article: ParsedArticle,
  source: SourceRow,
): { ok: true } | { ok: false; reason: RejectionReason } {
  if (!article.originalUrl || !article.canonicalUrl) {
    return { ok: false, reason: "no_url" };
  }

  if (!article.title.trim()) {
    return { ok: false, reason: "no_title" };
  }
  if (
    looksGenericTitle(article.title) ||
    isSourceNameOnly(article.title, source)
  ) {
    return { ok: false, reason: "generic_title" };
  }

  if (!article.publishedAt) {
    return { ok: false, reason: "no_date" };
  }

  if (!article.imageUrl) {
    return { ok: false, reason: "no_image" };
  }

  const meaningfulChars = article.rawText.replace(/\s/g, "").length;
  const paragraphs = article.rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.replace(/\s/g, "").length >= 40);

  const passes = paragraphs.length >= 3 || meaningfulChars >= 900;
  if (!passes) {
    return { ok: false, reason: "no_body" };
  }

  // 栏目页兜底：正文主要由短标题/摘要构成（段落多且都很短）时拒绝（session 13）
  const shortParagraphs = paragraphs.filter(
    (p) => p.replace(/\s/g, "").length < 120,
  ).length;
  if (paragraphs.length >= 10 && shortParagraphs / paragraphs.length >= 0.8) {
    return { ok: false, reason: "no_body" };
  }

  return { ok: true };
}
