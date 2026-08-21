-- Complete uitbreiding v15. Veilig herhaalbaar; verwijdert geen inventaris.
alter table public.items add column if not exists packing_heavy boolean not null default false;
alter table public.items add column if not exists packing_fragile boolean not null default false;
alter table public.items add column if not exists packing_liquid boolean not null default false;
alter table public.items add column if not exists packing_accessible boolean not null default false;

create table if not exists public.safety_checks (
  id text primary key,
  label text not null,
  category text not null default 'Algemeen',
  checked boolean not null default false,
  checked_at timestamptz,
  sort_order integer not null default 0
);
create table if not exists public.trip_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  trip_type text not null default 'Vakantie',
  note text not null default '',
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists public.trip_snapshots (
  id uuid primary key default gen_random_uuid(),
  trip_profile_id uuid references public.trip_profiles(id) on delete cascade,
  captured_at timestamptz not null default now(),
  total_weight_kg numeric,
  payload_margin_kg numeric,
  measured_hitch_kg numeric,
  calculated_hitch_kg numeric,
  snapshot jsonb not null default '{}'
);
create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  component text not null,
  last_date date,
  next_date date,
  interval_months integer,
  note text not null default '',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.safety_checks enable row level security;
alter table public.trip_profiles enable row level security;
alter table public.trip_snapshots enable row level security;
alter table public.maintenance enable row level security;
drop policy if exists "authenticated safety checks" on public.safety_checks;
create policy "authenticated safety checks" on public.safety_checks for all to authenticated using (true) with check (true);
drop policy if exists "authenticated trip profiles" on public.trip_profiles;
create policy "authenticated trip profiles" on public.trip_profiles for all to authenticated using (true) with check (true);
drop policy if exists "authenticated trip snapshots" on public.trip_snapshots;
create policy "authenticated trip snapshots" on public.trip_snapshots for all to authenticated using (true) with check (true);
drop policy if exists "authenticated maintenance" on public.maintenance;
create policy "authenticated maintenance" on public.maintenance for all to authenticated using (true) with check (true);

insert into public.safety_checks(id,label,category,sort_order) values
('coupling','Koppeling correct vergrendeld','Aankoppelen',10),
('breakaway','Breekkabel correct bevestigd','Aankoppelen',20),
('plug','13-polige stekker aangesloten','Aankoppelen',30),
('lights','Verlichting en richtingaanwijzers getest','Controle',40),
('tyres','Bandenspanning en banden gecontroleerd','Controle',50),
('bolts','Wielbouten gecontroleerd','Controle',60),
('supports','Steunpoten en neuswiel volledig omhoog','Controle',70),
('lid','Deksel en alle sluitingen vergrendeld','Controle',80),
('tie_downs','Bagage en boxen vastgezet','Belading',90),
('hitch_weight','Kogeldruk gemeten met STB-200','Belading',100),
('trailer_weight','Werkelijke trailermassa gecontroleerd indien nodig','Belading',110),
('final_walk','Laatste ronde rondom trailer uitgevoerd','Vertrek',120)
on conflict(id) do update set label=excluded.label,category=excluded.category,sort_order=excluded.sort_order;

insert into public.maintenance(component,interval_months,note)
select component,months,note from (values
('Banden en bandenspanning',1,'Voor iedere reis visueel controleren'),
('Wielbouten',1,'Voor vertrek en na eerste kilometers controleren'),
('Wiellagers',12,'Speling en smering laten controleren'),
('Verlichting en 13-polige stekker',3,'Functie en contacten controleren'),
('Daktentbevestiging en dakrails',3,'Bouten en bevestigingspunten controleren'),
('Dekselgasveren en scharnieren',6,'Werking, schade en bevestiging controleren'),
('Tentdoek, naden en ritsen',6,'Reinigen, drogen en inspecteren'),
('Sluitingen, sloten en sjorbeugels',6,'Werking en corrosie controleren')
) x(component,months,note)
where not exists(select 1 from public.maintenance);
