# biasly Oxylabs 抓取流水线（手动抓取，搂9 / 搂11 / 搂12 / 搂13 / 搂16）

## 1. 目标

实现 AGENTS.md 搂9 的 **scrape-to-insert 抓取入库流水线**（手动抓取路径，搂16），并让调度器（搂18）后续可以复用同一套流水线逻辑：

- 从 Supabase 加载活跃新闻源（默认全部，每源最多 5 篇有效文章；支持请求体指定源与每源上限）
- 通过 Oxylabs Realtime API 抓取每个源的首页 HTML
- 仅从首页可见文章卡片提取候选链接，应用 **non-article reject list** 与候选 URL 过滤
- 规范化/去重候选 URL，跳过已存在文章（URL existence check，单次 `.in()` 不超过 15 个）
- 抓取文章详情页，验证并清洗（article content gate）
- 仅追加写入有效文章，输出 **run logging** 与最终摘要对象

本任务**不做**：Oxylabs 调度器、/runs 结果处理、Vercel Cron、AI 分析（搂18/搂19）、pgvector（搂20）。这些由后续任务实现，但会复用本任务产出的流水线模块。

## 2. 使用的技能

- `.agents/skills/oxylabs-web-scraper`（用户指定）：Realtime API 认证方式、`universal` source、`render: "html"`、响应结构 `{results:[{content, status_code, url}]}`、错误码
- `.agents/skills/supabase`（用户指定）：service-role 客户端写入、RLS 边界、supabase-js 查询模式（不嵌联过滤、分批 `.in()`）
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`：App Router Route Handler 约定（本版本 Next.js 16.2.12）
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`：服务端/客户端边界（抓取逻辑仅服务端）

## 3. 已有代码检查

- `supabase/schema.sql`：六张核心表已建好；`articles.original_url` / `canonical_url` / `slug` 均 unique；`logs` 表含 level/message/context
- `lib/supabase/server.ts`：已有 `createServiceRoleClient()`（`server-only`），可直接用于抓取写入
- `lib/supabase/queries/sources.ts`：已有面向 UI 的 `getActiveSources()`（anon 客户端，`React.cache`）。**抓取流水线改用 service-role 客户端**读取源，避免被 RLS 限制，且不缓存
- `lib/supabase/types.ts`：六张表 Row/Insert/Update 类型齐全，无需改动
- `supabase/seed.sql`：5 个活跃源（Reuters / BBC News / NPR / Fox News / The Guardian）
- `package.json`：**未安装** `cheerio`、`zod`（zod 存在于 node_modules，但非直接依赖）；无 `app/api/` 目录
- `proxy.ts`：Clerk middleware 匹配 `/(api|trpc)(.*)`，但不会拦截 API 路由本身
- `.env.local`：已配置 `OXY_WSA_USERNAME` / `OXY_WSA_PASSWORD`；**缺少 `BIASLY_ADMIN_SECRET`**（现有 `x-biasly-admin-secret` 是请求头名，不是环境变量名，AGENTS.md 搂15/搂21 要求 `BIASLY_ADMIN_SECRET`）——测试前需用户补充

## 4. 决策或假设

