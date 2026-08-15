-- Bornes de validité des coordonnées de `patrimoine` (WGS 84).
--
-- Incident : deux lignes ont été enregistrées avec `lat = 5000`
-- (la-pyramide-abidjan) et `lat = 725` (basilique-yamoussoukro), alors que la
-- latitude est bornée à [-90, 90]. `maplibre-gl` levait alors
-- `Invalid LngLat latitude value: must be between -90 and 90` en boucle : la
-- carte publique (/carte) ne s'affichait plus du tout et quatre tests e2e
-- échouaient en cascade. Une seule saisie fautive suffisait donc à faire
-- tomber la page centrale du site pour tous les visiteurs.
--
-- Trois barrières couvrent désormais ce cas ; celle-ci est la dernière et la
-- seule que rien ne contourne (les deux autres — `min`/`max` sur le champ et
-- `validerCoordonnee` dans admin/patrimoine/actions.ts — ne protègent que le
-- chemin du formulaire, pas un script de seed ni un UPDATE en SQL direct).
--
-- `lat is null` reste autorisé : tous les édifices ne sont pas géolocalisés
-- (colonne nullable depuis 0004_patrimoine.sql), et la carte les ignore
-- simplement.
--
-- Non rejouable telle quelle (Postgres n'accepte pas `add constraint if not
-- exists`), comme les autres migrations du dépôt.
--
-- Numérotée 0019 alors que `main` s'arrête à 0015 : la branche `feat/accueil`
-- (Phase 5, non mergée) occupe déjà 0016 à 0018. Réutiliser 0016 ici
-- produirait deux migrations de même numéro à la fusion, avec un ordre
-- d'application ambigu.

alter table patrimoine
  add constraint patrimoine_lat_bornes check (lat is null or (lat between -90 and 90)),
  add constraint patrimoine_lng_bornes check (lng is null or (lng between -180 and 180));
