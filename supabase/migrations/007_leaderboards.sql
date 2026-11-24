-- Language Stars 007: worldwide rankings that protect names.
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Privacy (AC-3, AC-21, PT-2 minimization): rankings never return names, emails, avatars or ids.
-- Everyone else appears under a fixed made-up codename ("Brave Otter 47"); only your own reader
-- is marked "me" so the app can show your own name to you. Ranks are only for readers you own
-- (kids' need a two-step / Face ID session) or for the super admin.

-- One row of numbers per learner. Internal: not callable by app users.
create or replace function public.learner_metrics()
returns table (
  id uuid, owner_id uuid, kind text,
  stars bigint, stars_week bigint, reading bigint, spanish bigint,
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
           bool_or(mode = 'spanish') as did_spanish
      from public.practice_rounds
     group by learner_id
  )
  select l.id, l.owner_id, l.kind,
         l.lifetime_stars::bigint,
         coalesce(r.stars_week, 0)::bigint,
         -- Levels count once a learner has practiced that subject.
         case when l.mode = 'reading' or coalesce(r.did_reading, false) or l.reading_best > 1 then greatest(l.reading_best, l.reading_level) else 0 end::bigint,
         case when l.mode = 'spanish' or coalesce(r.did_spanish, false) or l.spanish_best > 1 then greatest(l.spanish_best, l.spanish_level) else 0 end::bigint,
         -- Biggest sticker = how many times it was grown, plus one.
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

-- A fixed, made-up name for a learner (never their real name).
create or replace function public.learner_codename(lid uuid) returns text
language sql immutable set search_path = '' as $$
  select (array['Brave','Clever','Swift','Happy','Mighty','Bright','Lucky','Gentle','Bold','Sunny','Jolly','Quick',
                'Cosmic','Wise','Zippy','Calm','Fearless','Sparkly','Curious','Daring','Golden','Silver','Noble','Merry',
                'Witty','Speedy','Cheerful','Shiny','Epic','Super','Kind','Starry'])[1 + get_byte(decode(md5(lid::text), 'hex'), 0) % 32]
      || ' ' ||
         (array['Otter','Falcon','Panda','Tiger','Dolphin','Koala','Fox','Owl','Lion','Penguin','Turtle','Rabbit',
                'Dragon','Unicorn','Whale','Eagle','Bear','Lynx','Puffin','Gecko','Moose','Llama','Hawk','Seal',
                'Zebra','Badger','Raccoon','Hedgehog','Cheetah','Octopus','Parrot','Wolf'])[1 + get_byte(decode(md5(lid::text), 'hex'), 1) % 32]
      || ' ' || (10 + get_byte(decode(md5(lid::text), 'hex'), 2) % 90)::text;
$$;

create or replace function public.learner_codename_icon(lid uuid) returns text
language sql immutable set search_path = '' as $$
  select (array['🦦','🦅','🐼','🐯','🐬','🐨','🦊','🦉','🦁','🐧','🐢','🐰',
                '🐲','🦄','🐳','🦅','🐻','🐱','🐦','🦎','🫎','🦙','🦅','🦭',
                '🦓','🦡','🦝','🦔','🐆','🐙','🦜','🐺'])[1 + get_byte(decode(md5(lid::text), 'hex'), 1) % 32];
$$;

-- Rankings for one metric: the top N, plus your own rank if `me` is given.
create or replace function public.leaderboard(metric text, me uuid default null, top_n integer default 10)
returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer := least(greatest(coalesce(top_n, 10), 3), 50);
  result jsonb;
begin
  if metric not in ('stars','stars_week','reading','spanish','biggest_sticker','stickers','words','minutes_week','days30','questions') then
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
             when 'spanish' then m.spanish when 'biggest_sticker' then m.biggest_sticker when 'stickers' then m.stickers
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

-- All of one learner's ranks at once (for the progress page).
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
        ('stars', m.stars), ('stars_week', m.stars_week), ('reading', m.reading), ('spanish', m.spanish),
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
            from (values ('stars'),('stars_week'),('reading'),('spanish'),('biggest_sticker'),('stickers'),('words'),('minutes_week'),('days30'),('questions')) as x(k)) t;
  return result;
end;
$$;
revoke all on function public.my_ranks(uuid) from public, anon;
grant execute on function public.my_ranks(uuid) to authenticated;
