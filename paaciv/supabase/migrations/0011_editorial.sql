-- Phase 4 · Volet éditorial : articles, reportages vidéo, événements.

create table categories_article (
  id      text primary key,
  nom_fr  text not null,
  nom_en  text,
  ordre   int  not null default 0
);

create table articles (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  titre_fr          text not null,
  titre_en          text,
  chapo_fr          text,
  chapo_en          text,
  corps_fr          text,
  corps_en          text,
  image_couverture  text,
  categorie_id      text references categories_article(id) on delete set null,
  patrimoine_id     uuid references patrimoine(id)         on delete set null,
  date_publication  date not null default current_date,
  statut            text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table reportages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  titre_fr        text not null,
  titre_en        text,
  video_url       text not null,
  description_fr  text,
  description_en  text,
  patrimoine_id   uuid references patrimoine(id) on delete set null,
  date            date not null default current_date,
  statut          text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table evenements (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  titre_fr        text not null,
  titre_en        text,
  description_fr  text,
  description_en  text,
  image           text,
  lieu            text,
  date_debut      date not null,
  date_fin        date,
  statut          text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint evenements_dates_coherentes check (date_fin is null or date_fin >= date_debut)
);

create index idx_articles_statut      on articles(statut);
create index idx_articles_date        on articles(date_publication desc);
create index idx_articles_categorie   on articles(categorie_id);
create index idx_articles_patrimoine  on articles(patrimoine_id);
create index idx_reportages_statut    on reportages(statut);
create index idx_reportages_date      on reportages(date desc);
create index idx_reportages_patrimoine on reportages(patrimoine_id);
create index idx_evenements_statut    on evenements(statut);
create index idx_evenements_debut     on evenements(date_debut);

create trigger trg_articles_touch   before update on articles
  for each row execute function public.touch_updated_at();
create trigger trg_reportages_touch before update on reportages
  for each row execute function public.touch_updated_at();
create trigger trg_evenements_touch before update on evenements
  for each row execute function public.touch_updated_at();

alter table categories_article enable row level security;
alter table articles           enable row level security;
alter table reportages         enable row level security;
alter table evenements         enable row level security;