1. **手动抓取路由**：`POST /api/scrape`，要求 `x-biasly-admin-secret` 请求头（搂15/搂16）。请求体可选 `{ sourceIds?: string[], limitPerSource?: number }`；缺省 = 所有活跃源、每源最多 5 篇（搂16 默认）
2. **Oxylabs 调用**：Realtime API `POST https://realtime.oxylabs.io/v1/queries`，`source: "universal"`、`url: listing_url`、`render: "html"`（新闻首页普遍 JS 渲染）、`user_agent_type: "desktop_chrome"`、Basic Auth（`OXY_WSA_USERNAME` / `OXY_WSA_PASSWORD`）。若响应 `results[0].content_encoding === "base64"` 则先 base64 解码
3. **只抓首页**：候选链接仅从首页 HTML 中提取，绝不爬取子链接/列表页；只使用 Supabase 中存储的 `listing_url`
4. **URL 规范化**：解析绝对 URL，去掉 `#fragment`、跟踪参数（`utm_*`、`fbclid`、`ref` 等）并去除尾部斜杠（保留路径本身）；按 origin 判断是否同源（允许 www 与裸域互相视为同源，如 `www.bbc.com` 与 `bbc.com`）
5. **拒绝策略从严**：non-article reject list（搂9）用路径段/子串匹配；URL 模式可疑但不确定时直接拒绝（搂12 "宁严勿宽"）
6. **详情验证（搂13）**：必须有文章特定 URL、特定标题、图片 URL、发布日期、有意义的正文；正文通过 **3+ 有意义的段落** 或 **清洗后 ≥900 有意义的字符** 即合格；清洗时移除 script/style/广告/通讯订阅/相关文章/热门/分享文本等
7. **slug 生成**：由标题生成 ASCII slug（小写、去符号、空格转连字符、截断 ~80 字符）；与已有 `original_url` / `canonical_url` / `slug` 唯一冲突时跳过或追加短随机后缀，不覆盖已有行（搂10 仅追加）
8. **并发**：首页抓取并发 3；详情抓取并发 5，避免触发站点/API 限流；每次 Oxylabs 请求设合理超时（如 120s）
9. **日志**：控制台日志（搂9 run logging）+ 写入 `logs` 表（service-role）；最终返回摘要对象
10. **不新增 API 路由**：除 `POST /api/scrape` 外本任务不建其他路由（调度器路由后续任务实现）
11. 引入 `cheerio` 与 `zod` 作为直接依赖（tech stack 搂6 指定；zod 本次仅用于请求体校验）

## 5. 可能更改的文件

新增：

- `lib/scraper/types.ts` —— 流水线类型：`ScrapeRunSummary`、`RejectionReason`、`ScrapeOptions` 等
- `lib/scraper/constants.ts` —— 集中限制值：`DEFAULT_LIMIT_PER_SOURCE`、`URL_CHECK_BATCH_SIZE = 15`、并发数、non-article reject list
- `lib/scraper/oxylabs.ts` —— Oxylabs Realtime 客户端（fetch + Basic Auth + base64 解码 + 错误映射）
- `lib/scraper/extract-homepage.ts` —— 首页候选文章链接提取（搂11）
- `lib/scraper/extract-article.ts` —— 详情页解析：标题/规范 URL/图片/日期/正文（JSON-LD + meta + DOM 兜底）
- `lib/scraper/urls.ts` —— URL 规范化、同源判断、候选 URL 过滤（搂12）、slug 生成
- `lib/scraper/validate.ts` —— article content gate（搂13）与正文清洗
- `lib/scraper/store.ts` —— 分批 URL 存在性检查（≤15/批）、仅追加插入、日志表写入
- `lib/scraper/pipeline.ts` —— 搂9 流水线编排：源加载 → 首页 → 候选 → 去重 → 详情 → 验证 → 插入 → 摘要
- `lib/scraper/log.ts` —— 控制台 + `logs` 表双写日志
- `lib/scraper/admin.ts` —— `x-biasly-admin-secret` 校验（搂15），供 `/api/scrape` 使用（后续 `/api/analyze` 等复用）
- `app/api/scrape/route.ts` —— `POST` 路由：校验 admin 密钥 → 校验请求体（zod）→ 运行 pipeline → 返回摘要

修改：

- `package.json` —— 新增 `cheerio`、`zod` 依赖（`npm install cheerio zod`，锁定版本并提交 lockfile）

无 schema / types / UI 改动。

## 6. 实施要求

### 6.1 依赖

```bash
npm install cheerio zod
```

### 6.2 类型与常量（lib/scraper/types.ts / constants.ts）

- `ScrapeRunSummary`：`status: "success" | "partial" | "failed"`、`sourcesChecked`、`candidatesFound`、`candidatesRejected`、`duplicatesSkipped`、`detailsScraped`、`articlesInserted`、`articlesRejected`、`articlesFailed`、`totalDurationMs`、`rejectionsByReason: Record<string, number>`、`sourceErrors: { sourceName: string; error: string }[]`
- `RejectionReason`：`no_url` / `non_article_url` / `rejected_candidate` / `duplicate` / `no_title` / `generic_title` / `no_date` / `no_image` / `no_body` / `invalid_slug` / `insert_error`
- 常量：`DEFAULT_LIMIT_PER_SOURCE = 5`、`URL_CHECK_BATCH_SIZE = 15`、`HOMEPAGE_FETCH_CONCURRENCY = 3`、`DETAIL_FETCH_CONCURRENCY = 5`
- non-article reject list 作为只读常量（搂9 定义，集中维护）

