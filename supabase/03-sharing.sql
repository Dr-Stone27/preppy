-- Run once after 02-hardening.sql. Safe to re-run.
-- Recipes people choose to share. Anyone can read the ones that aren't hidden; only the sharer can change or remove theirs.
create table if not exists public.shared_recipes (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users on delete cascade,
  recipe_id text not null,
  recipe jsonb not null,
  -- A first name the sharer chose to show. Never their email.
  shared_by text,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (owner, recipe_id),
  constraint shared_recipe_size check (pg_column_size(recipe) < 40000),
  constraint shared_by_length check (shared_by is null or char_length(shared_by) between 1 and 30)
);
create index if not exists shared_recipes_recent on public.shared_recipes (created_at desc) where not hidden;
alter table public.shared_recipes enable row level security;

drop policy if exists "read shown or own" on public.shared_recipes;
create policy "read shown or own" on public.shared_recipes for select to anon, authenticated
  using (not hidden or (select auth.uid()) = owner);
drop policy if exists "share own" on public.shared_recipes;
create policy "share own" on public.shared_recipes for insert to authenticated
  with check ((select auth.uid()) = owner);
drop policy if exists "change own" on public.shared_recipes;
create policy "change own" on public.shared_recipes for update to authenticated
  using ((select auth.uid()) = owner) with check ((select auth.uid()) = owner);
drop policy if exists "unshare own" on public.shared_recipes;
create policy "unshare own" on public.shared_recipes for delete to authenticated
  using ((select auth.uid()) = owner);

-- Sharers can set the recipe and their name, never `hidden` or `owner`, so a hidden recipe stays hidden.
revoke insert, update on public.shared_recipes from anon, authenticated;
grant insert (recipe_id, recipe, shared_by) on public.shared_recipes to authenticated;
grant update (recipe_id, recipe, shared_by) on public.shared_recipes to authenticated;
grant select on public.shared_recipes to anon, authenticated;
grant delete on public.shared_recipes to authenticated;

-- At most 100 shared recipes per account.
create or replace function public.shared_recipes_cap() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from shared_recipes where owner = new.owner) >= 100 then
    raise exception 'share limit reached';
  end if;
  return new;
end $$;
drop trigger if exists shared_recipes_cap on public.shared_recipes;
create trigger shared_recipes_cap before insert on public.shared_recipes for each row execute function public.shared_recipes_cap();

-- Reports. Signed-in people can report a recipe once each; nobody can read reports through the app.
create table if not exists public.recipe_reports (
  recipe uuid not null references public.shared_recipes on delete cascade,
  reporter uuid not null default auth.uid() references auth.users on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (recipe, reporter),
  constraint report_reason_length check (reason is null or char_length(reason) <= 300)
);
alter table public.recipe_reports enable row level security;
drop policy if exists "report as yourself" on public.recipe_reports;
create policy "report as yourself" on public.recipe_reports for insert to authenticated
  with check ((select auth.uid()) = reporter);
revoke all on public.recipe_reports from anon, authenticated;
grant insert (recipe, reason) on public.recipe_reports to authenticated;

-- Three reports from different people hide a recipe until the owner of the project looks at it.
create or replace function public.recipe_reports_hide() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from recipe_reports where recipe = new.recipe) >= 3 then
    update shared_recipes set hidden = true where id = new.recipe;
  end if;
  return new;
end $$;
drop trigger if exists recipe_reports_hide on public.recipe_reports;
create trigger recipe_reports_hide after insert on public.recipe_reports for each row execute function public.recipe_reports_hide();

-- To review: select r.id, r.recipe->>'title', count(p.*) from shared_recipes r left join recipe_reports p on p.recipe = r.id group by r.id order by 3 desc;
-- To hide one yourself: update shared_recipes set hidden = true where id = '…';
