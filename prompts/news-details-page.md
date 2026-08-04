# biasly 新闻详情页实现提示（News Details Page）

## 1. 目标

基于 UI 参考图 `03-news-details-page.png`（Biasly News 新闻详情页截图），实现与参考图视觉一致的新闻详情页：

- 顶部栏 + 主导航 + 分类标签栏（复用首页组件）
- 文章头部：面包屑、标题、作者/日期/阅读时长、Save / Share / More 操作栏
- 主图 + 图片说明（caption）
- 双栏布局：左侧文章正文（含内嵌 Bias Distribution 图表），右侧三张卡片（Bias Analysis / AI Summary / Source Breakdown）
- 底部 Related Stories（2 列 × 3 行卡片网格）
- Subscribe 订阅栏
- 页脚（复用首页组件）

本任务为纯 UI 实现：无数据库、无 API、无认证接入；详情数据使用与参考图一致的静态演示数据（沿用首页 `lib/home/mock-articles.ts` 的模式），后续接入 Supabase 数据层时替换。

## 2. 使用的技能

- `vision`（系统技能）：已用于识别参考图并提取视觉规范（见第 4 节）
- `node_modules/next/dist/docs/`：已阅读 `01-app/01-getting-started/03-layouts-and-pages.md`（页面与布局约定）与 `01-app/03-api-reference/03-file-conventions/dynamic-routes.md`（动态路由、`params` 为 Promise、`generateStaticParams`）
- 项目内 Tailwind CSS v4 设计令牌与既有 UI 组件（TopBar / Header / CategoryBar / Footer / Button / Card / BiasMeter / Chip）

说明：AGENTS.md 指定的四个项目技能（clerk / supabase / oxylabs-web-scraper / ai-sdk）与本 UI 任务无关，本任务不调用。

## 3. 已有代码检查

- `app/page.tsx`：首页，组合 TopBar → Header → CategoryBar → Top News 卡片网格 → Footer
- `components/home/`：`top-bar.tsx`、`header.tsx`（Home 高亮、For You 红点、Subscribe/Login）、`category-bar.tsx`、`news-card.tsx`（无链接）、`footer.tsx`
- `components/ui/`：`button.tsx`（primary/secondary/text）、`card.tsx`（白底圆角阴影）、`chip.tsx`、`bias-meter.tsx`（detailed/segmented 两种变体）
- `lib/home/mock-articles.ts`：`HomeArticle` 类型 + 12 条演示文章；card-01 与参考图文章同标题、同 L/C/R（20/31/49）、同 12 sources
- `app/globals.css`：Tailwind v4 `@theme` 令牌（文本色、语义偏见色 left/center/right、字阶、阴影、圆角）；body 背景 `bg-secondary` #F0F0F0
- `app/fonts.ts`：Poppins 本地字体（400/500/600/700）
- `app/design-system/page.tsx`：设计系统展示页（BiasMeter detailed 样式基线）
- `public/images/home/card-01.svg`：16:9 本地 SVG 占位图
- 依赖：`lucide-react@1.28.0`（已确认可用图标：Bookmark、Share2、MoreHorizontal、Info、Clock、ChevronRight 等）；项目尚无 `app/article/`、无 `lib/article/`
- Next.js 16.2.12 约定：动态路由 `params` 是 Promise，需 `await`；用 `generateStaticParams` 预渲染演示文章；未命中 slug 用 `notFound()`

## 4. 决策或假设

### 4.1 参考图视觉解读（来自 vision 识别，三次数值校准）

**整体布局**
- 经典双栏：左侧主内容区约 65–70%，右侧侧边栏约 30–35%；容器沿用 `max-w-7xl`（1280px）+ `px-6`
- 页面背景极浅灰（#F0F0F0 / #F6F6F6），内容卡片白色，圆角 + 轻阴影；无衬线字体（Poppins）

