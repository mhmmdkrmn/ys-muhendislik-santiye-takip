create table if not exists public.pipeline_lines (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  main_line text not null check (main_line in ('S1', 'P1')),
  branch_name text not null,
  pipe_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.art_structure_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.art_structures (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  line text not null,
  kilometer text not null,
  type text not null,
  detail text not null,
  status text not null default 'Tamamlanmadi',
  concrete_size text,
  cover_size text,
  air_valve_diameter text,
  valve_installed boolean not null default false,
  mechanical_installed boolean not null default false,
  steel_pipe_installed boolean not null default false,
  flange_installed boolean not null default false,
  cover_installed boolean not null default false,
  needs_revision boolean not null default false,
  revision_note text,
  included_in_progress_payment boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists art_structures_line_kilometer_unique
on public.art_structures (line, kilometer);

alter table public.pipeline_lines enable row level security;
alter table public.art_structure_presets enable row level security;
alter table public.art_structures enable row level security;

drop policy if exists "authenticated read lines" on public.pipeline_lines;
drop policy if exists "admin write lines" on public.pipeline_lines;
drop policy if exists "authenticated read presets" on public.art_structure_presets;
drop policy if exists "admin write presets" on public.art_structure_presets;
drop policy if exists "authenticated read art structures" on public.art_structures;
drop policy if exists "admin write art structures" on public.art_structures;

create policy "authenticated read lines"
on public.pipeline_lines for select
to authenticated
using (true);

create policy "admin write lines"
on public.pipeline_lines for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "authenticated read presets"
on public.art_structure_presets for select
to authenticated
using (true);

create policy "admin write presets"
on public.art_structure_presets for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "authenticated read art structures"
on public.art_structures for select
to authenticated
using (true);

create policy "admin write art structures"
on public.art_structures for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

insert into public.pipeline_lines (name, main_line, branch_name, pipe_note)
values
  ('S1 Anahat', 'S1', 'Anahat', 'Boru capi ve uzunluklari sonraki adimda girilecek'),
  ('P1 Anahat', 'P1', 'Anahat', null),
  ('S1 Yedek-11', 'S1', 'Yedek-11', null),
  ('S1 Yedek-12', 'S1', 'Yedek-12', null),
  ('S1 Yedek-13', 'S1', 'Yedek-13', null),
  ('S1 Yedek-13-A', 'S1', 'Yedek-13-A', null),
  ('S1 Yedek-14', 'S1', 'Yedek-14', null),
  ('S1 Yedek-14-1', 'S1', 'Yedek-14-1', null),
  ('S1 Yedek-14-2', 'S1', 'Yedek-14-2', null),
  ('S1 Yedek-14-2-1', 'S1', 'Yedek-14-2-1', null),
  ('S1 Yedek-15', 'S1', 'Yedek-15', null),
  ('S1 Yedek-16', 'S1', 'Yedek-16', null),
  ('S1 Yedek-16-1', 'S1', 'Yedek-16-1', null),
  ('S1 Yedek-17', 'S1', 'Yedek-17', null),
  ('S1 Yedek-18', 'S1', 'Yedek-18', null),
  ('S1 Yedek-18-A', 'S1', 'Yedek-18-A', null),
  ('S1 Yedek-19', 'S1', 'Yedek-19', null),
  ('S1 Yedek-20', 'S1', 'Yedek-20', null),
  ('S1 Yedek-20-A', 'S1', 'Yedek-20-A', null),
  ('S1 Yedek-20-B', 'S1', 'Yedek-20-B', null),
  ('S1 Yedek-20-B-1', 'S1', 'Yedek-20-B-1', null),
  ('S1 Yedek-21', 'S1', 'Yedek-21', null),
  ('S1 Yedek-21-1', 'S1', 'Yedek-21-1', null),
  ('S1 Yedek-21-2', 'S1', 'Yedek-21-2', null),
  ('S1 Yedek-21-3', 'S1', 'Yedek-21-3', null),
  ('S1 Yedek-21-4', 'S1', 'Yedek-21-4', null),
  ('S1 Yedek-22', 'S1', 'Yedek-22', null),
  ('S1 Yedek-22-1', 'S1', 'Yedek-22-1', null),
  ('S1 Yedek-23', 'S1', 'Yedek-23', null),
  ('S1 Yedek-23-1', 'S1', 'Yedek-23-1', null),
  ('S1 Yedek-23-2', 'S1', 'Yedek-23-2', null),
  ('S1 Yedek-24', 'S1', 'Yedek-24', null),
  ('S1 Yedek-25', 'S1', 'Yedek-25', null),
  ('S1 Yedek-26', 'S1', 'Yedek-26', null)
on conflict (name) do update
set
  main_line = excluded.main_line,
  branch_name = excluded.branch_name,
  pipe_note = coalesce(public.pipeline_lines.pipe_note, excluded.pipe_note);

insert into public.art_structure_presets (name)
values
  ('Tek cikisli, hat sonu degil, sade'),
  ('Tek cikisli, hat sonu, sade'),
  ('Tek cikisli, hat sonu degil, vantuzlu'),
  ('Tek cikisli, hat sonu, vantuzlu'),
  ('Cift cikisli, hat sonu degil, sade'),
  ('Cift cikisli, hat sonu, sade'),
  ('Cift cikisli, hat sonu degil, vantuzlu'),
  ('Cift cikisli, hat sonu, vantuzlu'),
  ('Sade vantuz'),
  ('Cazibeli tahliye'),
  ('Pompajli tahliye'),
  ('Ayrim yapisi'),
  ('Hat kapama vanasi')
on conflict (name) do nothing;

create table if not exists public.aksu_pozlar (
  id uuid primary key default gen_random_uuid(),
  poz_no text not null unique,
  ad text not null,
  birim text not null,
  metraj numeric not null default 0,
  fiyat numeric not null default 0,
  toplam numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aksu_metraj (
  id uuid primary key default gen_random_uuid(),
  tarih date not null,
  poz_no text not null references public.aksu_pozlar(poz_no) on update cascade on delete restrict,
  miktar numeric not null default 0,
  birim text,
  tutar numeric not null default 0,
  imalat_yeri text,
  aciklama text,
  hakedis_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.aksu_hakedis (
  id uuid primary key default gen_random_uuid(),
  no integer not null unique,
  tarih date not null,
  kesin boolean not null default false,
  onceki_no text,
  metraj_ids jsonb not null default '[]'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  toplam_sozlesme_tutari numeric not null default 0,
  onceki_sozlesme_tutari numeric not null default 0,
  sozlesme_tutari numeric not null default 0,
  fiyat_farki numeric not null default 0,
  fiyat_farki_detay jsonb not null default '[]'::jsonb,
  fiyat_farki_hata text,
  toplam_bu_hakedis numeric not null default 0,
  tahakkuk_kdv_dahil numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.aksu_pozlar enable row level security;
alter table public.aksu_metraj enable row level security;
alter table public.aksu_hakedis enable row level security;

drop policy if exists "authenticated read aksu pozlar" on public.aksu_pozlar;
drop policy if exists "admin write aksu pozlar" on public.aksu_pozlar;
drop policy if exists "authenticated read aksu metraj" on public.aksu_metraj;
drop policy if exists "admin write aksu metraj" on public.aksu_metraj;
drop policy if exists "authenticated read aksu hakedis" on public.aksu_hakedis;
drop policy if exists "admin write aksu hakedis" on public.aksu_hakedis;

create policy "authenticated read aksu pozlar"
on public.aksu_pozlar for select
to authenticated
using (true);

create policy "admin write aksu pozlar"
on public.aksu_pozlar for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "authenticated read aksu metraj"
on public.aksu_metraj for select
to authenticated
using (true);

create policy "admin write aksu metraj"
on public.aksu_metraj for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

create policy "authenticated read aksu hakedis"
on public.aksu_hakedis for select
to authenticated
using (true);

create policy "admin write aksu hakedis"
on public.aksu_hakedis for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');
