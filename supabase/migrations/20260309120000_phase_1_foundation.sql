create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default auth.uid(),
  email text not null unique,
  display_name text,
  bjcp_id text,
  bjcp_rank text,
  is_admin boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'setup' check (status in ('setup', 'accepting_entries', 'judging', 'closed', 'archived')),
  allowed_styles jsonb not null default '[]'::jsonb,
  judges_per_entry integer not null default 2 check (judges_per_entry > 0),
  entry_deadline timestamptz,
  judging_date date,
  created_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  brewer_id uuid not null references public.members(id) on delete cascade,
  entry_number integer not null,
  bjcp_category text not null,
  bjcp_subcategory text not null,
  bjcp_style_name text not null,
  special_ingredients text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (competition_id, entry_number)
);

create table if not exists public.judge_assignments (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  judge_id uuid not null references public.members(id) on delete cascade,
  entry_id uuid not null references public.entries(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (judge_id, entry_id)
);

create table if not exists public.scoresheets (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  judge_id uuid not null references public.members(id) on delete cascade,
  competition_id uuid not null references public.competitions(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  aroma_score integer check (aroma_score between 0 and 12),
  aroma_comments text,
  appearance_score integer check (appearance_score between 0 and 3),
  appearance_comments text,
  flavor_score integer check (flavor_score between 0 and 20),
  flavor_comments text,
  mouthfeel_score integer check (mouthfeel_score between 0 and 5),
  mouthfeel_comments text,
  overall_score integer check (overall_score between 0 and 10),
  overall_comments text,
  stylistic_accuracy integer check (stylistic_accuracy between 1 and 5),
  technical_merit integer check (technical_merit between 1 and 5),
  intangibles integer check (intangibles between 1 and 5),
  descriptors jsonb not null default '[]'::jsonb,
  total_score integer generated always as (
    aroma_score + appearance_score + flavor_score + mouthfeel_score + overall_score
  ) stored,
  submitted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (entry_id, judge_id)
);

create table if not exists public.bjcp_styles (
  id integer generated always as identity primary key,
  category_number text not null,
  subcategory_letter text,
  category_name text not null,
  style_name text not null,
  og_min numeric,
  og_max numeric,
  fg_min numeric,
  fg_max numeric,
  ibu_min integer,
  ibu_max integer,
  srm_min numeric,
  srm_max numeric,
  abv_min numeric,
  abv_max numeric,
  description text
);

create index if not exists competitions_status_idx on public.competitions(status);
create index if not exists entries_competition_idx on public.entries(competition_id);
create index if not exists entries_brewer_idx on public.entries(brewer_id);
create index if not exists judge_assignments_judge_idx on public.judge_assignments(judge_id);
create index if not exists judge_assignments_entry_idx on public.judge_assignments(entry_id);
create index if not exists scoresheets_entry_idx on public.scoresheets(entry_id);
create index if not exists scoresheets_judge_idx on public.scoresheets(judge_id);
create index if not exists bjcp_styles_category_idx on public.bjcp_styles(category_number, subcategory_letter);

create or replace function public.is_admin(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members
    where id = check_user_id
      and is_admin = true
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.protect_member_fields()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if old.is_admin is distinct from new.is_admin then
    raise exception 'Only admins may change admin status.';
  end if;

  if old.email is distinct from new.email then
    raise exception 'Members cannot change the stored email directly.';
  end if;

  if old.id is distinct from new.id then
    raise exception 'Member id is immutable.';
  end if;

  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      display_name = coalesce(public.members.display_name, excluded.display_name),
      updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.sync_scoresheet_competition()
returns trigger
language plpgsql
as $$
begin
  select competition_id
    into new.competition_id
  from public.entries
  where id = new.entry_id;

  if new.competition_id is null then
    raise exception 'Scoresheet entry does not exist.';
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.assign_entry_number()
returns trigger
language plpgsql
as $$
declare
  next_number integer;
begin
  if new.entry_number is not null and new.entry_number > 0 then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.competition_id::text, 0));

  select coalesce(max(entry_number), 0) + 1
    into next_number
  from public.entries
  where competition_id = new.competition_id;

  new.entry_number = next_number;
  return new;
end;
$$;

drop trigger if exists set_members_updated_at on public.members;
create trigger set_members_updated_at
  before update on public.members
  for each row execute procedure public.set_updated_at();

drop trigger if exists protect_member_fields_before_update on public.members;
create trigger protect_member_fields_before_update
  before update on public.members
  for each row execute procedure public.protect_member_fields();

drop trigger if exists set_competitions_updated_at on public.competitions;
create trigger set_competitions_updated_at
  before update on public.competitions
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_entries_updated_at on public.entries;
create trigger set_entries_updated_at
  before update on public.entries
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_scoresheets_updated_at on public.scoresheets;
create trigger set_scoresheets_updated_at
  before update on public.scoresheets
  for each row execute procedure public.set_updated_at();

drop trigger if exists sync_scoresheet_competition_before_write on public.scoresheets;
create trigger sync_scoresheet_competition_before_write
  before insert or update on public.scoresheets
  for each row execute procedure public.sync_scoresheet_competition();

drop trigger if exists assign_entry_number_before_insert on public.entries;
create trigger assign_entry_number_before_insert
  before insert on public.entries
  for each row execute procedure public.assign_entry_number();

alter table public.members enable row level security;
alter table public.competitions enable row level security;
alter table public.entries enable row level security;
alter table public.judge_assignments enable row level security;
alter table public.scoresheets enable row level security;
alter table public.bjcp_styles enable row level security;

create policy "admins manage members" on public.members
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "members view own profile" on public.members
  for select
  using (id = auth.uid());

create policy "members update own profile" on public.members
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "members insert own profile" on public.members
  for insert
  with check (id = auth.uid());

create policy "public read competitions" on public.competitions
  for select
  using (true);

create policy "admins manage competitions" on public.competitions
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "admins manage entries" on public.entries
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "brewers view own entries" on public.entries
  for select
  using (brewer_id = auth.uid());

create policy "brewers create own entries" on public.entries
  for insert
  with check (
    brewer_id = auth.uid()
    and exists (
      select 1
      from public.competitions c
      where c.id = competition_id
        and c.status = 'accepting_entries'
    )
  );

create policy "brewers edit own entries while open" on public.entries
  for update
  using (
    brewer_id = auth.uid()
    and exists (
      select 1
      from public.competitions c
      where c.id = competition_id
        and c.status = 'accepting_entries'
    )
  )
  with check (
    brewer_id = auth.uid()
    and exists (
      select 1
      from public.competitions c
      where c.id = competition_id
        and c.status = 'accepting_entries'
    )
  );

create policy "judges view own assignments" on public.judge_assignments
  for select
  using (judge_id = auth.uid());

create policy "admins manage assignments" on public.judge_assignments
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "judges view own scoresheets" on public.scoresheets
  for select
  using (judge_id = auth.uid());

create policy "judges insert own scoresheets" on public.scoresheets
  for insert
  with check (
    judge_id = auth.uid()
    and exists (
      select 1
      from public.judge_assignments ja
      where ja.entry_id = entry_id
        and ja.judge_id = auth.uid()
    )
  );

create policy "judges update own draft scoresheets" on public.scoresheets
  for update
  using (judge_id = auth.uid() and status = 'draft')
  with check (judge_id = auth.uid());

create policy "admins manage scoresheets" on public.scoresheets
  for all
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "brewers view results after close" on public.scoresheets
  for select
  using (
    exists (
      select 1
      from public.entries e
      join public.competitions c on c.id = e.competition_id
      where e.id = scoresheets.entry_id
        and e.brewer_id = auth.uid()
        and c.status in ('closed', 'archived')
    )
  );

create policy "public read bjcp styles" on public.bjcp_styles
  for select
  using (true);

create or replace view public.blind_entries as
select
  e.id,
  e.competition_id,
  e.entry_number,
  e.bjcp_category,
  e.bjcp_subcategory,
  e.bjcp_style_name,
  e.special_ingredients,
  e.created_at,
  e.updated_at
from public.entries e
join public.judge_assignments ja
  on ja.entry_id = e.id
where ja.judge_id = auth.uid();

grant usage on schema public to anon, authenticated;
grant select on public.competitions to anon, authenticated;
grant select on public.bjcp_styles to anon, authenticated;
grant select, insert, update on public.members to authenticated;
grant select, insert, update on public.entries to authenticated;
grant select on public.judge_assignments to authenticated;
grant select, insert, update on public.scoresheets to authenticated;
grant select on public.blind_entries to authenticated;