**顶部与导航（与首页一致）**
- 顶部深色条：Browser Extension ｜ Theme: Light/Dark/Auto ｜ Monday, June 1, 2026 ｜ Set Location ｜ International Edition
- 主导航：biasly News Logo、Home（选中）、For You（红点）、Local、Blindspot；右侧 Subscribe（黑底白字）、Login（白底黑边框）
- 分类标签栏：World Cup +、IPL +、Social Media + 等（横向滚动）

**文章头部**
- 面包屑：Politics · United States（caption 小字灰色）
- H1 标题：Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report（大号黑色加粗）
- 元数据：By David Morgan | May 31, 2026 | 12 min read（小字灰色）
- 操作栏（右侧）：Save + 书签图标、Share + 分享图标、…（MoreHorizontal）

**主图与说明**
- 16:9 大图；下方灰色小字 caption：President Donald Trump in the Cabinet Room at the White House, Washington, D.C., May 30, 2026. Photo: Andrew Harrill/Getty Images

**内嵌图表 Bias Distribution（位于图片下方、正文上方）**
- 标题 Bias Distribution（带 Info 圆形图标）
- 长条形三段：Left 20%（红 #B42318）、Center 31%（灰 #E5E7EB）、Right 49%（蓝 #1D4ED8），段内或下方带百分比标签
- 脚注：12 sources

**右侧边栏**
1. **Bias Analysis**
   - 标题 Bias Analysis（带 Info 图标）
   - Overall Bias：Right 49%（大号蓝色粗体）
   - 副标题：Based on 12 balanced sources（蓝色小字）
   - 三段进度条：Left 20%（红）/ Center 31%（灰）/ Right 49%（蓝），下方左/中/右带百分比标签
   - 说明文字：Our analysis is based on the political leaning of the publication and how the story is framed. Sources are weighted by reliability and recency.
   - 按钮：How We Analyze Bias（白底黑边框 secondary）
2. **AI Summary**
   - 标题 AI Summary（带 Info 图标）
   - 元数据：Generated May 31, 2026 · 3 min read（灰色小字）
   - 5 条要点（黑色圆点列表）：
     1. The Trump administration has sent Iran a revised nuclear deal proposal with tougher terms, including a complete halt to uranium enrichment and the removal of enriched uranium stockpiles.
     2. The proposal also demands unrestricted inspector access to all nuclear sites, including military facilities.
     3. Iran has not responded officially but says any deal must respect its right to peaceful nuclear energy and include sanctions relief.
     4. The U.S. warns it is prepared to take other action if diplomacy fails, while European allies urge continued negotiations.
     5. Israel supports the tougher stance, praising the administration's determination to prevent Iran from acquiring nuclear weapons.
   - 免责声明：AI summaries can make mistakes.（灰色小字）
   - 按钮：Provide Feedback（白底黑边框）
3. **Source Breakdown**
   - 标题 Source Breakdown（带 Info 图标）；副标题 12 Total Sources
   - 分布统计：Left 2 (20%)、Center 4 (31%)、Right 6 (49%)（短进度条 + 数字）
   - Top Sources 表（两列：Top Sources 左对齐 / Bias 右对齐）：
     - Fox News → Right（蓝色文字）
     - The Wall Street Journal → Center（灰色）
     - Reuters → Center（灰色）
     - BBC → Center（灰色）
     - CNN → Left（红色文字）
     - The New York Times → Center（灰色）
     - The Washington Post → Center（灰色）
     - Newsmax → Right（蓝色文字）
   - 按钮：View All Sources（白底黑边框，全宽）

**文章正文**
- 6 段正文（围绕特朗普向伊朗发送修订版和平提案的演示内容），正文 `text-body-lg`（16px，行高 1.6），段落间距适中

**Related Stories（底部全宽）**
- 标题 Related Stories + 浅灰分割线
- 2 列 × 3 行网格，每张卡片：左侧约 100×100 方形缩略图 + 右侧文本（分类·地区 caption 灰色 → 标题加粗 → 日期·阅读时长 caption 灰色）
- 6 条演示文章（标题、分类、日期、时长见 4.2 表）

**Subscribe 订阅栏**
- 浅灰边框圆角容器；左侧标题 Stay Informed. Stay Balanced.（黑色加粗）+ 副标题 Get the top stories and bias analysis delivered to your inbox.（灰色小字）；右侧输入框（Enter your email）+ 黑色 Subscribe 按钮

