import {
  NON_ARTICLE_PATH_SEGMENTS,
  TRACKING_QUERY_KEYS,
} from "@/lib/scraper/constants";

const TRACKING_QUERY_SET = new Set(TRACKING_QUERY_KEYS);

/**
 * 规范化候选 URL：仅接受 http/https，去掉 fragment 与跟踪参数。
 * 返回 null 表示不是可抓取的候选 URL。
 */
export function normalizeUrl(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  for (const key of Array.from(parsed.searchParams.keys())) {
    if (TRACKING_QUERY_SET.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }

  parsed.hash = "";
  return parsed.toString();
}

/**
 * 同源判断：允许 www 子域与裸域互相视为同源（如 www.bbc.com 与 bbc.com），
 * 其余跨域链接一律不是本源的候选文章。
 */
export function isSameSite(candidateUrl: string, listingUrl: string): boolean {
  let candidate: URL;
  let listing: URL;
  try {
    candidate = new URL(candidateUrl);
    listing = new URL(listingUrl);
  } catch {
    return false;
  }

  const candidateHost = candidate.hostname.toLowerCase();
  const listingHost = listing.hostname.toLowerCase();

  const stripWww = (host: string): string =>
    host.startsWith("www.") ? host.slice(4) : host;

  return stripWww(candidateHost) === stripWww(listingHost);
}

/** 路径中任意一段命中 non-article reject list（搂9/搂11）。 */
function hasRejectedPathSegment(pathname: string): boolean {
  const segments = pathname.split("/").filter(Boolean);
  return segments.some((segment) =>
    NON_ARTICLE_PATH_SEGMENTS.includes(segment.toLowerCase()),
  );
}

/**
 * 候选 URL 过滤（搂12）：看起来像真实文章详情页才保留。
 * 从严：URL 路径可疑且不确定时直接拒绝。
 */
export function looksLikeArticleUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const pathname = parsed.pathname;

  // 首页 / 空路径
  if (pathname === "" || pathname === "/") {
    return false;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) {
    return false;
  }

  // 尾段是常见首页文件名
  const lastSegment = segments[segments.length - 1]!.toLowerCase();
  if (lastSegment === "index.html" || lastSegment === "index.htm") {
    return false;
  }

  // 纯视频页（搂9 reject list）：即使含数字 ID 也拒绝
  if (
    segments.some((segment) => segment.toLowerCase() === "video" || segment.toLowerCase() === "videos")
  ) {
    return false;
  }

  // 查询串明显是搜索（如 ?s= 或 ?q=）
  const lowerSearch = parsed.search.toLowerCase();
  if (lowerSearch.startsWith("?s=") || lowerSearch.startsWith("?q=")) {
    return false;
  }

  // non-article reject list（搂9）
  if (hasRejectedPathSegment(pathname)) {
    return false;
  }

  // 文章特征：路径中含日期、文章 ID、或足够长的标题 slug。
  const hasDateLikeSegment = /(?:20\d{2}|19\d{2})[-/]\d{1,2}[-/]\d{1,2}/.test(
    pathname,
  );
  const hasNumericId = /\d{6,}/.test(pathname);

  if (hasDateLikeSegment || hasNumericId) {
    return true;
  }

  // BBC 风格的字母数字文章 ID（/news/articles/c1xxxxxx）
  if (
    segments.some((segment) => segment.toLowerCase() === "articles") &&
    /^c[a-z0-9]{10,}$/i.test(lastSegment)
  ) {
    return true;
  }

  // 多段路径 + 尾段为长标题 slug（搂12 从严）：
  // 真实文章 slug 通常 >=30 字符且含 3+ 连字符（如 Fox/Reuters/Guardian），
  // 复合栏目名（如 healthcare-pharmaceuticals）只有 1 个连字符，予以拒绝。
  const lastSegmentLength = Array.from(lastSegment).length;
  const hyphenCount = (lastSegment.match(/-/g) ?? []).length;
  if (lastSegmentLength >= 30 && hyphenCount >= 3) {
    return true;
  }

  return false;
}

/** 由标题生成 ASCII slug（小写、去符号、空格转连字符、截断）。 */
export function slugifyTitle(title: string): string {
  const slug = title
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");

  return slug.length > 0 ? slug : "article";
}

/** 在 slug 后追加短随机后缀，用于唯一冲突重试。 */
export function slugifyTitleWithSuffix(title: string, attempt: number): string {
  const base = slugifyTitle(title);
  const suffix = Math.random().toString(36).slice(2, 8);
  return attempt > 0 ? `${base}-${suffix}` : base;
}
