# biasly 集成 Clerk 登录（Clerk Authentication）

## 1. 目标

为 biasly 前端接入 Clerk 身份验证，实现完整的登录/注册体验：

- 根布局注入 `ClerkProvider`，让全站获得认证上下文
- 创建 `proxy.ts`（Next.js 16 的中间件等价物）接入 `clerkMiddleware()`
- 新增 `/sign-in` 与 `/sign-up` 页面（Clerk 预构建组件，视觉对齐现有设计系统）
- 替换 `components/home/header.tsx` 中静态的 "Login" 占位按钮：未登录显示 Login（跳转 `/sign-in`），已登录显示 `UserButton`
- 补齐 Clerk 环境变量（`.env.local` 与按 AGENTS.md §21 新建的 `.env.example`）

本任务只做身份验证 UI 与基础设施，不涉及数据表、API 路由鉴权或内容付费墙。

## 2. 使用的技能

- `.agents/skills/clerk`（用户指定）→ 路由到：
  - `.agents/skills/clerk-setup`：安装 SDK、环境变量、`ClerkProvider` 放置、`proxy.ts` 约定
  - `.agents/skills/clerk-nextjs-patterns`：服务端/客户端边界（`await auth()`）、`clerkMiddleware` 与 matcher 策略、`Show` 条件渲染
- `node_modules/next/dist/docs/`：已阅读 `01-getting-started/16-proxy.md`（Next.js 16 将 Middleware 更名为 Proxy，功能不变；`proxy.ts` 置于项目根目录）
- Clerk 官方快速上手（clerk.com/docs/nextjs/getting-started/quickstart）：确认 Next.js 16 使用 `proxy.ts`；`clerkMiddleware()` 默认不保护任何路由
- 项目内 Tailwind v4 设计令牌与既有 UI 组件（Button）

说明：项目无 `components.json`，按 `clerk-setup` 技能规则**不**引入 `@clerk/ui` shadcn 主题，仅用 `appearance` 变量做轻量品牌对齐。

## 3. 已有代码检查

- `package.json`：Next.js 16.2.12、React 19.2.4、Tailwind v4；**尚无** `@clerk/nextjs`
- `.env.local`：已存在 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`、`CLERK_SECRET_KEY`（用户已有 Clerk 应用/密钥）；**缺少** `NEXT_PUBLIC_CLERK_SIGN_IN_URL`、`NEXT_PUBLIC_CLERK_SIGN_UP_URL`、`NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL`
- 项目根**无** `.env.example`（AGENTS.md §21 规定其为环境变量规范清单，本任务需创建）
- `app/layout.tsx`：`<html>`/`<body>` 结构简单，`body` 内有 `{children}`；`ClerkProvider` 需放在 `<body>` 内部（当前 SDK 要求）
- `components/home/header.tsx`：右侧为 `Subscribe`（primary）+ `Login`（secondary）静态按钮，`Login` 无功能
- `components/ui/button.tsx`：`Button` 支持 `primary / secondary / text` 变体，`forwardRef` 实现
- `app/globals.css`：设计令牌已定义（`bg-primary #fff`、`bg-secondary #F0F0F0`、`text-primary #0D0D0F`、`text-secondary #6B7280`、`border`、`radius-md/lg`、`shadow-md`、Poppins）
- 项目根无 `middleware.ts`/`proxy.ts`；git 分支 `feat/UI`，工作区干净
- Node v24.14.0（满足 Clerk 当前 SDK 的 Node ≥ 20.9）

## 4. 决策或假设

