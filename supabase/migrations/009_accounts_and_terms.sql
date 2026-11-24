-- Language Stars 009: admin user list, sign-out / archive / restore accounts, and Terms acceptance.
-- Needs 004-008 first. Safe to run more than once.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- AC-2 (account management): the super admin can see every account (email, learners) and sign an
-- account out, archive it (blocks sign-in and all data access, keeps the data) or restore it.
-- Every admin action is written to the audit log with a reason.
-- PL-4 / PT-5 (rules of behavior, notice): the account holder must accept the current Terms of Use
-- and Privacy Policy; each acceptance is recorded with its version and time.

-- ---------------------------------------------------------------------------
-- Archived accounts
-- ---------------------------------------------------------------------------
create table if not exists public.account_flags (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  archived_at  timestamptz not null default now(),
  archived_by  uuid,
  reason       text check (reason is null or char_length(reason) <= 300)
);
alter table public.account_flags enable row level security;
alter table public.account_flags force row level security;
revoke all on public.account_flags from anon, authenticated, public;

create or replace function public.account_active() returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.account_flags f where f.user_id = auth.uid());
$$;
revoke all on function public.account_active() from public, anon;
grant execute on function public.account_active() to authenticated;

-- Learners and practice history: archived accounts can't read or write anything.
drop policy if exists "own learners: select" on public.learners;
drop policy if exists "own learners: insert" on public.learners;
drop policy if exists "own learners: update" on public.learners;
drop policy if exists "own learners: delete" on public.learners;
create policy "own learners: select" on public.learners for select to authenticated
  using ((select auth.uid()) = owner_id and (select public.account_active()) and (kind = 'self' or (select public.is_strong_session())));
create policy "own learners: insert" on public.learners for insert to authenticated
  with check ((select auth.uid()) = owner_id and (select public.account_active()) and (kind = 'self' or (select public.is_strong_session())));
create policy "own learners: update" on public.learners for update to authenticated
  using ((select auth.uid()) = owner_id and (select public.account_active()) and (kind = 'self' or (select public.is_strong_session())))
  with check ((select auth.uid()) = owner_id and (select public.account_active()) and (kind = 'self' or (select public.is_strong_session())));
create policy "own learners: delete" on public.learners for delete to authenticated
  using ((select auth.uid()) = owner_id and (select public.account_active()) and (kind = 'self' or (select public.is_strong_session())));

drop policy if exists "own rounds: select" on public.practice_rounds;
drop policy if exists "own rounds: insert" on public.practice_rounds;
create policy "own rounds: select" on public.practice_rounds for select to authenticated
  using ((select auth.uid()) = owner_id and (select public.account_active())
         and exists (select 1 from public.learners l where l.id = learner_id and l.owner_id = (select auth.uid())
                       and (l.kind = 'self' or (select public.is_strong_session()))));
create policy "own rounds: insert" on public.practice_rounds for insert to authenticated
  with check ((select auth.uid()) = owner_id and (select public.account_active())
              and created_at > now() - interval '5 minutes' and created_at < now() + interval '5 minutes'
              and exists (select 1 from public.learners l where l.id = learner_id and l.owner_id = (select auth.uid())
                            and (l.kind = 'self' or (select public.is_strong_session()))));

-- Archived accounts drop out of the world rankings.
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
    left join r on r.learner_id = l.id
   where not exists (select 1 from public.account_flags f where f.user_id = l.owner_id);
$$;
revoke all on function public.learner_metrics() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Terms of Use / Privacy Policy acceptance
-- ---------------------------------------------------------------------------
create table if not exists public.terms_acceptance (
  id           bigint generated always as identity primary key,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  version      text not null check (char_length(version) between 1 and 40),
  accepted_at  timestamptz not null default now(),
  is_adult     boolean not null,
  is_guardian  boolean not null
);
create index if not exists terms_acceptance_user_idx on public.terms_acceptance (user_id, accepted_at desc);
alter table public.terms_acceptance enable row level security;
alter table public.terms_acceptance force row level security;
revoke all on public.terms_acceptance from anon, authenticated, public;
grant select on public.terms_acceptance to authenticated;
drop policy if exists "own acceptance: select" on public.terms_acceptance;
create policy "own acceptance: select" on public.terms_acceptance for select to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.accept_terms(version text, is_adult boolean, is_guardian boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if not coalesce(is_adult, false) then raise exception 'The account holder must be an adult (18+).' using errcode = '22023'; end if;
  insert into public.terms_acceptance (user_id, version, is_adult, is_guardian) values (auth.uid(), version, is_adult, coalesce(is_guardian, false));
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'terms.accept', auth.jwt() ->> 'aal', jsonb_build_object('version', version, 'guardian', coalesce(is_guardian, false)));
end;
$$;
revoke all on function public.accept_terms(text, boolean, boolean) from public, anon;
grant execute on function public.accept_terms(text, boolean, boolean) to authenticated;

