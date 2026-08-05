# biasly 集成 Supabase 数据库与数据访问层

## 1. 目标

将 Supabase 接入 biasly 作为唯一数据源，并让应用的数据访问从 mock 切换到真实数据库：

- 创建六张核心表的完整 schema（`supabase/schema.sql`）：`sources`、`articles`、`article_analyses`、`logs`、`oxylabs_schedules`、`oxylabs_schedule_runs`
- 创建幂等演示种子数据（`supabase/seed.sql`），用于验证 UI 与数据库打通
- 创建类型化客户端与查询层：`lib/supabase/types.ts`、`client.ts`、`server.ts`、`queries/articles.ts`、`queries/sources.ts`
- 首页与文章详情页改为服务端组件异步读取 Supabase；删除 mock 数据文件
- UI 只展示已存储的数据（AGENTS.md §5、§19）

本任务**不做**：抓取、AI 分析、Oxylabs 调度器、Vercel Cron、pgvector 关联文章（§20）、`/api/*` 路由、日志写入。这些由后续任务实现。

## 2. 使用的技能

- `.agents/skills/supabase`（用户指定）：supabase-js 客户端初始化、Data API 权限模型（显式 `GRANT` + RLS）、生成式类型结构
- `node_modules/next/dist/docs/`：已核对 `01-getting-started/06-fetching-data.md`（服务端组件异步读取）、`08-caching.md` 与 `02-guides/caching-without-cache-components.md`（本项目 `next.config.ts` 未启用 Cache Components，`fetch` 默认不缓存、请求时渲染）、`03-api-reference/04-functions/generate-static-params.md`（详情页不再 build 期查库）
- Supabase 官方文档（已联网核对）：
  - `docs/reference/javascript/creating-client.md`：`createClient(url, key)` v2 用法；新表暴露给 Data API 必须显式 `GRANT` + 先启用 RLS 再建 policy；`supabase gen types typescript` 的 `Database` 结构（本项目手写 `lib/supabase/types.ts`）
  - changelog：2026-04 起新表不再自动暴露给 Data API；anon/service_role 密钥将于 2026 年底弃用并迁移到 publishable/secret 密钥——**本项目按 AGENTS.md §21 继续使用现有命名，密钥迁移另立任务**
- 不引入 Zod / Tailwind / shadcn 新依赖；不使用 Supabase CLI（项目无 `supabase/` CLI 配置）

## 3. 已有代码检查