1. **公开优先（public-first）**：biasly 是新闻站，首页、文章详情页保持公开；本任务不设置任何受保护路由。`clerkMiddleware()` 按官方默认不保护路由，认证状态全站可用，后续如需门控（如 "For You"）再用 `createRouteMatcher` + `auth.protect()` 增量添加。
2. **路由式登录页**：AGENTS.md §21 环境变量表已预留 `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `_SIGN_UP_URL`，故使用应用内 `/sign-in`、`/sign-up` 页面（Clerk 预构建 `<SignIn />`、`<SignUp />`），而非账号门户。
3. **保持现有头部视觉**：未登录时维持 `Subscribe`（primary）+ `Login`（secondary，文本与样式不变，点击进入 `/sign-in`）；已登录时 `Subscribe` + `UserButton`（默认头像菜单，退出后回 `/`）。注册入口由 `/sign-in` 页面内置的 "Create account" 提供，不新增按钮，避免破坏参考图布局。
4. **轻量外观定制**：在 `ClerkProvider` 的 `appearance.variables` 中设置品牌色（primary `#0D0D0F`、背景白、文字 `#0D0D0F`、圆角 8px、Poppins），不安装 `@clerk/ui`。
5. **环境变量补齐**：`.env.local` 追加 3 个 `NEXT_PUBLIC_*` 重定向变量（非敏感）；新建 `.env.example` 作为 AGENTS.md §21 的规范清单（含全部项目变量占位符，`CRON_SECRET` 以注释说明由 Vercel 注入）。
6. **管理员 API 不受影响**：`/api/*` 操作路由沿用 `x-biasly-admin-secret`（`BIASLY_ADMIN_SECRET`）机制，本任务不引入 Clerk 鉴权。

## 5. 可能更改的文件

新增：

- `proxy.ts`（项目根）— `clerkMiddleware()` + 标准 matcher
- `app/sign-in/[[...sign-in]]/page.tsx` — Clerk `<SignIn />`
- `app/sign-up/[[...sign-up]]/page.tsx` — Clerk `<SignUp />`
- `.env.example` — AGENTS.md §21 规范清单

修改：

- `package.json` — 安装 `@clerk/nextjs`（当前 SDK，v7+）
- `app/layout.tsx` — `<body>` 内包裹 `ClerkProvider`（含 `appearance`）
- `components/home/header.tsx` — 认证感知的按钮区
- `.env.local` — 追加 3 个 `NEXT_PUBLIC_CLERK_*` 变量（不进 git）

## 6. 实施要求

### 6.1 安装

- `npm install @clerk/nextjs`（解析为当前 SDK 最新版；若与 Next 16.2.12/React 19.2.4 存在 peer 依赖冲突，如实报告并按实际版本适配）

### 6.2 proxy.ts（项目根）

