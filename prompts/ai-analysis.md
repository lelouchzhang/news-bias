# biasly AI 文章分析（AGENTS.md §19；模型按本次命令使用 qwen3.7-plus）

## 1. 目标

实现 AI 文章分析流程（AGENTS.md §19），**不包含** §20（pgvector / embedding / 关联文章）。

- 新增 `POST /api/analyze`：携带 `x-biasly-admin-secret` 请求头（§15），默认处理所有待分析文章，支持可选 `articleIds` / `limit`
- 待分析检测使用 **LEFT JOIN**（§19 必需行为 1）：`article_analyses` 无对应行的文章视为待分析，不依赖 `analyzed_at IS NULL`
- 分析模型：**qwen3.7-plus**（OpenAI 兼容接口），密钥与模型名来自 `.env.local` 中的 `ANALYSIS_API_KEY` / `ANALYSIS_MODEL_NAME`
- 保存前用 Zod 校验 AI 输出；无效输出重试一次后标记失败，绝不保存错误分析（§19）
- 仅在 `article_analyses` 行成功保存后才设置 `articles.analyzed_at`
- 按 `ANALYSIS_BATCH_SIZE`（默认 5）分批；全量运行时持续处理直至无待处理文章（§19 必需行为 3）
- 运行期间输出整洁的控制台日志（前缀 `[analyze]`）并写入 `logs` 表；结束时输出摘要对象
- 实现完成后按用户要求更新 `AGENTS.md` 相关部分（模型/环境变量），并同步 `.env.example`

**本次不做**（后续任务）：§20 的 embedding 列与向量回填、`getRelatedArticles`、详情页“相关文章”区块；§18 Oxylabs 调度器 / Vercel Cron；UI 改动（文章卡片与详情页已能展示分析字段，无需修改）。

## 2. 使用的技能

- `.agents/skills/supabase`（用户指定）：service-role 写入、RLS 边界、supabase-js 查询模式（不在关联表上使用 `.eq('foreignTable.column', ...)`，见 AGENTS.md §21）、schema / types 同步约定
- `.agents/skills/ai-sdk`：安装 `ai` 与 `@ai-sdk/openai-compatible` 后，**以 `node_modules/ai/docs/` 与 `node_modules/@ai-sdk/openai-compatible/docs/` 的已装版本为准**核对 `generateObject` / `createOpenAICompatible` 用法，不凭记忆写 API
- `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`：Next.js 16.2.12 Route Handler 约定
- 已联网核对的官方资料：
  - 千问 AI 平台文档：`sk-ws-` 前缀为平台通用 API Key；OpenAI 兼容 Base URL 为 `https://dashscope.aliyuncs.com/compatible-mode/v1`；模型名如 `qwen3.7-plus`
  - 千问 AI 平台 OpenAI Chat API 参考：`POST /compatible-mode/v1/chat/completions`，支持 `response_format`：`text` / `json_object` / `json_schema`；qwen3.7-plus 支持 `enable_thinking`（非标准 OpenAI 参数，经 extra body 传入）

## 3. 已有代码检查

- `supabase/schema.sql`：`article_analyses` 字段完整（含 `bias_score` 生成列、百分比和=100 的 check），**尚无 embedding 列**（§20 范围外）；RLS 与显式 GRANT 已就绪；本任务**不改 schema**
- `lib/supabase/types.ts`：与 schema 同步，`article_analyses` 无 embedding 字段；本任务**不改 types**
- `lib/supabase/server.ts`：已有 `createServiceRoleClient()`（`server-only`），直接用于分析写入
- `app/api/scrape/route.ts` + `lib/scraper/admin.ts`：POST + `isAuthorizedAdminRequest` 既有模式，`/api/analyze` 复用
- `lib/scraper/log.ts`：控制台 + `logs` 表双写模式；分析侧新建 `lib/ai/log.ts`（前缀 `[analyze]`），不复用 scraper 模块避免串扰
- `package.json`：**未安装** `ai` / `@ai-sdk/openai-compatible`；`zod` v4 已安装；`ANALYSIS_BATCH_SIZE` 尚未被引用
- `.env.local`：已有 `ANALYSIS_MODEL_NAME=qwen3.7-plus` 与 `ANALYSIS_API_KEY`（sk-ws- 开头，千问AI平台密钥）；无 base URL 变量
- `.env.example`：目前是 `OPENAI_API_KEY=` 占位，需按本次任务替换
- `lib/supabase/queries/articles.ts`：首页/详情查询已按 §19 读取分析字段，无需改动
- `prompts/ai-analysis.md`（旧版）：曾覆盖 §19+§20 且分析模型为 DeepSeek；本次重写为仅 §19 + qwen3.7-plus

