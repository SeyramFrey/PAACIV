-- Phase 1 · Tables de référence
-- Nomenclatures partagées par les contenus des phases suivantes (types de
-- patrimoine, programmes, districts, époques). Identifiants texte stables
-- (slugs) pour être référencés en clé étrangère et lisibles dans les URLs.

create table types (
  id      text primary key,
  nom_fr  text not null,
  nom_en  text,
  icone   text,
  couleur text not null,
  ordre   int  not null default 0
);

create table programmes (
  id     text primary key,
  nom_fr text not null,
  nom_en text,
  ordre  int  not null default 0
);

create table districts (
  id     text primary key,
  nom_fr text not null,
  nom_en text,
  ordre  int  not null default 0
);

create table epoques (
  id      text primary key,
  nom_fr  text not null,
  nom_en  text,
  borne   text,
  couleur text,
  ordre   int  not null default 0
);

-- RLS : activé sur toutes les tables (exigence globale). Les tables de
-- référence sont en lecture publique intégrale ; aucune politique d'écriture
-- n'est définie, donc seuls la service_role (qui contourne la RLS) et les
-- migrations peuvent les modifier.
alter table types      enable row level security;
alter table programmes enable row level security;
alter table districts  enable row level security;
alter table epoques    enable row level security;

create policy "lecture publique types"
  on types for select to anon, authenticated using (true);
create policy "lecture publique programmes"
  on programmes for select to anon, authenticated using (true);
create policy "lecture publique districts"
  on districts for select to anon, authenticated using (true);
create policy "lecture publique epoques"
  on epoques for select to anon, authenticated using (true);
