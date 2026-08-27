-- Fiche architecte · les cinq ensembles apportés par le nouveau gabarit.
--
-- La maquette « Architecte Aka Adjo » demande cinq choses que la table
-- `architectes` ne savait pas porter. Elles se rangent en deux formes :
--
--   * des mentions SCALAIRES — profession, agence, distinction, lieu de
--     naissance — qui remplissent le tableau « Informations générales » ;
--   * quatre LISTES ordonnées — programmes à son actif, domaines
--     d'intervention, missions à l'étranger, chiffres-clés.
--
-- Les quatre listes partagent EXACTEMENT la même forme (un sur-titre
-- facultatif, un titre, un texte facultatif) et le même écran d'admin. Une
-- seule table les porte donc, séparée à la lecture par la colonne `bloc` :
-- c'est le patron déjà retenu pour `points_cles` (0016), pour la même raison.
-- Quatre tables jumelles auraient signifié quatre formulaires jumeaux.
--
-- Tout est facultatif : une fiche sans aucun bloc rend exactement la page
-- d'avant, en mieux mise en page. C'est ce qui permet au gabarit de valoir
-- pour les sept architectes, et pas seulement pour celui dont on tient la
-- documentation complète.

alter table architectes
  add column profession_fr  text,
  add column profession_en  text,
  -- Nom propre d'agence : pas de variante anglaise, « Atelier d'architecture
  -- et d'urbanisme sarl » ne se traduit pas.
  add column agence         text,
  add column distinction_fr text,
  add column distinction_en text,
  add column lieu_naissance text;

create table architecte_blocs (
  id            uuid primary key default gen_random_uuid(),
  architecte_id uuid not null references architectes(id) on delete cascade,
  bloc          text not null check (bloc in ('programme', 'domaine', 'mission', 'chiffre')),
  -- Sur-titre : « Sénégal · Dakar » au-dessus d'une mission. Inutilisé par les
  -- programmes et les chiffres, d'où le caractère facultatif.
  surtitre_fr   text,
  surtitre_en   text,
  titre_fr      text not null,
  titre_en      text,
  texte_fr      text,
  texte_en      text,
  ordre         int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- L'index couvre la seule lecture qui existe : « tous les blocs d'une fiche,
-- groupés par type, dans l'ordre ».
create index idx_architecte_blocs on architecte_blocs(architecte_id, bloc, ordre);

create trigger trg_architecte_blocs_touch before update on architecte_blocs
  for each row execute function public.touch_updated_at();

alter table architecte_blocs enable row level security;

-- Pas de colonne `statut` propre, contrairement à `points_cles` : un bloc
-- n'existe que par sa fiche et n'a pas de visibilité à lui. La publier ou non
-- est une décision qui se prend une fois, sur l'architecte. La policy reprend
-- donc l'idiome de la liaison `patrimoine_architecte` (0009) : le public ne
-- voit le bloc que si la fiche qui le porte est publiée. Sans cela, les blocs
-- d'un architecte en brouillon fuiraient par la clé anonyme, qui est publiée
-- dans le bundle du navigateur.
create policy "architecte_blocs select public"
  on architecte_blocs for select to anon
  using (
    (select exists (
      select 1 from architectes a
      where a.id = architecte_blocs.architecte_id and a.statut = 'publie'
    ))
  );
create policy "architecte_blocs all admin"
  on architecte_blocs for all to authenticated using (true) with check (true);
