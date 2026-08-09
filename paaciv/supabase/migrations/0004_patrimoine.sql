-- Phase 2 · Table patrimoine (édifices géolocalisés — cœur du site) + images.

create table patrimoine (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  titre_fr           text not null,
  titre_en           text,
  resume_fr          text,
  resume_en          text,
  description_fr     text,
  description_en     text,
  type_id            text references types(id),
  programme_id       text references programmes(id),
  date_texte         text,
  annee_debut        int,
  annee_fin          int,
  epoque_id          text references epoques(id),
  style_fr           text,
  style_en           text,
  lat                double precision,
  lng                double precision,
  geom               geography(Point, 4326),
  district_id        text references districts(id),
  ville              text,
  adresse_fr         text,
  adresse_en         text,
  statut_patrimonial text,
  etat_conservation  text,
  video_url          text,
  sources_fr         text,
  sources_en         text,
  statut             text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table images (
  id            uuid primary key default gen_random_uuid(),
  patrimoine_id uuid not null references patrimoine(id) on delete cascade,
  chemin        text not null,
  legende_fr    text,
  legende_en    text,
  credit        text,
  ordre         int  not null default 0,
  est_principale boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Index : clés étrangères (jointures + RLS), filtres du catalogue, géo, statut.
create index idx_patrimoine_type      on patrimoine(type_id);
create index idx_patrimoine_programme on patrimoine(programme_id);
create index idx_patrimoine_district  on patrimoine(district_id);
create index idx_patrimoine_epoque    on patrimoine(epoque_id);
create index idx_patrimoine_statut    on patrimoine(statut);
create index idx_patrimoine_geom      on patrimoine using gist(geom);
create index idx_images_patrimoine    on images(patrimoine_id);

-- Synchronise geom depuis lat/lng. search_path épinglé pour résoudre PostGIS
-- quel que soit le rôle appelant.
create or replace function public.patrimoine_sync_geom()
returns trigger
language plpgsql
set search_path = extensions, public
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geom := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.geom := null;
  end if;
  return new;
end $$;

create trigger trg_patrimoine_geom
  before insert or update of lat, lng on patrimoine
  for each row execute function public.patrimoine_sync_geom();

-- Maintient updated_at à chaque modification.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_patrimoine_touch
  before update on patrimoine
  for each row execute function public.touch_updated_at();

-- RLS activé dès la création (sécurité par défaut). Les politiques d'accès
-- sont posées en Task 2. Sans politique : anon lit 0 ligne et ne peut pas
-- écrire — c'est l'état sûr attendu à l'issue de cette tâche.
alter table patrimoine enable row level security;
alter table images     enable row level security;
