-- Language Stars 008: the Spelling Bee learning path (levels 1-100), in graphs, ranks and the
-- admin dashboard. Needs 005 and 007 first. Safe to run more than once.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

-- Learners: a third subject and its levels.
alter table public.learners drop constraint if exists learners_mode_check;
alter table public.learners add constraint learners_mode_check check (mode in ('reading', 'spanish', 'spelling'));
alter table public.learners add column if not exists spelling_level int not null default 1;
alter table public.learners add column if not exists spelling_best int not null default 1;
alter table public.learners drop constraint if exists learners_spelling_level_check;
alter table public.learners drop constraint if exists learners_spelling_best_check;
alter table public.learners add constraint learners_spelling_level_check check (spelling_level between 1 and 100);
alter table public.learners add constraint learners_spelling_best_check check (spelling_best between 1 and 100);

create or replace function public.learners_guard() returns trigger
-- security definer so the profile limit counts every row, including ones hidden by RLS.
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.learners where owner_id = new.owner_id) >= 12 then
      raise exception 'Too many reader profiles on this account (limit 12).';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.owner_id <> old.owner_id then
      raise exception 'A reader profile cannot move to another account.';
    end if;
    if new.lifetime_stars < old.lifetime_stars then
      raise exception 'Lifetime stars can only go up.';
    end if;
    if new.reading_best < old.reading_best or new.spanish_best < old.spanish_best or new.spelling_best < old.spelling_best then
      raise exception 'Best level can only go up.';
    end if;
    new.updated_at := now();
  end if;
  new.reading_best := greatest(new.reading_best, new.reading_level);
  new.spanish_best := greatest(new.spanish_best, new.spanish_level);
  new.spelling_best := greatest(new.spelling_best, new.spelling_level);
  new.display_name := btrim(new.display_name);
  return new;
end;
$$;
revoke all on function public.learners_guard() from public, anon, authenticated;

-- Practice history: spelling rounds too.
alter table public.practice_rounds drop constraint if exists practice_rounds_mode_check;
alter table public.practice_rounds add constraint practice_rounds_mode_check check (mode in ('reading', 'spanish', 'spelling'));

-- Rankings: add the spelling level.
drop function if exists public.learner_metrics();
create function public.learner_metrics()
returns table (
  id uuid, owner_id uuid, kind text,
  stars bigint, stars_week bigint, reading bigint, spanish bigint, spelling bigint,
  biggest_sticker bigint, stickers bigint, words bigint, minutes_week bigint, days30 bigint, questions bigint
)
language sql stable security definer set search_path = '' as $$
  with r as (
    select learner_id,
           coalesce(sum(stars) filter (where created_at >= now() - interval '7 days'), 0) as stars_week,
           coalesce(sum(clean), 0) as words,
           coalesce(round(sum(seconds) filter (where created_at >= now() - interval '7 days') / 60.0), 0) as minutes_week,
           count(distinct date_trunc('day', created_at)) filter (where created_at >= now() - interval '30 days') as days30,
           coalesce(sum(questions_right), 0) as questions,
           bool_or(mode = 'reading') as did_reading,
           bool_or(mode = 'spanish') as did_spanish,
           bool_or(mode = 'spelling') as did_spelling
      from public.practice_rounds
     group by learner_id
  )
  select l.id, l.owner_id, l.kind,
         l.lifetime_stars::bigint,
         coalesce(r.stars_week, 0)::bigint,
         case when l.mode = 'reading' or coalesce(r.did_reading, false) or l.reading_best > 1 then greatest(l.reading_best, l.reading_level) else 0 end::bigint,
         case when l.mode = 'spanish' or coalesce(r.did_spanish, false) or l.spanish_best > 1 then greatest(l.spanish_best, l.spanish_level) else 0 end::bigint,
         case when l.mode = 'spelling' or coalesce(r.did_spelling, false) or l.spelling_best > 1 then greatest(l.spelling_best, l.spelling_level) else 0 end::bigint,
         coalesce((select max(coalesce((s ->> 'growCount')::int, 0)) + 1 from jsonb_array_elements(l.stickers) s), 0)::bigint,
         jsonb_array_length(l.stickers)::bigint,
         coalesce(r.words, 0)::bigint,
         coalesce(r.minutes_week, 0)::bigint,
         coalesce(r.days30, 0)::bigint,
         coalesce(r.questions, 0)::bigint
    from public.learners l
    left join r on r.learner_id = l.id;
$$;
revoke all on function public.learner_metrics() from public, anon, authenticated;

create or replace function public.leaderboard(metric text, me uuid default null, top_n integer default 10)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer := least(greatest(coalesce(top_n, 10), 3), 50);
  result jsonb;
