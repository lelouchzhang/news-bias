# biasly 设计系统实现提示（Design System v1.0）

## 1. 目标

基于 UI 参考图 `01-ui-design-system.png`（Design System v1.0），为 biasly News 应用实现完整的设计系统：

- 设计令牌（颜色、字体、字号、间距、圆角、阴影、网格）
- 品牌字体 Poppins 全局接入
- 核心 UI 组件（Button、Chip、BiasMeter、Card）
- 一套设计系统展示页（`/design-system`），用于视觉验收，同时作为设计系统活文档

UI 参考图已通过 vision 技能识别，关键规范见下文第 4 节。

## 2. 使用的技能

- `vision`（系统技能）：识别参考图，提取设计规范
- `node_modules/next/dist/docs/`：已阅读 `01-getting-started/11-css.md`（Tailwind v4 接入）、`13-fonts.md` 与 `03-api-reference/02-components/font.md`（next/font + Tailwind 变量方式）
- 项目内已安装的 Tailwind CSS v4（`@tailwindcss/postcss`）与 Next.js 16.2.12 模式

说明：AGENTS.md 指定的四个项目技能（clerk / supabase / oxylabs-web-scraper / ai-sdk）与本 UI 任务无关，本任务不调用。

## 3. 已有代码检查

- `package.json`：Next.js 16.2.12、React 19.2.4、Tailwind CSS v4 + `@tailwindcss/postcss`；未安装任何 UI 依赖
- `app/globals.css`：仅有 Tailwind 导入 + Geist 变量 + 暗色模式媒体查询（将替换）
- `app/layout.tsx`：使用 Geist 字体，metadata 仍为 “Create Next App”
- `app/page.tsx`：空白 Home 占位（本任务不修改）
- `postcss.config.mjs`：已配置 `@tailwindcss/postcss`
- `tsconfig.json`：已配置 `@/*` 路径别名；无 `components/`、`lib/` 目录
- `prompts/`：目录存在且为空

## 4. 决策或假设

### 4.1 参考图视觉解读（来自 vision 识别）

页面：浅灰背景（#F0F0F0），白色圆角卡片内容区，底部黑色页脚。

#### 品牌 BRAND
- Logo：大号黑色粗体 “biasly” + 下方灰色小字 “News”
- 标语：Balanced news coverage, powered by AI.

#### 排版 TYPOGRAPHY（字体家族：Poppins）

| Token | 用途 | 字号 | 字重 | 行高 |
| --- | --- | --- | --- | --- |
| H1 | Page / Screen Title | 32px | Bold (700) | 1.2 |
| H2 | Section Title | 24px | SemiBold (600) | 1.3 |
| H3 | Card / Module Title | 20px | SemiBold (600) | 1.3 |
| H4 | Subheading | 16px | Medium (500) | 1.4 |
| Body Large | Important content | 16px | Regular (400) | 1.6 |
| Body Medium | Body text | 14px | Regular (400) | 1.6 |
| Body Small | Supporting text | 13px | Regular (400) | 1.6 |
| Caption | Labels, meta text | 11px | Regular (400) | 1.4 |

#### UI 元素
- 按钮：Primary（黑底白字）、Secondary（白底黑边框）、Text（文字按钮）；状态列 Default / Hover / Outline / Disabled
  - Primary：默认 #0D0D0F 底白字；Hover 轻微变亮（黑底 90% 不透明度）；Outline 白底黑边框黑字；Disabled 浅灰底灰字
  - Secondary：默认/Outline 均为白底黑边框黑字；Disabled 浅灰
  - Text：默认黑字；Hover 蓝色（#1D4ED8）
- Chip / 分类标签：胶囊形（rounded-full），浅灰底，示例 “World Cup +”、“IPL +”、“Business & Markets +”、“More +”
- 偏见计量表 BIAS METER：三段进度条——左红 25%（#B42318）、中灰 50%（#E5E7EB）、右蓝 25%（#1D4ED8），下方刻度 0% / 50% / 100%

#### 颜色 COLORS
- Primary：TEXT PRIMARY `#0D0D0F`、TEXT SECONDARY `#6B7280`、SURFACE `#F6F6F6`
- Semantic：LEFT BIAS `#B42318`、CENTER `#E5E7EB`、RIGHT BIAS `#1D4ED8`
- Neutrals：BG PRIMARY `#FFFFFF`、BG SECONDARY `#F0F0F0`、BORDER `#E5E7EB`、DIVIDER `#E5E7EB`

