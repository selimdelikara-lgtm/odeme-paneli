create extension if not exists pgcrypto;

create table if not exists public.admin_login_otps (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_user(id) on delete cascade,
  email text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  request_ip_hash text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint admin_login_otps_attempts_check check (attempts between 0 and 10)
);

create index if not exists admin_login_otps_admin_created_idx
  on public.admin_login_otps (admin_user_id, created_at desc);

create index if not exists admin_login_otps_expires_idx
  on public.admin_login_otps (expires_at);

alter table public.admin_login_otps enable row level security;
revoke all on public.admin_login_otps from anon, authenticated;

update public.fatura_ekleri
set url = ''
where coalesce(url, '') <> '';
