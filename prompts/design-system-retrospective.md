# biasly 设计系统心得：AI 生成代码与 Prompt 中的闪光点

> 范围：biasly 项目设计系统部分，涵盖 `prompts/design-system.md`、`app/globals.css`、`app/fonts.ts`、`app/layout.tsx`、`lib/utils.ts`、`components/ui/*`、`app/design-system/page.tsx`。
>
> 目的：记录 AI 在本次设计系统落地中值得借鉴的优秀做法，作为后续项目的参考。

---

## 一、Prompt 工程闪光点

### 1.1 十节固定模板的结构化约束

`prompts/design-system.md` 严格遵守 AGENTS.md 第 4 节规定的十节结构：目标 → 使用的技能 → 已有代码检查 → 决策或假设 → 可能更改的文件 → 实施要求 → 安全要求 → 验收标准 → 要运行的检查 → 实施后期望的确切手动检查步骤。

**为什么好**：模板把"想清楚再动手"固化成流程。每一节都强制 AI 在编码前回答一个关键问题——用什么技能、改哪些文件、安全边界在哪、怎么验证。这比开放式 prompt 更可控，也便于人类审查。

```1:10:prompts/design-system.md
## 1. 目标

基于 UI 参考图 `01-ui-design-system.png`（Design System v1.0），为 biasly News 应用实现完整的设计系统：

- 设计令牌（颜色、字体、字号、间距、圆角、阴影、网格）
- 品牌字体 Poppins 全局接入
- 核心 UI 组件（Button、Chip、BiasMeter、Card）
- 一套设计系统展示页（`/design-system`），用于视觉验收，同时作为设计系统活文档
```

### 1.2 "已有代码检查"前置——先审计再动手

第 3 节在动手前列出了 `package.json`、`globals.css`、`layout.tsx`、`page.tsx`、`postcss.config.mjs`、`tsconfig.json`、`prompts/` 的现状。

**为什么好**：避免重复造轮子。AI 先确认了"项目已装 Tailwind v4 + @tailwindcss/postcss""tsconfig 已配 @/* 别名""prompts/ 目录已存在且为空"，从而决策"无需改 postcss 配置""无需新建 prompts/ 目录"。这是"基于证据"而非"基于假设"的工程习惯。

