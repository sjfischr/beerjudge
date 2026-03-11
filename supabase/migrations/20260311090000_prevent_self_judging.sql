create or replace function public.prevent_self_judging()
returns trigger
language plpgsql
as $$
declare
  entry_brewer_id uuid;
  entry_competition_id uuid;
begin
  select brewer_id, competition_id
    into entry_brewer_id, entry_competition_id
  from public.entries
  where id = new.entry_id;

  if entry_brewer_id is null then
    raise exception 'Referenced entry does not exist.';
  end if;

  if new.judge_id = entry_brewer_id then
    raise exception 'Judges cannot score their own entries.';
  end if;

  if tg_table_name = 'judge_assignments' then
    new.competition_id = entry_competition_id;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_self_judging_on_assignments on public.judge_assignments;
create trigger prevent_self_judging_on_assignments
  before insert or update on public.judge_assignments
  for each row execute procedure public.prevent_self_judging();

drop trigger if exists prevent_self_judging_on_scoresheets on public.scoresheets;
create trigger prevent_self_judging_on_scoresheets
  before insert or update on public.scoresheets
  for each row execute procedure public.prevent_self_judging();