## 4. 决策或假设

1. **模型与端点**：使用 OpenAI 兼容协议调用 `qwen3.7-plus`；Base URL 默认 `https://dashscope.aliyuncs.com/compatible-mode/v1`（与 `sk-ws-` 密钥及 qwen3.7-plus 北京区域端点一致），提供可选 `ANALYSIS_BASE_URL` 环境变量覆盖；模型名取 `ANALYSIS_MODEL_NAME`（缺省回退 `qwen3.7-plus`）；密钥取 `ANALYSIS_API_KEY`。
2. **Provider**：使用 `@ai-sdk/openai-compatible`（用户以本次命令覆盖 AGENTS.md 中的 DeepSeek provider 方案），而非 `@ai-sdk/deepseek`。首选 `generateObject` + Zod schema（端点支持 `response_format: json_schema`，官方文档已确认）；若运行时该端点对 json_schema 支持不佳，回退为 `generateText` + JSON 提取 + Zod 校验（回退方案在代码中以注释说明）。
3. **关闭思考模式**：对 qwen3.7-plus 显式传 `enable_thinking: false`（provider 的 extra body 能力），避免 reasoning tokens 增加成本、保证结构化输出稳定。
4. **待分析检测**：仅用 LEFT JOIN（`article_analyses.id is null`）判断待分析（§19 必需行为 1）；不使用 `.eq('article_analyses.id', ...)` 过滤关联表（§21 红线）；本任务无 embedding 回填逻辑（§20 范围外）。
5. **保存语义**：分析成功后向 `article_analyses` **insert** 全字段行；成功后才 `update articles.analyzed_at = now()`；insert 遇唯一冲突视为“已分析”跳过；`bias_score` 由数据库生成列计算，JS 不写入；不删除、不重置任何文章（§10 精神）。
6. **输出校验**：Zod v4；范围约束（sentiment -1..1、confidence 0..1、百分比 0..100）、枚举约束（sentiment_label / bias_label）、百分比之和 = 100（容差 ±0.01）；百分比四舍五入到 2 位小数后写入 `numeric(5,2)`；校验失败重试一次，再失败标记 failed 且不保存。
7. **LLM 输入**：标题 + 来源名 + 发布日期 + `raw_text`（截断 `ANALYSIS_MAX_CHARS = 8000`）；提示词要求“AI 评估、非客观事实”，仅依据文章文本证据，不因来源名下结论（§19）。
8. **分批**：`ANALYSIS_BATCH_SIZE`（默认 5）；批间串行、批内串行（简单可靠，避免触发限流）；全量运行循环直至无待处理文章，不硬编码“只分析 10 篇”。
9. **框架标签规则**（§19）：占比最高一方为准；比例接近或置信度低时用 `mixed` / `unclear`；证据不足时 `unclear` 且置信度低。
10. **日志与摘要**：控制台 + `logs` 表双写，前缀 `[analyze]`；摘要对象含状态、检查总数、已分析、已跳过、失败数、按原因分组的失败数、总耗时、模型名。
11. **AGENTS.md 修改范围**（实现后执行，用户已授权）：§6 技术栈中 “Deepseek provider” 改为 qwen3.7-plus（OpenAI 兼容 provider）；§19 增加模型与环境变量说明；§21 环境变量表用 `ANALYSIS_MODEL_NAME` / `ANALYSIS_API_KEY`（+ 可选 `ANALYSIS_BASE_URL`）替换 `OPENAI_API_KEY`；同步 `.env.example`。§20 保持原样（仍为 OpenAI text-embedding-3-small，待 §20 任务时再改）。
12. **不影响既有抓取/调度代码**：新建独立 `lib/ai/*` 模块；未来 Cron 管道（§18）可直接复用 `runAnalysisPipeline`。