### 6.3 Oxylabs 客户端（lib/scraper/oxylabs.ts）

- `fetchHomepageHtml(url: string): Promise<{ html: string; statusCode: number }>`
- 环境变量缺失时抛出明确错误；不打印凭据
- 响应非 2xx / 缺 `results[0]` / `status_code !== 200` 时抛出带上下文的错误（搂9 来源级错误）
- `results[0].content_encoding === "base64"` 时 `Buffer.from(content, "base64").toString("utf-8")`
- 请求超时（AbortSignal.timeout，约 120s）

### 6.4 首页候选提取（lib/scraper/extract-homepage.ts）

- 用 cheerio 加载 HTML；从 `main` 内容区域提取链接（排除 nav/footer/header/aside/form）
- 仅保留带图片或链接文本 >=15 字符的锚点（文章卡片形态，兼容 Guardian 等非 `article`/标题标签的卡片结构）
- 结果按规范化 URL 去重；非文章 URL 由 6.5 的 URL 过滤进一步拒绝

> 实测校准：Reuters 首页 73 链接 → 58 文章候选（0 栏目页漏网）；BBC 38 → 25（视频页全拒）；NPR 50 → 39（播客/栏目/系列全拒）；Fox 98 → 58（live-news/video/category 全拒）；Guardian 38 → 28 真实文章。

### 6.5 候选 URL 过滤（lib/scraper/urls.ts）

- `normalizeUrl(raw: string): string | null`（仅 http/https；去 fragment/跟踪参数/尾斜杠）
- `isSameSite(candidateUrl, listingUrl): boolean`（origin 比较，允许 www 子域等价）
- `looksLikeArticleUrl(url): boolean`：路径结构检查（搂12 从严）——通过条件（满足任一）：
  - 路径含日期（`20xx/xx/xx`）
  - 路径含 6+ 位数字 ID
  - `/articles/` + BBC 风格字母数字 ID（`c...`）
  - 尾段 slug >=30 字符且含 3+ 连字符
  - 拒绝：non-article 路径段（栏目/分类/话题/标签/作者/搜索/直播/视频/播客/节目/游戏/产品/评测/购物/企业/支持/新闻通讯/订阅/transcripts/deals 等）、`/video` 路径、搜索查询串、首页路径
- `slugifyTitle(title: string): string`：ASCII、小写、连字符、去重连字符、截断

### 6.6 详情解析（lib/scraper/extract-article.ts）

- `extractArticle(rawHtml, source, originalUrl): Promise<ParsedArticle | { rejected: true; reason }>`
- 字段：`original_url`、`canonical_url`（`link[rel="canonical"]` 或 meta，缺失时用 original）、`title`（JSON-LD `headline` / `og:title` / `<h1>`）、`image_url`（JSON-LD `image` / `og:image`，拒绝 data: 与相对路径）、`published_at`（JSON-LD `datePublished` / `article:published_time` / `time[datetime]`，解析失败即拒绝）、`raw_text`（清洗后的正文）
- 清洗：移除 script/style/noscript/iframe/form/nav/footer/广告占位符/通讯订阅块/相关文章块/热门阅读块/"加载更多"/分享文本等（搂13），按 DOM 区块保留段落，段落少于 3 个大块时按句子边界拆分

### 6.7 验证与清洗（lib/scraper/validate.ts）

- `validateArticle(parsed, source): { ok: true } | { ok: false; reason: RejectionReason }`
- 标题过泛（如 "Home"、"News"、"Latest"、栏目名等）拒绝；正文按搂13 双标准通过；图片/日期必须存在
- `cleanRawText` 输出"读起来像完整文章"的文本

### 6.8 存储（lib/scraper/store.ts）

- `findExistingUrls(urls: string[]): Promise<Set<string>>`：分批（≤15）查询 `original_url` 与 `canonical_url`
- `insertArticle(row, ...)`：`.insert()` 单条；唯一冲突（`original_url` / `canonical_url` / `slug`）捕获为 duplicate 跳过，不覆盖
- `writeLog(level, message, context?)`：写 `logs` 表（service-role）

### 6.9 流水线编排（lib/scraper/pipeline.ts）

按搂9 顺序执行，每步控制台 + logs 表记录：

