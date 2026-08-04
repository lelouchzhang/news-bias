# biasly 首页实现提示（Homepage）

## 1. 目标

基于 UI 参考图 `02-homepage.png`（Biasly News 首页截图），在 `app/page.tsx` 中实现与参考图视觉一致的 Home 页：

- 顶栏（Top Bar）：Browser Extension、主题切换、日期、位置与版本
- 主导航栏（Main Navbar）：biasly News Logo、菜单（Home / For You / Local / Blindspot）、Subscribe / Login 按钮
- 分类标签栏（Categories）：横向滚动的胶囊标签（World Cup + / IPL + / …）
- 首页内容区：12 张新闻卡片，3 列 × 4 行网格
- 页脚（Footer）：深色背景，品牌 + 标语 + Company / Help 链接 + Connect 社交入口 + 版权

本任务为纯 UI 实现：无数据库、无 API、无认证接入；卡片数据使用与参考图一致的静态演示数据，后续接入 Supabase 数据层时替换。

## 2. 使用的技能

- `vision`（系统技能）：已用于识别参考图并提取视觉规范（见第 4 节）
- `node_modules/next/dist/docs/`：已阅读 `01-getting-started/03-layouts-and-pages.md`（页面与布局约定）、`12-images.md`（图片处理；本任务使用本地 SVG 占位图，不配置远程图片）
- 项目内 Tailwind CSS v4 设计令牌与既有 UI 组件（BiasMeter / Button / Chip / Card）

说明：AGENTS.md 指定的四个项目技能（clerk / supabase / oxylabs-web-scraper / ai-sdk）与本 UI 任务无关，本任务不调用。

## 3. 已有代码检查

- `app/page.tsx`：占位 `Home` 文本，需替换
- `app/globals.css`：Tailwind v4 `@theme` 令牌已定义（文本色、背景、语义偏置色 left/center/right、字号、阴影、圆角），body 背景为 `bg-secondary`（#F0F0F0）
- `app/layout.tsx`：Poppins 本地字体已接入，metadata 已为 biasly 品牌
- `components/ui/`：BiasMeter（三段条 + 下方标签 + 0/50/100 刻度）、Button（primary/secondary/text）、Chip（胶囊 + 加号）、Card（白底圆角阴影）
- `lib/utils.ts`：`cn()` 可用
- 依赖：`lucide-react@1.28.0`（已确认可用图标：Menu、Globe、ChevronDown、Plus、ArrowRight、Info、X、MapPin、Sun、Moon、Monitor、CircleUser、Bookmark、ExternalLink、Cpu、Search、AtSign、Send、Rss；无品牌图标 Twitter/LinkedIn/Instagram/YouTube）
- 项目尚无 `lib/` 数据层、无 `app/api/`、无 Supabase 客户端

## 4. 决策或假设

### 4.1 参考图视觉解读（来自 vision 识别）

**顶栏（黑色背景，白/浅灰文字）**
- 左侧："Browser Extension"
- 中间：主题切换 "Theme: Light Dark Auto"，Light 为当前项
- 右侧："Monday, June 1, 2026"、"Set Location"、"International Edition"（带下拉箭头）

**主导航栏（浅米/灰白背景）**
- Logo："biasly"（黑粗体）+ "News"（细体小字），左侧汉堡菜单图标
- 菜单：Home（黑色下划线选中）、For You（带红色小星点）、Local、Blindspot
- 右侧：Subscribe（黑色背景白字）、Login（白底黑边框黑字）

**分类标签栏（浅灰背景）**
- 横向滚动胶囊：World Cup +、IPL +、Social Media +、Business & Markets +、Health & Medicine +、Soccer +、Artificial Intelligence +、Arsenal FC +、Extreme Weather and Disasters +，最右侧带向右箭头

**内容区（3 列 × 4 行 = 12 张卡片）**
- 卡片为白底、圆角、轻微阴影；图片位于顶部，右上角有圆圈 "i" 信息图标
- 图片下方：小字 "Category · Region"（如 "Politics · United States"）
- 新闻标题：粗体黑色
- 偏见条：水平三段——左段深红（#B42318）白字 "L xx%"，中段浅灰（#E5E7EB）黑字 "Center xx%"，右段深蓝（#1D4ED8）白字 "Right xx%"，宽度按百分比
- 左下角："X sources"

**页脚（深灰/近黑背景）**
- 左侧：Logo "biasly News" + 标语 "Balanced news coverage powered by AI."
- 中间：Company（About / Careers / Press / Contact）与 Help（Help Center / Guides / Privacy Policy / Terms of Service）两列
- 右侧：Connect 标题 + 社交图标（X/Twitter、LinkedIn、Instagram、YouTube）
- 底部：© 2026 Biasly News. All rights reserved.

