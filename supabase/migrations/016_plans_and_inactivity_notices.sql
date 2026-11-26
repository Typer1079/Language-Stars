-- Language Stars 016: paid plans and inactivity notices.
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Inactivity rules
--  * Free accounts: reminder emails at 60 and 83 days without activity; at 90 days the account is
--    paused (archived: nothing deleted, reopening needs a sign-in link, Face ID or authenticator code).
--  * Paying accounts (active, trial, or within 14 days of a failed renewal): never paused for
--    inactivity. They get a friendly "we miss you" email at 45 days instead (once per quiet spell).
--    When a subscription ends, the 90 days count from whichever is later: the last activity or the
--    day the subscription ended, so nobody is paused the day their plan lapses.
--  * Nothing is ever deleted automatically.
--
-- account_plans is written only by the payment system (a webhook using the service key, later) and
-- by the admin (admin_set_plan, for gifts and testing). The app can read its own plan.

-- ---- Plans ------------------------------------------------------------------------------------
create table if not exists public.account_plans (
  user_id             uuid primary key references auth.users (id) on delete cascade,
  plan                text not null default 'family' check (char_length(plan) between 1 and 40),
  status              text not null check (status in ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  provider            text not null default 'manual' check (provider in ('manual', 'apple', 'google', 'stripe')),
  provider_ref        text check (char_length(provider_ref) <= 200),
  current_period_end  timestamptz,
  ended_at            timestamptz,
  updated_at          timestamptz not null default now()
);
alter table public.account_plans enable row level security;
alter table public.account_plans force row level security;
revoke all on public.account_plans from anon, authenticated, public;
grant select on public.account_plans to authenticated;
drop policy if exists "own plan: select" on public.account_plans;
create policy "own plan: select" on public.account_plans for select to authenticated
  using ((select auth.uid()) = user_id);

-- Keep ended_at when a plan stops (the inactivity clock restarts from it).
create or replace function public.account_plans_touch() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  if new.status in ('canceled', 'expired') and (tg_op = 'INSERT' or old.status not in ('canceled', 'expired')) then
    new.ended_at := coalesce(new.ended_at, least(coalesce(new.current_period_end, now()), now()));
  elsif new.status in ('active', 'trialing', 'past_due') then
    new.ended_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists account_plans_touch on public.account_plans;
create trigger account_plans_touch before insert or update on public.account_plans
  for each row execute function public.account_plans_touch();

-- Paying right now? (active / trial, or a failed renewal still within 14 days of the period end)
create or replace function public.is_paying(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.account_plans p
     where p.user_id = uid
       and (p.status in ('active', 'trialing')
            or (p.status = 'past_due' and coalesce(p.current_period_end, now()) > now() - interval '14 days')));
$$;
revoke all on function public.is_paying(uuid) from public, anon, authenticated;

-- When the inactivity clock started: the later of last activity and the end of a paid plan.
create or replace function public.inactive_since(uid uuid) returns timestamptz
language sql stable security definer set search_path = '' as $$
  select greatest(
    (select a.last_seen_at from public.account_activity a where a.user_id = uid),
    (select p.ended_at from public.account_plans p where p.user_id = uid));
$$;
revoke all on function public.inactive_since(uuid) from public, anon, authenticated;

-- Admin: give or change a plan by hand (gifts, testing). Payments will use their own webhook.
create or replace function public.admin_set_plan(target uuid, new_status text, new_plan text default 'family', period_end timestamptz default null) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  if new_status = 'none' then
    delete from public.account_plans where user_id = target;
  else
    insert into public.account_plans (user_id, plan, status, provider, current_period_end)
    values (target, coalesce(nullif(new_plan, ''), 'family'), new_status, 'manual', period_end)
    on conflict (user_id) do update
      set plan = excluded.plan, status = excluded.status, current_period_end = excluded.current_period_end;
  end if;
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'admin.set_plan', auth.jwt() ->> 'aal', jsonb_build_object('target', target, 'status', new_status, 'plan', new_plan));
end;
$$;
revoke all on function public.admin_set_plan(uuid, text, text, timestamptz) from public, anon;
grant execute on function public.admin_set_plan(uuid, text, text, timestamptz) to authenticated;

-- ---- Inactivity notices (sent by the inactivity-notices Edge Function) ---------------------------
create table if not exists public.inactivity_notices (
  user_id  uuid not null references auth.users (id) on delete cascade,
  kind     text not null check (kind in ('free_60', 'free_83', 'paid_45')),
  sent_at  timestamptz not null default now(),
  primary key (user_id, kind)
);
alter table public.inactivity_notices enable row level security;
alter table public.inactivity_notices force row level security;
revoke all on public.inactivity_notices from anon, authenticated, public;

