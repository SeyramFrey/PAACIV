-- Révision demandée par Yacouba Doukoure (« Révision paaciv.pdf », 13/11/2026).
--
-- Quatre ensembles, tous ADDITIFS sauf le premier :
--
--   1. L'état de conservation change de vocabulaire. Celui de 0023 (intact /
--      en_restauration / en_danger / demoli) disait une situation ; celui de
--      l'association dit un DEGRÉ, sur cinq niveaux :
--        bon_etat / etat_moyen / degrade / fortement_degrade / ruine.
--      Les valeurs déjà saisies sont converties (voir la table plus bas), puis
--      la contrainte est remplacée. Le pendant applicatif reste
--      `lib/etats-conservation.ts` : les deux moitiés bougent ensemble.
--
--   2. La fiche bâtiment gagne quatre mentions (maître d'ouvrage, fonction
--      actuelle, entreprise de construction, photographe) et le contenu de
--      deux onglets : « Photographies et état actuel » (état d'occupation,
--      transformations, texte sur les photographies) et « Documentation »
--      (contenus). Les sources existantes (`sources_fr/en`) passent dans le
--      premier onglet sans changer de colonne.
--
--   3. Les photos se rangent par onglet (`groupe`) et gagnent une date et une
--      source. Les photos existantes restent dans la galerie du haut.
--
--   4. La fiche architecte gagne une notice du fonds : présentation du
--      contenu, mentions obligatoires, auteur(s) de l'instrument de recherche.
--
-- Retour en arrière : les colonnes ajoutées se suppriment sans perte pour
-- l'existant ; la conversion d'état se défait par la table inverse
-- (bon_etat → intact, etat_moyen → en_restauration, degrade → en_danger,
-- ruine → demoli) avant de remettre la contrainte de 0023.

-- ── 1 · État de conservation ────────────────────────────────────────────────

alter table patrimoine drop constraint if exists patrimoine_etat_conservation_valide;

-- Conversion, au plus près du sens. Toutes ces valeurs étaient une amorce à
-- faire relire par l'association (0031) : elles restent à relire.
--   intact          → bon_etat
--   en_restauration → etat_moyen   (un chantier ouvert : ni bon, ni dégradé)
--   en_danger       → degrade
--   demoli          → ruine        (aucune fiche concernée au 13/11/2026)
update patrimoine set etat_conservation = case etat_conservation
  when 'intact'          then 'bon_etat'
  when 'en_restauration' then 'etat_moyen'
  when 'en_danger'       then 'degrade'
  when 'demoli'          then 'ruine'
  else etat_conservation
end
where etat_conservation in ('intact', 'en_restauration', 'en_danger', 'demoli');

alter table patrimoine
  add constraint patrimoine_etat_conservation_valide
  check (
    etat_conservation is null
    or etat_conservation in ('bon_etat', 'etat_moyen', 'degrade', 'fortement_degrade', 'ruine')
  );

-- La carte « Patrimoine démoli » de « À propos » pointe désormais vers les
-- édifices en ruine. Son titre ne change que s'il porte encore la valeur
-- d'origine : un titre retouché dans l'admin n'est jamais écrasé.
update contenu_site set valeur_fr = 'Patrimoine en ruine'
  where cle = 'soutien_demoli_titre' and valeur_fr = 'Patrimoine démoli';
update contenu_site set valeur_en = 'Heritage in ruins'
  where cle = 'soutien_demoli_titre' and valeur_en = 'Lost heritage';

-- ── 2 · Fiche bâtiment ──────────────────────────────────────────────────────

alter table patrimoine
  -- Noms propres : une personne, une administration, une entreprise. Pas de
  -- variante anglaise, comme `agence` sur les architectes (0032).
  add column maitre_ouvrage          text,
  add column entreprise_construction text,
  add column photographe             text,
  -- « Bureaux », « Musée » : se traduit.
  add column fonction_actuelle_fr    text,
  add column fonction_actuelle_en    text,
  -- Onglet « Photographies et état actuel ».
  add column etat_occupation         text
    constraint patrimoine_etat_occupation_valide
    check (etat_occupation is null
           or etat_occupation in ('occupe', 'partiellement_occupe', 'vacant', 'abandonne')),
  add column transformations_fr      text,
  add column transformations_en      text,
  add column photographies_fr        text,
  add column photographies_en        text,
  -- Onglet « Documentation » : « Plans, et archives photographiques ».
  add column documentation_fr        text,
  add column documentation_en        text;

-- ── 3 · Photos rangées par onglet ───────────────────────────────────────────

alter table images
  add column groupe text not null default 'galerie'
    constraint images_groupe_valide
    check (groupe in ('galerie', 'etat_actuel', 'documentation')),
  -- Texte libre, pas une date : « vers 1965 », « 1959-1970 », « mars 2024 ».
  add column date_texte text,
  -- Provenance du document (fonds, collection), distincte du `credit` qui
  -- nomme l'auteur de la photo.
  add column source text;

-- La lecture d'une fiche demande ses photos par onglet, dans l'ordre.
create index if not exists idx_images_patrimoine_groupe on images(patrimoine_id, groupe, ordre);

-- ── 4 · Notice du fonds, fiche architecte ───────────────────────────────────

alter table architectes
  add column presentation_contenu_fr text,
  add column presentation_contenu_en text,
  add column mentions_obligatoires_fr text,
  add column mentions_obligatoires_en text,
  -- Des noms : pas de variante anglaise.
  add column auteurs_instrument text;