- `package.json`：Next.js 16.2.12、React 19.2.4、Tailwind v4；**未安装** `@supabase/supabase-js`
- 项目根目录**无** `supabase/`（无 schema.sql）、**无** `lib/supabase/`
- `.env.local` 已配置 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`；`.env.example` 已有同名占位，无需改动
- 只读探测（已获批准执行）：远端 Supabase 项目六张核心表全部 HTTP 404 → **从零建表**
- `app/page.tsx` 直接渲染 `lib/home/mock-articles.ts` 的 12 张卡片；`app/article/[slug]/page.tsx` 用 `lib/article/mock-article-details.ts` 渲染详情
- 组件 props 依赖 mock 类型；`category`、`region`、`sourceCount`、`sourceBreakdown`、`relatedStories`、`imageCaption`、`readMinutes` 等字段在 AGENTS.md 核心表中**没有对应存储**
- `next.config.ts` 为空配置（未启用 Cache Components）→ 服务端组件默认请求时渲染
- 本地 `public/images/home/card-*.svg` 与 `public/images/article/hero.svg` 存在，可作 seed 图片
- git 工作区干净；`prompts/` 已有 clerk-auth.md 等历史提示文件（保留）

## 4. 决策或假设

1. **从零建 schema**，严格按 AGENTS.md §7 字段清单；`article_analyses` 暂不加入 `embedding` 列（§20 启用 pgvector 后再加）
2. **`articles` 增加 `slug` 列**（唯一、not null）：现有 UI 与 `/article/[slug]` 路由依赖可读 slug，数据库必须能稳定支撑；抓取任务后续根据标题/规范 URL 生成。这是对 §7 最小字段清单的追加，如不同意可去掉并改用其他路由策略
3. **`bias_score` 用生成列** `GENERATED ALWAYS AS ((right_percentage - left_percentage) / 100.0) STORED`，保证与 §19 公式永远一致
4. **UI 只展示已存储数据**：
   - 删除 `SourceBreakdownCard` 与 `RelatedStories` 的使用与文件（无存储支撑；§20 pgvector 落地后重建关联文章）
   - 卡片 meta 行由 `category · region` 改为 `源名 · 日期`；`sourceCount` 由 `置信度` 替代
   - 详情页按 §19 展示：摘要、情感标签/分数、框架标签与百分比、置信度、框架说明、倾向性词汇、免责声明、模型名；`readMinutes` 由 `raw_text` 词数估算（≈200 词/分钟）；`imageCaption` 缺省时隐藏
5. **客户端分层**（遵循 §21 服务端边界）：
   - `lib/supabase/server.ts`：`import "server-only"`；提供 anon 只读客户端（页面读取，配合 RLS）与 service-role 客户端（未来抓取/分析/调度写入）
   - `lib/supabase/client.ts`：浏览器 anon 客户端（按 AGENTS.md 环境变量表预留，本任务页面不消费）
6. **RLS + 显式 GRANT**：全部表启用 RLS；仅 `sources`（active）、`articles`（已分析）、`article_analyses`（文章已分析）对 anon/authenticated 开放 SELECT；`logs`/调度表不授予任何客户端角色
7. **密钥命名遵循 AGENTS.md**（anon/service_role）；官方 2026 年底弃用迁移另行处理，本次不动 `.env.example` 与 `.env.local` 键名
8. **seed.sql 为幂等演示数据**：5 个活跃新闻源 + 6 篇已分析文章（内容取自现有 mock）；图片用本地 SVG 相对路径（真实抓取将存绝对 URL）；seed 仅用于验证，不替代抓取流程
9. **schema/seed 由用户在 Supabase Dashboard → SQL Editor 执行**（AGENTS.md §7 指定的方式；无 CLI/psql 凭据），实施方不直接改远端
10. 详情页**移除 build 期 `generateStaticParams`**，避免构建时查询数据库产生陈旧静态页；slug 路由在请求时渲染

## 5. 可能更改的文件

新增：

- `supabase/schema.sql` — 六张表 + 约束 + 索引 + RLS policies + GRANT
- `supabase/seed.sql` — 幂等演示数据（sources / articles / article_analyses）
- `lib/supabase/types.ts` — `Database` 类型（六表 Row/Insert/Update + Relationships + `Tables` 辅助类型）
- `lib/supabase/client.ts` — 浏览器 anon 客户端
- `lib/supabase/server.ts` — 服务端 anon 只读 + service-role 客户端（`server-only`）
- `lib/supabase/queries/articles.ts` — `getHomeArticles()`、`getArticleBySlug(slug)`（DB 行 → 视图模型）
- `lib/supabase/queries/sources.ts` — `getActiveSources()`（供后续抓取任务）
- `lib/article/types.ts` — 视图模型类型（`ArticleCard`、`ArticleDetail`、`AnalysisView` 等）

修改：

- `package.json` — 安装 `@supabase/supabase-js`
- `app/page.tsx` — 异步读取 + 空态（"暂无已分析文章"）
- `app/article/[slug]/page.tsx` — DB 读取、`generateMetadata`、移除 `generateStaticParams`
- `components/home/news-card.tsx` — 新卡片字段（源、日期、情感/框架标签、置信度）
- `components/article/article-header.tsx`、`article-hero.tsx` — 适配新视图模型（caption/readMinutes 可选）
- `components/article/ai-summary-card.tsx` — 摘要正文 + 倾向性词汇 chips + 免责声明 + 生成时间
- `components/article/bias-analysis-card.tsx` — 框架标签（含 mixed/unclear）+ 置信度 + 框架说明；新增情感标签展示
- `components/article/bias-distribution.tsx`、`article-body.tsx` — 仅调整类型导入（若需要）

删除：

- `lib/home/mock-articles.ts`、`lib/article/mock-article-details.ts`
- `components/article/source-breakdown-card.tsx`、`components/article/related-stories.tsx`（§20 重建）

## 6. 实施要求

### 6.1 安装

```bash
npm install @supabase/supabase-js
```

锁定版本并提交 lockfile（supabase 技能安全清单）。

### 6.2 supabase/schema.sql

按下列结构创建（含 `create index`、`check` 约束；全部使用 `public` schema）：

**sources**

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `listing_url text not null unique`
- `parser_strategy text null`
- `active boolean not null default true`
- `logo_url text null`
- `created_at timestamptz not null default now()`

**articles**

- `id uuid primary key default gen_random_uuid()`
- `source_id uuid not null references sources(id) on delete cascade`
- `original_url text not null unique`
- `canonical_url text not null unique`
- `slug text not null unique`（决策 2）
- `title text not null`
- `image_url text not null`
- `published_at timestamptz not null`
- `raw_text text not null`
- `scraped_at timestamptz not null default now()`
- `analyzed_at timestamptz null`
- `created_at timestamptz not null default now()`

索引：`articles(analyzed_at)`、`articles(source_id)`。

**article_analyses**

- `id uuid primary key default gen_random_uuid()`
- `article_id uuid not null unique references articles(id) on delete cascade`
- `summary text not null`
- `sentiment_score double precision not null check (between -1 and 1)`
- `sentiment_label text not null check in ('positive','neutral','negative')`
- `bias_label text not null check in ('left','center','right','mixed','unclear')`
- `left_percentage numeric(5,2) not null check (0..100)`
- `center_percentage numeric(5,2) not null check (0..100)`
- `right_percentage numeric(5,2) not null check (0..100)`
- `bias_score double precision generated always as ((right_percentage - left_percentage) / 100.0) stored`（生成列）
- `confidence double precision not null check (0..1)`
- `framing_notes text not null`
- `loaded_terms text[] not null default '{}'`
- `disclaimer text not null`
- `model text not null`
- `created_at / updated_at timestamptz not null default now()`

约束：三百分比之和 = 100（`numeric` 精确运算，`check (left_percentage + center_percentage + right_percentage = 100)`）。

**logs**

- `id bigint generated always as identity primary key`
- `level text not null check in ('info','warn','error')`
- `message text not null`
- `context jsonb null`
- `created_at timestamptz not null default now()`

索引：`logs(created_at desc)`。

**oxylabs_schedules**

- `id uuid primary key default gen_random_uuid()`
- `source_id uuid not null unique references sources(id) on delete cascade`（每源一个调度）
- `oxylabs_schedule_id text not null unique`（**Oxylabs 64 位大整数以 text 存储**，避免 JS 精度丢失，§18）
- `status text not null default 'active' check in ('active','paused')`
- `created_at / updated_at timestamptz not null default now()`

**oxylabs_schedule_runs**

- `id uuid primary key default gen_random_uuid()`
- `schedule_id uuid not null references oxylabs_schedules(id) on delete cascade`
- `oxylabs_run_id text not null unique`
- `status text not null default 'pending' check in ('pending','done','faulted')`
- `processed_at timestamptz null`
- `created_at timestamptz not null default now()`

**RLS 与 GRANT**（先启用 RLS 再建 policy，最后 GRANT）：

```sql
alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