```22:31:prompts/design-system.md
## 3. 已有代码检查

- `package.json`：Next.js 16.2.12、React 19.2.4、Tailwind CSS v4 + `@tailwindcss/postcss`；未安装任何 UI 依赖
- `app/globals.css`：仅有 Tailwind 导入 + Geist 变量 + 暗色模式媒体查询（将替换）
- `app/layout.tsx`：使用 Geist 字体，metadata 仍为 "Create Next App"
- `app/page.tsx`：空白 Home 占位（本任务不修改）
- `postcss.config.mjs`：已配置 `@tailwindcss/postcss`
- `tsconfig.json`：已配置 `@/*` 路径别名；无 `components/`、`lib/` 目录
- `prompts/`：目录存在且为空
```

### 1.3 负向约束明确化——"不做什么"单独列出

Prompt 中多处显式声明边界：

- "AGENTS.md 指定的四个项目技能（clerk / supabase / oxylabs-web-scraper / ai-sdk）与本 UI 任务无关，本任务不调用。"
- "首页/详情页等业务页面不在本任务范围。"
- "不修改 `app/page.tsx`。"
- "本任务不涉及密钥、抓取、AI 或数据库，无服务端密钥暴露面。"

**为什么好**：负向约束比正向描述更难遗漏。AI 容易"顺手多做一点"，显式写明"不做什么"能有效收敛范围，也让人工审查时一眼看出是否有越界。

```19:21:prompts/design-system.md
说明：AGENTS.md 指定的四个项目技能（clerk / supabase / oxylabs-web-scraper / ai-sdk）与本 UI 任务无关，本任务不调用。
```

```87:89:prompts/design-system.md
- 展示页：新建 `/design-system` 路由作为设计系统展示页（复刻参考图布局，也是本任务的视觉验收载体）；`app/page.tsx` 保持不变。
- 首页/详情页等业务页面不在本任务范围，后续任务基于本设计系统实现。
```

### 1.4 视觉解读用表格锁定字号/字重/行高

第 4.1 节把 vision 技能识别出的排版规格整理成结构化表格，Token / 用途 / 字号 / 字重 / 行高五列对齐。

**为什么好**：把"图像里的视觉感受"转成"机器可校验的数值表"，消除了模糊地带。后续实施要求与验收标准都可以直接引用这张表，形成"参考图 → 表格 → 代码 → 验收"的可追溯链路。

```43:53:prompts/design-system.md
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
```

### 1.5 验收标准 + 手动检查步骤形成可验证闭环

第 8 节给出验收标准，第 10 节给出"实施后期望的确切手动检查步骤"——从 `npm run dev` 到逐区对比参考图，再到移动端缩放、hover 验证、首页回归。

**为什么好**：AI 产出的代码是否合格，不靠"感觉"，而靠可执行的检查清单。第 10 节甚至细化到"浏览器窗口缩放到约 375px""点击 disabled 按钮无响应"，让验收从模糊变精确。

```147:162:prompts/design-system.md
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
```

---

## 二、设计令牌闪光点

### 2.1 Tailwind v4 `@theme` 全量令牌化

`app/globals.css` 用 Tailwind v4 的 `@theme` 块把颜色、字号、阴影、圆角全部定义为 CSS 变量。之后所有组件直接用 `bg-text-primary`、`text-body-md`、`shadow-md`、`rounded-lg` 这样的语义类名，而非硬编码 hex / px。

**为什么好**：令牌是设计系统的单一事实来源。改色值只需改一处，全站生效。组件代码读起来也是语义化的——`bg-left-bias` 比 `bg-[#b42318]` 更易理解意图。

```7:65:app/globals.css
@theme {
  /* Brand colors */
  --color-text-primary: #0d0d0f;
  --color-text-secondary: #6b7280;
  --color-surface: #f6f6f6;

  /* Semantic bias colors */
  --color-left-bias: #b42318;
  --color-center-bias: #e5e7eb;
  --color-right-bias: #1d4ed8;

  /* Neutrals */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f0f0f0;
  --color-border: #e5e7eb;
  --color-divider: #e5e7eb;

  --color-background: var(--color-bg-primary);
  --color-foreground: var(--color-text-primary);

  /* Typography scale (Poppins) */
  --text-h1: 2rem;
  --text-h1--line-height: 1.2;
  --text-h1--font-weight: 700;

  --text-h2: 1.5rem;
  --text-h2--line-height: 1.3;
  --text-h2--font-weight: 600;

  /* ... */

  /* Shadows */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.08);
  --shadow-lg: 0 12px 24px rgb(0 0 0 / 0.12);

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### 2.2 字号后缀语法：`--text-h1--line-height` / `--text-h1--font-weight` 关联绑定

Tailwind v4 支持用 `--text-{name}--line-height` 和 `--text-{name}--font-weight` 后缀变量，把字号、行高、字重三者绑定到同一个 token 上。使用 `text-h1` 类名时三者一起生效。

**为什么好**：这是"令牌即规范"的体现。排版规格表里的 H1 = 32px / Bold / 1.2，在代码里就是一个 token 的三行定义，不会出现"用了 h1 字号但忘了配行高"的漂移。

```27:42:app/globals.css
  /* Typography scale (Poppins) */
  --text-h1: 2rem;
  --text-h1--line-height: 1.2;
  --text-h1--font-weight: 700;

  --text-h2: 1.5rem;
  --text-h2--line-height: 1.3;
  --text-h2--font-weight: 600;

  --text-h3: 1.25rem;
  --text-h3--line-height: 1.3;
  --text-h3--font-weight: 600;

  --text-h4: 1rem;
  --text-h4--line-height: 1.4;
  --text-h4--font-weight: 500;
```

### 2.3 `@theme inline` 与 `@theme` 分层——字体变量引用 vs 静态令牌定义

文件开头用 `@theme inline` 定义 `--font-sans: var(--font-poppins)`，而颜色、字号等用普通 `@theme` 块。

**为什么好**：`@theme inline` 让 `--font-sans` 引用运行时的 `--font-poppins` 变量（由 next/font 注入），而非在构建时静态展开。这是 Tailwind v4 的精细用法——区分"需要运行时解析的引用"与"静态常量"，避免字体变量被错误内联。

```1:5:app/globals.css
@import "tailwindcss";

@theme inline {
  --font-sans: var(--font-poppins);
}
```

### 2.4 `@utility scrollbar-none` 自定义工具类

用 Tailwind v4 的 `@utility` 指令定义了一个 `scrollbar-none` 工具类，统一隐藏滚动条（含 webkit 与 Firefox）。

