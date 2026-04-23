alter table public.odemeler
add column if not exists gvkli boolean default false;

update public.odemeler
set gvkli = false
where gvkli is null;
