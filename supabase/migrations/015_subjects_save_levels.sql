-- Language Stars 015: subjects list in the database, and levels saved to learner_subjects.
-- Needs 014. Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- * subjects: the subjects the app teaches. learners.mode, practice_rounds.mode, problem_reports.mode
--   and learner_subjects.subject must name one of them, so a new subject is one new row here
--   (plus its content in the app), not new columns or changed checks.
-- * The app now saves levels to learner_subjects (one row per learner per subject). The same people
--   who may change the learner may change these rows: the parent (children's profiles only with
--   Face ID / two-step) or the learner's linked device. Best levels can only go up, every change is
--   in the audit log, and Reading / Spanish / Spelling Bee are still copied to the old learner
--   columns so ranks, the admin dashboard and older app versions keep working.

-- ---- Subjects -------------------------------------------------------------------------------
create table if not exists public.subjects (
  id          text primary key check (id ~ '^[a-z][a-z0-9_]{1,30}$'),
  label       text not null check (char_length(label) between 1 and 40),
  sort_order  smallint not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.subjects enable row level security;
alter table public.subjects force row level security;
revoke all on public.subjects from anon, authenticated, public;
grant select on public.subjects to authenticated;
drop policy if exists "subjects: read" on public.subjects;
create policy "subjects: read" on public.subjects for select to authenticated using (true);

insert into public.subjects (id, label, sort_order) values
  ('reading', 'Reading', 1), ('spanish', 'Spanish', 2), ('spelling', 'Spelling Bee', 3)
on conflict (id) do nothing;

-- Subject names now come from the subjects table instead of fixed lists.
alter table public.learners drop constraint if exists learners_mode_check;
alter table public.learners drop constraint if exists learners_mode_fkey;
alter table public.learners add constraint learners_mode_fkey foreign key (mode) references public.subjects (id);
alter table public.practice_rounds drop constraint if exists practice_rounds_mode_check;
alter table public.practice_rounds drop constraint if exists practice_rounds_mode_fkey;
alter table public.practice_rounds add constraint practice_rounds_mode_fkey foreign key (mode) references public.subjects (id);
alter table public.problem_reports drop constraint if exists problem_reports_mode_check;
alter table public.problem_reports drop constraint if exists problem_reports_mode_fkey;
alter table public.problem_reports add constraint problem_reports_mode_fkey foreign key (mode) references public.subjects (id) on delete set null;
alter table public.learner_subjects drop constraint if exists learner_subjects_subject_check;
alter table public.learner_subjects drop constraint if exists learner_subjects_subject_fkey;
alter table public.learner_subjects add constraint learner_subjects_subject_fkey foreign key (subject) references public.subjects (id);

-- report_problem() checked a fixed list of subjects; it now accepts any subject in the table.
create or replace function public.report_problem(r jsonb) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare
  lid uuid;
  h text[];
begin
  if auth.uid() is null then return; end if;
  if (select count(*) from public.problem_reports p
       where p.reporter_id = auth.uid() and p.created_at > now() - interval '1 hour') >= 40 then
    return;
  end if;
  begin lid := nullif(r ->> 'learner_id', '')::uuid; exception when others then lid := null; end;
  if lid is not null and not public.can_view_learner(lid) then lid := null; end if;
  select coalesce(array_agg(left(x, 300)), '{}') into h
    from (select jsonb_array_elements_text(case when jsonb_typeof(r -> 'heard') = 'array' then r -> 'heard' else '[]'::jsonb end) as x limit 12) s;
  insert into public.problem_reports (reporter_id, learner_id, kind, mode, level, item, heard, seconds, detail, log, device, app_version)
  values (
    auth.uid(), lid,
    case when r ->> 'kind' in ('error', 'stuck', 'skipped', 'gave_up', 'mic') then r ->> 'kind' else 'error' end,
    (select s.id from public.subjects s where s.id = r ->> 'mode'),
    case when (r ->> 'level') ~ '^\d{1,3}$' and (r ->> 'level')::int between 1 and 100 then (r ->> 'level')::smallint end,
    left(r ->> 'item', 400), h,
    case when (r ->> 'seconds') ~ '^\d{1,5}$' then least((r ->> 'seconds')::int, 86400) end,
    left(r ->> 'detail', 2000), left(r ->> 'log', 8000), left(r ->> 'device', 120), left(r ->> 'app_version', 80));
end;
$$;

-- ---- Saving levels to learner_subjects ---------------------------------------------------------
grant insert, update (level, best) on public.learner_subjects to authenticated;

drop policy if exists "learner subjects: insert" on public.learner_subjects;
drop policy if exists "learner subjects: update" on public.learner_subjects;
create policy "learner subjects: insert" on public.learner_subjects for insert to authenticated
  with check ((select public.can_view_learner(learner_id)));
create policy "learner subjects: update" on public.learner_subjects for update to authenticated
  using ((select public.can_view_learner(learner_id)))
  with check ((select public.can_view_learner(learner_id)));

-- Best only goes up; time stamp; audit for subjects that have no old learner column.
create or replace function public.learner_subjects_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if new.learner_id <> old.learner_id or new.subject <> old.subject then
      raise exception 'A level row cannot move to another learner or subject.';
    end if;
    if new.best < old.best then new.best := old.best; end if;
    if (new.level, new.best) is not distinct from (old.level, old.best) then return new; end if;
  end if;
  new.best := greatest(new.best, new.level);
  new.updated_at := now();
  -- Reading, Spanish and Spelling Bee changes are logged by the learners audit (they're copied there).
  if new.subject not in ('reading', 'spanish', 'spelling') and auth.uid() is not null then
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), new.learner_id, 'learner.level', auth.jwt() ->> 'aal',
            jsonb_build_object('subject', new.subject, 'level', jsonb_build_array(case when tg_op = 'UPDATE' then old.level end, new.level)));
  end if;
  return new;
