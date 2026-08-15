# biasly pgvector 支持与「相关文章」功能（AGENTS.md §20）

## 1. 目标

在 AI 分析流水线已正常工作的基础上，实现 AGENTS.md §20：

1. 启用 pgvector，为 `article_analyses` 增加 `embedding vector(1024)` 列并创建 IVFFlat 余弦索引。
2. 升级 `/api/analyze` 流水线：分析每篇文章的同时生成 embedding 并保存；仅在分析结果与 embedding **都**保存成功后，才更新 `articles.analyzed_at`。
3. 回填：由于待分析检测用 LEFT JOIN（§19），`article_analyses` 行已存在但 `embedding IS NULL` 的文章会在下次运行时被自动拾取以补 embedding，而**不重新跑完整分析**。
4. 新增 `getRelatedArticles(articleId, embedding)` 服务角色查询：按余弦距离（`<=>`）返回最多 5 篇相似文章。
5. 新闻详情页新增「相关文章」模块；当前文章无 embedding 时不显示该模块。

## 2. 使用的技能

- `.agents/skills/supabase`（用户指定）：pgvector 扩展启用、`vector` 列 + IVFFlat 余弦索引 SQL、service-role 查询、schema / `lib/supabase/types.ts` 同步约定、RLS 边界、不在关联表列上加 `.eq()/.is()` 过滤（§21）。
- `.agents/skills/ai-sdk`：以 `node_modules/ai/docs/` 与 `node_modules/@ai-sdk/openai-compatible/docs/` 的已装版本为准核对 `embed` / `embeddingModel` 用法，不凭记忆。
- `node_modules/next/dist/docs/`：服务端组件 / 动态路由 / 查询函数约定。

## 3. 已有代码检查

- `supabase/schema.sql`：`article_analyses` 当前**尚无** `embedding` 列（注释第 7 行已预留说明）；RLS 与显式 GRANT 已就绪。需新增 `embedding vector(1024)` 列 + IVFFlat 余弦索引 + `article_analyses_embedding_idx`。
- `lib/supabase/types.ts`：`article_analyses.Row/Insert/Update` 均无 `embedding`，需新增字段类型（`number[] | null`）。
- `lib/ai/analyze.ts`：`runAnalysisPipeline` → `loadPendingArticles`（LEFT JOIN 逻辑，`row.article_analyses === null` 视为待分析）→ `storeAnalysis`（insert analysis + 设置 analyzed_at）。**这是升级重点**：当前只 insert 分析行，无 embedding。
- `lib/ai/constants.ts`：集中限值，需新增 embedding 模型名、维度、端点、截断长度等常量。
- `lib/ai/types.ts`：`AnalysisRunSummary` / `AnalysisFailureReason`，需新增 embedding 失败原因与 `embeddingsGenerated` 计数等。
- `lib/supabase/queries/articles.ts`：`getArticleBySlug` 已读详情，需新增 `getRelatedArticles`。
- `app/article/[slug]/page.tsx`：详情页组合区，需插入「相关文章」模块。
- `lib/article/types.ts`：视图模型，需新增 `RelatedArticle` 类型。
- `.env.local`：已含 `MODEL_NAME=qwen3.7-text-embedding` 与 `EMBEDDING_API_KEY=...`（sk-ws- 千问AI平台密钥）。
- `.env.example`：需新增 embedding 环境变量。
- 依赖：`ai@7.0.57`、`@ai-sdk/openai-compatible@3.0.26` 已安装（`createOpenAICompatible` 支持 `.embeddingModel()`，见 node_modules 内 CHANGELOG）；无需新依赖。

## 4. 决策或假设