**配色**
- 页面背景：非常浅的灰白/米灰（#F0F0F0）
- 卡片：纯白；强调色：深红（左）、深蓝（右）、黑/白（中）
- 页脚：深炭灰（≈#0D0D0F）

### 4.2 12 张卡片演示数据（与参考图一致）

| # | Category · Region | Title | L / C / R | Sources |
| --- | --- | --- | --- | --- |
| 1 | Politics · United States | Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report | 20 / 31 / 49 | 12 |
| 2 | Health · United States | Researchers Make Case for Grapes as a 'Superfood' After Review of Health Evidence | 18 / 42 / 40 | 7 |
| 3 | Science · Switzerland | CERN Finds High-Significance Hint of Physics Beyond Standard Model | 16 / 62 / 22 | 8 |
| 4 | World · Nicaragua | Indigenous Leader Brooklyn Rivera Dies in Nicaragua After Nearly 3 Years of Detention | 54 / 28 / 18 | 63 |
| 5 | World · Middle East | UN Security Council to Hold Emergency Meeting as Israel Pushes Deeper into Lebanon | 28 / 35 / 43 | 15 |
| 6 | Business · Global | Oil Prices Dip as OPEC+ Considers Output Increase Amid Weak Demand | 25 / 50 / 28 | 11 |
| 7 | Technology · United States | SpaceX Launches Starship Test Flight in Milestone for Mars Program | 12 / 45 / 49 | 9 |
| 8 | Business · United States | Apple Unveils AI-Powered Features Across iPhone, iPad and Mac | 15 / 40 / 45 | 10 |
| 9 | Climate · Global | 2025 on Track to Be Among Top 3 Hottest Years, EU Climate Service Says | 33 / 34 / 33 | 14 |
| 10 | Economy · United States | Fed Holds Rates Steady, Signals Caution on Inflation and Growth Outlook | 30 / 45 / 26 | 13 |
| 11 | Soccer · Europe | Real Madrid Win Champions League After Comeback Victory in Final | 10 / 20 / 70 | 26 |
| 12 | Environment · Canada | Wildfires Force Thousands to Evacuate Across Western Canada | 27 / 33 / 40 | 17 |

### 4.3 实现决策

