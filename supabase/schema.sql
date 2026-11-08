-- Preppy beta schema. Run once in the Supabase SQL editor. Safe to re-run.

-- Each account's plans, preferences, pantry stock and own recipes, as one document.
-- The recipe library and pantry list are shared and live in the app code, not here.
create table if not exists public.user_data (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.user_data enable row level security;

drop policy if exists "read own data" on public.user_data;
create policy "read own data" on public.user_data for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "add own data" on public.user_data;
create policy "add own data" on public.user_data for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "change own data" on public.user_data;
create policy "change own data" on public.user_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Daily count of AI calls (reading posts, cook-day order) per account.
-- No policies: only the function below touches it.
create table if not exists public.ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null default current_date,
  count int not null default 0,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;

-- Counts one AI call for the signed-in account. True while under the daily allowance.
create or replace function public.use_ai() returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then return false; end if;
  insert into ai_usage (user_id, day, count) values (auth.uid(), current_date, 1)
  on conflict (user_id, day) do update set count = ai_usage.count + 1
  returning count into n;
  return n <= 30;
end $$;
revoke execute on function public.use_ai() from public, anon;
grant execute on function public.use_ai() to authenticated;
