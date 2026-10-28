-- Les types de programme deviennent les douze catégories transmises par le
-- client (octobre 2026). Ce sont elles que liste la bande « Type de
-- programmes » de la fiche architecte, et elles que reprennent les filtres
-- « Programme » de l'archive et de la carte : un seul vocabulaire pour tout le
-- site.
--
-- Libellés repris de la liste du client, accords rétablis (« Habitats
-- individuels », « Établissements hospitaliers »…).
--
-- L'ordre des opérations compte : `patrimoine.programme_id` référence la
-- table sans `on delete`, il faut donc insérer les nouvelles catégories,
-- reclasser les fiches, et seulement ensuite retirer l'ancien vocabulaire.

insert into programmes (id, nom_fr, nom_en, ordre) values
  ('logements_sociaux',           'Logements sociaux',           'Social housing',        1),
  ('habitats_individuels',        'Habitats individuels',        'Individual housing',    2),
  ('bureaux',                     'Bureaux',                     'Offices',               3),
  ('etablissements_scolaires',    'Établissements scolaires',    'Schools',               4),
  ('etablissements_hospitaliers', 'Établissements hospitaliers', 'Hospitals',             5),
  ('etablissements_hoteliers',    'Établissements hôteliers',    'Hotels',                6),
  ('etablissements_commerciaux',  'Établissements commerciaux',  'Retail',                7),
  ('etablissements_religieux',    'Établissements religieux',    'Religious buildings',   8),
  ('equipements_sociaux',         'Équipements sociaux',         'Social facilities',     9),
  ('etablissements_industriels',  'Établissements industriels',  'Industrial facilities', 10),
  ('concours',                    'Concours',                    'Competitions',          11),
  ('urbanisme',                   'Urbanisme',                   'Urban planning',        12)
on conflict (id) do update set
  nom_fr = excluded.nom_fr,
  nom_en = excluded.nom_en,
  ordre  = excluded.ordre;

-- Reclassement des fiches existantes. Les correspondances évidentes d'abord ;
-- celles qui demandent un choix sont commentées, le client les corrigera
-- depuis l'admin s'il les classe autrement.
update patrimoine set programme_id = case programme_id
  when 'residentiel'   then 'habitats_individuels'
  when 'administratif' then 'bureaux'
  when 'hotelier'      then 'etablissements_hoteliers'
  when 'religieux'     then 'etablissements_religieux'
  when 'sanitaire'     then 'etablissements_hospitaliers'
  when 'industriel'    then 'etablissements_industriels'
  -- Stade, salle de spectacle : des équipements publics ouverts à tous.
  when 'sportif'       then 'equipements_sociaux'
  when 'culturel'      then 'equipements_sociaux'
  -- Pont, aéroport : des ouvrages d'aménagement du territoire.
  when 'ouvrage_art'   then 'urbanisme'
  when 'aeroportuaire' then 'urbanisme'
  else programme_id
end
where programme_id in (
  'residentiel', 'administratif', 'hotelier', 'religieux', 'sanitaire',
  'industriel', 'sportif', 'culturel', 'ouvrage_art', 'aeroportuaire'
);

-- Le Quartier France de Grand-Bassam était classé « Administratif » ; c'est un
-- quartier entier, il relève de l'urbanisme et non des bureaux.
update patrimoine set programme_id = 'urbanisme'
where slug = 'quartier-france-de-grand-bassam';

delete from programmes where id not in (
  'logements_sociaux', 'habitats_individuels', 'bureaux',
  'etablissements_scolaires', 'etablissements_hospitaliers',
  'etablissements_hoteliers', 'etablissements_commerciaux',
  'etablissements_religieux', 'equipements_sociaux',
  'etablissements_industriels', 'concours', 'urbanisme'
);