**为什么好**：把跨浏览器兼容的样板代码封装成语义工具类，后续任何横向滚动容器（如分类标签栏）只需加 `scrollbar-none` 一行。这比在每个组件里重复写 `::-webkit-scrollbar` 要干净。

```73:81:app/globals.css
/* Hide scrollbars for horizontal scrollers (category bar) */
@utility scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
}
```

---

## 三、组件抽象闪光点

### 3.1 Button：`forwardRef` + `baseClasses`/`variantClasses` 字典分离 + 类型导出

Button 组件用 `forwardRef` 暴露 ref，把基础样式 `baseClasses` 与变体样式 `variantClasses` 字典分离，并把 `ButtonVariant` 类型导出供展示页复用。

**为什么好**：
- `forwardRef` 让组件可被父组件聚焦/测量，符合 shadcn/ui 约定，后续表单场景可用。
- 字典分离让新增变体只需加一行，不动基础样式逻辑。
- 类型导出让展示页能 `satisfies readonly ButtonVariant[]` 反向约束常量数组，类型安全。

```1:35:components/ui/button.tsx
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "text";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const baseClasses =
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-body-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-right-bias focus-visible:ring-offset-2 disabled:pointer-events-none disabled:border-transparent disabled:bg-surface disabled:text-text-secondary";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-text-primary text-bg-primary hover:bg-text-primary/90",
  secondary:
    "border border-text-primary bg-bg-primary text-text-primary hover:bg-surface",
  text: "bg-transparent px-2 text-text-primary hover:text-right-bias",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", className, type = "button", ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    );
  },
);
```

### 3.2 BiasMeter：数据驱动 `segments` 数组 + 双 variant + 无障碍

BiasMeter 把三段（Left/Center/Right）定义为 `segments` 数组，用 `variant` 控制 `detailed`（带刻度）与 `segmented`（段内标签）两种渲染形态，并加 `role="img"` + `aria-label` 保证无障碍。

**为什么好**：
- 数据驱动：加一段只需往数组里加一项，渲染逻辑不变。
- 双 variant：同一组件既用于设计系统展示页（detailed）又用于新闻卡片（segmented），复用度高。
- `aria-label` 里动态拼接百分比，屏幕阅读器能完整读出偏见分布——无障碍不是事后补丁，而是组件内置。

```18:55:components/ui/bias-meter.tsx
export function BiasMeter({
  left = 25,
  center = 50,
  right = 25,
  variant = "detailed",
  className,
}: BiasMeterProps) {
  const segments = [
    {
      label: variant === "segmented" ? `Left ${left}%` : "Left",
      value: left,
      barClass: "bg-left-bias",
      textClass: "text-bg-primary",
    },
    {
      label: variant === "segmented" ? `Center ${center}%` : "Center",
      value: center,
      barClass: "bg-center-bias",
      textClass: "text-text-primary",
    },
    {
      label: variant === "segmented" ? `Right ${right}%` : "Right",
      value: right,
      barClass: "bg-right-bias",
      textClass: "text-bg-primary",
    },
  ];

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full",
          variant === "segmented" ? "h-7 gap-px" : "h-2.5",
        )}
        role="img"
        aria-label={`Bias meter: Left ${left}%, Center ${center}%, Right ${right}%`}
      >
```

### 3.3 Chip：`withPlus` 可控 + 默认 `type="button"` 安全默认值

Chip 组件用 `withPlus` prop 控制 trailing "+" 图标，默认 `type="button"` 防止意外提交表单。

**为什么好**：`type="button"` 是一个容易被忽略但很重要的默认值——HTML button 默认 `type="submit"`，在表单内会触发提交。Chip 作为分类标签通常不该提交表单，显式设为 `button` 是防御性编程的体现。

```1:32:components/ui/chip.tsx
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether to render the trailing "+" icon. */
  withPlus?: boolean;
}

export function Chip({
  className,
  withPlus = true,
  children,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-bg-secondary px-4 py-1.5 text-body-md font-medium text-text-primary transition-colors hover:bg-surface",
        className,
      )}
      {...props}
    >
      {children}
      {withPlus ? (
        <Plus aria-hidden className="size-3.5" strokeWidth={2} />
      ) : null}
    </button>
  );
}
```

### 3.4 Card：`<section>` 语义标签 + `title`/`description` 可选插槽

Card 用 `<section>` 而非 `<div>` 作为根元素，并提供可选的 `title`/`description` 插槽。

**为什么好**：语义化标签对 SEO 和无访问性都有帮助。插槽设计让 Card 既能当简单容器（只传 children），又能当带标题的模块（传 title/description），灵活性高。

