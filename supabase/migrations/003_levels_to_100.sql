-- Language Stars 003: levels now go up to 100 in both Reading and Spanish
-- (words -> phrases -> sentences), and learners can move down a level after a rough round.
-- Safe to run more than once.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

alter table public.learners drop constraint if exists learners_reading_level_check;
alter table public.learners drop constraint if exists learners_spanish_level_check;
alter table public.learners add constraint learners_reading_level_check check (reading_level between 1 and 100);
alter table public.learners add constraint learners_spanish_level_check check (spanish_level between 1 and 100);

-- Highest level ever reached in each mode. Learners can move down a level after a rough round
-- and climb back; the level-up star bonus is only paid for new highs.
alter table public.learners add column if not exists reading_best int not null default 1;
alter table public.learners add column if not exists spanish_best int not null default 1;
alter table public.learners drop constraint if exists learners_reading_best_check;
alter table public.learners drop constraint if exists learners_spanish_best_check;
alter table public.learners add constraint learners_reading_best_check check (reading_best between 1 and 100);
alter table public.learners add constraint learners_spanish_best_check check (spanish_best between 1 and 100);
update public.learners
   set reading_best = greatest(reading_best, reading_level),
       spanish_best = greatest(spanish_best, spanish_level)
 where reading_best < reading_level or spanish_best < spanish_level;

create or replace function public.learners_guard() returns trigger
-- security definer so the profile limit counts every row, including ones hidden by RLS.
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.learners where owner_id = new.owner_id) >= 12 then
      raise exception 'Too many reader profiles on this account (limit 12).';
    end if;
  elsif tg_op = 'UPDATE' then
    if new.owner_id <> old.owner_id then
      raise exception 'A reader profile cannot move to another account.';
    end if;
    if new.lifetime_stars < old.lifetime_stars then
      raise exception 'Lifetime stars can only go up.';
    end if;
    if new.reading_best < old.reading_best or new.spanish_best < old.spanish_best then
      raise exception 'Best level can only go up.';
    end if;
    new.updated_at := now();
  end if;
  -- Best level is never below the current level.
  new.reading_best := greatest(new.reading_best, new.reading_level);
  new.spanish_best := greatest(new.spanish_best, new.spanish_level);
  new.display_name := btrim(new.display_name);
  return new;
end;
$$;

revoke all on function public.learners_guard() from public, anon, authenticated;

-- Mastered lists now hold phrases and sentences; finished levels are cleared by the app,
-- so this stays small. The limit still blocks oversized writes (SI-10).
alter table public.learners drop constraint if exists learners_mastered_check;
alter table public.learners add constraint learners_mastered_check
  check (jsonb_typeof(mastered) = 'object' and octet_length(mastered::text) <= 60000);