## 5. 可能更改的文件

新增：

- `lib/ai/constants.ts` — 集中限值：`DEFAULT_ANALYSIS_MODEL = "qwen3.7-plus"`、`DEFAULT_ANALYSIS_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1"`、`ANALYSIS_MAX_CHARS = 8000`、`ANALYSIS_RETRY_LIMIT = 1`、默认批次/超时等
- `lib/ai/types.ts` — `AnalysisResult`（已校验输出）、`PendingArticle`、`AnalysisRunSummary` 等
- `lib/ai/schema.ts` — Zod 分析输出 schema（§19 全部字段 + refine）
- `lib/ai/prompt.ts` — 系统提示词
- `lib/ai/analyze.ts` — 分析流水线（待分析检测、分批、调用、校验、写库、日志、摘要）
- `lib/ai/log.ts` — 控制台 + `logs` 表双写（`[analyze]` 前缀）
- `app/api/analyze/route.ts` — `POST /api/analyze`

修改：

- `package.json` / `package-lock.json` — 安装 `ai`、`@ai-sdk/openai-compatible`（锁定版本并提交 lockfile）
- `.env.example` — 环境变量替换
- `AGENTS.md` — §6 / §19 / §21 相关部分（见决策 11）

不改：`supabase/schema.sql`、`lib/supabase/types.ts`、现有 UI 与抓取代码。

## 6. 实施要求

### 6.1 依赖

```bash
npm install ai @ai-sdk/openai-compatible
```

锁定版本并提交 lockfile（ai-sdk 技能要求）。安装后先读 `node_modules/ai/docs/` 与 `node_modules/@ai-sdk/openai-compatible/docs/`，以已装版本为准核对 `generateObject`、`createOpenAICompatible`、extra body 传参方式。

### 6.2 分析输出 schema（`lib/ai/schema.ts`）

字段（camelCase，映射 snake_case 列）：

- `summary: string`
- `sentimentScore: number`（-1..1）
- `sentimentLabel: "positive" | "neutral" | "negative"`
- `politicalFramingLabel: "left" | "center" | "right" | "mixed" | "unclear"`
- `leftPercentage` / `centerPercentage` / `rightPercentage`（0..100，三者之和 = 100，±0.01 容差 refine）
- `confidence: number`（0..1）
- `framingNotes: string`
- `loadedTerms: string[]`
- `disclaimer: string`

写库时：百分比四舍五入到 2 位小数；`bias_score` 由数据库生成列计算；`model` 存实际使用的模型名。

### 6.3 系统提示词（`lib/ai/prompt.ts`）

要求模型输出：中立、事实性摘要（不站队）；情感分数与标签；政治立场框架百分比（和必须为 100）与标签（占比最高方；接近或证据不足用 mixed / unclear）；置信度（低证据 → unclear + 低置信度）；立场框架说明；倾向性词汇列表；免责声明。强调“AI 评估，非客观事实”、仅依据文章文本、不因新闻源名称下结论。

### 6.4 分析流水线（`lib/ai/analyze.ts`）

1. `createServiceRoleClient()`（server-only）
<!-- 2. 加载待分析文章：`articles` LEFT JOIN `article_analyses`，条件 `article_analyses.id is null`（supabase-js 用 `.is("article_analyses.id", null)`，**不要**用 `.eq('foreignTable.column', ...)`），带出 `title / raw_text / published_at / sources(name)` -->
2. 加载待分析文章：`articles` 嵌入选择 `article_analyses(id)`，带出 `title / raw_text / published_at / sources(name)`；**不要**在关联表列上加过滤（`.eq()` / `.is()` 均不可），改为在 JavaScript 中筛选“无 `article_analyses` 关联行”的文章
3. 应用 `articleIds` / `limit` 过滤（缺省 = 全部待分析）
4. 按 `ANALYSIS_BATCH_SIZE` 分批（默认 5），批间串行、批内串行
5. 每篇文章：
   - 调用 `generateObject`（qwen3.7-plus，schema 校验）；失败重试一次 → 仍失败记 `failed`（reason: `analysis_failed`），不保存
   - 校验通过 → insert `article_analyses` 全字段行
   - insert 成功后 `update articles.analyzed_at = now()`
   - insert 唯一冲突 → 视为已分析，跳过
   - 其他写库错误 → `failed`（reason: `insert_failed`）
