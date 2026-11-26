-- Language Stars 018: rankings and admin views for the newer languages.
-- Needs 017. Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- * World ranks for French, Portuguese, Tagalog, Japanese, Korean, Mandarin and Farsi (and any later
--   subject): their levels come from learner_subjects. Before this, those rankings showed an error.
-- * Admin → Accounts lists each learner's level in every subject.
-- * admin_subject_levels(): how many learners are in each subject and where, for Admin → Levels.

-- A learner's level in a subject for rankings: counts once they've practiced it (or moved past Level 1).
create or replace function public.subject_level_value(lid uuid, subj text) returns bigint
language sql stable security definer set search_path = '' as $$
  select coalesce((
    select greatest(ls.best, ls.level)::bigint
      from public.learner_subjects ls
      join public.learners l on l.id = ls.learner_id
     where ls.learner_id = lid and ls.subject = subj
       and (ls.best > 1 or l.mode = subj
            or exists (select 1 from public.practice_rounds p where p.learner_id = lid and p.mode = subj))), 0)
$$;
revoke all on function public.subject_level_value(uuid, text) from public, anon, authenticated;

create or replace function public.leaderboard(metric text, me uuid default null, top_n integer default 10)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer := least(greatest(coalesce(top_n, 10), 3), 50);
  result jsonb;
begin
  if metric not in ('stars','stars_week','reading','spanish','spelling','biggest_sticker','stickers','words','minutes_week','days30','questions')
     and not exists (select 1 from public.subjects s where s.id = metric) then
    raise exception 'Unknown ranking' using errcode = '22023';
  end if;
  if me is null then
    if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  elsif not public.can_view_learner(me) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  with v as (
    select m.id,
           case metric
             when 'stars' then m.stars when 'stars_week' then m.stars_week when 'reading' then m.reading
             when 'spanish' then m.spanish when 'spelling' then m.spelling
             when 'biggest_sticker' then m.biggest_sticker when 'stickers' then m.stickers
             when 'words' then m.words when 'minutes_week' then m.minutes_week when 'days30' then m.days30
             when 'questions' then m.questions
             else public.subject_level_value(m.id, metric) end as value
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
  if me is null or not public.can_view_learner(me) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  with m as (select * from public.learner_metrics()),
  long as (
    select m.id, x.k, x.value
      from m cross join lateral (values
        ('stars', m.stars), ('stars_week', m.stars_week), ('reading', m.reading), ('spanish', m.spanish), ('spelling', m.spelling),
        ('biggest_sticker', m.biggest_sticker), ('stickers', m.stickers), ('words', m.words),
        ('minutes_week', m.minutes_week), ('days30', m.days30), ('questions', m.questions)) as x(k, value)
    union all
    -- Subjects without an old learner column (the newer languages), from learner_subjects.
    select m.id, s.id, public.subject_level_value(m.id, s.id)
      from m cross join public.subjects s
     where s.id not in ('reading', 'spanish', 'spelling')
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
            from (select v.k from (values ('stars'),('stars_week'),('reading'),('spanish'),('spelling'),('biggest_sticker'),('stickers'),('words'),('minutes_week'),('days30'),('questions')) as v(k)
                  union select s.id from public.subjects s) as x(k)) t;
  return result;
end;
$$;
revoke all on function public.my_ranks(uuid) from public, anon;
grant execute on function public.my_ranks(uuid) to authenticated;

create or replace function public.admin_users() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  result jsonb;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
           'id', u.id,
           'email', u.email,
           'created_at', u.created_at,
           'last_sign_in_at', u.last_sign_in_at,
           'archived_at', f.archived_at,
           'archive_reason', f.reason,
           'archive_kind', f.kind,
           'is_admin', exists (select 1 from public.app_admins a where a.user_id = u.id),
           'terms_version', (select t.version from public.terms_acceptance t where t.user_id = u.id order by t.accepted_at desc limit 1),
           'last_active', greatest((select max(p.created_at) from public.practice_rounds p where p.owner_id = u.id),
                                   (select a.last_seen_at from public.account_activity a where a.user_id = u.id)),
           'paying', public.is_paying(u.id),
           'plan_status', (select pl.status from public.account_plans pl where pl.user_id = u.id),
           'last_notice', (select n.kind from public.inactivity_notices n where n.user_id = u.id order by n.sent_at desc limit 1),
           'devices', (select count(*) from public.learner_devices d where d.owner_id = u.id),
           'learners', coalesce((select jsonb_agg(jsonb_build_object(
                          'name', l.display_name, 'kind', l.kind, 'mode', l.mode, 'avatar', l.avatar,
                          'reading', l.reading_level, 'spanish', l.spanish_level, 'spelling', l.spelling_level,
                          'levels', (select coalesce(jsonb_object_agg(ls.subject, ls.level), '{}'::jsonb)
                                       from public.learner_subjects ls where ls.learner_id = l.id),
                          'stars', l.lifetime_stars) order by l.created_at)
                        from public.learners l where l.owner_id = u.id), '[]'::jsonb)
         ) order by u.created_at desc), '[]'::jsonb)
    into result
    from auth.users u
    left join public.account_flags f on f.user_id = u.id
   where not coalesce(u.is_anonymous, false);
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.view_users', auth.jwt() ->> 'aal', '{}'::jsonb);
  return result;
end;
$$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- Admin → Levels: learners per subject (current choice) and per subject per 10-level band.
create or replace function public.admin_subject_levels() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return jsonb_build_object(
    'modes', (select coalesce(jsonb_object_agg(mode, n), '{}'::jsonb) from (select mode, count(*) as n from public.learners group by mode) x),
    'bands', (select coalesce(jsonb_agg(jsonb_build_object('subject', subject, 'band', band, 'n', n)), '[]'::jsonb)
                from (select ls.subject, (ls.level - 1) / 10 as band, count(*) as n
                        from public.learner_subjects ls
                        join public.learners l on l.id = ls.learner_id
                       where ls.level > 1 or ls.best > 1 or l.mode = ls.subject
                          or exists (select 1 from public.practice_rounds p where p.learner_id = l.id and p.mode = ls.subject)
                       group by 1, 2) y));
end;
$$;
revoke all on function public.admin_subject_levels() from public, anon;
grant execute on function public.admin_subject_levels() to authenticated;
