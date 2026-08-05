const displayDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** 将 ISO 时间格式化为 "May 31, 2026" 样式（UTC，避免时区导致日期偏移）。 */
export function formatDisplayDate(isoDate: string): string {
  return displayDateFormatter.format(new Date(isoDate));
}

/** 按正文词数估算阅读分钟数（≈200 词/分钟，最少 1 分钟）。 */
export function estimateReadMinutes(rawText: string): number {
  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

/** 将 raw_text 按空行拆分为段落。 */
export function splitParagraphs(rawText: string): string[] {
  return rawText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}
