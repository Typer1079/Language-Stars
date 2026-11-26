-- Language Stars 014: one row per learner per subject (level and best level).
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Until now each subject had its own columns on learners (reading_level, spanish_best, ...).
-- learner_subjects holds the same numbers as rows (learner, subject, level, best), so a new
-- subject needs no new columns.
--
-- This step is deliberately safe:
--  * The app keeps saving to the existing columns, which keep their checks and audit log.
--  * A trigger copies every change into learner_subjects right away; nobody can write to it directly.
--  * Existing progress is copied in now, and subjects_in_sync() lets the admin confirm both match.
-- Once it has run cleanly for a while, the app can switch to reading and writing learner_subjects.

create table if not exists public.learner_subjects (
  learner_id  uuid not null references public.learners (id) on delete cascade,
  subject     text not null check (subject in ('reading', 'spanish', 'spelling')),
  level       smallint not null default 1 check (level between 1 and 100),
  best        smallint not null default 1 check (best between 1 and 100),
  updated_at  timestamptz not null default now(),
  primary key (learner_id, subject),
  check (best >= level)
);
create index if not exists learner_subjects_subject_level_idx on public.learner_subjects (subject, level);

alter table public.learner_subjects enable row level security;
alter table public.learner_subjects force row level security;
revoke all on public.learner_subjects from anon, authenticated, public;
grant select on public.learner_subjects to authenticated;

-- Read: the same people who can see the learner (owner; children only with Face ID / two-step;
-- the learner's own linked device). No insert/update/delete policies: only the trigger writes.
drop policy if exists "learner subjects: select" on public.learner_subjects;
create policy "learner subjects: select" on public.learner_subjects for select to authenticated
  using ((select public.can_view_learner(learner_id)));

-- Copies a learner's per-subject columns into learner_subjects.
create or replace function public.sync_learner_subjects() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.learner_subjects as ls (learner_id, subject, level, best, updated_at)
  values
    (new.id, 'reading',  new.reading_level,  greatest(new.reading_best,  new.reading_level),  now()),
    (new.id, 'spanish',  new.spanish_level,  greatest(new.spanish_best,  new.spanish_level),  now()),
    (new.id, 'spelling', new.spelling_level, greatest(new.spelling_best, new.spelling_level), now())
  on conflict (learner_id, subject) do update
     set level = excluded.level, best = excluded.best, updated_at = now()
   where (ls.level, ls.best) is distinct from (excluded.level, excluded.best);
  return null;
end;
$$;
revoke all on function public.sync_learner_subjects() from public, anon, authenticated;

drop trigger if exists learners_sync_subjects on public.learners;
create trigger learners_sync_subjects
  after insert or update of reading_level, reading_best, spanish_level, spanish_best, spelling_level, spelling_best
  on public.learners
  for each row execute function public.sync_learner_subjects();

-- Copy everyone's current progress (and fix any row that drifted).
insert into public.learner_subjects (learner_id, subject, level, best)
select l.id, s.subject, s.level, greatest(s.best, s.level)
  from public.learners l
 cross join lateral (values
   ('reading',  l.reading_level,  l.reading_best),
   ('spanish',  l.spanish_level,  l.spanish_best),
   ('spelling', l.spelling_level, l.spelling_best)) as s (subject, level, best)
on conflict (learner_id, subject) do update
   set level = excluded.level, best = excluded.best, updated_at = now()
 where (public.learner_subjects.level, public.learner_subjects.best) is distinct from (excluded.level, excluded.best);

-- Admin check: how many learner/subject pairs differ between the columns and learner_subjects (should be 0).
create or replace function public.subjects_in_sync() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  mismatched integer;
  total integer;
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  select count(*) into total from public.learner_subjects;
  select count(*) into mismatched
    from public.learners l
   cross join lateral (values
     ('reading',  l.reading_level,  greatest(l.reading_best,  l.reading_level)),
     ('spanish',  l.spanish_level,  greatest(l.spanish_best,  l.spanish_level)),
     ('spelling', l.spelling_level, greatest(l.spelling_best, l.spelling_level))) as s (subject, level, best)
    left join public.learner_subjects ls on ls.learner_id = l.id and ls.subject = s.subject
   where ls.learner_id is null or ls.level <> s.level or ls.best <> s.best;
  return jsonb_build_object('rows', total, 'mismatched', mismatched, 'checked_at', now());
end;
$$;
revoke all on function public.subjects_in_sync() from public, anon;
grant execute on function public.subjects_in_sync() to authenticated;