create policy "sources_public_read_active" on public.sources
  for select to anon, authenticated using (active = true);

create policy "articles_public_read_analyzed" on public.articles
  for select to anon, authenticated using (analyzed_at is not null);

create policy "analyses_public_read_of_analyzed" on public.article_analyses
  for select to anon, authenticated
  using (exists (
    select 1 from public.articles a
    where a.id = article_id and a.analyzed_at is not null
  ));

-- logs / oxylabs_schedules / oxylabs_schedule_runs：启用 RLS 但不建 policy、不 GRANT 给 anon/authenticated

grant select on public.sources, public.articles, public.article_analyses
  to anon, authenticated;
grant all on public.sources, public.articles, public.article_analyses,
  public.logs, public.oxylabs_schedules, public.oxylabs_schedule_runs
  to service_role;
```

文件头注释说明：2026-04 起新表不再自动暴露给 Data API，必须显式 GRANT（supabase 技能核心原则 4）。

### 6.3 supabase/seed.sql

- 幂等（`on conflict ... do nothing` / `do update`，key 用 `listing_url`、`original_url`、`slug`）
- 5 个活跃新闻源（如 Reuters、BBC、NPR、Fox News、The Guardian，含真实 homepage URL 占位）
- 6 篇文章 + 对应分析：标题/正文沿用现有 mock（`trump-iran-peace-proposal` 等 6 条），`analyzed_at` 全部设置，三百分比之和 = 100，`bias_score` 不手写（生成列）
- 图片用 `/images/home/card-0X.svg`（文章 1 用 `/images/article/hero.svg`），`raw_text` 以空行分隔段落（供详情页拆段）

### 6.4 lib/supabase/types.ts

- 手写 `Database` 接口，包含六张表的 `Row` / `Insert` / `Update`，与 schema 严格同步
- `bias_score` 在 `Insert` / `Update` 中为 `never`（生成列）
- 标注 `Relationships`（articles→sources、article_analyses→articles、oxylabs_schedules→sources、runs→schedules）
- 导出 `Tables<'articles'>` 等辅助类型
- 顶层注释：字段变更时须同步 `supabase/schema.sql` 与远端（AGENTS.md §7）

### 6.5 客户端

`lib/supabase/server.ts`：

- `import "server-only"`，避免被浏览器代码引用
- `createServerDataClient()`：anon key，供服务端组件公开读取
- `createServiceRoleClient()`：`SUPABASE_SERVICE_ROLE_KEY`，供未来抓取/分析/调度写入
- 环境变量缺失时抛明确错误；不打印密钥

`lib/supabase/client.ts`：`createBrowserClient()` 返回 anon 客户端（本任务预留，不消费）。

### 6.6 查询层

`lib/supabase/queries/articles.ts`（类型安全、小函数、显式类型）：

- `getHomeArticles()`：查 `articles`（`analyzed_at` 非空，`order published_at desc`，limit 12），嵌入 `sources(name)` 与 `article_analyses(sentiment_label, bias_label, left_percentage, center_percentage, right_percentage, confidence)`；映射为 `ArticleCard[]`
- `getArticleBySlug(slug)`：按 `slug` 查文章 + 源 + 分析（`analyzed_at` 非空）；不存在返回 `null`；映射为 `ArticleDetail`
- 注意：不嵌套过滤关联表（§21 禁止 `.eq('foreignTable.column', value)`）

`lib/supabase/queries/sources.ts`：

- `getActiveSources()`：`active = true`，按 `name` 排序（供后续抓取任务）

### 6.7 页面接线

- `app/page.tsx` 改为 `async` 服务端组件：`const articles = await getHomeArticles()`；保留现有布局（`max-w-7xl`、`sm:grid-cols-2 lg:grid-cols-3`、12 卡）；空数组时显示空态文案
- `app/article/[slug]/page.tsx`：`await getArticleBySlug(slug)`，为空 `notFound()`；`generateMetadata` 使用文章标题与摘要；**删除 `generateStaticParams`**（决策 10）
- 详情页区块：`ArticleHeader` → `ArticleHero` → `BiasDistribution` → `ArticleBody`（raw_text 按空行拆段）→ 侧栏 `BiasAnalysisCard` + `AiSummaryCard`；`SubscribeBar` 保留；不再渲染 SourceBreakdown / RelatedStories
- Next.js 16 依据：`06-fetching-data.md`（服务端组件可直接 await 数据库客户端）、`caching-without-cache-components.md`（默认请求时渲染）

### 6.8 UI 视觉规范（数据化后的卡片与详情）

整体保持现有设计语言（Poppins、`text-caption uppercase` meta、`rounded-lg`、`shadow-md`、`gap-6` 网格），不引入新色板：

**新闻卡片（news-card.tsx）**

- 图片区不变（`aspect-video`、`object-cover`、hover 缩放、Info 圆标）
- meta 行：`源名 · 发布日期`（`text-caption font-medium uppercase tracking-wide text-text-secondary`），替换原 `category · region`
- 标题区不变（`line-clamp-3`、`text-[15px] font-semibold`）
- 底部：`BiasMeter`（left/center/right 百分比）不变；原 `{n} sources` 行替换为情感标签 chip（`positive/neutral/negative`）与 `{confidence}% confidence`（`text-caption text-text-secondary`）

**详情页 AI Summary 卡（ai-summary-card.tsx）**

- 标题 "AI Summary" + Info 图标不变；副标题显示 `Generated {分析时间}`（用 `article_analyses.created_at` 格式化）
- 正文：`summary` 单段（`text-body-md text-text-primary`）
- 新增 "Loaded Terms" 区：`loaded_terms` 以 `Chip` 组件渲染（surface 背景、`text-text-secondary`）
- 免责声明 `disclaimer`（`text-caption text-text-secondary`）

**详情页 Bias Analysis 卡（bias-analysis-card.tsx）**

- 标题 "Bias Analysis" 不变；"Overall Bias" 显示 `bias_label`（left/center/right/mixed/unclear，颜色沿用 `biasLabelTextClass`；mixed/unclear 用 `text-text-secondary`）+ 最高百分比
- 百分比条形区不变；`basedOn` 行替换为置信度：`{confidence}% confidence`
- 说明文字显示 `framing_notes`；"How We Analyze Bias" 按钮保留
- 卡片顶部或 meta 行新增情感展示：`Sentiment: positive/neutral/negative`（Chip）

**响应式**：375px 视口无横向滚动；网格 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` 与详情页 `lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]` 保持不变。