1. **embedding 模型**：用户指定使用 `.env.local` 中已启用的 `qwen3.7-text-embedding`，密钥 `EMBEDDING_API_KEY`（sk-ws- 千问AI平台）。模型名变量为 `EMBEDDING_MODEL_NAME`（注意：`.env.local` 当前写的是 `MODEL_NAME=qwen3.7-text-embedding`；实现时兼容读取 `EMBEDDING_MODEL_NAME`，缺省回退读取 `MODEL_NAME`，常量缺省 `qwen3.7-text-embedding`，避免断链）。端点走 OpenAI 兼容协议（默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`，与 `ANALYSIS_BASE_URL` 同源，可提供 `EMBEDDING_BASE_URL` 覆盖）。
2. **Provider**：复用 `createOpenAICompatible`（同一 provider name / apiKey / baseURL），`.embeddingModel(modelName)`；不引入 `@ai-sdk/openai`。
3. **向量维度**：**固定 1024**（用户确认，遵循 AGENTS.md §20）。写库前校验 embedding 长度 = 1024；长度不符则记录失败且不入库（避免数据库 vector 维度约束报错）。
4. **待分析 vs 待回填**：`loadPendingArticles` 当前只返回无 analysis 行的文章。升级后需同时识别「无 analysis 行」与「有 analysis 行但 embedding 为空」两类：
   - 无 analysis 行 → 跑完整分析 + 生成 embedding（新文章）；
   - 有 analysis 行、embedding IS NULL → 仅生成 embedding 并**更新**该 analysis 行（回填，不重跑分析）。
   实现时在 JS 中筛选（勿在关联表列上加 `.eq/.is`，§21）。`PendingArticle` 需携带可选 `analysisId`（回填时用于 update）。
5. **保存语义**：分析结果与 embedding 先后保存。为避免「analysis insert 成功、embedding 失败」遗留半成品，采用：insert analysis 行（含空 embedding）→ 生成 embedding → update 该行 embedding → 全部成功后 update `articles.analyzed_at`。若 embedding 失败：新文章保留 analysis 行但 embedding 为 NULL（下次运行回填），并记失败；不设置 analyzed_at。回填路径：直接 update 已有 analysis 行的 embedding。
6. **embedding 文本输入**：使用文章 `title + raw_text`（截断到 `EMBEDDING_MAX_CHARS`，如 8000），与摘要无关。
7. **相关文章查询**：`getRelatedArticles(articleId, embedding)` 用 service-role 客户端 → `article_analyses` 关联 `articles` / `sources`，`embedding` 非空、`articles.analyzed_at is not null`、`article_id != 当前文章`，按 `embedding <=> 当前 embedding` 升序，limit 5；在 JS 中过滤/映射（关联表列不加 `.eq/.is`）。经 `@supabase/supabase-js` 的 RPC 或直接 `.from('article_analyses').select(...).neq('article_id', ...)` 需要向量运算——**用 `supabase.rpc` 调用一个 SQL 函数**（在 schema 中新增 `get_related_articles` SECURITY INVOKER 函数，接受 `p_article_id uuid`、`p_embedding vector`，返回关联文章行）是最稳妥做法，避免 supabase-js 对 `vector` 类型与 `<=>` 运算的表达限制。也可用 `.from('article_analyses').select(..., embedding).neq().embedding ? 距离` —— 方案在实现时按 supabase-js 已装版本能力定，但**首选 RPC 函数**（向量比较运算放 SQL 层）。
8. **详情页 UI**：在正文下方、SubscribeBar 之前，新增「Related Stories」横向/网格卡片区（复用 NewsCard 或轻量列表卡片），展示标题、来源、日期；无 embedding 时不渲染该区块。视觉沿用现有令牌（`text-body-md`、`text-caption`、`border-border`、`rounded-lg`、`bg-bg-primary` 等）。
9. **schema / types 同步**：`embedding` 字段变更需同步 `supabase/schema.sql`（含 `create extension if not exists vector`、`alter table ... add column embedding vector(1024)`、IVFFlat 余弦索引）与 `lib/supabase/types.ts`，并在测试前于 Supabase Dashboard → SQL Editor 执行对应 ALTER SQL。

## 5. 可能更改的文件

修改：
- `supabase/schema.sql` — `create extension vector`；`article_analyses` 增加 `embedding vector(1024)` 列 + IVFFlat 余弦索引；新增 `get_related_articles(p_article_id, p_embedding)` SQL 函数（SECURITY INVOKER）
- `lib/supabase/types.ts` — `article_analyses` 增 `embedding: number[] | null`（Row / Insert / Update）
- `lib/ai/constants.ts` — 增 `DEFAULT_EMBEDDING_MODEL`、`EMBEDDING_DIMENSIONS = 1024`、`EMBEDDING_MAX_CHARS`、`DEFAULT_EMBEDDING_BASE_URL`
- `lib/ai/types.ts` — `PendingArticle` 增可选 `analysisId`；`AnalysisResult`/summary 增 embedding 计数与失败原因
- `lib/ai/analyze.ts` — 升级 `loadPendingArticles`（识别回填）、新增 embedding 生成函数、`storeAnalysis` 拆分 insert/update 语义
- `lib/supabase/queries/articles.ts` — 新增 `getRelatedArticles`
- `lib/article/types.ts` — 新增 `RelatedArticle` 类型 + 详情视图含 `relatedArticles`
- `app/article/[slug]/page.tsx` — 组合「相关文章」模块
- `.env.example` — 增 `EMBEDDING_MODEL_NAME`、`EMBEDDING_API_KEY`、`EMBEDDING_BASE_URL`（可选）

新增：
- `components/article/related-articles.tsx` — 相关文章卡片区（或复用之）
- （可选）`lib/ai/embed.ts` — 独立的 embedding 生成/写库辅助模块

## 6. 实施要求

1. **SQL（schema + 手工执行）**：
   ```sql
   create extension if not exists vector;
   alter table public.article_analyses
     add column if not exists embedding vector(1024);
   create index if not exists article_analyses_embedding_idx
     on public.article_analyses
     using ivfflat (embedding vector_cosine_ops)
     with (lists = 100);
   ```
   （IVFFlat 在数据量大时需 `create index` 前先有数据；空表建索引亦可，或用 HNSW 备选——实现时按 Supabase Dashboard 实际行为决定。）
   `get_related_articles` 函数：
   ```sql
   create or replace function public.get_related_articles(
     p_article_id uuid,
     p_embedding vector
   ) returns table (... ) language sql stable security invoker as $$ ... $$;
   ```
2. **嵌入生成**：`import { embed } from "ai"`，`model = provider.embeddingModel(modelName)`，`const { embedding } = await embed({ model, value })`，返回 `number[]`；校验维度 = 1024。
3. **流水线升级**（§6 决策 4/5）：两类文章分流处理，embedding 失败记 `embedding_failed` 且不设置 analyzed_at；控制台 `[analyze]` 前缀日志与 `logs` 表双写，摘要含 `embeddingsGenerated`、`embeddingFailed`、`backfilled` 等计数。
4. **相关文章查询**：`getRelatedArticles(articleId, embedding)` 走 service-role；若用 RPC 则传 embedding 为数组；返回最长 5 条（标题、slug、来源名、published_at）。
5. **详情页**：`getArticleBySlug` 顺带读当前文章 embedding（或不读，改由页面查询），`getRelatedArticles` 结果传给 `RelatedArticles`；无 embedding 时不渲染。
6. **环境变量**：`.env.example` 与 AGENTS.md §21 表同步新增 `EMBEDDING_MODEL_NAME` / `EMBEDDING_API_KEY` / `EMBEDDING_BASE_URL`（可选）。

## 7. 安全要求

- `EMBEDDING_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY` 仅服务端；不进入浏览器代码、日志、响应体。
- 相关文章查询只在服务端用 service-role；`get_related_articles` 若为 SQL 函数用 `SECURITY INVOKER`（不 `SECURITY DEFINER`），并仅公开读取已分析文章（复用 RLS 语义或客户端侧过滤）。
- 向量值不打入日志（只记维度/长度与文章 ID）。
- 不删除、不重置任何文章/分析行；仅追加或回填 embedding。

## 8. 验收标准

- SQL 执行后，`article_analyses` 存在 `embedding vector(1024)` 列与 IVFFlat 余弦索引；Dashboard 已启用 pgvector。
- `POST /api/analyze` 分析新文章时：analysis 行写入且 embedding 非空、`analyzed_at` 已设置；embedding 长度为 1024。
- 对已有 analysis 行但 embedding 为 NULL 的文章，再次运行不重跑分析，仅回填 embedding。
- `getRelatedArticles` 返回最多 5 篇余弦相似文章，且排除当前文章、只含已分析且有 embedding 的文章。
- 详情页在正文下方展示「相关文章」区；当前文章无 embedding 时不显示该区。
- `npm run typecheck`、`npm run lint`、`npm run build` 全部通过。
- `AGENTS.md` §21 环境变量表与 `.env.example` 已同步本次新增变量。

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（新增 SQL 函数 / 路由 / 服务端模块 / 组件）

## 10. 实施后期望的确切手动检查步骤

前置：`.env.local` 已含 `EMBEDDING_API_KEY` 与 `MODEL_NAME=qwen3.7-text-embedding`（已存在）；Supabase Dashboard 已启用 pgvector 扩展并执行第 6 节 SQL。

1. Supabase Dashboard → SQL Editor 执行第 6 节 SQL；`select * from pg_extension where extname='vector'` 确认启用；`\d article_analyses` 可见 `embedding vector(1024)`。
2. `npm run dev`，观察终端 `[analyze]` 日志。
3. 分析并生成 embedding：
   ```bash
   curl.exe -X POST http://localhost:3000/api/analyze `
     -H "Content-Type: application/json" `
     -H "x-biasly-admin-secret: <你的值>" `
     -d "{}"
   ```
   预期：日志显示每篇分析 + embedding 生成成功，摘要含 `embeddingsGenerated`。
4. Supabase 查询：`select article_id, vector_dims(embedding) from article_analyses;` 应为 1024；`select count(*) from article_analyses where embedding is null;` 应为 0。
5. 回填验证：手动将某已分析行 `embedding` 置 NULL，再次运行 `/api/analyze`，应仅补 embedding、不重跑完整分析（摘要中 `backfilled` 计数增加）。
6. 详情页：打开某有 embedding 的文章 `/article/[slug]`，正文下方出现「Related Stories」区，展示最多 5 篇相似文章；打开无 embedding 的文章（若存在），不显示该区。
7. 错误密钥请求 → 401；`GET /api/analyze` → 405。
