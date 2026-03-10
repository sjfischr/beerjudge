create or replace function public.lock_submitted_scoresheets()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE' then
    if old.status = 'submitted' then
      raise exception 'Submitted scoresheets are locked.';
    end if;

    if new.status = 'submitted' and old.status <> 'submitted' then
      new.submitted_at = coalesce(new.submitted_at, timezone('utc', now()));
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists lock_submitted_scoresheets_before_update on public.scoresheets;
create trigger lock_submitted_scoresheets_before_update
  before update on public.scoresheets
  for each row
  execute procedure public.lock_submitted_scoresheets();

create or replace function public.enforce_scoresheet_submission_requirements()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'submitted' and (old.status is distinct from new.status) then
    if new.aroma_score is null
      or new.appearance_score is null
      or new.flavor_score is null
      or new.mouthfeel_score is null
      or new.overall_score is null
      or coalesce(length(trim(new.aroma_comments)), 0) = 0
      or coalesce(length(trim(new.appearance_comments)), 0) = 0
      or coalesce(length(trim(new.flavor_comments)), 0) = 0
      or coalesce(length(trim(new.mouthfeel_comments)), 0) = 0
      or coalesce(length(trim(new.overall_comments)), 0) = 0
      or new.stylistic_accuracy is null
      or new.technical_merit is null
      or new.intangibles is null
    then
      raise exception 'Scoresheet submission is missing required fields.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_scoresheet_submission_requirements_before_update on public.scoresheets;
create trigger enforce_scoresheet_submission_requirements_before_update
  before update on public.scoresheets
  for each row
  execute procedure public.enforce_scoresheet_submission_requirements();