```1:33:components/ui/card.tsx
export function Card({
  className,
  title,
  description,
  children,
  ...props
}: CardProps) {
  return (
    <section
      className={cn("rounded-lg bg-bg-primary p-8 shadow-md", className)}
      {...props}
    >
      {title ? (
        <header className="mb-6">
          <h2 className="text-h2 font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-body-sm text-text-secondary">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
```

---

## 四、展示页工程化闪光点

### 4.1 常量集中定义 + `as const` + `satisfies` 约束——类型安全的数据与渲染分离

展示页把 `typeScale`、`colorGroups`、`icons`、`spacingSteps`、`buttonStates`、`buttonVariants` 全部提取为模块级常量，用 `as const` 锁定字面量类型，并用 `satisfies readonly ButtonVariant[]` 反向约束。

**为什么好**：
- 数据与渲染分离：改内容只改常量数组，不动 JSX 逻辑。
- `as const` 让每个条目的字段成为字面量联合类型，`switch` / `map` 时类型推断更精确。
- `satisfies readonly ButtonVariant[]` 确保常量数组的每一项都是合法的 `ButtonVariant`，但又不拓宽类型——这是 TypeScript 4.9+ 的最佳实践，比 `: ButtonVariant[]` 更安全（保留字面量类型）。

```187:196:app/design-system/page.tsx
const spacingSteps = [4, 8, 16, 24, 32, 40, 64] as const;

const buttonStates = ["default", "hover", "outline", "disabled"] as const;
type ButtonState = (typeof buttonStates)[number];

const buttonVariants = [
  "primary",
  "secondary",
  "text",
] as const satisfies readonly ButtonVariant[];
```

### 4.2 `DemoButton` 条件渲染模拟 hover/disabled 态——静态页呈现交互态

展示页用 `DemoButton` 组件，通过 `state` prop 判断：`disabled` 态传 `disabled` 属性，`hover` 态直接注入对应 hover 类名（如 `bg-text-primary/90`），`outline` 态沿用 secondary 默认外观。对于 text 变体不存在的 `outline`/`disabled` 态，渲染占位符 "—"。

**为什么好**：设计系统展示页需要一次性呈现所有状态，但 CSS `:hover` 只有鼠标悬停时才触发。`DemoButton` 用"强制注入 hover 类"的方式让 hover 态常驻可见，是展示页的巧妙做法。对不适用的状态显式渲染占位符，也比"留空"更清晰。

```198:232:app/design-system/page.tsx
function DemoButton({
  variant,
  state,
}: {
  variant: ButtonVariant;
  state: ButtonState;
}) {
  if (variant === "text" && (state === "outline" || state === "disabled")) {
    return (
      <span
        aria-hidden
        className="inline-flex h-10 items-center px-4 text-body-md text-text-secondary"
      >
        —
      </span>
    );
  }

  const hoverClass =
    variant === "primary"
      ? "bg-text-primary/90"
      : variant === "secondary"
        ? "bg-surface"
        : "text-right-bias";

  return (
    <Button
      variant={variant}
      disabled={state === "disabled"}
      className={state === "hover" ? hoverClass : undefined}
    >
      Button
    </Button>
  );
}
```

### 4.3 `Section` 组件复用 `Card` 统一分区视觉

展示页定义了局部 `Section` 组件，统一渲染分区标题（caption 大小写 + 字间距）+ `Card` 容器，所有分区复用同一套布局。

**为什么好**：避免每个分区重复写 `<section><h2/><Card>` 的样板。`Section` 把"分区标题样式 + 卡片容器"封装成一处，改分区视觉只需改 `Section`，全站分区同步。

```234:249:app/design-system/page.tsx
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-caption font-medium uppercase tracking-widest text-text-secondary">
        {title}
      </h2>
      <Card>{children}</Card>
    </section>
  );
}
```

### 4.4 图标区用 `lucide-react` + `strokeWidth={2}` 对齐参考图风格

展示页导入 15 个 lucide 图标，统一设 `strokeWidth={2}`、`size-6`、`text-text-primary`，与参考图"Line style · 2px stroke · Rounded caps"规范对齐。

**为什么好**：lucide-react 默认就是 2px 描边 + 圆角端帽，与参考图图标风格天然一致，省去了自定义 SVG 的成本。统一用 `strokeWidth` / `size` props 而非 CSS 类，让图标规格在一处可调。

