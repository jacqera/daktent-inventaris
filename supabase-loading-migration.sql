-- Belading, gewichten en kogeldruk voor TPV/Bockmann KT-EU2 + Renault Symbioz.
-- Veilig herhaalbaar: bestaande inventaris blijft behouden.
alter table public.items add column if not exists product_weight_kg numeric;
alter table public.items add column if not exists measured_weight_kg numeric;
alter table public.items add column if not exists calculated_weight_kg numeric;
alter table public.items add column if not exists weight_source text not null default '';
alter table public.items add column if not exists weight_verified boolean not null default false;
alter table public.items add column if not exists weight_date date;
alter table public.items add column if not exists trailer_zone text;
alter table public.items add column if not exists position_x_cm numeric;
alter table public.items add column if not exists position_y_cm numeric;

alter table public.boxes add column if not exists measured_weight_kg numeric;
alter table public.boxes add column if not exists calculated_weight_kg numeric;
alter table public.boxes add column if not exists weight_date date;
alter table public.boxes add column if not exists weight_source text not null default '';
alter table public.boxes add column if not exists contents_changed_since_weighing boolean not null default false;
alter table public.boxes add column if not exists item_weight_at_weighing_kg numeric;
alter table public.boxes add column if not exists trailer_zone text;

create table if not exists public.technical_values (
  key text primary key,
  label text not null,
  value numeric,
  unit text not null default 'kg',
  value_type text not null check (value_type in ('officieel','gemeten','berekend','productspecificatie')),
  source text not null default '',
  source_url text,
  verified_on date,
  note text not null default '',
  verified boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.hitch_measurements (
  id uuid primary key default gen_random_uuid(),
  value_kg numeric not null check (value_kg >= 0),
  measured_at date not null default current_date,
  source text not null default 'ATSensoTec STB-200',
  note text not null default '',
  created_at timestamptz not null default now()
);

alter table public.technical_values enable row level security;
alter table public.hitch_measurements enable row level security;
drop policy if exists "authenticated technical values" on public.technical_values;
create policy "authenticated technical values" on public.technical_values for all to authenticated using (true) with check (true);
drop policy if exists "authenticated hitch measurements" on public.hitch_measurements;
create policy "authenticated hitch measurements" on public.hitch_measurements for all to authenticated using (true) with check (true);

insert into public.technical_values (key,label,value,unit,value_type,source,note,verified) values
('trailer_mtm','MTM trailer',750,'kg','officieel','TPV / Bockmann KT-EU2','Ongeremde enkelasser',true),
('trailer_empty','Eigen massa trailer',230,'kg','officieel','Configuratiegebonden dealerinformatie','Zwart deksel, dakrails, steunpoten en extra gasveren inbegrepen',true),
('car_unbraked_limit','Maximaal ongeremd trekgewicht auto',675,'kg','officieel','Renault Symbioz','Laagste waarde bepaalt operationele grens',true),
('trailer_hitch_limit','Maximale kogeldruk trailer',50,'kg','officieel','TPV / Bockmann KT-EU2','Controleer eventueel lagere trekhaaklimiet',true),
('car_hitch_limit','Maximale kogeldruk auto',75,'kg','officieel','Renault Symbioz','Trailerlimiet is lager',true),
('tent_weight','Sheepie Yuna 160 inclusief ladder',61,'kg','productspecificatie','Modelgeneratie-specifieke Sheepie/Yuna-specificatie','Later te vervangen door gemeten gewicht',false),
('trailer_inner_length','Binnenlengte',202,'cm','officieel','TPV / Bockmann KT-EU2','',true),
('trailer_inner_width','Binnenbreedte',107.5,'cm','officieel','TPV / Bockmann KT-EU2','',true),
('axle_position','Hart as vanaf binnenzijde disselzijde',113,'cm','gemeten','Eigen meting','Belangrijk voor momentberekening',true),
('closed_lid_limit','Dekselbelasting gesloten met extra gasveren',250,'kg','productspecificatie','KT-EU2 configuratie','Geen vervanging voor rail- of montagebeperkingen',true),
('open_lid_limit','Dekselbelasting open',20,'kg','productspecificatie','KT-EU2 specificatie','',true),
('warning_margin','Waarschuwingsmarge trailermassa',50,'kg','berekend','App-instelling','Configureerbaar',true)
on conflict (key) do update set label=excluded.label,value=excluded.value,unit=excluded.unit,value_type=excluded.value_type,source=excluded.source,note=excluded.note,verified=excluded.verified,updated_at=now();

insert into public.hitch_measurements(value_kg,measured_at,note)
select v, current_date, n from (values
 (21.5::numeric,'Trailer en daktent zonder bagage'),
 (22.25::numeric,'Eerste opslagbelading (middenwaarde 22-22,5)'),
 (30::numeric,'Latere belading'),
 (32.5::numeric,'Laatste bekende belading; bovenzijde gemeten bereik 31-32,5')
) x(v,n)
where not exists (select 1 from public.hitch_measurements);

update public.boxes set measured_weight_kg = case id when 1 then 7.0 when 2 then 6.8 when 3 then 6.4 when 4 then 4.3 when 5 then 12.8 else measured_weight_kg end,
  weight_source = case when id between 1 and 5 then 'Eigen meting' else weight_source end,
  weight_date = case when id between 1 and 5 then current_date else weight_date end
where id between 1 and 5;

update public.items set product_weight_kg=22, weight_source='Productspecificatie fabrikant/verkoper', weight_verified=true, trailer_zone='rechts rond as'
where lower(name) like '%wild land%' or lower(name) like '%keuken%';
update public.items set product_weight_kg=19.3, weight_source='Anker productspecificatie incl. accu', weight_verified=true
where lower(name) like '%anker%' or lower(name) like '%everfrost%';
update public.items set measured_weight_kg=3.6, weight_source='Eigen meting', weight_verified=true where lower(name)='tafel';
update public.items set measured_weight_kg=5.2, weight_source='Eigen meting', weight_verified=true where lower(name) like '%slaapzakken%' or lower(name) like '%beddengoed%';
update public.items set measured_weight_kg=13.0, weight_source='Eigen meting', weight_verified=true where lower(name) like '%sup%tas 1%' or lower(name) like '%sup-tas 1%';
update public.items set measured_weight_kg=2.8, weight_source='Eigen meting', weight_verified=true where lower(name) like '%shark 3%';
update public.items set measured_weight_kg=4.2, weight_source='Eigen meting', weight_verified=true where lower(name) like '%vaquita%';
update public.items set measured_weight_kg=2.6, weight_source='Eigen meting', weight_verified=true where lower(name) like '%bigblue%';
update public.items set measured_weight_kg=2.9, weight_source='Eigen meting', weight_verified=true where lower(name) like '%decktas jacq%';
update public.items set measured_weight_kg=2.6, weight_source='Eigen meting', weight_verified=true where lower(name) like '%decktas cel%';
update public.items set measured_weight_kg=8.6, weight_source='Eigen meting', weight_verified=true where lower(name) like '%kledingtas cel%';
update public.items set measured_weight_kg=8.0, weight_source='Eigen meting', weight_verified=true where lower(name) like '%kledingtas jacq%';
update public.items set measured_weight_kg=0.8, weight_source='Eigen meting', weight_verified=true where lower(name)='klein tasje';
