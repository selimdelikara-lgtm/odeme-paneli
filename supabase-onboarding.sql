create table if not exists public.user_onboarding (
  user_id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create or replace function public.set_user_onboarding_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists set_user_onboarding_updated_at on public.user_onboarding;
create trigger set_user_onboarding_updated_at
before update on public.user_onboarding
for each row
execute function public.set_user_onboarding_updated_at();

alter table public.user_onboarding enable row level security;

drop policy if exists "Users can read own onboarding" on public.user_onboarding;
create policy "Users can read own onboarding"
on public.user_onboarding
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own onboarding" on public.user_onboarding;
create policy "Users can insert own onboarding"
on public.user_onboarding
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own onboarding" on public.user_onboarding;
create policy "Users can update own onboarding"
on public.user_onboarding
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
