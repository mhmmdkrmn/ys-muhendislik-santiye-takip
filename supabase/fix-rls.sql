create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

drop policy if exists "admin profiles read all" on public.profiles;
drop policy if exists "admin sites all" on public.sites;
drop policy if exists "admin entries all" on public.daily_entries;

create policy "admin profiles read all"
on public.profiles for select
to authenticated
using (public.current_user_role() = 'admin');

create policy "admin sites all"
on public.sites for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "admin entries all"
on public.daily_entries for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