#### 图标 ICONS
- 15 个线性图标，3 行 × 5 列：menu、search、bookmark、clock、info、share、external-link、calendar、chart、tag、user、bell、settings、check、more
- 风格：Line style • 2px stroke • Rounded caps

#### 间距 / 网格 / 阴影 / 圆角
- SPACING：4px 基础单位 → 4 / 8 / 16 / 24 / 32 / 40 / 64
- GRID：Container 1280px、12 列、Gutter 24px、Margin 24px
- SHADOWS：SMALL `0 1px 2px rgba(0,0,0,0.05)`；MEDIUM `0 4px 12px rgba(0,0,0,0.08)`；LARGE `0 12px 24px rgba(0,0,0,0.12)`
- RADIUS：SMALL 4px、MEDIUM 8px、LARGE 12px、FULL 9999px

#### 页脚 FOOTER
- 深黑底（≈ #0D0D0F）；左：logo “biasly News” + 标语；中：Design System v1.0 / June 1, 2026；右：Stay consistent. Stay unbiased.

### 4.2 实现决策

- **Tailwind v4 `@theme` 令牌**：全部设计令牌以 CSS 变量形式定义在 `app/globals.css` 的 `@theme` 中；移除暗色模式媒体查询（本设计系统为浅色单主题）。
- **字体**：使用 `next/font/google` 的 Poppins（400/500/600/700 静态字重，Poppins 非可变字体），通过 CSS 变量 `--font-poppins` 接入 `--font-sans`。构建时需要网络下载字体文件。
- **间距**：Tailwind v4 默认 spacing 即以 0.25rem（4px）为基，4/8/16/24/32/40/64 与内置 `p-1/2/4/6/8/10/16` 一一对应，无需自定义，但会在展示页标注说明。
- **依赖**：新增 `clsx`、`tailwind-merge`（shadcn 风格类名合并）、`lucide-react`（2px 描边 + 圆角端帽，与参考图标风格一致）。
- **展示页**：新建 `/design-system` 路由作为设计系统展示页（复刻参考图布局，也是本任务的视觉验收载体）；`app/page.tsx` 保持不变。
- 首页/详情页等业务页面不在本任务范围，后续任务基于本设计系统实现。

## 5. 可能更改的文件

新增：
- `app/fonts.ts` — Poppins 字体定义（`variable: "--font-poppins"`）
- `lib/utils.ts` — `cn()` 类名合并工具（clsx + tailwind-merge）
- `components/ui/button.tsx` — Button（primary / secondary / text，含 hover、outline、disabled）
- `components/ui/chip.tsx` — Chip 胶囊标签
- `components/ui/bias-meter.tsx` — BiasMeter 三段偏见计量条
- `components/ui/card.tsx` — Card 白色卡片（radius-lg + shadow-md）
- `app/design-system/page.tsx` — 设计系统展示页

修改：
- `app/globals.css` — `@theme` 令牌 + body 基础样式
- `app/layout.tsx` — Poppins 变量、metadata（title: biasly News；description: Balanced news coverage, powered by AI.）、lang="en"
- `package.json` / `package-lock.json` — 新增上述依赖

## 6. 实施要求

1. **设计令牌（globals.css `@theme`）**：
   - 颜色：`--color-text-primary` / `--color-text-secondary` / `--color-surface` / `--color-left-bias` / `--color-center` / `--color-right-bias` / `--color-bg-primary` / `--color-bg-secondary` / `--color-border` / `--color-divider`（值见 4.1）
   - 字体：`--font-sans: var(--font-poppins)`
   - 字号：`--text-h1`(32px, lh 1.2)、`--text-h2`(24px, 1.3)、`--text-h3`(20px, 1.3)、`--text-h4`(16px, 1.4)、`--text-body-lg`(16px, 1.6)、`--text-body-md`(14px, 1.6)、`--text-body-sm`(13px, 1.6)、`--text-caption`(11px, 1.4)
   - 阴影：覆盖 `--shadow-sm` / `--shadow-md` / `--shadow-lg` 为设计值
   - 圆角：覆盖 `--radius-sm`(4px) / `--radius-md`(8px) / `--radius-lg`(12px)
   - body：`bg-bg-secondary`、`text-text-primary`、`font-sans`、`antialiased`
