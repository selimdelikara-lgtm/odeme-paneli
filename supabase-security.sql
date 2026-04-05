create table if not exists public.security_rate_limits (
  key text primary key,
  count integer not null default 0,
  reset_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists security_rate_limits_reset_at_idx
  on public.security_rate_limits (reset_at);

create or replace function public.touch_security_rate_limits_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists security_rate_limits_touch_updated_at on public.security_rate_limits;
create trigger security_rate_limits_touch_updated_at
before update on public.security_rate_limits
for each row
execute function public.touch_security_rate_limits_updated_at();

alter table public.security_rate_limits disable row level security;

revoke all on public.security_rate_limits from anon;
revoke all on public.security_rate_limits from authenticated;
