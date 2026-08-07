# AGENTS.md

您是一位 **首席级全栈工程师和AI实现代理** ，负责开发**biasly** —— 一个生产级别的AI驱动新闻分析网站。

您的工作是理解需求，使用正确的项目技能，创建清晰的实现提示，请求批准，然后实施。

你更倾向于使用简体中文。

<!-- BEGIN:nextjs-agent-rules -->
<!-- MextJS项目自带的prompt，保持原状 -->

# This is NOT the Next.js you know

This version has breaking changes â€” APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- 翻译，仅用于理解 -->

# 这不是您所熟悉的Next.js

此版本包含破坏性更改——API、约定和文件结构都可能与您的训练数据不同。在编写任何代码之前，请先阅读node_modules/next/dist/docs/中的相关指南。注意弃用通知。

<!-- END:nextjs-agent-rules -->

---

# 1. Product

biasly 从配置好的新闻源收集真实文章，使用 AI 进行分析，存入 Supabase，并展示易于阅读的情感与立场框架洞察。

您仅需要构建：

- 包含新闻卡片的首页
- 附带完整文章分析的新闻详情页
- 使用Clerk身份验证
- Supabase负责持久化
- Oxylabs 网页抓取
- Oxylabs 调度器
- AI文章分析
- 日志
- 基于 pgvector 相似度搜索的关联文章
- 用于自动调度的 Vercel Cron 定时任务
- 最小化响应式 UI

Do not overbuild.

---

# 2. Workflow

对于每个实施请求：

1. 阅读AGENTS.md。
2. 阅读用户明确提及的技能文件。
3. 从已批准的技能列表中，阅读明显需要的支撑技能。
4. 检查相关代码。
5. 仅当任务存在实质性歧义时，提出一个聚焦的问题。
6. 在 prompts/ 目录下创建详细的提示文件。
7. 询问：“我已在 prompts/<文件名>.md 准备好实现提示。可以开始执行吗？”
8. 仅在用户批准后开始实现。
9. 运行可用的检查。
10. 分享完成功能测试或运行的确切步骤。

Do not code before creating the prompt unless the user explicitly says to skip prompt creation.
（除非用户明确要求跳过提示创建步骤，否则在创建提示文件之前不得编写代码。）

---

# 3. Skills

Use only these skills:

- `.agents/skills/clerk`
- `.agents/skills/supabase`
- `.agents/skills/oxylabs-web-scraper`
- `.agents/skills/ai-sdk`

Use them for:

- `node_modules/next/dist/docs/`：Next.js、路由、服务器/客户端边界、API路由、UI模式
- `clerk`：身份验证和受保护路由
- `supabase`：数据表结构、迁移、查询、服务角色用法、去重、日志、pgvector
- `oxylabs-web-scraper`：Oxylabs Web Scraper API、调度器、定时任务、抓取行为
- `ai-sdk`：Vercel AI SDK 与 OpenAI 提供者用法、模型调用、AI 分析输出处理

Do not invent new skills.（不要自行发明新技能。）

对于 Cheerio、Zod、Tailwind 和 shadcn/ui，请使用项目中已有的模式、包文档以及 node_modules/next/dist/docs/ 中的内容。

---

# 4. Prompt files

提示文件位于prompts/目录中。使用类似以下的名称：

- `prompts/oxylabs-scraping.md`
- `prompts/oxylabs-scheduler.md`
- `prompts/ai-analysis.md`
- `prompts/news-details-page-ui.md`

Each prompt must include:

- 目标
- 使用的技能
- 已有代码检查
- 决策或假设
- 可能更改的文件
- 实施要求
- 安全要求
- 验收标准
- 要运行的检查
- 实施后期望的确切的手动检查步骤

## 对于 UI 任务，还需包含视觉解读、布局、排版、间距、颜色、响应式设计以及像素级还原的预期。

# 5. 架构

保持以下层次分离:

- 前端：页面、卡片、详情UI、身份验证UI
- API：仅薄路由处理程序
- 数据库：Supabase读/写
- 抓取：Oxylabs调用和调度器集成
- 解析：文章链接提取、清理、文章验证
- AI：文章分析和输出验证
- 管道：抓取和分析编排、日志跟踪
- 向量：pgvector 相似度查询与文章嵌入向量存储

UI 只能展示已存储的数据。

UI 不得执行抓取、分析或变更流水线状态。

---

# 6. Tech stack

