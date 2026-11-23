-- Read Aloud Stars 002: log when a reader switches between Reading and Spanish
-- (now a profile setting changed from ✏️ Edit). Safe to run more than once.
-- Run in Supabase: SQL Editor -> New query -> paste -> Run.

create or replace function public.learners_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  d jsonb := '{}'::jsonb;
begin
  if tg_op = 'INSERT' then
    d := jsonb_build_object('kind', new.kind, 'lifetime_stars', new.lifetime_stars,
                            'stickers', jsonb_array_length(new.stickers));
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), new.id, 'learner.create', auth.jwt() ->> 'aal', d);
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), old.id, 'learner.delete', auth.jwt() ->> 'aal',
            jsonb_build_object('lifetime_stars', old.lifetime_stars));
    return old;
  end if;

  if new.lifetime_stars  <> old.lifetime_stars  then d := d || jsonb_build_object('lifetime_stars',  jsonb_build_array(old.lifetime_stars,  new.lifetime_stars));  end if;
  if new.spendable_stars <> old.spendable_stars then d := d || jsonb_build_object('spendable_stars', jsonb_build_array(old.spendable_stars, new.spendable_stars)); end if;
  if new.reading_level   <> old.reading_level   then d := d || jsonb_build_object('reading_level',   jsonb_build_array(old.reading_level,   new.reading_level));   end if;
  if new.spanish_level   <> old.spanish_level   then d := d || jsonb_build_object('spanish_level',   jsonb_build_array(old.spanish_level,   new.spanish_level));   end if;
  if jsonb_array_length(new.stickers) <> jsonb_array_length(old.stickers) then
    d := d || jsonb_build_object('stickers', jsonb_build_array(jsonb_array_length(old.stickers), jsonb_array_length(new.stickers)));
  end if;
  if new.mode <> old.mode then
    d := d || jsonb_build_object('mode', jsonb_build_array(old.mode, new.mode));
  end if;
  if new.display_name <> old.display_name or new.age_group <> old.age_group
     or new.kind <> old.kind or new.sticker_style <> old.sticker_style then
    d := d || jsonb_build_object('profile_edited', true);
  end if;
  -- Sticker moves and word lists change constantly; only log changes that matter.
  if d <> '{}'::jsonb then
    insert into public.audit_log (actor_id, learner_id, action, aal, detail)
    values (auth.uid(), new.id, 'learner.update', auth.jwt() ->> 'aal', d);
  end if;
  return new;
end;
$$;

revoke all on function public.learners_audit() from public, anon, authenticated;
