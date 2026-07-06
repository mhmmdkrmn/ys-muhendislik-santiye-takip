create type public.user_role as enum ('admin', 'saha');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null default 'saha',
  created_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  status text not null default 'aktif',
  created_at timestamptz not null default now()
);

create table public.site_assignments (
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (site_id, user_id)
);

create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  entry_date date not null default current_date,
  work_title text not null,
  quantity numeric,
  unit text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.site_assignments enable row level security;
alter table public.daily_entries enable row level security;

create policy "profiles own read"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "admin profiles read all"
on public.profiles for select
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "admin sites all"
on public.sites for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "assigned users read sites"
on public.sites for select
to authenticated
using (
  exists (
    select 1 from public.site_assignments sa
    where sa.site_id = sites.id and sa.user_id = auth.uid()
  )
);

create policy "admin entries all"
on public.daily_entries for all
to authenticated
using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create policy "assigned users insert entries"
on public.daily_entries for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.site_assignments sa
    where sa.site_id = daily_entries.site_id and sa.user_id = auth.uid()
  )
);

create policy "assigned users read own entries"
on public.daily_entries for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.site_assignments sa
    where sa.site_id = daily_entries.site_id and sa.user_id = auth.uid()
  )
);
