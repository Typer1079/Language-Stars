-- Language Stars: learner profiles, row-level security, MFA rule for children, audit log.
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- NIST 800-53 controls noted inline: AC-3 (access enforcement), AC-6 (least privilege),
-- IA-2(1) (MFA), AU-2/AU-3/AU-12 (audit events), SI-10 (input validation), SC-28 (data at rest,
-- provided by Supabase disk encryption).

-- ---------------------------------------------------------------------------
-- Learners: one row per learner (a parent's child, or an adult practicing for themself).
-- Data minimization: first name / nickname and age group only. No birthdays, photos, voice.
-- ---------------------------------------------------------------------------
create table if not exists public.learners (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  display_name     text not null check (char_length(btrim(display_name)) between 1 and 40),
  -- 'child': a kid managed by a parent account (requires MFA to read or change).
  -- 'self':  the signed-in adult's own practice profile.
  kind             text not null default 'child' check (kind in ('child', 'self')),
  age_group        text not null default '5-6' check (age_group in ('3-4', '5-6', '7-8', '9+', 'adult')),
  sticker_style    text not null default 'any' check (sticker_style in ('boy', 'girl', 'any')),
  mode             text not null default 'reading' check (mode in ('reading', 'spanish')),
  reading_level    int  not null default 1 check (reading_level between 1 and 5),
  spanish_level    int  not null default 1 check (spanish_level between 1 and 6),
  lifetime_stars   int  not null default 0 check (lifetime_stars between 0 and 1000000),
  spendable_stars  int  not null default 0 check (spendable_stars >= 0),
  -- { "1": ["am", ...], "2_es": ["morning", ...] }
  mastered         jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(mastered) = 'object' and octet_length(mastered::text) <= 20000),
  -- [{ "id", "emoji", "label", "x", "y", "rot", "scale", "growCount" }]
  stickers         jsonb not null default '[]'::jsonb
                     check (jsonb_typeof(stickers) = 'array' and jsonb_array_length(stickers) <= 60
                            and octet_length(stickers::text) <= 20000),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Every spendable star was earned, so the balance can never exceed lifetime stars.
  constraint spendable_within_lifetime check (spendable_stars <= lifetime_stars)
);

create unique index if not exists learners_owner_name_idx on public.learners (owner_id, lower(btrim(display_name)));
create index if not exists learners_owner_idx on public.learners (owner_id);

-- ---------------------------------------------------------------------------
-- Integrity rules enforced by the database (SI-10, AC-3)
-- ---------------------------------------------------------------------------
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
    new.updated_at := now();
  end if;
  new.display_name := btrim(new.display_name);
  return new;
end;
$$;

drop trigger if exists learners_guard on public.learners;
create trigger learners_guard
  before insert or update on public.learners
  for each row execute function public.learners_guard();

-- ---------------------------------------------------------------------------
-- Row-level security (AC-3, AC-6, IA-2(1))
--   * Each account can only see and change its own learners.
--   * Children's profiles additionally require a session that passed MFA (aal2).
-- ---------------------------------------------------------------------------
alter table public.learners enable row level security;
alter table public.learners force row level security;

revoke all on public.learners from anon, public;
grant select, insert, update, delete on public.learners to authenticated;

drop policy if exists "own learners: select" on public.learners;
drop policy if exists "own learners: insert" on public.learners;
drop policy if exists "own learners: update" on public.learners;
drop policy if exists "own learners: delete" on public.learners;

create policy "own learners: select" on public.learners
  for select to authenticated
  using ((select auth.uid()) = owner_id
         and (kind = 'self' or (select auth.jwt() ->> 'aal') = 'aal2'));

create policy "own learners: insert" on public.learners
  for insert to authenticated
  with check ((select auth.uid()) = owner_id
              and (kind = 'self' or (select auth.jwt() ->> 'aal') = 'aal2'));

create policy "own learners: update" on public.learners
  for update to authenticated
  using ((select auth.uid()) = owner_id
         and (kind = 'self' or (select auth.jwt() ->> 'aal') = 'aal2'))
  with check ((select auth.uid()) = owner_id
              and (kind = 'self' or (select auth.jwt() ->> 'aal') = 'aal2'));

create policy "own learners: delete" on public.learners
  for delete to authenticated
  using ((select auth.uid()) = owner_id
         and (kind = 'self' or (select auth.jwt() ->> 'aal') = 'aal2'));

-- ---------------------------------------------------------------------------
-- Audit log (AU-2, AU-3, AU-9, AU-12)
-- Written only by the database trigger. Users can read their own entries; nobody using the
-- app can change or delete them. Records what changed (counts), not the content itself.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_id    uuid,
  learner_id  uuid,
  action      text not null,
  aal         text,
  detail      jsonb not null default '{}'::jsonb
);

create index if not exists audit_log_actor_at_idx on public.audit_log (actor_id, at desc);

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;
revoke all on public.audit_log from anon, authenticated, public;
grant select on public.audit_log to authenticated;

drop policy if exists "own audit entries: select" on public.audit_log;
create policy "own audit entries: select" on public.audit_log
  for select to authenticated using ((select auth.uid()) = actor_id);

create or replace function public.learners_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  d jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    d := jsonb_build_object('kind', new.kind, 'lifetime_stars', new.lifetime_stars,
                            'stickers', jsonb_array_length(new.stickers));
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), new.id, 'learner.create', auth.jwt() ->> 'aal', d);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), old.id, 'learner.delete', auth.jwt() ->> 'aal',
            jsonb_build_object('lifetime_stars', old.lifetime_stars));
    return old;
  end if;

  if new.lifetime_stars  <> old.lifetime_stars  then d := d || jsonb_build_object('lifetime_stars',  jsonb_build_array(old.lifetime_stars,  new.lifetime_stars));  end if;
  if new.spendable_stars <> old.spendable_stars then d := d || jsonb_build_object('spendable_stars', jsonb_build_array(old.spendable_stars, new.spendable_stars)); end if;
  if new.reading_level   <> old.reading_level   then d := d || jsonb_build_object('reading_level',   jsonb_build_array(old.reading_level,   new.reading_level));   end if;
  if new.spanish_level   <> old.spanish_level   then d := d || jsonb_build_object('spanish_level',   jsonb_build_array(old.spanish_level,   new.spanish_level));   end if;
  if jsonb_array_length(new.stickers) <> jsonb_array_length(old.stickers) then
    d := d || jsonb_build_object('stickers', jsonb_build_array(jsonb_array_length(old.stickers), jsonb_array_length(new.stickers)));
  end if;
  if new.display_name <> old.display_name or new.age_group <> old.age_group
     or new.kind <> old.kind or new.sticker_style <> old.sticker_style then
    d := d || jsonb_build_object('profile_edited', true);
  end if;
  -- Sticker moves and word lists change constantly; only log changes that matter.
  if d <> '{}'::jsonb then
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), new.id, 'learner.update', auth.jwt() ->> 'aal', d);
  end if;
  return new;
end;
$$;

revoke all on function public.learners_audit() from public, anon, authenticated;
revoke all on function public.learners_guard() from public, anon, authenticated;

drop trigger if exists learners_audit on public.learners;
create trigger learners_audit
  after insert or update or delete on public.learners
  for each row execute function public.learners_audit();

-- Audit retention (AU-11): keep one year. Run manually, or schedule with pg_cron:
--   select cron.schedule('purge-audit', '15 3 * * 0', $$delete from public.audit_log where at < now() - interval '1 year'$$);
