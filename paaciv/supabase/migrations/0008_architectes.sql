-- Phase 3 · Architectes (ivoiriens & étrangers) + liaison N–N avec le patrimoine.

create table architectes (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text unique not null,
  nom                    text not null,
  origine                text not null check (origine in ('ivoirien', 'etranger')),
  photo                  text,
  annee_naissance        int,
  annee_deces            int,
  periode_texte          text,
  bio_fr                 text,
  bio_en                 text,
  parcours_fr            text,
  parcours_en            text,
  realisations_texte_fr  text,
  realisations_texte_en  text,
  statut                 text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  ordre                  int  not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table patrimoine_architecte (
  patrimoine_id uuid not null references patrimoine(id)  on delete cascade,
  architecte_id uuid not null references architectes(id) on delete cascade,
  role          text,
  primary key (patrimoine_id, architecte_id)
);

create index idx_architectes_statut   on architectes(statut);
create index idx_architectes_origine  on architectes(origine);
create index idx_patarch_patrimoine   on patrimoine_architecte(patrimoine_id);
create index idx_patarch_architecte   on patrimoine_architecte(architecte_id);

-- updated_at maintenu par la fonction existante (search_path déjà épinglé).
create trigger trg_architectes_touch
  before update on architectes
  for each row execute function public.touch_updated_at();

-- RLS activé dès la création (politiques posées en 0009).
alter table architectes            enable row level security;
alter table patrimoine_architecte  enable row level security;