**页脚（与首页一致）**
- 深黑底；品牌区（biasly News + 标语）+ Company（About/Careers/Press/Contact）+ Help（Help Center/Guides/Privacy Policy/Terms of Service）+ Connect（4 个圆形社交图标）；底部版权行 © 2026 Biasly News. All rights reserved.

**配色**
- 主色：TEXT PRIMARY #0D0D0F、TEXT SECONDARY #6B7280、SURFACE #F6F6F6
- 语义色：LEFT BIAS #B42318（红）、CENTER #E5E7EB（灰）、RIGHT BIAS #1D4ED8（蓝）
- 中性色：BG PRIMARY #FFFFFF、BG SECONDARY #F0F0F0、BORDER/DIVIDER #E5E7EB

### 4.2 Related Stories 演示数据（与参考图一致）

| # | 分类 | 标题 | 日期 | 时长 |
| --- | --- | --- | --- | --- |
| 1 | World · Middle East | Iran Says It Will Not Negotiate Under 'Maximum Pressure' | May 29, 2026 | 8 min |
| 2 | Politics · United States | Bipartisan Group Urges Diplomacy With Iran | May 28, 2026 | 7 min |
| 3 | World · Middle East | US Sanctions More Iranian Entities Over Nuclear Program | May 26, 2026 | 9 min |
| 4 | Science · Nuclear Policy | What's in the 2015 Iran Nuclear Deal? | May 25, 2026 | 10 min |
| 5 | World · Middle East | Oman Hosts Another Round of US-Iran Nuclear Talks | May 27, 2026 | 7 min |
| 6 | World · Middle East | Israel Reaffirms Red Line Over Iranian Nuclear Program | May 24, 2026 | 6 min |

### 4.3 实现决策

1. **纯 UI + 静态演示数据**：项目尚无 Supabase/API 层，详情页先以 `lib/article/mock-article-details.ts` 提供与参考图一致的演示数据；组件类型按未来数据层形态设计（article / analysis / source / relatedStory），后续仅替换数据源。
2. **动态路由 `/article/[slug]`**：`app/article/[slug]/page.tsx`，使用 `generateStaticParams` 预渲染演示文章（slug 为演示 ID，如 `trump-iran-peace-proposal`）；未命中 slug 调用 `notFound()`；`generateMetadata` 输出文章标题。`params` 按 Next 16 约定 `await`。
3. **入口链接**：首页 NewsCard 用 `next/link` 包裹链接到详情页（card-01 → 详情演示文章），使页面可导航、可测试；其余卡片共用同一详情页或各自 slug 的演示数据（保持最小改动：所有卡片链接到各自的 slug，详情数据层以 slug 查表，未提供详细数据的 slug 也渲染同一篇演示文章）。
4. **图片用本地 SVG 占位图**：新增 `public/images/article/hero.svg`（16:9 主图占位）与 `related-01.svg` ~ `related-06.svg`（方形缩略图占位，或复用 `public/images/home/card-*.svg`）；不引入远程图片，避免 `next/image remotePatterns` 配置与构建期网络依赖。
5. **Bias Analysis 卡片与 Bias Distribution 图表**：各自独立小组件；三段条复用语义色令牌；百分比由数据驱动，不做硬编码。
6. **Bias 标签颜色映射**：left → `text-left-bias`，center → `text-text-secondary`（灰），right → `text-right-bias`；在 `lib/article/` 中集中定义映射常量，避免散落条件样式。
7. **侧边栏卡片**：不使用 `Card` 组件（其 `p-8` 内边距过大），改用自定义白底 `rounded-lg border border-border` 轻卡片容器（参考图侧边栏卡片为细边框/极淡阴影，非深阴影）。
8. **响应式**：桌面双栏（`lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`）；平板/移动端单栏堆叠，侧边栏卡片在正文之后、Related Stories 之前；Related Stories 桌面 2 列、移动端 1 列；顶栏与导航沿用首页的响应式简化。
9. **组件拆分**：`components/article/` 下拆分 `article-header.tsx`、`article-hero.tsx`、`bias-distribution.tsx`、`article-body.tsx`、`bias-analysis-card.tsx`、`ai-summary-card.tsx`、`source-breakdown-card.tsx`、`related-stories.tsx`、`subscribe-bar.tsx`；`app/article/[slug]/page.tsx` 负责组合。
10. **导航组件复用**：TopBar / Header / CategoryBar / Footer 直接从 `components/home/` 导入复用，不复制。

