-- Read Aloud Stars 004: a Face ID (passkey / WebAuthn) sign-in counts as two-step on its own.
-- A passkey is something you have (the device) plus something you are (Face ID), which NIST
-- SP 800-63B treats as multi-factor (AAL2). Kids' profiles accept either an aal2 session or a
-- session that was signed in with a passkey. Safe to run more than once.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

create or replace function public.is_strong_session() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
      or exists (
           select 1
             from jsonb_array_elements(coalesce(auth.jwt() -> 'amr', '[]'::jsonb)) as m
            where m ->> 'method' in ('passkey', 'webauthn', 'mfa/webauthn')
         );
$$;

revoke all on function public.is_strong_session() from public, anon;
grant execute on function public.is_strong_session() to authenticated;

drop policy if exists "own learners: select" on public.learners;
drop policy if exists "own learners: insert" on public.learners;
drop policy if exists "own learners: update" on public.learners;
drop policy if exists "own learners: delete" on public.learners;

create policy "own learners: select" on public.learners
  for select to authenticated
  using ((select auth.uid()) = owner_id and (kind = 'self' or (select public.is_strong_session())));

create policy "own learners: insert" on public.learners
  for insert to authenticated
  with check ((select auth.uid()) = owner_id and (kind = 'self' or (select public.is_strong_session())));

create policy "own learners: update" on public.learners
  for update to authenticated
  using ((select auth.uid()) = owner_id and (kind = 'self' or (select public.is_strong_session())))
  with check ((select auth.uid()) = owner_id and (kind = 'self' or (select public.is_strong_session())));

create policy "own learners: delete" on public.learners
  for delete to authenticated
  using ((select auth.uid()) = owner_id and (kind = 'self' or (select public.is_strong_session())));
