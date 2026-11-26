-- Language Stars 013: delete my account (self-service).
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- The account holder can delete their own account from Account -> Delete my account (required for
-- App Store apps, guideline 5.1.1(v), and a parent's right under COPPA). It removes the sign-in and,
-- through the existing "on delete cascade" links, every learner profile, all practice history,
-- ranks, linked devices, terms records and account flags.
--
-- * Accounts with children's profiles need a two-step / Face ID session, the same rule as editing them.
-- * Admin accounts can't delete themselves here (so the site is never left without an admin by mistake).
-- * The security log keeps one entry that the account was deleted (no email or names), per the
--   1-year security-log retention in the Privacy Policy.

create or replace function public.delete_my_account(confirm text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  kids integer;
  everyone integer;
begin
  if me is null then raise exception 'Not signed in' using errcode = '42501'; end if;
  if public.is_anonymous_session() then raise exception 'A linked learner device can''t delete the account' using errcode = '42501'; end if;
  if coalesce(confirm, '') <> 'DELETE' then raise exception 'Confirmation text did not match' using errcode = '22023'; end if;
  if exists (select 1 from public.app_admins a where a.user_id = me) then
    raise exception 'Admin accounts can''t be deleted here. Remove the admin role first.' using errcode = '42501';
  end if;
  select count(*) filter (where kind = 'child'), count(*) into kids, everyone from public.learners where owner_id = me;
  if kids > 0 and not public.is_strong_session() then
    raise exception 'Confirm with Face ID or your two-step code first' using errcode = '42501';
  end if;

  insert into public.audit_log (actor_id, action, aal, detail)
  values (me, 'account.delete', auth.jwt() ->> 'aal', jsonb_build_object('learners', everyone, 'children', kids));

  -- Linked learner devices sign in as their own anonymous users; remove those sign-ins too.
  delete from auth.users u
   where u.id in (select d.device_user_id from public.learner_devices d where d.owner_id = me);
  -- Everything else that belongs to the account goes with it (on delete cascade).
  delete from auth.users where id = me;
end;
$$;
revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;