2. **Button**：TypeScript + 显式 props（`variant`、`disabled`）；使用 Tailwind 类，无内联样式；禁用态 `disabled:pointer-events-none disabled:bg-surface disabled:text-text-secondary`。
3. **Chip**：胶囊形，`bg-bg-secondary text-text-primary`，中号字，可选 trailing “+” 图标（默认带加号，展示 “More +”）。
4. **BiasMeter**：props `left`/`center`/`right`（百分比，默认 25/50/25），三段色块 + 段标签（Left x% / Center x% / Right x%）+ 底部刻度 0% / 50% / 100%；宽度自适应（flex），高度约 10px，rounded-full。
5. **Card**：白底、`rounded-lg`、`shadow-md`，可选的 `title`/`description` 插槽。
6. **展示页**：复刻参考图的分区结构（BRAND → TYPOGRAPHY → UI ELEMENTS → COLORS → ICONS → SPACING → GRID → SHADOWS → RADIUS → FOOTER）；使用设计令牌与组件；网格区用 12 列 grid 可视化 Gutter/Margin；响应式：桌面 12 列，移动端单列堆叠。
7. 全部使用 TypeScript，禁止 `any`；小函数、集中定义常量（色值、字号表等以令牌形式集中在 CSS 与组件 props 类型中）。

## 7. 安全要求

- 本任务不涉及密钥、抓取、AI 或数据库，无服务端密钥暴露面。
- 不引入任何浏览器端不允许的依赖；全部组件为纯展示组件。
- 不动用 `supabase`、`clerk`、`oxylabs`、`ai-sdk` 相关代码。

## 8. 验收标准

- `/design-system` 页面在桌面端与参考图结构一致：浅灰背景、白色卡片、黑色页脚。
- 页面使用 Poppins；H1–Caption 字号/字重/行高与 4.1 表格一致。
- 颜色色块值与参考图完全一致（#0D0D0F / #6B7280 / #F6F6F6 / #B42318 / #E5E7EB / #1D4ED8 / #FFFFFF / #F0F0F0）。
- Button 三种变体 × 四种状态正确呈现；disabled 不可点击。
- Chip、BiasMeter 渲染正确（25/50/25、0–50–100 刻度）。
- 15 个图标以 2px 线性风格展示。
- 间距 4–64、网格 1280/12/24/24、阴影 SM/MD/LG、圆角 4/8/12/full 均有可视化展示。
- `npm run typecheck`、`npm run lint` 通过；`npm run build` 通过（字体下载需联网）。
- 根布局 metadata 已更新为 biasly 品牌信息。

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（涉及 layout/字体/样式变更，需运行；Google Fonts 下载需要网络）
- 如命令因沙箱网络限制失败，将以提权方式重跑（npm install、next build 字体下载）

## 10. 实施后期望的确切手动检查步骤

1. `npm run dev`，观察终端无编译错误。
2. 浏览器打开 `http://localhost:3000/design-system`，与参考图 `01-ui-design-system.png` 逐区对比：
   - 品牌区：biasly（黑粗体）+ News（灰小字）+ 标语
   - 排版区：Poppins 字样与 8 级字号规格表
   - UI 元素区：按钮 3 变体 × 4 状态、4 个胶囊 Chip、偏见计量条（25/50/25 + 0/50/100 刻度）
   - 颜色区：10 个色块与 hex 标注
   - 图标区：15 个线性图标（2px、圆角端帽）
   - 间距区：4/8/16/24/32/40/64 色块
   - 网格区：12 列网格示意 + 1280/12/24/24 标注
   - 阴影区：SM/MD/LG 三档；圆角区：4/8/12/full
   - 页脚：黑色底、品牌/标语、版本号与日期、口号
3. 浏览器窗口缩放到移动端宽度（约 375px）：卡片单列堆叠、无横向滚动。
4. 悬停按钮验证 hover 状态、点击 disabled 按钮无响应。
5. 打开 `http://localhost:3000/`，确认布局仍正常（Home 占位不变）。
