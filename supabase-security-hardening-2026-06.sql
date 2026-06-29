-- Safe hardening migration for odedimi.com.
-- Run after the existing setup/admin/onboarding SQL files.

do $$
begin
  if to_regclass('public.odemeler') is not null then
    alter table public.odemeler enable row level security;
    create index if not exists odemeler_user_id_idx
      on public.odemeler (user_id);
    create index if not exists odemeler_user_id_id_idx
      on public.odemeler (user_id, id);
    create index if not exists odemeler_user_id_grup_idx
      on public.odemeler (user_id, grup);
    create index if not exists odemeler_user_id_fatura_tarihi_idx
      on public.odemeler (user_id, fatura_tarihi);
  end if;

  if to_regclass('public.fatura_ekleri') is not null then
    alter table public.fatura_ekleri enable row level security;
    create index if not exists fatura_ekleri_user_odeme_idx
      on public.fatura_ekleri (user_id, odeme_id);
  end if;

  if to_regclass('public.audit_logs') is not null then
    alter table public.audit_logs enable row level security;
    create index if not exists audit_logs_user_created_idx
      on public.audit_logs (user_id, created_at desc);
  end if;

  if to_regclass('public.user_sessions') is not null then
    alter table public.user_sessions enable row level security;
    create index if not exists user_sessions_user_seen_idx
      on public.user_sessions (user_id, last_seen_at desc);
  end if;

  if to_regclass('public.user_onboarding') is not null then
    alter table public.user_onboarding enable row level security;
  end if;

  if to_regclass('public.admin_user') is not null then
    alter table public.admin_user enable row level security;
    revoke all on public.admin_user from anon, authenticated;
  end if;

  if to_regclass('public.admin_audit_logs') is not null then
    alter table public.admin_audit_logs enable row level security;
    revoke all on public.admin_audit_logs from anon, authenticated;
  end if;

  if to_regclass('public.traffic_events') is not null then
    alter table public.traffic_events enable row level security;
    revoke all on public.traffic_events from anon, authenticated;
  end if;

  if to_regclass('public.admin_user_status') is not null then
    alter table public.admin_user_status enable row level security;
    revoke all on public.admin_user_status from anon, authenticated;
  end if;

  if to_regclass('public.system_settings') is not null then
    alter table public.system_settings enable row level security;
    revoke all on public.system_settings from anon, authenticated;
  end if;

  if to_regclass('public.contact_messages') is not null then
    alter table public.contact_messages enable row level security;
    revoke all on public.contact_messages from anon, authenticated;
    create index if not exists contact_messages_email_created_idx
      on public.contact_messages (lower(email), created_at desc);
  end if;

  if to_regclass('public.contact_message_replies') is not null then
    alter table public.contact_message_replies enable row level security;
    revoke all on public.contact_message_replies from anon, authenticated;
  end if;

  if to_regclass('public.security_rate_limits') is not null then
    alter table public.security_rate_limits disable row level security;
    revoke all on public.security_rate_limits from anon, authenticated;
  end if;
end $$;

do $$
begin
  if to_regclass('public.odemeler') is not null and not exists (
    select 1 from pg_constraint where conname = 'odemeler_tutar_nonnegative_check'
  ) then
    alter table public.odemeler
      add constraint odemeler_tutar_nonnegative_check
      check (tutar is null or tutar >= 0);
  end if;

  if to_regclass('public.odemeler') is not null and not exists (
    select 1 from pg_constraint where conname = 'odemeler_proje_len_check'
  ) then
    alter table public.odemeler
      add constraint odemeler_proje_len_check
      check (proje is null or char_length(proje) <= 160);
  end if;

  if to_regclass('public.odemeler') is not null and not exists (
    select 1 from pg_constraint where conname = 'odemeler_grup_len_check'
  ) then
    alter table public.odemeler
      add constraint odemeler_grup_len_check
      check (grup is null or char_length(grup) <= 160);
  end if;

  if to_regclass('public.fatura_ekleri') is not null and not exists (
    select 1 from pg_constraint where conname = 'fatura_ekleri_name_len_check'
  ) then
    alter table public.fatura_ekleri
      add constraint fatura_ekleri_name_len_check
      check (char_length(name) between 1 and 255);
  end if;

  if to_regclass('public.fatura_ekleri') is not null and not exists (
    select 1 from pg_constraint where conname = 'fatura_ekleri_path_owner_check'
  ) then
    alter table public.fatura_ekleri
      add constraint fatura_ekleri_path_owner_check
      check (split_part(path, '/', 1) = user_id::text);
  end if;
end $$;

create or replace function public.cleanup_security_rate_limits()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.security_rate_limits') is not null then
    execute
      'delete from public.security_rate_limits
       where reset_at < timezone(''utc''::text, now()) - interval ''1 day''';
  end if;
end;
$$;
