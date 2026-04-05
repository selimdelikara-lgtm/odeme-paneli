create extension if not exists pgcrypto;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  detail text not null,
  source text,
  ip text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists audit_logs_user_created_idx
  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs disable row level security;

revoke all on public.audit_logs from anon;
revoke all on public.audit_logs from authenticated;