6. 日志：运行开始 / 待处理数量 / 每批进度（已分析、已跳过、失败）/ 完成；摘要对象含状态、检查总数、已分析、已跳过、失败数、按原因分组的失败数、总耗时、模型名
7. 摘要对象返回给 API 路由

### 6.5 API 路由（`app/api/analyze/route.ts`）

- `POST /api/analyze`（§14）；`runtime = "nodejs"`、`maxDuration = 300`
- 复用 `isAuthorizedAdminRequest`，缺失/错误密钥返回 401（§15）
- zod 校验请求体：`{ articleIds?: string[] (uuid), limit?: number (>= 1) }`；非法请求体返回 400
- 内部异常返回 500 + 错误信息（不泄露密钥）；成功返回 `{ summary }`
- 其他方法返回 405

### 6.6 环境变量与文档同步

- `.env.example`：新增 `ANALYSIS_MODEL_NAME=qwen3.7-plus`、`ANALYSIS_API_KEY=`、`ANALYSIS_BASE_URL=`（可选，默认千问AI平台端点）；移除 `OPENAI_API_KEY=`
- `AGENTS.md`：按决策 11 修改 §6 / §19 / §21，保持环境变量表与 `.env.example` 一致

## 7. 安全要求

- `ANALYSIS_API_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`BIASLY_ADMIN_SECRET` 仅服务端；不得出现在浏览器代码、日志、响应体中
- 涉及路由/服务端逻辑的新模块加 `import "server-only"`
- 密钥不进 URL 查询串；日志只记文章 ID 与截断信息，不打完整提示词或整篇 `raw_text`
- 只新增/更新目标文章的 analysis 行，不删除、不重置文章（仅追加精神）
- 无效 AI 输出绝不入库

## 8. 验收标准

- `POST /api/analyze`（正确 admin secret）处理全部待分析文章：控制台有整洁的逐批日志，响应含完整摘要对象；Supabase 中 `article_analyses` 新增行、`articles.analyzed_at` 已设置；首页出现已分析文章卡片
- LEFT JOIN 待分析检测生效：仅无 analysis 行的文章被处理
- Zod 校验：无效输出重试一次后标记失败、不保存错误分析；百分比和 = 100；标签受枚举约束
- 缺失/错误 admin secret → 401；`GET /api/analyze` → 405
- `npm run typecheck`、`npm run lint`、`npm run build` 全部通过
- `AGENTS.md` 与 `.env.example` 已同步本次模型/环境变量改动

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（新增路由与多个服务端模块，必须运行）

## 10. 实施后期望的确切手动检查步骤

前置：`.env.local` 已含 `ANALYSIS_MODEL_NAME=qwen3.7-plus` 与 `ANALYSIS_API_KEY`（已存在，无需改动；如自定义端点再加 `ANALYSIS_BASE_URL`）。

1. `npm run dev`，观察终端（分析进度会输出，前缀 `[analyze]`）
2. 默认全量分析：
   ```bash
   curl -X POST http://localhost:3000/api/analyze ^
     -H "Content-Type: application/json" ^
     -H "x-biasly-admin-secret: <你的值>" ^
     -d "{}"
   ```
3. 指定文章 / 数量：
   ```bash
   curl -X POST http://localhost:3000/api/analyze ^
     -H "Content-Type: application/json" ^
     -H "x-biasly-admin-secret: <你的值>" ^
     -d "{\"articleIds\":[\"<article-uuid>\"],\"limit\":1}"
   ```
4. 预期：终端逐批日志（待处理数 → 每篇成功/失败 → 摘要对象）；响应含 `summary`（`articlesAnalyzed`、`skipped`、`failed`、`failuresByReason`、`totalDurationMs`、`model` 等）
5. Supabase 检查：`article_analyses` 新增行（各字段齐全、`bias_score` 已由数据库生成、百分比和 = 100）、`articles.analyzed_at` 已设置、首页出现已分析文章卡片
6. 错误密钥请求 → 401；`curl http://localhost:3000/api/analyze`（GET）→ 405
