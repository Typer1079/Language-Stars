-- Language Stars 010: learner devices (a child signs in on their own phone, linked by a parent)
-- and automatic archiving after 90 days without activity (re-verification needed to come back).
-- Needs 005-009 first. Safe to run more than once.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- ALSO REQUIRED for learner devices: Authentication -> Sign In / Providers -> "Allow anonymous sign-ins" ON.
--
-- Learner devices (COPPA): the child never gives an email, phone number or password. The parent,
-- signed in with two-step / Face ID, makes a one-time code (valid 10 minutes); the child's device
-- signs in anonymously and redeems it. That device can then see and update ONLY that one learner's
-- progress (not its name or settings, not other learners, not the parent's account). The parent can
-- see and unlink devices at any time. Every link and unlink is audited.
--
-- Inactivity (AC-2(3)): an account with no sign-in or practice for 90 days is archived the next time
-- it appears (or by the optional nightly job at the bottom). It must re-verify with an emailed link,
-- Face ID or its authenticator code before its data is available again.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Archive kinds and activity
-- ---------------------------------------------------------------------------
alter table public.account_flags add column if not exists kind text not null default 'admin';
alter table public.account_flags drop constraint if exists account_flags_kind_check;
alter table public.account_flags add constraint account_flags_kind_check check (kind in ('admin', 'inactive'));

create table if not exists public.account_activity (
  user_id       uuid primary key references auth.users (id) on delete cascade,
  last_seen_at  timestamptz not null default now()
);
alter table public.account_activity enable row level security;
alter table public.account_activity force row level security;
revoke all on public.account_activity from anon, authenticated, public;

-- ---------------------------------------------------------------------------
-- Learner devices
-- ---------------------------------------------------------------------------
create table if not exists public.learner_devices (
  device_user_id  uuid primary key references auth.users (id) on delete cascade,
  learner_id      uuid not null references public.learners (id) on delete cascade,
  owner_id        uuid not null references auth.users (id) on delete cascade,
  label           text check (label is null or char_length(label) <= 40),
  created_at      timestamptz not null default now(),
  last_seen_at    timestamptz
);
create index if not exists learner_devices_learner_idx on public.learner_devices (learner_id);
alter table public.learner_devices enable row level security;
alter table public.learner_devices force row level security;
revoke all on public.learner_devices from anon, authenticated, public;

create table if not exists public.pairing_codes (
  code        text primary key,
  learner_id  uuid not null references public.learners (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
alter table public.pairing_codes enable row level security;
alter table public.pairing_codes force row level security;
revoke all on public.pairing_codes from anon, authenticated, public;

-- The one learner this signed-in device is linked to (null for normal accounts, or if the parent's account is archived).
create or replace function public.device_learner() returns uuid
language sql stable security definer set search_path = '' as $$
  select d.learner_id
    from public.learner_devices d
   where d.device_user_id = auth.uid()
     and not exists (select 1 from public.account_flags f where f.user_id = d.owner_id);
$$;
revoke all on function public.device_learner() from public, anon;
grant execute on function public.device_learner() to authenticated;

-- May the caller see this learner? (its owner with the usual rules, or its linked device)
create or replace function public.can_view_learner(lid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.learners l
                  where l.id = lid and l.owner_id = auth.uid() and public.account_active()
                    and (l.kind = 'self' or public.is_strong_session()))
      or lid = public.device_learner();
$$;
revoke all on function public.can_view_learner(uuid) from public, anon;
grant execute on function public.can_view_learner(uuid) to authenticated;

-- Devices can read and save progress for their learner only.
drop policy if exists "device learner: select" on public.learners;
drop policy if exists "device learner: update" on public.learners;
create policy "device learner: select" on public.learners for select to authenticated
  using (id = (select public.device_learner()));
create policy "device learner: update" on public.learners for update to authenticated
  using (id = (select public.device_learner())) with check (id = (select public.device_learner()));

-- A device can't rename the learner or change their profile settings (only progress, stickers and today's subject).
create or replace function public.learners_guard() returns trigger
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
    if auth.uid() is distinct from old.owner_id and auth.uid() is not null
       and (new.display_name <> old.display_name or new.kind <> old.kind or new.age_group <> old.age_group
            or new.sticker_style <> old.sticker_style or new.avatar is distinct from old.avatar) then
      raise exception 'Only the parent can change this profile.';
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

-- Practice history from a device is filed under the parent's account.
create or replace function public.practice_rounds_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.owner_id := (select l.owner_id from public.learners l where l.id = new.learner_id);
  return new;
end;
$$;
revoke all on function public.practice_rounds_owner() from public, anon, authenticated;
drop trigger if exists practice_rounds_owner on public.practice_rounds;
create trigger practice_rounds_owner before insert on public.practice_rounds
  for each row execute function public.practice_rounds_owner();

drop policy if exists "device rounds: select" on public.practice_rounds;
drop policy if exists "device rounds: insert" on public.practice_rounds;
create policy "device rounds: select" on public.practice_rounds for select to authenticated
  using (learner_id = (select public.device_learner()));
create policy "device rounds: insert" on public.practice_rounds for insert to authenticated
  with check (learner_id = (select public.device_learner())
              and created_at > now() - interval '5 minutes' and created_at < now() + interval '5 minutes');

-- Parent: make a one-time code (10 minutes) to link a phone or tablet to one learner.
create or replace function public.create_pairing_code(learner uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
  b bytea;
  i int;
begin
  if not exists (select 1 from public.learners l where l.id = learner and l.owner_id = auth.uid()) then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if not public.account_active() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if not public.is_strong_session() then
    raise exception 'Linking a device needs a two-step or Face ID sign-in.' using errcode = '42501';
  end if;
  if (select count(*) from public.learner_devices d where d.learner_id = learner) >= 5 then
    raise exception 'This learner already has 5 linked devices. Unlink one first.' using errcode = '22023';
  end if;
  delete from public.pairing_codes where expires_at < now() or (owner_id = auth.uid() and pairing_codes.learner_id = learner);
  b := extensions.gen_random_bytes(10);
  c := '';
  for i in 0..9 loop c := c || substr(alphabet, 1 + (get_byte(b, i) % length(alphabet)), 1); end loop;
  insert into public.pairing_codes (code, learner_id, owner_id, expires_at) values (c, learner, auth.uid(), now() + interval '10 minutes');
  insert into public.audit_log (actor_id, learner_id, action, aal, detail)
  values (auth.uid(), learner, 'device.code_created', auth.jwt() ->> 'aal', '{}'::jsonb);
  return jsonb_build_object('code', c, 'expires_at', now() + interval '10 minutes');
end;
$$;
revoke all on function public.create_pairing_code(uuid) from public, anon;
grant execute on function public.create_pairing_code(uuid) to authenticated;

-- Device: redeem the code. Only an anonymous (no email) session that isn't linked yet may do this.
create or replace function public.redeem_pairing_code(code text, label text default null) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare
  p public.pairing_codes;
  recent int;
begin
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) is not true then
    raise exception 'Use this on the learner''s device, before signing in.' using errcode = '42501';
  end if;
  if exists (select 1 from public.learner_devices where device_user_id = auth.uid()) then
    raise exception 'This device is already linked.' using errcode = '22023';
  end if;
  -- Slow down guessing: at most 10 wrong codes per 10 minutes, across all devices.
  select count(*) into recent from public.audit_log where action = 'device.code_failed' and at > now() - interval '10 minutes';
  if recent >= 10 then raise exception 'Too many tries. Wait a few minutes and ask for a new code.' using errcode = '22023'; end if;

  select * into p from public.pairing_codes pc
   where pc.code = upper(regexp_replace(coalesce(redeem_pairing_code.code, ''), '[^A-Za-z0-9]', '', 'g')) and pc.expires_at > now();
  if p.code is null then
    insert into public.audit_log (actor_id, action, detail) values (auth.uid(), 'device.code_failed', '{}'::jsonb);
    raise exception 'That code is wrong or expired. Ask for a new one.' using errcode = '22023';
  end if;
  if exists (select 1 from public.account_flags f where f.user_id = p.owner_id) then
    raise exception 'That account isn''t active.' using errcode = '42501';
  end if;
  insert into public.learner_devices (device_user_id, learner_id, owner_id, label, last_seen_at)
  values (auth.uid(), p.learner_id, p.owner_id, left(nullif(btrim(label), ''), 40), now());
  delete from public.pairing_codes where pairing_codes.code = p.code;
  insert into public.audit_log (actor_id, learner_id, action, detail)
  values (p.owner_id, p.learner_id, 'device.linked', jsonb_build_object('device', auth.uid(), 'label', left(label, 40)));
  return p.learner_id;
end;
$$;
revoke all on function public.redeem_pairing_code(text, text) from public, anon;
grant execute on function public.redeem_pairing_code(text, text) to authenticated;

create or replace function public.list_devices(learner uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', d.device_user_id, 'label', d.label, 'created_at', d.created_at, 'last_seen_at', d.last_seen_at) order by d.created_at), '[]'::jsonb)
    from public.learner_devices d
   where d.learner_id = learner and d.owner_id = auth.uid();
$$;
revoke all on function public.list_devices(uuid) from public, anon;
grant execute on function public.list_devices(uuid) to authenticated;

-- Parent (or the device itself): unlink. Removes the device's anonymous login entirely.
create or replace function public.unlink_device(device uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  d public.learner_devices;
begin
  select * into d from public.learner_devices where device_user_id = device;
  if d.device_user_id is null then return; end if;
  if auth.uid() <> d.owner_id and auth.uid() <> d.device_user_id then raise exception 'Not authorized' using errcode = '42501'; end if;
  delete from public.learner_devices where device_user_id = device;
  insert into public.audit_log (actor_id, learner_id, action, aal, detail)
  values (auth.uid(), d.learner_id, 'device.unlinked', auth.jwt() ->> 'aal', jsonb_build_object('device', device, 'label', d.label));
  begin
    delete from auth.refresh_tokens where user_id = device::text;
    delete from auth.sessions where user_id = device;
    delete from auth.users where id = device and coalesce(is_anonymous, false);
  exception when others then null; -- the link is already gone, so the device has no access either way
  end;
end;
$$;
revoke all on function public.unlink_device(uuid) from public, anon;
grant execute on function public.unlink_device(uuid) to authenticated;

-- Ranks also work for a linked device (its own learner only).
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

-- ---------------------------------------------------------------------------
-- Account status at sign-in (now also handles devices and 90-day inactivity)
-- ---------------------------------------------------------------------------
drop function if exists public.my_account_status();
create function public.my_account_status() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev public.learner_devices;
  last timestamptz;
  flag public.account_flags;
begin
  if uid is null then return null; end if;

  -- A linked learner device: it counts as activity on the parent's account.
  select * into dev from public.learner_devices where device_user_id = uid;
  if dev.device_user_id is not null then
    update public.learner_devices set last_seen_at = now() where device_user_id = uid;
    insert into public.account_activity (user_id, last_seen_at) values (dev.owner_id, now())
      on conflict (user_id) do update set last_seen_at = greatest(account_activity.last_seen_at, now());
    return jsonb_build_object('device', true, 'learner_id', dev.learner_id,
      'archived', exists (select 1 from public.account_flags f where f.user_id = dev.owner_id));
  end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    return jsonb_build_object('device', true, 'learner_id', null, 'archived', false);
  end if;

  select f.* into flag from public.account_flags f where f.user_id = uid;
  if flag.user_id is null then
    select a.last_seen_at into last from public.account_activity a where a.user_id = uid;
    if last is not null and last < now() - interval '90 days' then
      insert into public.account_flags (user_id, kind, reason) values (uid, 'inactive', 'No activity for 90 days')
        on conflict (user_id) do nothing;
      insert into public.audit_log (actor_id, action, aal, detail)
      values (uid, 'account.auto_archived', auth.jwt() ->> 'aal', jsonb_build_object('last_seen', last));
      select f.* into flag from public.account_flags f where f.user_id = uid;
    else
      insert into public.account_activity (user_id, last_seen_at) values (uid, now())
        on conflict (user_id) do update set last_seen_at = now();
    end if;
  end if;

  return jsonb_build_object(
    'device', false,
    'archived', flag.user_id is not null,
    'archive_kind', flag.kind,
    'terms_version', (select t.version from public.terms_acceptance t where t.user_id = uid order by t.accepted_at desc limit 1));
end;
$$;
revoke all on function public.my_account_status() from public, anon;
grant execute on function public.my_account_status() to authenticated;

-- Coming back after 90 days: allowed once this session has re-verified in the last 15 minutes
-- (emailed sign-in link, Face ID / passkey, or authenticator code). Admin archives can't be undone this way.
create or replace function public.reactivate_after_inactivity() returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  fresh boolean;
begin
  if not exists (select 1 from public.account_flags f where f.user_id = uid and f.kind = 'inactive') then return false; end if;
  select exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) m
     where m ->> 'method' in ('otp', 'magiclink', 'totp', 'passkey', 'webauthn', 'mfa/webauthn', 'recovery', 'email/signup')
       and to_timestamp((m ->> 'timestamp')::bigint) > now() - interval '15 minutes'
  ) into fresh;
  if not fresh then return false; end if;
  delete from public.account_flags where user_id = uid and kind = 'inactive';
  insert into public.account_activity (user_id, last_seen_at) values (uid, now())
    on conflict (user_id) do update set last_seen_at = now();
  insert into public.audit_log (actor_id, action, aal, detail)
  values (uid, 'account.reactivated', auth.jwt() ->> 'aal', jsonb_build_object('amr', auth.jwt() -> 'amr'));
  return true;
end;
$$;
revoke all on function public.reactivate_after_inactivity() from public, anon;
grant execute on function public.reactivate_after_inactivity() to authenticated;

-- Admin list: show the archive kind and linked devices.
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
           'devices', (select count(*) from public.learner_devices d where d.owner_id = u.id),
           'learners', coalesce((select jsonb_agg(jsonb_build_object(
                          'name', l.display_name, 'kind', l.kind, 'mode', l.mode, 'avatar', l.avatar,
                          'reading', l.reading_level, 'spanish', l.spanish_level, 'spelling', l.spelling_level,
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

-- Optional nightly job (Database -> Extensions -> enable pg_cron, then run the schedule line once):
--   select cron.schedule('archive-inactive', '20 4 * * *', $$select public.archive_inactive_accounts()$$);
create or replace function public.archive_inactive_accounts() returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer;
begin
  with stale as (
    select a.user_id from public.account_activity a
     where a.last_seen_at < now() - interval '90 days'
       and not exists (select 1 from public.account_flags f where f.user_id = a.user_id)
  ), ins as (
    insert into public.account_flags (user_id, kind, reason)
    select user_id, 'inactive', 'No activity for 90 days' from stale
    returning user_id
  )
  select count(*) into n from ins;
  if n > 0 then
    insert into public.audit_log (action, detail) values ('account.auto_archive_job', jsonb_build_object('count', n));
  end if;
  return n;
end;
$$;
revoke all on function public.archive_inactive_accounts() from public, anon, authenticated;
