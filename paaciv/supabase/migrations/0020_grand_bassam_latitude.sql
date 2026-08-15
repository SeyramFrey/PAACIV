-- Correction de la latitude du Quartier France de Grand-Bassam.
--
-- La ligne était enregistrée à lat = 51.1996 au lieu de 5.1996 : un chiffre en
-- trop, qui plaçait le marqueur dans le canal de Bristol, au large du pays de
-- Galles, sur la carte publique. La longitude (-3.7386) était correcte.
--
-- Le seed 0007_patrimoine_seed.sql porte déjà la bonne valeur (5.1996) sous le
-- slug `quartier-france-grand-bassam` : la faute vient d'une édition ultérieure
-- via le back-office, qui a aussi renommé le slug en
-- `quartier-france-de-grand-bassam`. Rien à corriger dans le seed, donc — mais
-- la correction doit exister dans le dépôt pour que tout environnement déjà
-- déployé converge, et non seulement la base de production.
--
-- 51.1996 reste DANS les bornes de `patrimoine_lat_bornes` (migration 0019) :
-- aucune des trois barrières ne pouvait l'attraper, elles n'écartent que
-- l'absurde, pas le plausible-mais-faux. C'est le rôle du test d'enveloppe
-- ivoirienne ajouté à tests/db/data-patrimoine.spec.ts.
--
-- Rejouable : la condition `lat > 11` (hors enveloppe du pays) borne la portée
-- et rend l'instruction sans effet une fois la correction appliquée.

update patrimoine
set lat = 5.1996
where slug in ('quartier-france-de-grand-bassam', 'quartier-france-grand-bassam')
  and lat > 11;
