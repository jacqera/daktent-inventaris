-- Reisplanner v16. Veilig herhaalbaar; bestaande reizen en inventaris blijven staan.
alter table public.trip_profiles add column if not exists origin text not null default '';
alter table public.trip_profiles add column if not exists destination text not null default '';
alter table public.trip_profiles add column if not exists stops text not null default '';
alter table public.trip_profiles add column if not exists stay text not null default '';
alter table public.trip_profiles add column if not exists route_note text not null default '';
