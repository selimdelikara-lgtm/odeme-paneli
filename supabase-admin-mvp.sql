create extension if not exists pgcrypto;

create table if not exists public.admin_user (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  last_login_at timestamptz
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  entity_type text not null,
  entity_id text,
  old_value jsonb,
  new_value jsonb,
  admin_user_id uuid references public.admin_user(id) on delete set null,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs (created_at desc);

create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs (entity_type, entity_id, created_at desc);

create table if not exists public.traffic_events (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  referrer text,
  device_type text,
  browser text,
  country text,
  city text,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists traffic_events_created_idx
  on public.traffic_events (created_at desc);

create index if not exists traffic_events_path_idx
  on public.traffic_events (path, created_at desc);

create table if not exists public.admin_user_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_active boolean not null default true,
  note text,
  updated_by uuid references public.admin_user(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.admin_user(id) on delete set null,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  admin_note text,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint contact_messages_status_check check (status in ('new', 'reviewed', 'resolved', 'archived')),
  constraint contact_messages_name_len check (char_length(name) between 2 and 120),
  constraint contact_messages_email_len check (char_length(email) between 5 and 254),
  constraint contact_messages_subject_len check (char_length(subject) between 2 and 160),
  constraint contact_messages_message_len check (char_length(message) between 10 and 2000)
);

create index if not exists contact_messages_created_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_status_created_idx
  on public.contact_messages (status, created_at desc);

create table if not exists public.contact_message_replies (
  id uuid primary key default gen_random_uuid(),
  contact_message_id uuid not null references public.contact_messages(id) on delete cascade,
  admin_user_id uuid references public.admin_user(id) on delete set null,
  email text not null,
  subject text not null,
  message text not null,
  provider text not null default 'resend',
  provider_id text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint contact_message_replies_message_len check (char_length(message) between 2 and 5000)
);

create index if not exists contact_message_replies_message_idx
  on public.contact_message_replies (contact_message_id, created_at desc);

alter table public.admin_user enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.traffic_events enable row level security;
alter table public.admin_user_status enable row level security;
alter table public.system_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.contact_message_replies enable row level security;

revoke all on public.admin_user from anon, authenticated;
revoke all on public.admin_audit_logs from anon, authenticated;
revoke all on public.traffic_events from anon, authenticated;
revoke all on public.admin_user_status from anon, authenticated;
revoke all on public.system_settings from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.contact_message_replies from anon, authenticated;

insert into public.system_settings (key, value)
values
  ('maintenance_mode', '{"enabled": false, "message": ""}'::jsonb),
  ('export_settings', '{"default_format": "csv"}'::jsonb)
on conflict (key) do nothing;

drop policy if exists "odemeler_select_own" on public.odemeler;
create policy "odemeler_select_own"
on public.odemeler
for select
to authenticated
using (
  auth.uid() = user_id
  and not exists (
    select 1
    from public.admin_user_status s
    where s.user_id = auth.uid()
      and s.is_active = false
  )
);

drop policy if exists "odemeler_insert_own" on public.odemeler;
create policy "odemeler_insert_own"
on public.odemeler
for insert
to authenticated
with check (
  auth.uid() = user_id
  and not exists (
    select 1
    from public.admin_user_status s
    where s.user_id = auth.uid()
      and s.is_active = false
  )
);

drop policy if exists "odemeler_update_own" on public.odemeler;
create policy "odemeler_update_own"
on public.odemeler
for update
to authenticated
using (
  auth.uid() = user_id
  and not exists (
    select 1
    from public.admin_user_status s
    where s.user_id = auth.uid()
      and s.is_active = false
  )
)
with check (
  auth.uid() = user_id
  and not exists (
    select 1
    from public.admin_user_status s
    where s.user_id = auth.uid()
      and s.is_active = false
  )
);

drop policy if exists "odemeler_delete_own" on public.odemeler;
create policy "odemeler_delete_own"
on public.odemeler
for delete
to authenticated
using (
  auth.uid() = user_id
  and not exists (
    select 1
    from public.admin_user_status s
    where s.user_id = auth.uid()
      and s.is_active = false
  )
);

-- Admin kullaniciyi tanimlamak icin:
-- 1) Normal siteden ya da Supabase Auth panelinden owner hesabini olustur.
-- 2) Asagidaki sorguda e-posta adresini degistirip calistir.
--
-- insert into public.admin_user (user_id, email)
-- select id, email
-- from auth.users
-- where lower(email) = lower('OWNER_EMAIL@example.com')
-- on conflict (user_id) do update
-- set email = excluded.email,
--     is_active = true;
