import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import type { ParsedArticle, RejectionReason, SourceRow } from "@/lib/scraper/types";
import { normalizeUrl } from "@/lib/scraper/urls";

export type ExtractArticleResult =
  | { ok: true; article: ParsedArticle }
  | { ok: false; reason: RejectionReason };

interface JsonLdArticle {
  headline?: string;
  datePublished?: string;
  dateModified?: string;
  image?: JsonLdImage;
  mainEntityOfPage?: string | { "@id"?: string };
  url?: string;
}

type JsonLdImage =
  | string
  | { url?: string }
  | Array<string | { url?: string }>;

function isJsonLdImageObject(
  image: JsonLdImage | undefined,
): image is { url?: string } {
  return typeof image === "object" && image !== null && !Array.isArray(image);
}

function extractJsonLd($: cheerio.CheerioAPI): JsonLdArticle | null {
  let candidate: JsonLdArticle | null = null;

  $('script[type="application/ld+json"]').each((_index, element) => {
    if (candidate) {
      return;
    }
    try {
      const parsed = JSON.parse($(element).contents().text()) as unknown;
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const node = item as {
          "@type"?: string | string[];
          headline?: string;
          datePublished?: string;
          image?: unknown;
          mainEntityOfPage?: unknown;
          url?: string;
        };
        const types = Array.isArray(node["@type"])
          ? node["@type"]
          : [node["@type"]];
        if (types.some((t) => t?.toLowerCase().includes("article"))) {
          candidate = node as JsonLdArticle;
          return;
        }
      }
    } catch {
      // 忽略无法解析的 JSON-LD 块
    }
  });

  return candidate;
}

function resolveUrl(raw: string | undefined, base: string): string | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.startsWith("data:")) {
    return null;
  }
  try {
    const normalized = normalizeUrl(new URL(trimmed, base).toString());
    return normalized ?? null;
  } catch {
    return null;
  }
}

function extractImageUrl(
  jsonLd: JsonLdArticle | null,
  articleImg: string | undefined,
): string | undefined {
  if (typeof jsonLd?.image === "string") {
    return jsonLd.image;
  }
  if (Array.isArray(jsonLd?.image)) {
    for (const item of jsonLd.image) {
      if (typeof item === "string") {
        return item;
      }
      if (typeof item?.url === "string") {
        return item.url;
      }
    }
  }
  if (isJsonLdImageObject(jsonLd?.image)) {
    return jsonLd.image.url;
  }
  return articleImg;
}

function parseDate(raw: string | undefined): string | null {
  if (!raw) {
    return null;
  }
  const timestamp = Date.parse(raw.trim());
  if (Number.isNaN(timestamp)) {
    return null;
  }
  return new Date(timestamp).toISOString();
}

const REMOVABLE_SELECTOR = [
  "script",
  "style",
  "noscript",
  "iframe",
  "form",
  "nav",
  "footer",
  "header",
  "aside",
  "button",
  "svg",
  "canvas",
  "figure",
  "picture",
  "video",
  "audio",
  "select",
  "input",
  "textarea",
  'div[class*="advert" i]',
  'div[id*="advert" i]',
  'div[class*="related" i]',
  'div[class*="recommend" i]',
  'div[class*="trending" i]',
  'div[class*="most-read" i]',
  'div[class*="most-popular" i]',
  'div[class*="newsletter" i]',
  'div[class*="subscribe" i]',
  'div[class*="share" i]',
  'div[class*="social" i]',
  'div[class*="cookie" i]',
  "hr",
].join(",");

const JUNK_PHRASES = [
  "sign up for",
  "subscribe to",
  "newsletter",
  "related:",
  "related stories",
  "most popular",
  "most read",
  "recommended for you",
  "load more",
  "©",
  "all rights reserved",
  "terms of service",
  "privacy policy",
  "cookie policy",
];

function cleanParagraph(text: string): string | null {
  const cleaned = text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (cleaned.length < 40) {
    return null;
  }

  const lower = cleaned.toLowerCase();
  if (JUNK_PHRASES.some((phrase) => lower.includes(phrase))) {
    return null;
  }

  return cleaned;
}

