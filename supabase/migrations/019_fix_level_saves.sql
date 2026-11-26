-- Language Stars 019: fix saving levels to learner_subjects, and practice by subject for Admin.
-- Needs 018. Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- * Fix: the app saves levels with an "insert or update" (upsert). Supabase writes every column of the
--   row on update, but 015 only allowed updating level and best, so every save was refused and the app
--   quietly fell back to the old learner columns. Reading, Spanish and Spelling Bee were still saved
--   there, but levels in the newer languages (French, Portuguese, Tagalog, Japanese, Korean, Mandarin,
--   Farsi) were not. A row still can't move to another learner or subject (learner_subjects_guard).
-- * Adds a Level 1 row for any learner currently on a subject that has no row yet.
-- * admin_subject_levels(days): learners per subject, where they are, and practice per subject.

grant update (learner_id, subject, level, best) on public.learner_subjects to authenticated;

insert into public.learner_subjects (learner_id, subject, level, best)
select l.id, l.mode, 1, 1
  from public.learners l
 where not exists (select 1 from public.learner_subjects ls where ls.learner_id = l.id and ls.subject = l.mode)
on conflict (learner_id, subject) do nothing;

drop function if exists public.admin_subject_levels();
create or replace function public.admin_subject_levels(days integer default 30) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  d integer := least(greatest(coalesce(days, 30), 1), 366);
begin
  if not public.is_admin() then raise exception 'Not authorized' using errcode = '42501'; end if;
  return jsonb_build_object(
    'modes', (select coalesce(jsonb_object_agg(mode, n), '{}'::jsonb) from (select mode, count(*) as n from public.learners group by mode) x),
    'bands', (select coalesce(jsonb_agg(jsonb_build_object('subject', subject, 'band', band, 'n', n)), '[]'::jsonb)
                from (select ls.subject, (ls.level - 1) / 10 as band, count(*) as n
                        from public.learner_subjects ls
                        join public.learners l on l.id = ls.learner_id
                       where ls.level > 1 or ls.best > 1 or l.mode = ls.subject
                          or exists (select 1 from public.practice_rounds p where p.learner_id = l.id and p.mode = ls.subject)
                       group by 1, 2) y),
    'practice', (select coalesce(jsonb_agg(jsonb_build_object('subject', mode, 'rounds', rounds, 'items', items, 'clean', clean,
                                                              'minutes', minutes, 'stars', stars, 'learners', learners) order by rounds desc), '[]'::jsonb)
                   from (select p.mode, count(*) as rounds, sum(p.items) as items, sum(p.clean) as clean,
                                round(sum(p.seconds) / 60.0) as minutes, sum(p.stars) as stars, count(distinct p.learner_id) as learners
                           from public.practice_rounds p
                          where p.created_at >= now() - make_interval(days => d)
                          group by p.mode) z));
end;
$$;
revoke all on function public.admin_subject_levels(integer) from public, anon;
grant execute on function public.admin_subject_levels(integer) to authenticated;
