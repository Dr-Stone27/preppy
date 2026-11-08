-- Run once after schema.sql.
-- 1. AI allowance is counted by the server with its secret key, so signed-in users can no longer call it.
create or replace function public.use_ai(uid uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  insert into ai_usage (user_id, day, count) values (uid, current_date, 1)
  on conflict (user_id, day) do update set count = ai_usage.count + 1
  returning count into n;
  return n <= 30;
end $$;
revoke execute on function public.use_ai(uuid) from public, anon, authenticated;
grant execute on function public.use_ai(uuid) to service_role;
revoke execute on function public.use_ai() from authenticated;
-- 2. Cap each account's saved data at about 1 MB.
alter table public.user_data add constraint user_data_size check (pg_column_size(data) < 1000000);