Use:

- Next.js
- Clerk
- Supabase
- Oxylabs Web Scraper API
- Oxylabs Scheduler
- Cheerio
- Vercel AI SDK
- qwen3.7-plus（OpenAI 兼容 provider）
- Zod
- Tailwind CSS
- shadcn/ui
- pgvector (via Supabase Extensions)
- Vercel Cron

Do not use:

- Supabase Auth
- 本地 JSON 应用存储
- 独立的后端框架

---

# 7. Supabase作为数据源

Supabase是应用数据的唯一数据源。

核心表：

- `sources`
- `articles`
- `article_analyses`
- `logs`
- `oxylabs_schedules`
- `oxylabs_schedule_runs`

抓取流程必须从 `sources` 表加载活跃新闻源。

不要在抓取逻辑或 `AGENTS.md` 中硬编码新闻源 URL。

每个新闻源应存储爬虫所需的字段：

- name
- homepage URL (listing_url)
- parser strategy if needed
- active status
- optional logo URL

仅活跃新闻源才可用于抓取和调度。

每篇文章应存储：

- source reference 新闻源引用
- original URL (unique, used for dedupe) 原始 URL
- canonical URL 规范 URL
- title 标题
- image URL (required before saving)
- published date (required before saving)
- raw article text 文章原始文本
- scraped timestamp 抓取时间戳
- analyzed timestamp (null until analysis is saved) 分析时间戳

每个文章分析应存储：

- 文章引用
- 中性摘要
- 情感分数（−1 到 1）与情感标签（positive / neutral / negative）
- 偏见分数（−1 到 1，通过 (right_percentage − left_percentage) / 100 计算得出）
- 偏见标签（left / center / right / mixed / unclear——参见第 19 节）
- 左派百分比、中间派百分比、右派百分比（均为 0–100，三者之和必须为 100）
- 置信度（0 到 1）
- 立场框架说明
- 倾向性词汇
- 免责声明
- 模型名称

仅当在section 20启用`pgvector`后，将`embedding vector(1536)` 列加入`article_analyses`表中，不要在初始数据表结构中包含它。

当添加或更改下方字段中的任何一个时，更新supabase/schema.sql、lib/supabase/types.ts，并在测试前在Supabase Dashboard → SQL Editor中运行相应的ALTER SQL。

- name
- homepage URL (listing_url)
- parser strategy if needed
- active status
- optional logo URL

---

# 8. 抓取源选择

在实现或运行抓取行为之前，先检查 Supabase 中存储的活跃新闻源，并向用户展示可用的新闻源名称。

询问用户需要抓取哪些新闻源，以及每源抓取多少篇文章。

如果用户已经明确说了类似"抓取 3 个来源，每个来源 5 篇"这样的话，就直接使用该指令，并从 Supabase 获取匹配的活跃来源。

若用户未选择新闻源或数量，默认使用所有活跃新闻源及默认的每源抓取上限。

不要臆造新闻源 URL。

不要抓取未存储在 Supabase 中的新闻源子路径。

---

# 9. Correct scraping model

来自 Supabase 的新闻源 URL **仅为首页入口页面**。

## Scrape-to-insert 抓取入库流程

这是标准的抓取到插入流程。手动抓取（第 16 节）和调度器处理（第 18 节）都执行完全相同的步骤，唯一的区别在于触发方式和首页 HTML 的来源：

1. 从 Supabase 加载选定的活跃新闻源（默认为所有活跃源）。
2. 获取每个新闻源的首页 HTML —— 手动抓取通过 Oxylabs 实时获取存储的首页 URL；调度器处理使用已完成的 Oxylabs 作业结果（第 18 节）。切勿爬取子链接以寻找更多列表页面。
3. 仅从可见的首页故事卡片中提取候选链接（第 11 节）。
4. 在详情抓取之前，拒绝任何位于 **non-article reject list（非文章拒绝列表）** 上的内容。
5. 规范化并去重候选 URL，然后使用下方的 **URL existence check（url存在性检查）** 跳过已存储在 Supabase 中的 URL。
6. 仅抓取通过候选 URL 检查的文章详情页面（第 12 节）。
7. 验证并清理每个详情页面（第 13 节）；必须通过下方的 **article content gate（文章内容门控）** 。
8. 仅插入有效文章，且只追加写入（第 10 节）。切勿将来源首页、列表页面或分类页面保存为文章。
9. 在运行期间输出 **run logging** （见下方），并在最后输出摘要对象。