```169:185:app/design-system/page.tsx
const icons = [
  { name: "Menu", Icon: Menu },
  { name: "Search", Icon: Search },
  { name: "Bookmark", Icon: Bookmark },
  { name: "Clock", Icon: Clock },
  { name: "Info", Icon: Info },
  { name: "Share", Icon: Share },
  { name: "External Link", Icon: ExternalLink },
  { name: "Calendar", Icon: Calendar },
  { name: "Chart", Icon: ChartColumn },
  { name: "Tag", Icon: Tag },
  { name: "User", Icon: User },
  { name: "Bell", Icon: Bell },
  { name: "Settings", Icon: Settings },
  { name: "Check", Icon: Check },
  { name: "More", Icon: MoreHorizontal },
] as const;
```

```411:425:app/design-system/page.tsx
{icons.map(({ name, Icon }) => (
  <div
    key={name}
    className="flex w-24 flex-col items-center gap-2"
  >
    <Icon
      aria-hidden
      className="size-6 text-text-primary"
      strokeWidth={2}
    />
    <span className="text-caption text-text-secondary">
      {name}
    </span>
  </div>
))}
```

---

## 五、字体与身份集成闪光点

### 5.1 `localFont` 自托管 Poppins 规避网络依赖

`app/fonts.ts` 用 `next/font/local` 加载本地 woff2 文件（400/500/600/700 四个字重），通过 CSS 变量 `--font-poppins` 暴露。

**为什么好**：相比 `next/font/google`，`localFont` 不依赖构建时联网下载字体，在离线或受限网络环境下也能稳定构建。字体文件随仓库分发，保证了构建可复现性。

```1:13:app/fonts.ts
import localFont from "next/font/local";

export const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-400-normal.woff2", weight: "400" },
    { path: "./fonts/poppins-latin-500-normal.woff2", weight: "500" },
    { path: "./fonts/poppins-latin-600-normal.woff2", weight: "600" },
    { path: "./fonts/poppins-latin-700-normal.woff2", weight: "700" },
  ],
  display: "swap",
  variable: "--font-poppins",
});
```

### 5.2 Clerk `appearance` 变量与设计令牌对齐

`app/layout.tsx` 中 ClerkProvider 的 `appearance.variables` 显式把 `colorPrimary`、`colorBackground`、`borderRadius`、`fontFamily` 等映射到设计系统的令牌值。

**为什么好**：第三方身份组件（Clerk 登录弹窗、用户菜单）默认外观往往与业务设计系统割裂。这里用 `appearance.variables` 把 Clerk 的主题变量对齐到 biasly 的 `#0d0d0f` 主色、8px 圆角、Poppins 字体，让登录页也服从设计系统，视觉统一。

```19:34:app/layout.tsx
<ClerkProvider
  afterSignOutUrl="/"
  appearance={{
    variables: {
      colorPrimary: "#0d0d0f",
      colorPrimaryForeground: "#ffffff",
      colorBackground: "#ffffff",
      colorForeground: "#0d0d0f",
      colorInput: "#ffffff",
      colorInputForeground: "#0d0d0f",
      borderRadius: "8px",
      fontFamily:
        "var(--font-poppins), ui-sans-serif, system-ui, sans-serif",
    },
  }}
>
```

---

## 六、总结：值得沉淀的习惯

| 维度 | 核心习惯 | 一句话 |
| --- | --- | --- |
| Prompt | 结构化模板 | 十节固定结构，每节回答一个工程问题 |
| Prompt | 前置审计 | 先读已有代码，再决定改什么 |
| Prompt | 负向约束 | 显式写"不做什么"，收敛范围 |
| 令牌 | 全量 CSS 变量化 | 颜色/字号/阴影/圆角单一事实来源 |
| 令牌 | 字号后缀绑定 | `--text-h1--line-height` 让字号行高不分家 |
| 组件 | 字典分离 | baseClasses + variantClasses，新增变体只加一行 |
| 组件 | 数据驱动 | segments 数组驱动渲染，无障碍内置 |
| 组件 | 安全默认值 | `type="button"` 防意外提交 |
| 展示页 | 数据与渲染分离 | 常量 + as const + satisfies |
| 展示页 | 交互态模拟 | DemoButton 强制注入 hover 类 |
| 集成 | 第三方组件对齐令牌 | Clerk appearance 映射设计系统色值 |

这些闪光点的共性是：**把规范前置成约束，把重复抽象成工具，把模糊量化成表格**。无论是 prompt 还是代码，都在追求"可追溯、可验证、可复用"。