## 5. 可能更改的文件

新增：
- `lib/article/mock-article-details.ts` — 详情演示数据 + 类型（ArticleDetail、Analysis、SourceTally、TopSource、RelatedStory、BiasLabel）
- `lib/article/bias-labels.ts` — Bias 标签颜色/文案映射常量（或并入上述文件）
- `components/article/article-header.tsx` — 面包屑、标题、元数据、操作栏
- `components/article/article-hero.tsx` — 主图 + caption
- `components/article/bias-distribution.tsx` — 内嵌三段图表 + 脚注
- `components/article/article-body.tsx` — 正文段落
- `components/article/bias-analysis-card.tsx` — Overall Bias + 三段条 + 说明 + 按钮
- `components/article/ai-summary-card.tsx` — 要点列表 + 免责声明 + 按钮
- `components/article/source-breakdown-card.tsx` — 分布统计 + Top Sources 表 + 按钮
- `components/article/related-stories.tsx` — 2×3 卡片网格
- `components/article/subscribe-bar.tsx` — 订阅栏
- `app/article/[slug]/page.tsx` — 详情页（组合 + generateStaticParams + generateMetadata + notFound）
- `public/images/article/hero.svg`（以及需要时 related 缩略图占位 SVG）

修改：
- `components/home/news-card.tsx` — 用 `next/link` 包裹，链接到 `/article/[slug]`

## 6. 实施要求

1. 页面容器沿用 `max-w-7xl px-6`；整体背景 `bg-bg-secondary`（body 已设置）。
2. 主内容双栏：`grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]`；侧边栏卡片纵向 `space-y-6`。
3. 文章头部：
   - 面包屑：`text-caption text-text-secondary`，格式 `Politics · United States`
   - 标题：`text-2xl md:text-3xl font-bold leading-tight text-text-primary`
   - 元数据：`text-body-sm text-text-secondary`，`By {author} | {date} | {readTime} min read`
   - 操作栏：Save（Bookmark 图标 + 文字）、Share（Share2 图标 + 文字）、More（MoreHorizontal 图标），透明按钮 + hover 浅灰底
4. 主图：`next/image`，`aspect-video`、`rounded-lg`、`object-cover`，宽度/高度固定防布局抖动；caption `text-caption text-text-secondary`，`mt-2`。
5. Bias Distribution：白底卡片或直接内嵌，标题行（标题 + Info 图标），三段条 `h-7 rounded-full overflow-hidden`（Left 红 / Center 灰 / Right 蓝，段内白/黑标签 `Left 20%` 等），下方 `text-caption text-text-secondary` 脚注 `12 sources`。
6. 正文：`text-body-lg text-text-primary`，段落 `mb-5`，共 6 段；首段可 `text-text-primary`，其余同色；不渲染网页杂物。
7. Bias Analysis 卡片：
   - 标题行（Bias Analysis + Info 图标）
   - Overall Bias 大号蓝色粗体 `Right 49%`；副标题 `text-body-sm text-right-bias`：Based on 12 balanced sources
   - 三段条（detailed 风格：Left 20% 红 / Center 31% 灰 / Right 49% 蓝），下方左/中/右标签
   - 说明文字 `text-body-sm text-text-secondary`
   - How We Analyze Bias：`Button variant="secondary"` 全宽
8. AI Summary 卡片：
   - 标题行（AI Summary + Info 图标）；元数据 Generated May 31, 2026 · 3 min read
   - 无序列表 5 条，`text-body-md`，圆点样式
   - 免责声明 AI summaries can make mistakes.（`text-caption text-text-secondary`）
   - Provide Feedback：secondary 全宽按钮