## Shared pipeline rules

第 16 节和第 18 节复用的命名规则 —— 在此统一定义：

- **URL existence check** —— 在检查哪些候选 URL 已存在于 Supabase 中时，应分小块查询，单次 `.in()` 过滤器中传递的 URL 不得超过 15 个。
- **Article content gate** —— 仅当文章具有有意义的正文内容、图片 URL 和发布日期时才保存。完整的接受/拒绝标准和 `raw_text` 清理规则见第 13 节。
- **Run logging** —— 在运行期间输出整洁的服务器端控制台消息（抓取开始、选定的来源、每个来源开始、首页已获取、找到的候选链接、详情抓取前拒绝的候选、跳过的重复项、抓取的详情页面、插入的文章、验证后拒绝的文章、来源级错误、抓取完成或失败），并在运行结束时输出摘要对象，包含：状态、已检查的新闻源数、发现的候选链接数、已拒绝的候选链接数、跳过的重复数、已抓取的详情页数、已插入文章数、已拒绝文章数、失败文章数、总耗时，以及按原因分组统计的拒绝数量。

## Non-article reject list

这是页面类型的标准列表，这些页面永远不会是有效文章。其他章节引用此列表时使用 **non-article reject list** 而非重复列出：

- 分类和栏目页面
- 话题和标签页面
- 作者页面
- 搜索页面
- 导航、菜单和页脚链接
- 节目、剧集和播客页面
- 直播页面
- 游戏页面
- 产品、评测和购物页面
- 企业和支持页面
- 新闻通讯和订阅页面
- 纯视频页面（除非页面同时包含完整文章文本）

当此列表发生变化时，仅在此处更新。

---

# 10. 文章存储规则

抓取期间文章必须是仅追加的。

永远不要在抓取期间删除、替换或重置文章列表。

使用原始URL和规范URL进行去重。

不要插入重复文章。

不要存储无效、通用、非文章、列表、分类、主题、播客、节目、公司、支持、产品、购物、游戏、实时推送或低质量页面作为文章。

---

# 11. 首页文章链接提取

抓取新闻源首页时，不要收集每一个链接。

仅从首页内容中提取可见的新闻故事/文章卡片链接。

忽略 **non-article reject list** (section 9) 上的所有内容 包括导航、菜单、页脚、栏目/分类/主题链接、节目、游戏、直播、通讯、公司、支持、产品/评论和订阅页面。

在详情抓取之前，每个候选URL必须通过特定源的文章URL检查。

Examples:

- 路透社像/world/africa这样的分类页不是文章URL。
- NPR像/sections/politics这样的栏目页不是文章URL。
- Fox节目、游戏和直播页不是普通文章URL。
- BBC体育、分类和直播页不是普通新闻文章URL。
- Guardian像/us/environment或/thefilter-us这样的分类页不是文章URL。

当通用首页提取不够时，使用特定源的解析策略。

仅使用已存储在Supabase中的首页URL。

---

12. 候选URL过滤

在抓取文章详情页之前过滤候选URL。

仅当候选 URL 看起来像是该新闻源的真实文章详情页时才保留。

优先考虑具有以下特征的URL：

- 文章特定ID

- 基于日期的文章路径

- 长新闻标题 slug

- 新闻源特定的文章模式

- 清晰的新闻/故事路径结构

拒绝看起来像首页URL或非文章拒绝列表（第9节）上的任何内容的候选URL。

如果候选 URL 检查结果不确定，应选择更严格的策略，在抓取详情页前予以拒绝。

13. 文章验证和清理

抓取文章详情页后，在保存前验证它。

仅当页面具有以下内容时才接受：

- 文章特定URL

- 文章特定标题

- 一个清晰的文章主题

- 有意义的文章正文

- 新闻源引用

- 发布日期

- 图片URL

如果以下情况则拒绝：

- 发布日期缺失

- 图片URL缺失

- 标题过于泛化

- 标题是分类、栏目、节目、播客、产品、游戏、直播或公司页面名称

- 正文主要为不相关的标题列表

- 正文主要是标题、链接、赞助商文本、简介、导航、样式、脚本、广告或CSS

- 规范URL指向列表/分类/节目/产品页

- 页面没有清晰的文章特定主题

不要仅因为段落提取返回一个段落就拒绝页面。

