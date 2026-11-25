-- Language Stars 011: lock down anonymous sign-ins before turning them on.
-- Run this BEFORE enabling "Allow anonymous sign-ins". Safe to run more than once.
--
-- Anonymous (learner device) sign-ins use the same "authenticated" role as parents. The only thing
-- an anonymous sign-in should ever do is redeem a link code and then practice as that one learner.
-- These policies make sure it can't create learner profiles, history or anything else of its own.

create or replace function public.is_anonymous_session() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
$$;
grant execute on function public.is_anonymous_session() to authenticated;

drop policy if exists "own learners: select" on public.learners;
drop policy if exists "own learners: insert" on public.learners;
drop policy if exists "own learners: update" on public.learners;
drop policy if exists "own learners: delete" on public.learners;
create policy "own learners: select" on public.learners for select to authenticated
  using (not (select public.is_anonymous_session()) and (select auth.uid()) = owner_id and (select public.account_active())
         and (kind = 'self' or (select public.is_strong_session())));
create policy "own learners: insert" on public.learners for insert to authenticated
  with check (not (select public.is_anonymous_session()) and (select auth.uid()) = owner_id and (select public.account_active())
              and (kind = 'self' or (select public.is_strong_session())));
create policy "own learners: update" on public.learners for update to authenticated
  using (not (select public.is_anonymous_session()) and (select auth.uid()) = owner_id and (select public.account_active())
         and (kind = 'self' or (select public.is_strong_session())))
  with check (not (select public.is_anonymous_session()) and (select auth.uid()) = owner_id and (select public.account_active())
              and (kind = 'self' or (select public.is_strong_session())));
create policy "own learners: delete" on public.learners for delete to authenticated
  using (not (select public.is_anonymous_session()) and (select auth.uid()) = owner_id and (select public.account_active())
         and (kind = 'self' or (select public.is_strong_session())));

-- Anonymous sessions can't accept Terms (only the adult account holder does).
create or replace function public.accept_terms(version text, is_adult boolean, is_guardian boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or public.is_anonymous_session() then raise exception 'Not signed in' using errcode = '42501'; end if;
  if not coalesce(is_adult, false) then raise exception 'The account holder must be an adult (18+).' using errcode = '22023'; end if;
  insert into public.terms_acceptance (user_id, version, is_adult, is_guardian) values (auth.uid(), version, is_adult, coalesce(is_guardian, false));
  insert into public.audit_log (actor_id, action, aal, detail)
  values (auth.uid(), 'terms.accept', auth.jwt() ->> 'aal', jsonb_build_object('version', version, 'guardian', coalesce(is_guardian, false)));
end;
$$;
revoke all on function public.accept_terms(text, boolean, boolean) from public, anon;
grant execute on function public.accept_terms(text, boolean, boolean) to authenticated;