1. **纯 UI + 静态演示数据**：项目尚无 Supabase/API 层，Home 页先以 `lib/home/mock-articles.ts` 提供与参考图一致的 12 条数据；卡片组件按将来数据层形状设计（title / category / region / imageUrl / left / center / right / sourceCount），后续接入 Supabase 时仅替换数据源。
2. **图片用本地 SVG 占位图**：不引入远程图片（避免 next/image remotePatterns 配置与构建期网络依赖）；在 `public/images/` 下生成 12 张 16:9 浅灰底、带分类文字标签的 SVG 占位图，用 next/image 渲染并固定 `width/height` 防止布局抖动。占位图视觉为中性灰 + 类别文字，明确是占位而非真实新闻图片。
3. **偏见条新增紧凑分段样式**：参考图中的偏见条为"标签直接显示在色段内部"的紧凑形态，与现有 BiasMeter（标签在条下方）不同。为 BiasMeter 增加 `variant="segmented"`（默认保持原 "detailed" 样式），NewsCard 使用 segmented；标签格式：左段 "L xx%"、中段 "Center xx%"、右段 "Right xx%"。
4. **导航与按钮为静态占位**：Subscribe / Login、导航菜单、分类标签、顶栏控件均无对应功能（认证、路由尚未实现），渲染为静态元素或 `<button>` 占位，不引入假路由；卡片不包链接（详情页尚未实现）。
5. **社交图标降级**：lucide-react 1.28.0 无 Twitter/LinkedIn/Instagram/YouTube 品牌图标，Connect 区以圆形描边 + 通用图标/文本呈现（如 AtSign、Send、Rss、X），视觉上保持 4 个圆形社交入口。
6. **布局**：内容容器沿用设计系统约定 max-w-7xl（1280px）+ px-6；卡片网格 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`；分类标签栏横向滚动（`overflow-x-auto` + 隐藏滚动条），右侧箭头提示更多。
7. **组件拆分**：`components/home/top-bar.tsx`、`components/home/header.tsx`、`components/home/category-bar.tsx`、`components/home/news-card.tsx`、`components/home/footer.tsx`；`app/page.tsx` 组合之。标题 "Top News" 以 H1 呈现。

## 5. 可能更改的文件

新增：
- `lib/home/mock-articles.ts` — 12 条演示文章数据（含类型定义 `HomeArticle`）
- `components/home/top-bar.tsx` — 黑色顶栏
- `components/home/header.tsx` — 主导航栏
- `components/home/category-bar.tsx` — 分类标签栏
- `components/home/news-card.tsx` — 新闻卡片
- `components/home/footer.tsx` — 页脚
- `public/images/home/card-01.svg` … `card-12.svg` — 16:9 占位图

修改：
- `app/page.tsx` — 组合 Home 页各区块
- `components/ui/bias-meter.tsx` — 增加 `variant="segmented"` 紧凑样式（默认行为不变）

## 6. 实施要求

1. 顶栏：黑底（bg-text-primary / #0D0D0F），白/浅灰小字；左侧 "Browser Extension"，中间主题切换（Light 高亮、Dark、Auto），右侧日期、Set Location（MapPin 图标）、International Edition（Globe + ChevronDown）；桌面显示、移动端简化（仅保留关键项）。
2. 主导航：浅色底；Logo "biasly"（粗体黑）+ "News"（灰色细体）；汉堡菜单（Menu 图标）；菜单项 Home（下划线/加粗表示选中）、For You（红色小圆点）、Local、Blindspot；右侧 Subscribe（primary Button）与 Login（secondary Button，白底黑边框）。
3. 分类标签：使用 Chip（withPlus）；列表 World Cup、IPL、Social Media、Business & Markets、Health & Medicine、Soccer、Artificial Intelligence、Arsenal FC、Extreme Weather and Disasters；横向滚动 + 右侧箭头（ArrowRight）。
4. 内容区：H1 "Top News"；3 列 × 4 行卡片网格（1/2/3 列响应式）。
5. NewsCard：
   - 顶部图片（next/image，16:9，`fill` 或固定宽高 + `rounded-t-lg`），右上角 Info 圆形图标（白底/半透明）
   - 元信息：Caption 字号 "Category · Region"（text-text-secondary）
   - 标题：text-h3 或 15–16px 半粗，2–3 行截断（line-clamp-3）
   - 偏见条：BiasMeter `variant="segmented"`，标签在色段内
   - 底部：Body Small "12 sources"
   - 卡片：白底、rounded-lg、shadow-md、hover 轻微上浮/阴影增强
6. 页脚：黑底；四列布局（品牌 + 标语 / Company / Help / Connect），社交入口 4 个圆形图标；底部版权行 "© 2026 Biasly News. All rights reserved."
7. 全部使用 TypeScript，禁止 `any`；使用既有设计令牌（text-h1/h3、text-caption、text-body-sm、text-text-primary/secondary、bg-bg-secondary、bg-left-bias、bg-center-bias、bg-right-bias、shadow-md、rounded-lg 等）；不新增依赖。
8. 响应式：桌面 3 列；平板（sm）2 列；移动端 1 列；顶栏与导航在移动端合理简化；无横向页面滚动（分类条内部滚动除外）。

## 7. 安全要求

- 本任务不涉及密钥、抓取、AI、数据库、认证；无服务端代码。
- 不引入浏览器端不允许的依赖；全部组件为静态展示组件。
- 不配置远程图片；不把任何密钥写入代码。

## 8. 验收标准

- `/` 页面与参考图结构一致：顶栏 → 主导航 → 分类条 → "Top News" 3×4 卡片网格 → 页脚。
- 12 张卡片数据（标题、类别·地区、L/C/R 百分比、来源数）与 4.2 表一致。
- 偏见条为分段样式，色段宽度按百分比，左红（#B42318）、中灰（#E5E7EB）、右蓝（#1D4ED8），标签在段内。
- 全部使用设计令牌与既有组件；无新增依赖。
- `npm run typecheck`、`npm run lint` 通过；运行 `npm run build`。
- 移动端（≈375px）单列堆叠、无横向溢出；分类条内部可横向滚动。

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（涉及页面与组件变更）

## 10. 实施后期望的确切手动检查步骤

1. `npm run dev`，终端无编译错误。
2. 浏览器打开 `http://localhost:3000/`，与参考图 `02-homepage.png` 逐区对比：
   - 顶栏：黑底三区内容正确
   - 主导航：Logo、菜单（Home 选中态、For You 红点）、Subscribe / Login 按钮样式
   - 分类条：9 个胶囊 + 滚动箭头
   - Top News：3 列 × 4 行，卡片含图片、类别·地区、标题、分段偏见条、sources 计数
   - 页脚：黑底、品牌/标语、Company、Help、Connect 四区 + 版权
3. 窗口缩放到 375px：卡片单列、无横向页面滚动。
4. 打开 `http://localhost:3000/design-system`，确认 BiasMeter 原有 detailed 样式未受影响（25/50/25 + 0/50/100 刻度）。
