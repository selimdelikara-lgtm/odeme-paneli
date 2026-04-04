create table if not exists public.fatura_ekleri (
  id bigserial primary key,
  odeme_id bigint not null references public.odemeler(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  path text not null unique,
  url text not null,
  uploaded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists fatura_ekleri_odeme_id_idx
  on public.fatura_ekleri (odeme_id);

create index if not exists fatura_ekleri_user_id_idx
  on public.fatura_ekleri (user_id);

alter table public.fatura_ekleri enable row level security;

drop policy if exists "fatura_ekleri_select_own" on public.fatura_ekleri;
create policy "fatura_ekleri_select_own"
on public.fatura_ekleri
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "fatura_ekleri_insert_own" on public.fatura_ekleri;
create policy "fatura_ekleri_insert_own"
on public.fatura_ekleri
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "fatura_ekleri_delete_own" on public.fatura_ekleri;
create policy "fatura_ekleri_delete_own"
on public.fatura_ekleri
for delete
to authenticated
using (auth.uid() = user_id);
