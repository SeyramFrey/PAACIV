-- Phase 5 · Page d'accueil : contenus éditables et collecte.

-- Textes de bloc, en clé/valeur. Pas de colonne `statut` : tout est visible,
-- l'édition passe uniquement par l'admin.
create table contenu_site (
  cle        text primary key,
  valeur_fr  text,
  valeur_en  text,
  type       text not null default 'texte' check (type in ('texte', 'html', 'image')),
  updated_at timestamptz not null default now()
);

-- Les 4 arguments de « Pourquoi nous suivre » et les 5 « raisons de regarder »
-- partagent la même forme et le même écran d'admin : une seule table, séparée
-- à la lecture par la colonne `bloc`.
create table points_cles (
  id        uuid primary key default gen_random_uuid(),
  bloc      text not null check (bloc in ('pourquoi', 'raisons')),
  titre_fr  text not null,
  titre_en  text,
  texte_fr  text,
  texte_en  text,
  ordre     int  not null default 0,
  statut    text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activites (
  id             uuid primary key default gen_random_uuid(),
  titre_fr       text not null,
  titre_en       text,
  cadence_fr     text,
  cadence_en     text,
  description_fr text,
  description_en text,
  cta_libelle_fr text,
  cta_libelle_en text,
  cta_href       text,
  image          text,
  ordre          int  not null default 0,
  statut         text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table temoignages (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  role_fr     text,
  role_en     text,
  citation_fr text not null,
  citation_en text,
  note        int  not null default 5 check (note between 1 and 5),
  ordre       int  not null default 0,
  statut      text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table newsletter_abonnes (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  langue     text not null default 'fr' check (langue in ('fr', 'en')),
  created_at timestamptz not null default now()
);

create table demandes (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('adhesion', 'don', 'archive')),
  nom        text not null,
  email      text not null,
  telephone  text,
  montant    numeric(12, 2) check (montant is null or montant > 0),
  message    text,
  statut     text not null default 'nouvelle' check (statut in ('nouvelle', 'traitee')),
  created_at timestamptz not null default now()
);

create index idx_points_cles_bloc   on points_cles(bloc, ordre);
create index idx_activites_ordre    on activites(ordre);
create index idx_temoignages_ordre  on temoignages(ordre);
create index idx_demandes_type      on demandes(type, created_at desc);
create index idx_demandes_statut    on demandes(statut);

create trigger trg_contenu_site_touch before update on contenu_site
  for each row execute function public.touch_updated_at();
create trigger trg_points_cles_touch  before update on points_cles
  for each row execute function public.touch_updated_at();
create trigger trg_activites_touch    before update on activites
  for each row execute function public.touch_updated_at();
create trigger trg_temoignages_touch  before update on temoignages
  for each row execute function public.touch_updated_at();

alter table contenu_site        enable row level security;
alter table points_cles         enable row level security;
alter table activites           enable row level security;
alter table temoignages         enable row level security;
alter table newsletter_abonnes  enable row level security;
alter table demandes            enable row level security;

-- Contenus : lecture publique du publié, écriture admin. Même patron que le
-- volet éditorial (migration 0012).
create policy "contenu_site select public"
  on contenu_site for select to anon using (true);
create policy "contenu_site all admin"
  on contenu_site for all to authenticated using (true) with check (true);

create policy "points_cles select public"
  on points_cles for select to anon using (statut = 'publie');
create policy "points_cles all admin"
  on points_cles for all to authenticated using (true) with check (true);

create policy "activites select public"
  on activites for select to anon using (statut = 'publie');
create policy "activites all admin"
  on activites for all to authenticated using (true) with check (true);

create policy "temoignages select public"
  on temoignages for select to anon using (statut = 'publie');
create policy "temoignages all admin"
  on temoignages for all to authenticated using (true) with check (true);

-- Collecte : patron INVERSE. Insertion publique, lecture réservée à l'admin.
-- Sans cette asymétrie, la liste des abonnés et les coordonnées des donateurs
-- seraient lisibles par quiconque dispose de la clé anonyme — qui est, par
-- construction, publiée dans le bundle du navigateur.
create policy "newsletter_abonnes insert public"
  on newsletter_abonnes for insert to anon with check (true);
create policy "newsletter_abonnes all admin"
  on newsletter_abonnes for all to authenticated using (true) with check (true);

create policy "demandes insert public"
  on demandes for insert to anon with check (statut = 'nouvelle');
create policy "demandes all admin"
  on demandes for all to authenticated using (true) with check (true);