```ts
import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

- 按官方默认不保护任何路由；matcher 必须包含 API 段，保证认证状态在 API 路由可用

### 6.3 根布局

- `ClerkProvider` 放在 `<body>` **内部**、包裹 `{children}`（当前 SDK 要求，不可包 `<html>`）
- `appearance` 变量：`colorPrimary: "#0d0d0f"`、`colorBackground: "#ffffff"`、`colorText: "#0d0d0f"`、`colorInputBackground: "#ffffff"`、`colorInputText: "#0d0d0f"`、`borderRadius: "8px"`、`fontFamily` 使用 Poppins 变量字体
- 保持现有 metadata、字体与布局类不变

### 6.4 登录/注册页（视觉解读）

- **页面背景**：`bg-bg-secondary`（#F0F0F0），与全站一致
- **布局**：全高居中列（`min-h-[70vh]` 或 `flex min-h-[calc(100vh-4rem)] items-center justify-center`），无横向滚动
- **品牌区**：页面上方 "biasly"（`text-h2`/粗体）+ "News"（灰色细体），下方标语 "Balanced news coverage, powered by AI."（`text-body-md`、`text-text-secondary`）
- **卡片容器**：白色背景、`rounded-lg`（12px）、`shadow-md`、`w-full max-w-sm`（384px）、内边距 `px-6 py-8`，内部渲染 `<SignIn />` / `<SignUp />`
- **响应式**：375px 视口下卡片占满可用宽度（页面 `px-4`），无横向溢出
- 使用 `app/sign-in/[[...sign-in]]/page.tsx` 与 `app/sign-up/[[...sign-up]]/page.tsx` 捕获式路由
- 已登录用户访问这些页面时由 Clerk 组件自动重定向到 fallback URL

### 6.5 头部认证区

`components/home/header.tsx` 右侧按钮区（保持 `ml-auto flex items-center gap-3`）：

- 未登录（`<Show when="signed-out">`）：`SignInButton mode="redirect"` 包裹现有 `Button variant="secondary"`，文本保持 "Login"
- 已登录（`<Show when="signed-in">`）：`UserButton afterSignOutUrl="/"`（移动端可见）
- `Subscribe` 按钮维持不变
- `SignInButton`/`SignUpButton`/`UserButton`/`Show` 从 `@clerk/nextjs` 导入（客户端安全组件，仅用于展示层）

### 6.6 环境变量

`.env.local` 追加（非敏感，仅客户端配置）：

```bash
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL=/
```

新建 `.env.example`，按 AGENTS.md §21 表格列出全部变量占位符：Clerk（含上面 3 个）、Supabase、Oxylabs、OpenAI、`BIASLY_ADMIN_SECRET`、`ANALYSIS_BATCH_SIZE=5`，并注释 `CRON_SECRET` 由 Vercel 注入、勿加入 `.env.local`。

## 7. 安全要求

- 不向浏览器暴露 `CLERK_SECRET_KEY`（已在 `.env.local`，仅服务端读取）；浏览器只能拿到 `NEXT_PUBLIC_*` 变量
- 不把任何密钥写入代码或 `.env.example`（只放占位符）
- `.env.local` 已被 `.gitignore` 忽略，不提交
- 本任务不触碰管理员 API 的 `x-biasly-admin-secret` 机制；不在客户端代码中引入抓取/分析/调度逻辑
- 不引入 `@clerk/ui` 等非必要依赖

## 8. 验收标准

- `proxy.ts` 存在且默认导出 `clerkMiddleware()`，matcher 含 API 段
- `app/layout.tsx` 的 `ClerkProvider` 位于 `<body>` 内，`appearance` 品牌变量生效
- `/sign-in` 与 `/sign-up` 可访问，渲染 Clerk 预构建组件，视觉符合 6.4 描述
- 未登录时头部显示 `Subscribe` + `Login`（样式与现设计一致）；点击 Login 进入 `/sign-in`
- 登录/注册成功后自动重定向回 `/`，头部切换为 `Subscribe` + `UserButton`；退出登录后回到未登录态
- 首页、文章详情页、design-system 页面不受影响
- 375px 视口无横向溢出
- `npm run typecheck`、`npm run lint`、`npm run build` 全部通过（涉及路由与配置变更，需跑 build）

## 9. 要运行的检查

- `npm run typecheck`
- `npm run lint`
- `npm run build`（路由、配置、服务端模块变更）

## 10. 实施后期望的确切手动检查步骤

1. `npm run dev`，终端无编译错误
2. 浏览器打开 `http://localhost:3000/`：
   - 头部右侧为 `Subscribe` + `Login`（样式与之前一致）
   - 点击 `Login` → 跳转 `http://localhost:3000/sign-in`，页面为居中白卡片 + Poppins 品牌字，背景 #F0F0F0
   - 完成注册（或登录）→ 自动重定向回 `/`，头部显示 `Subscribe` + 用户头像（UserButton）
3. 点击头像 → 菜单中退出登录 → 回到未登录态（头部恢复 Login）
4. 打开 `http://localhost:3000/sign-up`，确认注册页同样正常渲染
5. 打开 `http://localhost:3000/design-system` 与任意 `/article/[slug]` 页面，确认无回归
6. 窗口缩放到 375px：登录/注册卡片占满宽度、无横向滚动