function splitParagraphIfNeeded(text: string): string[] {
  const segments = text
    .split(/(?<=\.)\s+(?=[A-Z0-9"'])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  return segments.length > 1 ? segments : [text.trim()];
}

function pickContentRoot($: cheerio.CheerioAPI): cheerio.Cheerio<AnyNode> {
  const article = $("article").first();
  if (article.length > 0) {
    return article;
  }
  const main = $("main").first();
  if (main.length > 0) {
    return main;
  }
  // 常见文章正文容器（Guardian articleBody、Reuters paragraph testid 等）
  const bodyMarkers = $(
    '[data-gu-name="articleBody"], [itemprop="articleBody"], [data-testid="paragraph"]',
  );
  if (bodyMarkers.length > 0) {
    return bodyMarkers.first();
  }

  let best: cheerio.Cheerio<AnyNode> = $();
  let bestCount = 0;
  $("div").each((_index, element) => {
    const node = $(element);
    const count = node.find("p").length;
    if (count > bestCount) {
      bestCount = count;
      best = node;
    }
  });
  return best;
}

/**
 * 解析文章详情页（搂13）：标题/规范 URL/图片/发布日期/正文。
 * 缺失任一必需字段即返回拒绝原因。
 */
export function extractArticle(
  html: string,
  source: SourceRow,
  fallbackUrl: string,
): ExtractArticleResult {
  const $ = cheerio.load(html);
  const base = new URL(fallbackUrl).origin;
  const jsonLd = extractJsonLd($);

  const originalUrl = normalizeUrl(fallbackUrl);
  if (!originalUrl) {
    return { ok: false, reason: "no_url" };
  }

  const canonicalRaw =
    $('link[rel="canonical"]').attr("href") ?? jsonLd?.url ?? originalUrl;
  const canonicalUrl = resolveUrl(canonicalRaw, base) ?? originalUrl;

  const title =
    $('meta[property="og:title"]').attr("content")?.trim() ||
    jsonLd?.headline?.trim() ||
    $("h1").first().text().trim();
  if (!title) {
    return { ok: false, reason: "no_title" };
  }

  const articleImg = $("article img[src]").first().attr("src");
  const image =
    $('meta[property="og:image"]').attr("content") ||
    extractImageUrl(jsonLd, articleImg) ||
    $('meta[name="twitter:image"]').attr("content");
  const imageUrl = resolveUrl(image, base);
  if (!imageUrl) {
    return { ok: false, reason: "no_image" };
  }

  const publishedRaw =
    jsonLd?.datePublished ||
    jsonLd?.dateModified ||
    $('meta[property="article:published_time"]').attr("content") ||
    $('meta[name="date"]').attr("content") ||
    $('meta[itemprop="datePublished"]').attr("content") ||
    $("time[datetime]").first().attr("datetime");
  const publishedAt = parseDate(publishedRaw);
  if (!publishedAt) {
    return { ok: false, reason: "no_date" };
  }

  const root = pickContentRoot($);
  root.find(REMOVABLE_SELECTOR).remove();
  root.find("a").each((_index, element) => {
    const node = $(element);
    const text = node.text().trim();
    if (text.length > 40 && text.length > node.parent().text().length * 0.8) {
      node.remove();
    }
  });

  const paragraphs: string[] = [];
  root.find("p").each((_index, element) => {
    const cleaned = cleanParagraph($(element).text());
    if (cleaned) {
      paragraphs.push(...splitParagraphIfNeeded(cleaned));
    }
  });

  if (paragraphs.length === 0) {
    const bodyText = $("body").text();
    for (const chunk of splitParagraphIfNeeded(bodyText)) {
      const cleaned = cleanParagraph(chunk);
      if (cleaned) {
        paragraphs.push(cleaned);
      }
    }
  }

  const rawText = paragraphs.join("\n\n");
  if (rawText.replace(/\s/g, "").length < 900) {
    return { ok: false, reason: "no_body" };
  }

  return {
    ok: true,
    article: {
      sourceId: source.id,
      sourceName: source.name,
      originalUrl,
      canonicalUrl,
      title,
      imageUrl,
      publishedAt,
      rawText,
    },
  };
}