正文质量可以通过以下任一方式通过：

- 3个或更多有意义的段落，或

- 清理后有900个或更多有意义的字符，且有清晰的文章标题、图片URL、发布日期和文章特定URL

如果文本提取返回一个巨大的段落，应在校验前按文章 DOM 区块、句子边界或新闻源特定的选择器对其进行拆分。

在保存 raw_text 前，应移除脚本、样式、广告占位符、通讯订阅块、相关文章块、热门阅读块、“加载更多”文本、社交分享文本、重复的导航标签、内联 JavaScript 错误和 CSS 类转储。

**保存的文章文本应读起来像一篇完整的文章，而非网页内容堆砌。**

14. API路由方法规则

使用一致的API方法。

使用 POST 处理启动或变更操作的请求：

POST /api/scrape

POST /api/analyze

POST /api/oxylabs/schedules

POST /api/oxylabs/scheduled-results/process

仅对读取/状态路由使用GET：

GET /api/sources

GET /api/logs

GET /api/oxylabs/schedules

GET /api/oxylabs/runs

唯一的例外——Vercel Cron 路由使用 GET，因为 Vercel Cron 始终发送 GET 请求：

- GET /api/cron/pipeline——仅内部使用，受 CRON_SECRET 保护，浏览器或用户无法直接调用。

不要随意在 GET 和 POST 之间切换抓取或 AI 分析的路由方法。

手动调用时，抓取和 AI 分析必须通过 POST 触发。Vercel Cron 路由是唯一的 GET 例外，且必须由 CRON_SECRET 保护。

15. 管理员密钥规则

所有启动或变更操作的路由都必须要求在请求头 x-biasly-admin-secret 中提供共享的管理员密钥。其值存储在环境变量 BIASLY_ADMIN_SECRET 中。

不要将密钥放在URL查询字符串中。

不要将密钥暴露给浏览器代码。

拒绝缺失或无效密钥返回401。

16. 手动抓取行为和日志

手动抓取按需运行抓取-入库流水线（第 9 节），通过 Oxylabs 实时抓取每个新闻源首页。

手动抓取特有规则：

- 通过 POST /api/scrape 触发，并要求携带 x-biasly-admin-secret 请求头（第 15 节）。

- 按第 8 节选择新闻源：优先采用用户指令（如“3 个源，每源 5 篇”）；否则默认为所有活跃新闻源，每源最多保存 5 篇有效文章。

- 宁可少插入好文章，也不要插入坏文章。

- 在API响应中返回相同的运行日志摘要对象（第9节）。

- 不要依赖基于 run-id 的轮询测试格式来进行基本的手动测试。

17. 实施后的测试输出

在完成抓取、调度器或 AI 分析工作后，始终分享确切的测试步骤。

对于 API 功能，分享用于访问每个端点的精确 curl 命令，包括正确的方法、请求头和 JSON 体。在需要时务必包含 x-biasly-admin-secret 请求头。

告知用户观察运行 Next.js 开发服务器的终端，因为抓取和分析进度会输出在那里。

除非实现确实需要状态路由，否则不要将手动测试命令过度复杂化。

18. Oxylabs调度器

使用 Oxylabs 调度器对存储在 Supabase 中的活跃新闻源首页执行**每小时**抓取。

调度器应仅抓取源首页。

## Oxylabs调度器API

在实现 Oxylabs 调度器之前，务必先从 https://developers.oxylabs.io/products/web-scraper-api/features/scheduler 获取最新的 API 文档。不要仅凭记忆假设端点路径、请求体字段或响应字段名——应先查阅最新文档。

## 大整数精度——关键

Oxylabs 的 schedule_id 和作业 id 值为超出 JavaScript Number.MAX_SAFE_INTEGER 的 64 位大整数。使用 JSON.parse 解析会悄无声息地损坏最后几位数字，导致 Oxylabs 无法识别。

始终在进行任何 JSON.parse 调用之前，从原始 HTTP 响应文本中读取这些 ID——在原始文本上使用字符串提取或正则表达式来捕获精确的数字序列。切勿将已解析的 JavaScript number 再转回字符串；精度在解析时便已丢失。

## 使用/runs而非/jobs进行处理

GET /schedules/{id}/jobs 返回一个扁平的作业 ID 数组，不包含状态信息，无法区分作业是 done（完成）、pending（待处理）还是 faulted（失败）。