-- ---- Pausing for inactivity now skips paying accounts -------------------------------------------
create or replace function public.archive_inactive_accounts() returns integer
language plpgsql volatile security definer set search_path = '' as $$
declare
  n integer;
begin
  with stale as (
    select a.user_id from public.account_activity a
     where public.inactive_since(a.user_id) < now() - interval '90 days'
       and not public.is_paying(a.user_id)
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
-- The nightly inactivity-notices Edge Function runs this with the service key.
grant execute on function public.archive_inactive_accounts() to service_role;

-- Same rule at sign-in (my_account_status), plus the plan for the app.
drop function if exists public.my_account_status();
create function public.my_account_status() returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  dev public.learner_devices;
  since timestamptz;
  flag public.account_flags;
  pl public.account_plans;
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
    since := public.inactive_since(uid);
    if since is not null and since < now() - interval '90 days' and not public.is_paying(uid) then
      insert into public.account_flags (user_id, kind, reason) values (uid, 'inactive', 'No activity for 90 days')
        on conflict (user_id) do nothing;
      insert into public.audit_log (actor_id, action, aal, detail)
      values (uid, 'account.auto_archived', auth.jwt() ->> 'aal', jsonb_build_object('inactive_since', since));
      select f.* into flag from public.account_flags f where f.user_id = uid;
    else
      insert into public.account_activity (user_id, last_seen_at) values (uid, now())
        on conflict (user_id) do update set last_seen_at = now();
      -- Back again: the next quiet spell gets fresh reminders.
      delete from public.inactivity_notices where user_id = uid;
    end if;
  end if;

  select p.* into pl from public.account_plans p where p.user_id = uid;
  return jsonb_build_object(
    'device', false,
    'archived', flag.user_id is not null,
    'archive_kind', flag.kind,
    'paying', public.is_paying(uid),
    'plan', case when pl.user_id is null then null else jsonb_build_object('plan', pl.plan, 'status', pl.status, 'current_period_end', pl.current_period_end) end,
    'terms_version', (select t.version from public.terms_acceptance t where t.user_id = uid order by t.accepted_at desc limit 1));
end;
$$;
revoke all on function public.my_account_status() from public, anon;
grant execute on function public.my_account_status() to authenticated;

-- ---- Who gets an email ------------------------------------------------------------------------
-- Who should get an email today. Only the service key (the Edge Function) can call this.
create or replace function public.inactivity_notices_due() returns table (user_id uuid, email text, kind text, days_inactive integer, pause_on date)
language sql stable security definer set search_path = '' as $$
  with accounts as (
    select u.id, u.email, public.inactive_since(u.id) as since, public.is_paying(u.id) as paying
      from auth.users u
     where not coalesce(u.is_anonymous, false) and u.email is not null and u.email_confirmed_at is not null
       and not exists (select 1 from public.account_flags f where f.user_id = u.id)
  ), due as (
    select a.id, a.email, a.since, a.paying,
           case
             when a.paying and a.since < now() - interval '45 days' then 'paid_45'
             when not a.paying and a.since < now() - interval '83 days' then 'free_83'
             when not a.paying and a.since < now() - interval '60 days' then 'free_60'
           end as kind
      from accounts a where a.since is not null
  )
  select d.id, d.email, d.kind, extract(day from now() - d.since)::integer,
         case when d.paying then null else (d.since + interval '90 days')::date end
    from due d
   where d.kind is not null
     and not exists (select 1 from public.inactivity_notices n where n.user_id = d.id and n.kind = d.kind)
     -- the 83-day email replaces the 60-day one if both are due on the first run
     and not (d.kind = 'free_60' and d.since < now() - interval '83 days');
$$;
revoke all on function public.inactivity_notices_due() from public, anon, authenticated;
grant execute on function public.inactivity_notices_due() to service_role;

create or replace function public.mark_inactivity_notice_sent(target uuid, notice text) returns void
language sql volatile security definer set search_path = '' as $$
  insert into public.inactivity_notices (user_id, kind) values (target, notice)
  on conflict (user_id, kind) do update set sent_at = now();
  insert into public.audit_log (actor_id, action, detail) values (null, 'account.inactivity_notice', jsonb_build_object('user', target, 'kind', notice));
$$;
revoke all on function public.mark_inactivity_notice_sent(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_inactivity_notice_sent(uuid, text) to service_role;

-- Admin list: add each account's plan and inactivity status.
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
