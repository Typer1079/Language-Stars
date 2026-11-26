-- Language Stars 017: seven more language paths.
-- Needs 015. Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Adds French, Portuguese (Portugal), Tagalog, Japanese, Korean, Mandarin and Farsi to the subjects
-- list. Their levels are saved only in learner_subjects (no new learner columns). The app shows these
-- languages once this has been run.

insert into public.subjects (id, label, sort_order) values
  ('french',     'French',     4),
  ('portuguese', 'Portuguese', 5),
  ('tagalog',    'Tagalog',    6),
  ('japanese',   'Japanese',   7),
  ('korean',     'Korean',     8),
  ('mandarin',   'Mandarin',   9),
  ('farsi',      'Farsi',      10)
on conflict (id) do update set label = excluded.label, sort_order = excluded.sort_order;