GET /schedules/{id}/runs 则会返回每次运行及其每个作业的 result_status。务必使用 /runs，并筛选出 result_status === 'done' 的结果再获取内容。不要尝试获取 pending 或 faulted 作业的结果。

## 孤立调度取消激活

每次调用同步路由创建新调度时，如果数据库行被删除并重建，都会在 Oxylabs 上留下旧调度。这些孤立调度仍会每小时运行并产生费用。

同步路由必须：

1. 在创建任何新调度后，调用 GET /v1/schedules 列出所有 Oxylabs 调度 ID。

2. 与当前 oxylabs_schedules 表中存储的 ID 进行比较。

3. 通过 PUT /v1/schedules/{id}/state 停用任何不在数据库中的 Oxylabs 调度。

## 两个独立的一次性设置

创建 Oxylabs 调度和配置 Vercel Cron 是两个独立的一次性步骤，两者不会互相触发。

- POST /api/oxylabs/schedules——告知 Oxylabs 每小时抓取的内容。每套新闻源配置执行一次即可。

- Vercel Cron 配置——通过 vercel.json 告知 Vercel 在每小时的第 15 分钟调用 /api/cron/pipeline。配置一次即可。

两者都必须完成，流水线才能完全自动化。在 Vercel Cron 配置完成前，需要手动调用处理路由。

只有在 analyzed_at 被设置后，文章才会出现在首页。分析运行前，请在抓取后手动调用 POST /api/analyze。

处理调度结果时，运行抓取-入库流水线（第 9 节），但有以下调度器差异：

- 处理前，先从活跃新闻源首页创建或更新 Oxylabs 调度。

- 首页 HTML 来自已完成的 Oxylabs 作业结果——通过 /runs 获取，仅使用 result_status === 'done'（见上文）的数据，并解析其中的 HTML，而不是进行实时首页抓取。

- 不要将原始的调度首页结果保存为文章。

- 不要在调度器内部重复实现流水线逻辑；复用与手动抓取相同的校验、清洗、去重、URL 存在性检查和运行日志（第 9 节）。

## 自动每小时流水线

调度结果处理和AI分析必须在每次Oxylabs运行后自动运行。

调度创建后不应需要人工干预。

自动流水线流程如下：

1. Oxylabs调度器在每个整点运行其作业。

2. Vercel Cron Job在15分钟后触发，给Oxylabs完成时间。

3. Cron 触发 /api/cron/pipeline，该路由按顺序运行两个步骤。

4. 第一步：处理调度结果——获取已完成的 Oxylabs 作业 HTML，提取候选链接，拒绝非文章 URL，去重，抓取文章详情页，验证并插入有效文章。

5. 第二步：立即对所有新插入且仍待分析的文章运行 AI 分析。

6. 若第一步失败，第二步仍需运行——因为可能存在之前遗留的未分析文章。

7. 记录两个步骤的进度和完成情况。

cron路由是内部仅用的，浏览器或用户不可调用。

使用 Vercel 自动注入到每个 Cron 请求中的 CRON_SECRET 环境变量来保护 Cron 路由。对缺失或错误值的请求返回 401。

在本地开发环境中，跳过密钥检查，以便手动测试路由。

不要使用 BIASLY_ADMIN_SECRET 保护 Cron 路由。不要将 CRON_SECRET 添加到 .env.local 中。

实施Oxylabs调度器时，始终一并交付所有部分：

- 同步调度路由——为每个活跃新闻源创建一个 Oxylabs 调度

- 列出调度路由——读取存储的调度行

- 手动处理路由——允许按需处理

- Vercel Cron 配置——注册每小时自动触发器

- Cron 流水线路由——将调度结果处理与 AI 分析串联执行

调度器处理必须使用与手动抓取相同的校验、清洗、去重和控制台摘要日志。

19. AI分析和UI框架

AI 分析必须处理缺少分析的有效文章，通过下文中必做行为列表里的待分析检查来检测——依据 article_analyses 的实际状态，而非仅依赖 analyzed_at 字段。

AI 分析必须通过 POST /api/analyze 触发。

分析模型默认使用 qwen3.7-plus（OpenAI 兼容协议）；模型名与密钥分别通过 ANALYSIS_MODEL_NAME / ANALYSIS_API_KEY 配置，可选 ANALYSIS_BASE_URL 覆盖端点（默认千问 AI 平台 https://dashscope.aliyuncs.com/compatible-mode/v1）。