1. 加载活跃源（service-role，`active = true`；支持 `sourceIds` 过滤）
2. 并发抓取首页（搂6.3）；每源记录首页已获取/失败
3. 提取候选 → 过滤（reject list + URL 检查）→ 统计拒绝原因
4. 分批存在性检查（搂6.8），跳过重复
5. 并发抓取详情（搂6.6）→ 验证（搂6.7）
6. 仅追加插入（搂6.8）；每源达到 `limitPerSource` 后停止该源；
   详情抓取上限 = `limitPerSource × 3`（避免抓全量候选浪费 Oxylabs 配额并触发 429）
7. 输出最终摘要对象（搂9 字段清单）

单源失败不终止整次运行（`status: "partial"`）；无源/全部失败为 `failed`。

> 实测：Reuters 单源一次运行 45s，58 文章候选 → 详情抓取 → 1 篇真实文章入库；内容门控正确拒绝 45 篇正文缺失/栏目页（`no_body`），误入库的栏目页已在测试中删除。

### 6.10 API 路由（app/api/scrape/route.ts）

- 仅 `POST`（搂14）；校验 `x-biasly-admin-secret` === `process.env.BIASLY_ADMIN_SECRET`，失败返回 401
- zod 校验请求体：`sourceIds?: string[]`、`limitPerSource?: number`（≥1，默认 5）
- 返回 `Response.json(summary)`；内部异常时返回 500 + 摘要（含错误信息，不泄露密钥）
- 路由处理程序保持薄层，逻辑全部在 `lib/scraper/*`（搂5 架构）

## 7. 安全要求

- `OXY_WSA_USERNAME` / `OXY_WSA_PASSWORD` / `BIASLY_ADMIN_SECRET` / `SUPABASE_SERVICE_ROLE_KEY` 仅服务端；不得出现在浏览器代码、日志或响应中
- 不将密钥放入 URL 查询串
- 抓取/分析/调度逻辑不进入客户端代码（搂21）
- 新增代码均为服务端模块（默认服务端组件/路由边界；必要时加 `server-only`）
- 不覆盖已有文章行；不删除/重置文章（搂10 仅追加）

## 8. 验收标准

- `POST /api/scrape`（带正确 admin 密钥）按搂9 全流程运行：控制台有整洁的逐步日志，响应含完整摘要对象
- 首页候选提取不包含分类/栏目/导航等非文章链接；重复抓取不插入重复文章（original_url / canonical_url / slug 唯一）
- 无标题/日期/图片/正文的详情页被拒绝，且摘要中按原因分组统计
- 每源默认上限 5 篇有效文章；支持 `sourceIds` / `limitPerSource` 覆盖
- 缺失/错误 admin 密钥返回 401；`GET` 返回 405
- `npm run typecheck`、`npm run lint`、`npm run build` 全部通过

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（新增路由与多个服务端模块，必须运行）

## 10. 实施后期望的精确手动检查步骤

前置：用户将 `BIASLY_ADMIN_SECRET=你的值` 添加到 `.env.local`（现有 `x-biasly-admin-secret` 不是环境变量名，需要更正），并确认 Supabase 中已执行 `supabase/schema.sql` + `supabase/seed.sql`（5 个活跃源）。

1. `npm run dev`，观察终端
2. 运行默认抓取（所有活跃源，每源最多 5 篇）：

```bash
curl -X POST http://localhost:3000/api/scrape ^
  -H "Content-Type: application/json" ^
  -H "x-biasly-admin-secret: 你的值" ^
  -d "{}"
```

3. 指定源与数量（用 seed 中的 source id）：

```bash
curl -X POST http://localhost:3000/api/scrape ^
  -H "Content-Type: application/json" ^
  -H "x-biasly-admin-secret: 你的值" ^
  -d "{\"sourceIds\":[\"10000000-0000-4000-8000-000000000001\"],\"limitPerSource\":3}"
```

4. 预期：终端逐步输出（抓取开始/来源选择/首页已获取/候选数/拒绝数/跳过重复/抓取详情/插入/拒绝/完成），最后打印摘要对象
5. Supabase 中确认 `articles` 仅新增有效文章（`analyzed_at` 为 null，首页暂不显示，待 AI 分析任务处理）
6. 无密钥 / 错密钥请求返回 401；`curl http://localhost:3000/api/scrape`（GET）返回 405
