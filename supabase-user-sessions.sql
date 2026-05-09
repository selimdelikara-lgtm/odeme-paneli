create table if not exists public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  user_agent text,
  ip text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint user_sessions_device_id_len check (char_length(device_id) between 16 and 120),
  constraint user_sessions_user_device_unique unique (user_id, device_id)
);

create index if not exists user_sessions_user_expires_idx
  on public.user_sessions (user_id, expires_at desc);

create index if not exists user_sessions_expires_idx
  on public.user_sessions (expires_at);

alter table public.user_sessions enable row level security;

drop policy if exists "Users can read own sessions" on public.user_sessions;
create policy "Users can read own sessions"
  on public.user_sessions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.user_sessions;
create policy "Users can delete own sessions"
  on public.user_sessions
  for delete
  to authenticated
  using (auth.uid() = user_id);