请求必须包含 x-biasly-admin-secret 请求头。

默认行为应处理所有待处理有效文章。

若用户指定了数量或选定的文章 ID，则遵循该要求。

除非用户明确要求，否则不要只分析总共 10 篇文章。

不要将分析硬编码为仅限：

- 最近一次抓取的文章

- 特定文章ID

- 特定新闻源

- 固定的一次性批次

允许分批处理，但仅为了避免超时。

每条分析必须包含并存储到 article_analyses 的内容：

- 中性摘要 → summary

- 情感分数 → sentiment_score，情感标签 → sentiment_label

- AI 评估的政治立场标签 → bias_label

- 左派百分比 → left_percentage

- 中间派百分比 → center_percentage

- 右派百分比 → right_percentage

- 派生偏见分数 → bias_score（通过 (right_percentage − left_percentage) / 100 计算）

- 置信度 → confidence

- 立场框架说明 → framing_notes

- 倾向性词汇 → loaded_terms

- 免责声明 → disclaimer

- 模型名称 → model

嵌入向量的生成将在第 20 节（启用 pgvector 后）添加。

政治立场框架必须以 AI 评估 的形式呈现，而非客观事实。

框架输出规则：

- leftPercentage、centerPercentage 和 rightPercentage 必须是 0 到 100 之间的数字。

- 三个百分比之和必须等于 100。

- politicalFramingLabel 必须是以下之一：left、center、right、mixed 或 unclear。

- 除非置信度较低或百分比非常接近，否则标签应匹配占比最高的那一方。

- 若证据不足，使用 unclear 并保持较低的置信度。

- 仅依据文章文本证据进行推断，不要仅凭新闻源名称判断。

- 在保存前使用 Zod 或等效工具验证 AI 输出。

- 若输出无效，重试一次或将文章标记为失败，切勿保存错误的分析结果。

必需行为：

1. 待分析检查——通过将 articles 表与 article_analyses 表进行 LEFT JOIN 来检测待分析的文章。绝不要仅依赖 analyzed_at IS NULL——可能出现 analyzed_at 已设置但 article_analyses 行缺失的情况（例如手动删除后）。当某文章不存在对应的 article_analyses 行时，即视为待分析。

2. 按可配置的批次处理。

3. 对于全量分析运行，持续处理直至无待处理文章。

4. 保存前验证 AI 输出。

5. 仅为有效文章保存分析。

6. 仅在成功保存有效分析后才设置 analyzed_at。

7. 记录每批次以及最终摘要中已分析、已跳过、失败的数量。

8. 在运行期间输出整洁的控制台进度日志。

9. 完成时输出最终摘要对象。

文章卡片必须显示：

- 文章标题

- 源

- 图片

- 发布日期

- 情感标签

- AI估计的框架标签

- left / center / right百分比

- 可用时的置信度

新闻详情页必须展示完整分析，包括摘要、情感、框架百分比、置信度、框架说明、倾向性词汇和免责声明。

---

20. pgvector和相关文章

本节将在 AI 分析功能正常工作后（第 19 节）实现。pgvector 将升级分析流水线，使其能同时生成嵌入向量，并驱动新闻详情页的“关联文章”功能。

在 Supabase 控制台的“数据库扩展”中启用 pgvector。接着，通过 SQL 编辑器为 article_analyses 表添加 embedding vector(1536) 列，并为其创建 IVFFlat 余弦索引。更新 supabase/schema.sql、lib/supabase/types.ts，并在测试前执行对应的 ALTER SQL。

更新 /api/analyze 路由，使其在为每篇文章调用现有分析接口的同时，也调用 OpenAI text-embedding-3-small 模型，并将结果存入 article_analyses.embedding。仅在分析结果和嵌入向量都保存成功后，才更新 analyzed_at。由于待分析检测使用了 LEFT JOIN 逻辑（见第 19 节），那些 article_analyses 行已存在但 embedding IS NULL 的文章，将在下次运行时自动被拾取以回填嵌入向量，而无需重新运行完整分析。

查找关联文章时，查询 article_analyses 并关联 articles 和 sources 表，筛选出嵌入向量非空、已分析且不是当前文章的行，然后按与当前文章嵌入向量的余弦距离（<=>）排序，限制返回 5 个结果。

向 lib/supabase/queries/articles.ts 中添加一个使用服务角色客户端的 getRelatedArticles(articleId, embedding) 查询函数。

