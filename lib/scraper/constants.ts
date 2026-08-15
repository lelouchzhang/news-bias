/**
 * 抓取流水线集中限制值与非文章拒绝列表（AGENTS.md session 9 / session 16）。
 */

export const DEFAULT_LIMIT_PER_SOURCE = 5;

export const URL_CHECK_BATCH_SIZE = 15;

export const HOMEPAGE_FETCH_CONCURRENCY = 3;

export const DETAIL_FETCH_CONCURRENCY = 3;

/** 每源详情抓取上限 = limitPerSource 的倍数（验证留余量，避免抓全量浪费 API）。 */
export const DETAIL_FETCH_PER_SOURCE_MULTIPLIER = 3;

export const OXYLABS_REQUEST_TIMEOUT_MS = 120_000;

/**
 * Non-article reject list（session 9）：分类/栏目/话题/标签/作者/搜索/直播/视频/
 * 播客/节目/游戏/产品/评测/购物/企业/支持/新闻通讯/订阅等路径段。
 * 变更时仅在此处更新。
 */
export const NON_ARTICLE_PATH_SEGMENTS: readonly string[] = [
  "about",
  "advertise",
  "author",
  "authors",
  "careers",
  "category",
  "categories",
  "column",
  "columns",
  "company",
  "contact",
  "cookies",
  "corporate",
  "deals",
  "download",
  "episode",
  "episodes",
  "faq",
  "feature",
  "features",
  "games",
  "gaming",
  "help",
  "investors",
  "jobs",
  "legal",
  "live",
  "liveblog",
  "live-blog",
  "live-news",
  "livescore",
  "media",
  "menu",
  "newsletter",
  "newsletters",
  "podcast",
  "podcasts",
  "privacy",
  "products",
  "profile",
  "promo",
  "promos",
  "reviews",
  "search",
  "section",
  "sections",
  "series",
  "shop",
  "shopping",
  "show",
  "shows",
  "sponsor",
  "sponsored",
  "sport",
  "sports",
  "subscribe",
  "subscription",
  "support",
  "tag",
  "tags",
  "terms",
  "transcripts",
  "topic",
  "topics",
  "video",
  "videos",
  "watch",
  "weather",
];

/** 候选中需要剔除的查询参数（跟踪/分享参数）。 */
export const TRACKING_QUERY_KEYS: readonly string[] = [
  "campaign",
  "content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "medium",
  "ref",
  "source",
  "term",
  "utm_campaign",
  "utm_content",
  "utm_medium",
  "utm_source",
  "utm_term",
];
