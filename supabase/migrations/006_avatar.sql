-- Language Stars 006: each learner can pick a profile character (an emoji, with a skin tone).
-- Safe to run more than once. Run in Supabase: SQL Editor -> New query -> paste -> Run.
alter table public.learners add column if not exists avatar text
  check (avatar is null or (char_length(avatar) between 1 and 16 and avatar !~ '[A-Za-z0-9<>"''`]'));
