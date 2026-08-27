-- Contenu de la fiche Raymond Aka Adjo, tel qu'il figure dans la maquette
-- « Architecte Aka Adjo » livrée avec le nouveau gabarit.
--
-- Ce contenu vient des pièces de l'agence transmises par le client ; la
-- maquette n'a fait que le mettre en forme. Il est versé ici pour que la fiche
-- ne perde rien au passage au nouveau gabarit — et il devient, dès cette
-- migration, ÉDITABLE depuis l'admin comme n'importe quel autre bloc.
--
-- Les intitulés d'origine sont conservés au mot près, coquilles comprises
-- (« Immobiliei », « Republique ») : ce sont les libellés des pièces d'archive,
-- et les corriger d'office reviendrait à réécrire la source. Le client les
-- amendera depuis l'admin s'il le souhaite.
--
-- Les variantes anglaises des missions et de l'agence sont laissées nulles :
-- l'intitulé d'un document d'archive ne se traduit pas, et `champ()` retombe
-- déjà sur le français.

-- La fiche est visée par son slug NORMALISÉ, et non par sa valeur littérale :
-- au fil de la vie du site elle a porté « aka-adjo » (seed 0010), puis
-- « Aka Raymond » (saisie manuelle dans l'admin), et vaudra « aka-raymond »
-- au prochain enregistrement depuis que les slugs sont normalisés à l'écriture.
-- Les trois doivent désigner la même ligne, ici comme sur une base rejouée
-- depuis zéro.
update architectes set
  profession_fr  = 'Architecte DESA · urbaniste',
  profession_en  = 'DESA architect · urban planner',
  agence         = 'Atelier d''architecture et d''urbanisme sarl, 1969',
  distinction_fr = 'Fondateur de l''Ordre des architectes de Côte d''Ivoire',
  distinction_en = 'Founder of the Order of Architects of Côte d''Ivoire',
  lieu_naissance = 'Adjamé — Abidjan'
where lower(replace(slug, ' ', '-')) in ('aka-adjo', 'aka-raymond');

-- Idempotence : la garde porte sur « cette fiche a-t-elle déjà des blocs »
-- plutôt que sur un `on conflict`, faute de clé naturelle — deux blocs peuvent
-- légitimement partager un même `ordre` le temps d'une réorganisation.
insert into architecte_blocs (architecte_id, bloc, surtitre_fr, surtitre_en, titre_fr, titre_en, texte_fr, texte_en, ordre)
select a.id, v.bloc, v.surtitre_fr, v.surtitre_en, v.titre_fr, v.titre_en, v.texte_fr, v.texte_en, v.ordre
from architectes a
cross join (values
  -- Chiffres-clés : synthèse de la liste des réalisations ci-dessous
  -- (Abidjan + six villes de l'intérieur = 7 schémas ; 1 700 + 800 logements).
  ('chiffre',   null::text, null::text, '7', null::text,
   'Schémas directeurs de villes', 'City master plans', 1),
  ('chiffre',   null, null, '2 500+', '2,500+',
   'Logements en opérations', 'Housing units in operations', 2),

  ('programme', null, null, 'Logements',                  'Housing', null, null,           1),
  ('programme', null, null, 'Bureaux',                    'Offices', null, null,           2),
  ('programme', null, null, 'Établissements scolaires',   'Schools', null, null,           3),
  ('programme', null, null, 'Établissements hospitaliers','Hospitals', null, null,         4),
  ('programme', null, null, 'Hôtellerie',                 'Hotels', null, null,            5),
  ('programme', null, null, 'Équipements sociaux',        'Social facilities', null, null, 6),
  ('programme', null, null, 'Commerces',                  'Retail', null, null,            7),
  ('programme', null, null, 'Industrie',                  'Industry', null, null,          8),
  ('programme', null, null, 'Édifices religieux',         'Religious buildings', null, null,9),

  ('domaine', null, null, 'Urbanisme', 'Urban planning',
   'Schémas directeurs d''Abidjan et de six villes de l''intérieur, à l''horizon 1980.',
   'Master plans for Abidjan and six inland cities, on a 1980 horizon.', 1),
  ('domaine', null, null, 'Lotissements', 'Housing estates',
   'Opérations pour la SOGEFIHA et la SICOGI à Abobo, Koumassi, Port-Bouët, Yopougon.',
   'Developments for SOGEFIHA and SICOGI in Abobo, Koumassi, Port-Bouët, Yopougon.', 2),
  ('domaine', null, null, 'Équipements', 'Public facilities',
   'Hôtels de l''Indépendance, établissements scolaires et hospitaliers, Grand Temple protestant d''Abidjan.',
   'Hôtels de l''Indépendance, schools and hospitals, Grand Protestant Temple of Abidjan.', 3),
  ('domaine', null, null, 'Missions à l''étranger', 'Missions abroad',
   'Dakar, Brazzaville, Conakry — résidences, opérations immobilières, chancellerie.',
   'Dakar, Brazzaville, Conakry — residences, property developments, chancery.', 4),

  ('mission', 'Sénégal · Dakar', 'Senegal · Dakar', 'Residence ATTA', null,
   'pour le compte de Mr OLLO Gabriel a DAKAR (SENEGAL) - Etudes', null, 1),
  ('mission', 'Congo · Brazzaville', 'Congo · Brazzaville', 'Operation Pole de Moukondo', null,
   'pour le compte de la Societe de Promotion et de Gestion Immobiliei (SOPROGI) a BRAZZAVILLE (Republique Populaire du CONGO)', null, 2),
  ('mission', 'Guinée · Conakry', 'Guinea · Conakry', 'Chancellerie et Residence de l''Ambassadeur', null,
   'de Cote d''Ivoire a CONAKRY (GUINEE)', null, 3)
) as v(bloc, surtitre_fr, surtitre_en, titre_fr, titre_en, texte_fr, texte_en, ordre)
where lower(replace(a.slug, ' ', '-')) in ('aka-adjo', 'aka-raymond')
  and not exists (select 1 from architecte_blocs b where b.architecte_id = a.id);