begin
  if metric not in ('stars','stars_week','reading','spanish','spelling','biggest_sticker','stickers','words','minutes_week','days30','questions') then
    raise exception 'Unknown ranking' using errcode = '22023';
  end if;
  if me is null then
    if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  elsif not exists (select 1 from public.learners l
                     where l.id = me and l.owner_id = auth.uid()
                       and (l.kind = 'self' or public.is_strong_session())) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  with v as (
    select m.id,
           case metric
             when 'stars' then m.stars when 'stars_week' then m.stars_week when 'reading' then m.reading
             when 'spanish' then m.spanish when 'spelling' then m.spelling
             when 'biggest_sticker' then m.biggest_sticker when 'stickers' then m.stickers
             when 'words' then m.words when 'minutes_week' then m.minutes_week when 'days30' then m.days30
             else m.questions end as value
      from public.learner_metrics() m
  ), ranked as (
    select id, value, rank() over (order by value desc) as rnk, row_number() over (order by value desc, id) as rn
      from v where value > 0
  )
  select jsonb_build_object(
    'metric', metric,
    'total', (select count(*) from ranked),
    'me', (select jsonb_build_object('rank', rnk, 'value', value) from ranked where id = me),
    'top', coalesce((select jsonb_agg(jsonb_build_object(
                       'rank', rnk, 'value', value,
                       'name', public.learner_codename(id), 'icon', public.learner_codename_icon(id),
                       'me', coalesce(id = me, false)) order by rn)
                     from ranked where rn <= n), '[]'::jsonb)
  ) into result;

  if me is null then
    insert into public.audit_log (actor_id, action, aal, detail)
    values (auth.uid(), 'admin.view_leaderboard', auth.jwt() ->> 'aal', jsonb_build_object('metric', metric));
  end if;
  return result;
end;
$$;
revoke all on function public.leaderboard(text, uuid, integer) from public, anon;
grant execute on function public.leaderboard(text, uuid, integer) to authenticated;

create or replace function public.my_ranks(me uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb := '{}'::jsonb;
begin
  if me is null or not exists (select 1 from public.learners l
                                where l.id = me and l.owner_id = auth.uid()
                                  and (l.kind = 'self' or public.is_strong_session())) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  with m as (select * from public.learner_metrics()),
  long as (
    select m.id, x.k, x.value
      from m cross join lateral (values
        ('stars', m.stars), ('stars_week', m.stars_week), ('reading', m.reading), ('spanish', m.spanish), ('spelling', m.spelling),
        ('biggest_sticker', m.biggest_sticker), ('stickers', m.stickers), ('words', m.words),
        ('minutes_week', m.minutes_week), ('days30', m.days30), ('questions', m.questions)) as x(k, value)
  ), ranked as (
    select id, k, value, rank() over (partition by k order by value desc) as rnk, count(*) over (partition by k) as total
      from long where value > 0
  )
  select coalesce(jsonb_object_agg(t.k, jsonb_build_object(
           'total', t.total,
           'rank', (select r.rnk from ranked r where r.k = t.k and r.id = me),
           'value', coalesce((select l.value from long l where l.k = t.k and l.id = me), 0))), '{}'::jsonb)
    into result
    from (select x.k, coalesce((select max(total) from ranked r where r.k = x.k), 0) as total
            from (values ('stars'),('stars_week'),('reading'),('spanish'),('spelling'),('biggest_sticker'),('stickers'),('words'),('minutes_week'),('days30'),('questions')) as x(k)) t;
  return result;
end;
$$;
revoke all on function public.my_ranks(uuid) from public, anon;
grant execute on function public.my_ranks(uuid) to authenticated;

-- Admin dashboard: spelling counts and level spread.
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
    'learners_spelling', (select count(*) from public.learners where mode = 'spelling'),
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
    'levels', (select coalesce(jsonb_agg(jsonb_build_object('band', b.band, 'reading', b.reading, 'spanish', b.spanish, 'spelling', b.spelling) order by b.band), '[]'::jsonb)
               from (select g.band,
                            (select count(*) from public.learners where (reading_level - 1) / 10 = g.band) as reading,
                            (select count(*) from public.learners where (spanish_level - 1) / 10 = g.band) as spanish,
                            (select count(*) from public.learners where (mode = 'spelling' or spelling_best > 1) and (spelling_level - 1) / 10 = g.band) as spelling
                       from generate_series(0, 9) as g(band)) b)
  ) into result;

  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.view_kpis', auth.jwt() ->> 'aal', jsonb_build_object('days', n));
  return result;
end;
$$;
revoke all on function public.admin_kpis(integer) from public, anon;
grant execute on function public.admin_kpis(integer) to authenticated;
