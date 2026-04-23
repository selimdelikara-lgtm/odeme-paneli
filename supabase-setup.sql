alter table public.odemeler
add column if not exists user_id uuid references auth.users(id);

alter table public.odemeler
add column if not exists gvkli boolean default false;

update public.odemeler
set gvkli = false
where gvkli is null;

alter table public.odemeler
alter column user_id set default auth.uid();

update public.odemeler
set user_id = auth.uid()
where user_id is null;

alter table public.odemeler
alter column user_id set not null;

alter table public.odemeler enable row level security;

drop policy if exists "odemeler_select_own" on public.odemeler;
create policy "odemeler_select_own"
on public.odemeler
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "odemeler_insert_own" on public.odemeler;
create policy "odemeler_insert_own"
on public.odemeler
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "odemeler_update_own" on public.odemeler;
create policy "odemeler_update_own"
on public.odemeler
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "odemeler_delete_own" on public.odemeler;
create policy "odemeler_delete_own"
on public.odemeler
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "faturalar_select_own" on storage.objects;
create policy "faturalar_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'faturalar'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "faturalar_insert_own" on storage.objects;
create policy "faturalar_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'faturalar'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "faturalar_delete_own" on storage.objects;
create policy "faturalar_delete_own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'faturalar'
  and split_part(name, '/', 1) = auth.uid()::text
);
