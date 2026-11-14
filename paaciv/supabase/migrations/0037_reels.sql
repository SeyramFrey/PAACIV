-- Les réels Instagram de l'association, montrés en cartes sur l'accueil
-- (décision de Sey du 15/11/2026 : « clips ajoutés dans l'admin », une roue de
-- cartes portrait avec une étiquette en verre, dans l'épilogue).
--
-- Pourquoi des clips stockés ici plutôt que l'API d'Instagram ou ses blocs
-- d'intégration : les blocs officiels ne se stylisent pas et déposent des
-- cookies Meta, l'API Graph exige un compte pro relié à une page Facebook, une
-- application Meta et un jeton à renouveler, et ses liens de vidéo expirent.
-- Un clip déposé par l'association reste sous son contrôle, se sert depuis le
-- même stockage que les photos, et la carte renvoie vers le post d'origine.
--
-- `video` et `affiche` sont des chemins dans le bucket `patrimoine`
-- (préfixe `reels/`). L'affiche est l'image montrée tant que la vidéo ne joue
-- pas : l'admin la tire de la vidéo, elle est stockée avec ses versions WebP
-- comme toute image (lib/images/televerser.ts).
--
-- `credit` : l'auteur des images quand ce n'est pas l'association. La règle du
-- projet veut des crédits toujours visibles ; à défaut, la carte crédite le
-- compte de l'association.
create table reels (
  id               uuid primary key default gen_random_uuid(),
  video            text not null,
  affiche          text,
  -- Le post d'origine. La contrainte écarte tout autre domaine : la carte est
  -- un lien sortant, il ne doit mener nulle part ailleurs.
  lien             text not null check (lien ~ '^https://(www\.)?instagram\.com/'),
  legende_fr       text,
  legende_en       text,
  credit           text,
  date_publication date,
  ordre            int  not null default 0,
  statut           text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_reels_ordre on reels(ordre);

create trigger trg_reels_touch before update on reels
  for each row execute function public.touch_updated_at();

alter table reels enable row level security;

-- Même patron que les activités (0016) : lecture publique du publié,
-- écriture admin.
create policy "reels select public"
  on reels for select to anon using (statut = 'publie');
create policy "reels all admin"
  on reels for all to authenticated using (true) with check (true);
