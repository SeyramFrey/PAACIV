-- Palette « Matières » · les couleurs de données rejoignent celles du thème.
--
-- Les jetons de app/globals.css ont été recalés sur cinq matières du bâti
-- ivoirien (chaux de Grand-Bassam, banco du Nord, latérite, lagune Ébrié, tôle
-- vieillie). Les couleurs de `types` et `epoques`, elles, vivent EN BASE — la
-- carte, les badges de fiche et la répartition par type les lisent directement.
-- Sans cette migration, l'interface parlerait matière pendant que ses données
-- continueraient d'afficher l'ancienne charte : deux oranges différents côte à
-- côte sur la même page.
--
-- Chaque valeur est nommée par la matière dont elle vient, et toutes tiennent
-- 4,5:1 contre `--color-sable` (#F6F1E7), la couleur du texte posé dessus dans
-- les pastilles de type. Les teintes sont écartées sur la roue pour rester
-- distinguables en pastille de 12 px — c'est le vrai contrainte d'une palette
-- catégorielle, pas la beauté de chaque teinte prise seule.

update types set couleur = '#A6482A' where id = 'batiment';       -- latérite cuite
update types set couleur = '#8A6540' where id = 'religieux';      -- banco des mosquées du Nord
update types set couleur = '#5B6E4A' where id = 'monument';       -- bronze patiné
update types set couleur = '#2F6A63' where id = 'site';           -- lagune Ébrié
update types set couleur = '#5A4E8F' where id = 'lieu_culturel';  -- indigo (teinture sénoufo)
update types set couleur = '#33608C' where id = 'ensemble';       -- persiennes bleues de Bassam
update types set couleur = '#565C63' where id = 'ouvrage';        -- acier et fonte

update epoques set couleur = '#6B5A3C' where id = 'precolonial';       -- terre crue
update epoques set couleur = '#9E4A2C' where id = 'colonial';          -- brique de latérite
update epoques set couleur = '#35655F' where id = 'post_independance'; -- lagune

-- Bornes numériques des époques.
--
-- La frise chronologique du bâti place les édifices sur un axe d'années : elle
-- a besoin de savoir où commence et où finit chaque période. La colonne `borne`
-- existante (« 1893–1960 ») est un LIBELLÉ destiné à l'œil — la parser pour en
-- tirer des nombres serait fragile, et intraduisible en anglais. Deux colonnes
-- nullables plutôt qu'un intervalle : `annee_min` nulle sur le précolonial et
-- `annee_max` nulle sur le contemporain disent exactement ce qu'on veut dire —
-- une période ouverte, pas une date arbitraire.
alter table epoques add column if not exists annee_min int;
alter table epoques add column if not exists annee_max int;

update epoques set annee_min = null, annee_max = 1892 where id = 'precolonial';
update epoques set annee_min = 1893, annee_max = 1959 where id = 'colonial';
update epoques set annee_min = 1960, annee_max = null where id = 'post_independance';
