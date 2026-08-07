-- ============================================================================
-- biasly Supabase schema（AGENTS.md §7 / §9 / §18 / §19）
-- 说明：
--   1. 2026-04 起 Supabase 新建表不再自动暴露给 Data API，必须显式 GRANT。
--   2. 先启用 RLS，再创建 policy，最后 GRANT（官方推荐顺序）。
--   3. 字段变更时必须同步更新 lib/supabase/types.ts（AGENTS.md §7）。
--   4. article_analyses 暂不含 embedding 列；pgvector（§20）启用后再加入。
-- 执行位置：Supabase Dashboard → SQL Editor（可重复执行，幂等）。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- sources：新闻源（抓取流程只加载 active = true 的源，§8/§9）
-- ----------------------------------------------------------------------------
create table if not exists public.sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  listing_url text not null unique,
  parser_strategy text,
  active boolean not null default true,
  logo_url text,
  created_at timestamptz not null default now()
);

create index if not exists sources_active_idx
  on public.sources (active)
  where active;

-- ----------------------------------------------------------------------------
-- articles：文章（仅追加写入；original_url / canonical_url 用于去重，§9/§10）
-- ----------------------------------------------------------------------------
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  original_url text not null unique,
  canonical_url text not null unique,
  slug text not null unique,
  title text not null,
  image_url text not null,
  published_at timestamptz not null,
  raw_text text not null,
  scraped_at timestamptz not null default now(),
  analyzed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists articles_analyzed_at_idx
  on public.articles (analyzed_at);

create index if not exists articles_source_id_idx
  on public.articles (source_id);

-- ----------------------------------------------------------------------------
-- article_analyses：AI 分析（一篇文章至多一行；bias_score 为生成列，§19）
-- ----------------------------------------------------------------------------
create table if not exists public.article_analyses (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null unique references public.articles(id) on delete cascade,
  summary text not null,
  sentiment_score double precision not null
    check (sentiment_score >= -1 and sentiment_score <= 1),
  sentiment_label text not null
    check (sentiment_label in ('positive', 'neutral', 'negative')),
  bias_label text not null
    check (bias_label in ('left', 'center', 'right', 'mixed', 'unclear')),
  left_percentage numeric(5,2) not null
    check (left_percentage >= 0 and left_percentage <= 100),
  center_percentage numeric(5,2) not null
    check (center_percentage >= 0 and center_percentage <= 100),
  right_percentage numeric(5,2) not null
    check (right_percentage >= 0 and right_percentage <= 100),
  bias_score double precision
    generated always as (
      ((right_percentage - left_percentage) / 100.0)::double precision
    ) stored,
  confidence double precision not null
    check (confidence >= 0 and confidence <= 1),
  framing_notes text not null,
  loaded_terms text[] not null default '{}',
  disclaimer text not null,
  model text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_analyses_percentages_sum
    check (left_percentage + center_percentage + right_percentage = 100)
);

-- ----------------------------------------------------------------------------
-- logs：流水线日志（仅服务端写入；不对客户端角色开放）
-- ----------------------------------------------------------------------------
create table if not exists public.logs (
  id bigint generated always as identity primary key,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  context jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_created_at_idx
  on public.logs (created_at desc);

-- ----------------------------------------------------------------------------
-- oxylabs_schedules：每源一个 Oxylabs 调度（§18）
-- oxylabs_schedule_id 为超出 JS Number.MAX_SAFE_INTEGER 的 64 位大整数，
-- 必须存为 text，避免解析精度丢失。
-- ----------------------------------------------------------------------------
create table if not exists public.oxylabs_schedules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null unique references public.sources(id) on delete cascade,
  oxylabs_schedule_id text not null unique,
  status text not null default 'active'
    check (status in ('active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- oxylabs_schedule_runs：调度运行记录（§18，使用 /runs 而非 /jobs）
-- ----------------------------------------------------------------------------
create table if not exists public.oxylabs_schedule_runs (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references public.oxylabs_schedules(id) on delete cascade,
  oxylabs_run_id text not null unique,
  status text not null default 'pending'
    check (status in ('pending', 'done', 'faulted')),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- RLS：所有表启用；仅公开内容表对 anon/authenticated 开放 SELECT
-- ----------------------------------------------------------------------------
alter table public.sources enable row level security;
alter table public.articles enable row level security;
alter table public.article_analyses enable row level security;
alter table public.logs enable row level security;
alter table public.oxylabs_schedules enable row level security;
alter table public.oxylabs_schedule_runs enable row level security;

drop policy if exists "sources_public_read_active" on public.sources;
create policy "sources_public_read_active" on public.sources
  for select to anon, authenticated
  using (active = true);

drop policy if exists "articles_public_read_analyzed" on public.articles;
create policy "articles_public_read_analyzed" on public.articles
  for select to anon, authenticated
  using (analyzed_at is not null);

drop policy if exists "analyses_public_read_of_analyzed" on public.article_analyses;
create policy "analyses_public_read_of_analyzed" on public.article_analyses
  for select to anon, authenticated
  using (
    exists (
      select 1
      from public.articles a
      where a.id = article_id and a.analyzed_at is not null
    )
  );

-- logs / oxylabs_schedules / oxylabs_schedule_runs：
-- 仅启用 RLS，不创建 policy、不 GRANT 给 anon/authenticated（Data API 不可达）。

-- ----------------------------------------------------------------------------
-- GRANT：显式授予（2026-04 起新表不再自动暴露给 Data API）
-- ----------------------------------------------------------------------------
grant select on public.sources, public.articles, public.article_analyses
  to anon, authenticated;

grant all on public.sources, public.articles, public.article_analyses,
  public.logs, public.oxylabs_schedules, public.oxylabs_schedule_runs
  to service_role;
