-- Language Stars 012: problem reports (crash and "stuck" tracking) for the admin view.
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- * problem_reports: short technical reports the app sends when something breaks (an app error,
--   the microphone won't start) or a learner seems stuck (long time on one item, skipped after
--   trying, the coach gave up). Holds the word or sentence, what the speech service heard as
--   text, timings, level, device type and app version. Never names, emails or audio.
-- * Write-only for the app through report_problem() (rate-limited, validated). Nobody but an
--   admin with a strong session can read them (AC-6), and each read is audited (AU-2).
-- * Kept 90 days (SI-12): older reports are removed whenever the admin list is opened.

create table if not exists public.problem_reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references auth.users (id) on delete set null,
  learner_id   uuid references public.learners (id) on delete set null,
  kind         text not null check (kind in ('error', 'stuck', 'skipped', 'gave_up', 'mic')),
  mode         text check (mode in ('reading', 'spanish', 'spelling')),
  level        smallint check (level between 1 and 100),
  item         text check (char_length(item) <= 400),
  heard        text[] not null default '{}' check (cardinality(heard) <= 12),
  seconds      integer check (seconds between 0 and 86400),
  detail       text check (char_length(detail) <= 2000),
  log          text check (char_length(log) <= 8000),
  device       text check (char_length(device) <= 120),
  app_version  text check (char_length(app_version) <= 80),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index if not exists problem_reports_created_idx on public.problem_reports (created_at desc);
create index if not exists problem_reports_reporter_idx on public.problem_reports (reporter_id, created_at desc);

alter table public.problem_reports enable row level security;
alter table public.problem_reports force row level security;
revoke all on public.problem_reports from anon, authenticated, public;
-- (no policies: only the functions below touch it)

create or replace function public.report_problem(r jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  lid uuid;
  h text[];
begin
  if auth.uid() is null then return; end if;
  -- At most 40 reports an hour from one sign-in, so a loop can't flood the table.
  if (select count(*) from public.problem_reports p
       where p.reporter_id = auth.uid() and p.created_at > now() - interval '1 hour') >= 40 then
    return;
  end if;
  begin lid := nullif(r ->> 'learner_id', '')::uuid; exception when others then lid := null; end;
  if lid is not null and not public.can_view_learner(lid) then lid := null; end if;
  select coalesce(array_agg(left(x, 300)), '{}') into h
    from (select jsonb_array_elements_text(case when jsonb_typeof(r -> 'heard') = 'array' then r -> 'heard' else '[]'::jsonb end) as x limit 12) s;
  insert into public.problem_reports (reporter_id, learner_id, kind, mode, level, item, heard, seconds, detail, log, device, app_version)
  values (
    auth.uid(), lid,
    case when r ->> 'kind' in ('error', 'stuck', 'skipped', 'gave_up', 'mic') then r ->> 'kind' else 'error' end,
    case when r ->> 'mode' in ('reading', 'spanish', 'spelling') then r ->> 'mode' end,
    case when (r ->> 'level') ~ '^\d{1,3}$' and (r ->> 'level')::int between 1 and 100 then (r ->> 'level')::smallint end,
    left(r ->> 'item', 400), h,
    case when (r ->> 'seconds') ~ '^\d{1,5}$' then least((r ->> 'seconds')::int, 86400) end,
    left(r ->> 'detail', 2000), left(r ->> 'log', 8000), left(r ->> 'device', 120), left(r ->> 'app_version', 80));
end;
$$;
revoke all on function public.report_problem(jsonb) from public, anon;
grant execute on function public.report_problem(jsonb) to authenticated;

-- Admin list for the last `days` days (1-90). No names or emails: the learner is shown as a short code.
create or replace function public.admin_problems(days integer default 7, include_resolved boolean default false) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer := least(greatest(coalesce(days, 7), 1), 90);
  result jsonb;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  delete from public.problem_reports where created_at < now() - interval '90 days';
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', p.id, 'kind', p.kind, 'mode', p.mode, 'level', p.level, 'item', p.item,
           'heard', to_jsonb(p.heard), 'seconds', p.seconds, 'detail', p.detail, 'log', p.log,
           'device', p.device, 'app_version', p.app_version, 'created_at', p.created_at,
           'resolved_at', p.resolved_at,
           'learner', case when p.learner_id is null then null else left(replace(p.learner_id::text, '-', ''), 6) end,
           'learner_kind', l.kind,
           'reporter', case when p.reporter_id is null then null else left(replace(p.reporter_id::text, '-', ''), 6) end
         ) order by p.created_at desc), '[]'::jsonb)
    into result
    from (select * from public.problem_reports
           where created_at >= now() - make_interval(days => n)
             and (include_resolved or resolved_at is null)
           order by created_at desc limit 1000) p
    left join public.learners l on l.id = p.learner_id;
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.problems.view', auth.jwt() ->> 'aal', jsonb_build_object('days', n));
  return result;
end;
$$;
revoke all on function public.admin_problems(integer, boolean) from public, anon;
grant execute on function public.admin_problems(integer, boolean) to authenticated;

-- Mark reports fixed (or reopen them).
create or replace function public.admin_resolve_problems(ids uuid[], resolved boolean default true) returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  changed integer;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  update public.problem_reports
     set resolved_at = case when resolved then now() else null end
   where id = any (ids[1:1000]);
  get diagnostics changed = row_count;
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.problems.resolve', auth.jwt() ->> 'aal', jsonb_build_object('count', changed, 'resolved', resolved));
  return changed;
end;
$$;
revoke all on function public.admin_resolve_problems(uuid[], boolean) from public, anon;
grant execute on function public.admin_resolve_problems(uuid[], boolean) to authenticated;
