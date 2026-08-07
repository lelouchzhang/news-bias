import * as cheerio from "cheerio";
import { isSameSite, normalizeUrl } from "@/lib/scraper/urls";

/**
 * 仅从首页可见故事卡片提取候选文章链接（搂11）。
 * 排除导航/菜单/页脚区域；只保留带图片或较长链接文本的锚点
 * （文章卡片形态，Guardian 等站点的卡片不是 h1-h4/article 结构），
 * 结果按规范化 URL 去重，非文章 URL 由 looksLikeArticleUrl 在后续步骤过滤。
 */
export function extractHomepageCandidates(
  html: string,
  listingUrl: string,
): string[] {
  const $ = cheerio.load(html);
  const seen = new Set<string>();
  const candidates: string[] = [];

  $("main a[href]").each((_index, element) => {
    const anchor = $(element);
    // 跳过位于导航/菜单/页脚/侧栏中的链接
    if (
      anchor.closest("nav, footer, header, aside, form").length > 0 ||
      anchor.attr("role") === "navigation"
    ) {
      return;
    }

    const anchorText = anchor.text().trim().replace(/\s+/g, " ");
    const hasImage = anchor.find("img").length > 0;
    if (anchorText.length < 15 && !hasImage) {
      return;
    }

    const href = anchor.attr("href");
    if (!href) {
      return;
    }

    const absolute = new URL(href, listingUrl).toString();
    const normalized = normalizeUrl(absolute);
    if (!normalized || !isSameSite(normalized, listingUrl)) {
      return;
    }

    if (!seen.has(normalized)) {
      seen.add(normalized);
      candidates.push(normalized);
    }
  });

  return candidates;
}