-- What the app needs to know at sign-in: archived? which Terms version was accepted?
create or replace function public.my_account_status() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'archived', exists (select 1 from public.account_flags f where f.user_id = auth.uid()),
    'terms_version', (select t.version from public.terms_acceptance t where t.user_id = auth.uid() order by t.accepted_at desc limit 1));
$$;
revoke all on function public.my_account_status() from public, anon;
grant execute on function public.my_account_status() to authenticated;

-- ---------------------------------------------------------------------------
-- Super admin: every account, and actions on them
-- ---------------------------------------------------------------------------
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
           'is_admin', exists (select 1 from public.app_admins a where a.user_id = u.id),
           'terms_version', (select t.version from public.terms_acceptance t where t.user_id = u.id order by t.accepted_at desc limit 1),
           'last_active', (select max(p.created_at) from public.practice_rounds p where p.owner_id = u.id),
           'learners', coalesce((select jsonb_agg(jsonb_build_object(
                          'name', l.display_name, 'kind', l.kind, 'mode', l.mode, 'avatar', l.avatar,
                          'reading', l.reading_level, 'spanish', l.spanish_level, 'spelling', l.spelling_level,
                          'stars', l.lifetime_stars) order by l.created_at)
                        from public.learners l where l.owner_id = u.id), '[]'::jsonb)
         ) order by u.created_at desc), '[]'::jsonb)
    into result
    from auth.users u
    left join public.account_flags f on f.user_id = u.id;
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.view_users', auth.jwt() ->> 'aal', '{}'::jsonb);
  return result;
end;
$$;
revoke all on function public.admin_users() from public, anon;
grant execute on function public.admin_users() to authenticated;

-- action: 'sign_out' (end all sessions), 'archive' (sign out + block sign-in and data, keep data), 'restore'.
create or replace function public.admin_account_action(target uuid, action text, reason text default null) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  notes text[] := '{}';
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if target is null or not exists (select 1 from auth.users where id = target) then raise exception 'No such account' using errcode = '22023'; end if;
  if target = auth.uid() and action <> 'restore' then raise exception 'You can’t do that to your own admin account.' using errcode = '22023'; end if;
  if action not in ('sign_out', 'archive', 'restore') then raise exception 'Unknown action' using errcode = '22023'; end if;

  if action = 'archive' then
    insert into public.account_flags (user_id, archived_by, reason) values (target, auth.uid(), left(reason, 300))
      on conflict (user_id) do update set archived_at = now(), archived_by = auth.uid(), reason = left(excluded.reason, 300);
    -- Also block new sign-ins at the login service (best effort: data is already blocked above).
    begin
      update auth.users set banned_until = 'infinity' where id = target;
    exception when others then notes := notes || 'sign-in block not applied: ' || sqlerrm;
    end;
  elsif action = 'restore' then
    delete from public.account_flags where user_id = target;
    begin
      update auth.users set banned_until = null where id = target;
    exception when others then notes := notes || 'sign-in unblock not applied: ' || sqlerrm;
    end;
  end if;

  if action in ('sign_out', 'archive') then
    -- End every session and refresh token, so the account is signed out everywhere
    -- (open screens stop working within the hour, when their short-lived pass expires).
    begin
      delete from auth.refresh_tokens where user_id = target::text;
      delete from auth.sessions where user_id = target;
    exception when others then notes := notes || 'session sign-out not applied: ' || sqlerrm;
    end;
  end if;

  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.account_' || action, auth.jwt() ->> 'aal',
          jsonb_build_object('target', target, 'reason', left(reason, 300), 'notes', to_jsonb(notes)));
  return jsonb_build_object('ok', true, 'notes', to_jsonb(notes));
end;
$$;
revoke all on function public.admin_account_action(uuid, text, text) from public, anon;
grant execute on function public.admin_account_action(uuid, text, text) to authenticated;