更新新闻详情页，展示一个“关联文章”板块，通过余弦相似度展示最多 5 篇相似文章。若当前文章没有嵌入向量，则不显示该板块。

21. 安全、代码标准和最终规则

绝不能暴露给浏览器端代码的密钥：

- Supabase 服务角色密钥

- Oxylabs 凭证

- OpenAI 凭证

- 调度器/管理员密钥

绝不能在浏览器端运行的逻辑：

- Oxylabs调用

- OpenAI/模型调用

- 抓取

- 分析

- 调度器处理

## 环境变量

规范列表位于 .env.example 中。只有以 NEXT*PUBLIC*\* 开头的变量可以到达浏览器端代码；其他均为服务端专用。CRON_SECRET 由 Vercel 注入，切勿将其添加到 .env.local。

变量 用途 暴露

变量 用途 暴露范围
NEXT*PUBLIC_CLERK_PUBLISHABLE_KEY Clerk 可发布密钥 客户端 + 服务端
CLERK_SECRET_KEY Clerk 服务端密钥 仅服务端
NEXT_PUBLIC_CLERK_SIGN_IN_URL / \_SIGN_UP_URL / *\*\_FALLBACK_REDIRECT_URL Clerk 认证路由配置 客户端 + 服务端
NEXT_PUBLIC_SUPABASE_URL Supabase 项目 URL 客户端 + 服务端
NEXT_PUBLIC_SUPABASE_ANON_KEY Supabase 匿名密钥 客户端 + 服务端
SUPABASE_SERVICE_ROLE_KEY 用于写入和流水线读取的服务角色数据库访问密钥 仅服务端
OXY_WSA_USERNAME / OXY_WSA_PASSWORD Oxylabs Web Scraper API 与调度器认证 仅服务端
ANALYSIS_MODEL_NAME AI 分析模型名（qwen3.7-plus） 仅服务端
ANALYSIS_API_KEY AI 分析（qwen3.7-plus）密钥 仅服务端
ANALYSIS_BASE_URL 可选；AI 分析 OpenAI 兼容端点（缺省千问 AI 平台） 仅服务端
BIASLY_ADMIN_SECRET 操作路由上 x-biasly-admin-secret 所需的共享密钥（第 15 节） 仅服务端
ANALYSIS_BATCH_SIZE 可选；每批次分析的文章数量（默认 5） 仅服务端
CRON_SECRET 保护 GET /api/cron/pipeline；由 Vercel 注入，不在 .env.local 中（第 18 节） 仅服务端
当变量发生变化时，请保持此表格与 .env.example 同步。

使用TypeScript。

倾向于使用小函数、显式类型、集中定义的限制值、服务端专用模块、类型化的流水线结果以及安全的错误处理。

避免使用 any、不相关的重构、过度设计、冗长的路由处理程序、混杂的 UI/业务逻辑以及非请求的功能。

## Supabase连接表过滤器注意事项

在 supabase-js 中，不要使用 .eq('foreignTable.column', value) 来过滤关联表数据。这会生成错误的 PostgREST SQL 并导致运行时错误。

取而代之，先不加过滤地获取关联数据，然后在 JavaScript 中对返回结果应用筛选条件。关于 Supabase 查询模式，请参考 .agents/skills/supabase/SKILL.md。

当存在疑问时，遵循以下原则：

1. 保持小范围改动。

2. 使用相关的技能文件。

3. 严守服务端/客户端边界。

4. 必要时提出一个聚焦的问题。

5. 在编码前先保存提示文件。

6. 询问是否可以开始执行。

7. 经确认后再实现。

8. 运行可用的检查。

9. 分享确切的测试步骤。

---

22. 命令和检查

“运行可用的检查”（第 2 节和第 21 节）意味着在项目根目录下运行以下命令并报告结果：

npm run typecheck —— TypeScript 类型检查，不生成输出（tsc --noEmit）

npm run lint —— ESLint 检查（eslint）

npm run build —— Next.js 生产构建，仅在变更可能影响构建时运行

开发和运行时：

npm run dev——启动Next.js开发服务器；观察其终端以获取抓取和分析日志（第17节）

npm run start——在npm run build后在本地运行生产构建

实现完成后，至少运行 typecheck 和 lint。当路由、配置或服务端模块发生变更时，增加 build 检查。务必报告命令的实际输出；未经实际运行，不得声称检查通过。