## 7. 安全要求

- `SUPABASE_SERVICE_ROLE_KEY` 仅存在于服务端模块；`server.ts` 使用 `server-only` 防止浏览器打包
- 不把任何密钥写入代码、日志或 `.env.example`（仅占位符）；`.env.local` 已被 `.gitignore` 忽略
- 六张表全部启用 RLS；`logs` 与两张调度表不授予 anon/authenticated，不暴露给 Data API
- 不新增 API 路由；浏览器端不执行任何抓取/分析/调度逻辑
- 查询层不使用 `.eq('foreignTable.column', value)` 过滤关联表

## 8. 验收标准

- `supabase/schema.sql` 包含六张表、约束、索引、RLS policies、GRANT；`supabase/seed.sql` 幂等
- 用户在 SQL Editor 执行后：`sources` 5 行、`articles` 6 行、`article_analyses` 6 行；`bias_score` 等于 `(right-left)/100`
- 以 anon key 请求 REST：`/rest/v1/articles?select=id,title` 只返回已分析文章；`/rest/v1/logs` 无权限
- 首页渲染 seed 文章（标题/源/图片/日期/情感/框架/百分比/置信度）；无数据时显示空态
- 详情页展示完整分析（摘要、情感、框架百分比、置信度、框架说明、倾向性词汇、免责声明）；无效 slug 返回 404
- mock 文件删除后项目内无残留引用；`rg "mock-articles|mock-article-details"` 为空
- `npm run typecheck`、`npm run lint`、`npm run build` 全部通过

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（页面与路由、服务端模块变更，必须跑）

## 10. 实施后期望的精确手动检查步骤

1. **Supabase Dashboard → SQL Editor**：依次运行 `supabase/schema.sql` 与 `supabase/seed.sql`；确认三张表行数（5 / 6 / 6）与 `bias_score` 数值正确
2. **REST 校验**（可选）：用 anon key 请求 `<SUPABASE_URL>/rest/v1/articles?select=id,title` 只返回已分析文章；`<SUPABASE_URL>/rest/v1/logs` 应无权限
3. `npm run typecheck && npm run lint && npm run build` 均通过，终端无报错
4. `npm run dev`，浏览器打开 `http://localhost:3000/`：
   - 首页显示 6 张来自数据库的新闻卡片（源名、日期、情感 chip、BiasMeter、置信度）
   - 打开任意卡片详情页：完整分析卡片正常；`/article/nonexistent-slug` 返回 404
   - 窗口缩放到 375px：无横向滚动
5. 在 Supabase 中把某篇文章 `analyzed_at` 置空（模拟未分析），刷新首页确认该文章不再出现
