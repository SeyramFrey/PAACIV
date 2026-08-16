-- Désigne l'architecte PRINCIPAL d'une fiche patrimoine.
--
-- La colonne `role` existante (architecte / co-auteur / bureau) dit la NATURE
-- de l'intervention, pas la primauté : rien n'y empêche deux lignes « architecte »
-- sur la même fiche, et l'ordre d'affichage devenait alors arbitraire.
-- Colonne additive, défaut `false` : les 0 liaisons existantes restent valides
-- et aucune fiche ne change de rendu tant qu'un principal n'est pas désigné.
alter table patrimoine_architecte
  add column principal boolean not null default false;

-- Au plus UN principal par fiche. Index unique PARTIEL : il ne contraint que
-- les lignes à `true`, donc autant de non-principaux que voulu.
create unique index patrimoine_architecte_un_seul_principal
  on patrimoine_architecte (patrimoine_id)
  where principal;

comment on column patrimoine_architecte.principal is
  'Architecte principal de la fiche. Au plus un par patrimoine (index unique partiel).';