9. Source Breakdown 卡片：
   - 标题行（Source Breakdown + Info 图标）；12 Total Sources 副标题
   - 分布统计三行：Left 2 (20%) / Center 4 (31%) / Right 6 (49%)，左侧标签、右侧短进度条（语义色）
   - Top Sources 表：两列表头（Top Sources / Bias），8 行来源；Bias 列按映射着色
   - View All Sources：secondary 全宽按钮
10. Related Stories：标题 + `border-t border-border` 分割线；`grid grid-cols-1 gap-6 sm:grid-cols-2`；卡片为横排（左侧 `size-24` 圆形或方形缩略图 + 右侧文本），hover 轻微阴影；文本结构：caption 分类 → 加粗标题（line-clamp-2）→ caption 日期·时长。
11. Subscribe 栏：`rounded-lg border border-border bg-bg-primary px-6 py-6`，flex 两端布局；左标题 + 副标题；右输入框（`h-10 rounded-md border border-border px-3 text-body-md`，placeholder Enter your email）+ Subscribe（primary Button）。
12. 全部使用 TypeScript，禁止 `any`；使用既有设计令牌（text-h1/h2、text-caption、text-body-*、text-text-primary/secondary、bg-left-bias/center-bias/right-bias、border-border、shadow-md、rounded-lg 等）；小函数、显式类型、集中常量；不新增依赖。
13. 响应式：375px 移动端单列堆叠、无横向页面滚动；双栏在 `lg` 断点启用；Related Stories 移动端 1 列。

## 7. 安全要求

- 本任务不涉及密钥、抓取、AI、数据库、认证；无服务端代码。
- 不引入浏览器端不允许的依赖；全部组件为静态展示组件。
- 不配置远程图片；不把任何密钥写入代码。
- 不新增 Supabase / Clerk / Oxylabs / AI SDK 相关代码。

## 8. 验收标准

- `/article/trump-iran-peace-proposal` 与参考图结构一致：顶部栏 → 主导航 → 分类栏 → 双栏（文章头 → 主图 → Bias Distribution → 正文 ｜ Bias Analysis → AI Summary → Source Breakdown）→ Related Stories → Subscribe → 页脚。
- 详情数据（标题、元数据、L/C/R 20/31/49、12 sources、AI 摘要 5 条、来源 8 行、Related Stories 6 条）与 4.1/4.2 表一致。
- 偏见三段条与标签着色符合语义色（红 #B42318 / 灰 #E5E7EB / 蓝 #1D4ED8）。
- 首页卡片可点击进入详情页；未知 slug 返回 404（notFound）。
- 全部使用设计令牌与既有组件模式；无新增依赖。
- `npm run typecheck`、`npm run lint` 通过；运行 `npm run build`。
- 移动端（≤375px）单列堆叠、无横向溢出。

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（涉及页面、路由、组件变更）

## 10. 实施后期望的确切手动检查步骤

1. `npm run dev`，终端无编译错误。
2. 浏览器打开 `http://localhost:3000/`，点击第一张卡片（Trump Sends Iran Revised Peace Proposal…），应跳转到 `/article/trump-iran-peace-proposal`。
3. 与参考图 `03-news-details-page.png` 逐区对比：
   - 顶部栏 / 主导航 / 分类栏与首页一致
   - 文章头：面包屑、标题、作者/日期/时长、Save/Share/More
   - 主图 + caption
   - Bias Distribution：20 / 31 / 49 三段 + 12 sources
   - 正文 6 段
   - 右侧三张卡片内容与样式（含 Top Sources 着色）
   - Related Stories 6 条（2×3）
   - Subscribe 栏 + 页脚
4. 访问未知 slug（如 `/article/nonexistent`）应显示 404。
5. 窗口缩放到 375px：双栏变单列堆叠、无横向页面滚动。
6. 打开 `http://localhost:3000/` 与 `http://localhost:3000/design-system`，确认首页与设计系统（尤其 BiasMeter detailed 样式）未受影响。