end;
$$;
revoke all on function public.learner_subjects_guard() from public, anon, authenticated;
drop trigger if exists learner_subjects_guard on public.learner_subjects;
create trigger learner_subjects_guard before insert or update on public.learner_subjects
  for each row execute function public.learner_subjects_guard();

-- Copy Reading / Spanish / Spelling Bee back to the old learner columns.
create or replace function public.learner_subjects_to_columns() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() > 2 then return null; end if;
  if new.subject = 'reading' then
    update public.learners set reading_level = new.level, reading_best = greatest(reading_best, new.best)
     where id = new.learner_id and (reading_level, reading_best) is distinct from (new.level, greatest(reading_best, new.best));
  elsif new.subject = 'spanish' then
    update public.learners set spanish_level = new.level, spanish_best = greatest(spanish_best, new.best)
     where id = new.learner_id and (spanish_level, spanish_best) is distinct from (new.level, greatest(spanish_best, new.best));
  elsif new.subject = 'spelling' then
    update public.learners set spelling_level = new.level, spelling_best = greatest(spelling_best, new.best)
     where id = new.learner_id and (spelling_level, spelling_best) is distinct from (new.level, greatest(spelling_best, new.best));
  end if;
  return null;
end;
$$;
revoke all on function public.learner_subjects_to_columns() from public, anon, authenticated;
drop trigger if exists learner_subjects_to_columns on public.learner_subjects;
create trigger learner_subjects_to_columns after insert or update on public.learner_subjects
  for each row execute function public.learner_subjects_to_columns();

-- The copy from learners (014) keeps running for older app versions; it skips rows already equal.
create or replace function public.sync_learner_subjects() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if pg_trigger_depth() > 2 then return null; end if;
  insert into public.learner_subjects as ls (learner_id, subject, level, best, updated_at)
  values
    (new.id, 'reading',  new.reading_level,  greatest(new.reading_best,  new.reading_level),  now()),
    (new.id, 'spanish',  new.spanish_level,  greatest(new.spanish_best,  new.spanish_level),  now()),
    (new.id, 'spelling', new.spelling_level, greatest(new.spelling_best, new.spelling_level), now())
  on conflict (learner_id, subject) do update
     set level = excluded.level, best = greatest(ls.best, excluded.best), updated_at = now()
   where (ls.level, ls.best) is distinct from (excluded.level, greatest(ls.best, excluded.best));
  return null;
end;
$$;
