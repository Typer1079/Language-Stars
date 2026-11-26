-- Language Stars 005: practice history (for progress graphs) and a super-admin dashboard.
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- * practice_rounds: one row per finished round (counts and timings only, never audio or answers).
--   Append-only: learners' families can add and read their own rows; nobody can edit them (AU-9).
-- * app_admins: who may see the site-wide dashboard. Not readable or writable from the app;
--   add an admin only here in the SQL editor (AC-2, AC-6 least privilege).
-- * admin_kpis(): site-wide totals and daily trends, aggregated (no names, no emails). Requires a
--   strong (two-step or Face ID) session and writes an audit entry each time it is used (AU-2).

-- ---------------------------------------------------------------------------
-- Practice history
-- ---------------------------------------------------------------------------
create table if not exists public.practice_rounds (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  learner_id       uuid not null references public.learners (id) on delete cascade,
  mode             text not null check (mode in ('reading', 'spanish')),
  level            smallint not null check (level between 1 and 100),
  level_after      smallint not null check (level_after between 1 and 100),
  items            smallint not null check (items between 0 and 100),
  clean            smallint not null check (clean between 0 and 100),
  coached          smallint not null check (coached between 0 and 100),
  skipped          smallint not null check (skipped between 0 and 100),
  stars            integer  not null check (stars between 0 and 100000),
  questions        smallint not null default 0 check (questions between 0 and 100),
  questions_right  smallint not null default 0 check (questions_right between 0 and questions),
  seconds          integer  not null check (seconds between 0 and 14400),
  created_at       timestamptz not null default now(),
  constraint clean_within_items check (clean + coached + skipped <= items)
);

create index if not exists practice_rounds_learner_idx on public.practice_rounds (learner_id, created_at desc);
create index if not exists practice_rounds_created_idx on public.practice_rounds (created_at);

alter table public.practice_rounds enable row level security;
alter table public.practice_rounds force row level security;
revoke all on public.practice_rounds from anon, authenticated, public;
grant select, insert on public.practice_rounds to authenticated;

drop policy if exists "own rounds: select" on public.practice_rounds;
drop policy if exists "own rounds: insert" on public.practice_rounds;

-- Same rule as the learner itself: kids' history needs a strong session.
create policy "own rounds: select" on public.practice_rounds
  for select to authenticated
  using ((select auth.uid()) = owner_id
         and exists (select 1 from public.learners l
                      where l.id = learner_id and l.owner_id = (select auth.uid())
                        and (l.kind = 'self' or (select public.is_strong_session()))));

create policy "own rounds: insert" on public.practice_rounds
  for insert to authenticated
  with check ((select auth.uid()) = owner_id
              and created_at > now() - interval '5 minutes' and created_at < now() + interval '5 minutes'
              and exists (select 1 from public.learners l
                           where l.id = learner_id and l.owner_id = (select auth.uid())
                             and (l.kind = 'self' or (select public.is_strong_session()))));

-- History retention (AU-11 style): keep two years. Run manually, or schedule with pg_cron:
--   select cron.schedule('purge-rounds', '30 3 * * 0', $$delete from public.practice_rounds where created_at < now() - interval '2 years'$$);

-- ---------------------------------------------------------------------------
-- Super admins
-- ---------------------------------------------------------------------------
create table if not exists public.app_admins (
  user_id   uuid primary key references auth.users (id) on delete cascade,
  added_at  timestamptz not null default now()
);
alter table public.app_admins enable row level security;
alter table public.app_admins force row level security;
revoke all on public.app_admins from anon, authenticated, public;
-- (no policies: invisible to the app)

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.app_admins a where a.user_id = auth.uid())
     and public.is_strong_session();
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_kpis(days integer default 30) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer := least(greatest(coalesce(days, 30), 7), 365);
  since timestamptz := date_trunc('day', now()) - make_interval(days => n - 1);
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'generated_at', now(),
    'days', n,
    'accounts', (select count(*) from auth.users),
    'accounts_new', (select count(*) from auth.users u where u.created_at >= since),
    'learners', (select count(*) from public.learners),
    'learners_kids', (select count(*) from public.learners where kind = 'child'),
    'learners_reading', (select count(*) from public.learners where mode = 'reading'),
    'learners_spanish', (select count(*) from public.learners where mode = 'spanish'),
    'active_accounts_1d', (select count(distinct owner_id) from public.practice_rounds where created_at >= now() - interval '1 day'),
    'active_accounts_7d', (select count(distinct owner_id) from public.practice_rounds where created_at >= now() - interval '7 days'),
    'active_accounts_30d', (select count(distinct owner_id) from public.practice_rounds where created_at >= now() - interval '30 days'),
    'active_learners_7d', (select count(distinct learner_id) from public.practice_rounds where created_at >= now() - interval '7 days'),
    'totals', (select jsonb_build_object(
                 'rounds', count(*), 'items', coalesce(sum(items), 0), 'clean', coalesce(sum(clean), 0),
                 'stars', coalesce(sum(stars), 0), 'minutes', coalesce(round(sum(seconds) / 60.0), 0),
                 'questions', coalesce(sum(questions), 0), 'questions_right', coalesce(sum(questions_right), 0))
               from public.practice_rounds where created_at >= since),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object(
                 'day', to_char(d.day, 'YYYY-MM-DD'),
                 'rounds', coalesce(x.rounds, 0), 'items', coalesce(x.items, 0), 'clean', coalesce(x.clean, 0),
                 'stars', coalesce(x.stars, 0), 'minutes', coalesce(x.minutes, 0),
                 'learners', coalesce(x.learners, 0), 'accounts', coalesce(x.accounts, 0)) order by d.day), '[]'::jsonb)
              from generate_series(since, date_trunc('day', now()), interval '1 day') as d(day)
              left join (select date_trunc('day', created_at) as day, count(*) as rounds, sum(items) as items,
                                sum(clean) as clean, sum(stars) as stars, round(sum(seconds) / 60.0) as minutes,
                                count(distinct learner_id) as learners, count(distinct owner_id) as accounts
                           from public.practice_rounds where created_at >= since group by 1) x on x.day = d.day),
    'levels', (select coalesce(jsonb_agg(jsonb_build_object('band', b.band, 'reading', b.reading, 'spanish', b.spanish) order by b.band), '[]'::jsonb)
               from (select g.band,
                            (select count(*) from public.learners where (reading_level - 1) / 10 = g.band) as reading,
                            (select count(*) from public.learners where (spanish_level - 1) / 10 = g.band) as spanish
                       from generate_series(0, 9) as g(band)) b)
  ) into result;

  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.view_kpis', auth.jwt() ->> 'aal', jsonb_build_object('days', n));
  return result;
end;
$$;
revoke all on function public.admin_kpis(integer) from public, anon;
grant execute on function public.admin_kpis(integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Make yourself the super admin (edit the email, then run just this statement):
--
--   insert into public.app_admins (user_id)
--   select id from auth.users where lower(email) = lower('you@example.com')
--   on conflict do nothing;
-- ---------------------------------------------------------------------------
