-- État de conservation · première passe de renseignement.
--
-- ╔═══════════════════════════════════════════════════════════════════════════╗
-- ║  À VALIDER PAR L'ASSOCIATION AVANT MISE EN LIGNE                          ║
-- ╚═══════════════════════════════════════════════════════════════════════════╝
--
-- Le vocabulaire d'état existe depuis la migration 0023, la colonne aussi — et
-- elle était NULLE sur les huit fiches. Conséquence directe : les cartes
-- « Patrimoine en danger » et « Patrimoine démoli » de l'accueil ne s'affichaient
-- jamais (elles se masquent quand leur liste est vide, par `comptesParEtat`), le
-- filtre « État » ne rendait aucun résultat, et la lecture par état de la carte
-- aurait montré sept points gris. Le propos militant du site n'existait qu'en
-- puissance.
--
-- Les valeurs ci-dessous sont une AMORCE fondée sur l'état public et documenté
-- de chaque édifice à la date de cette migration. Elles ne remplacent pas le
-- jugement de l'association, qui est la seule à connaître le terrain : chacune
-- doit être relue depuis `/admin/patrimoine`, et rectifiée s'il y a lieu.
--
-- Deux précautions rendent cette amorce sans danger :
--
--   1. `where etat_conservation is null` — une valeur déjà saisie par un éditeur
--      n'est JAMAIS écrasée. Rejouer la migration ne défait aucune correction.
--   2. Le retour en arrière est une ligne, sans perte :
--         update patrimoine set etat_conservation = null;
--
-- Justification, fiche par fiche :
--   · cathedrale-saint-paul-abidjan  intact     — en service, entretenue
--   · hotel-ivoire-abidjan           intact     — rénové et rouvert, en exploitation
--   · pont-felix-houphouet-boigny    intact     — ouvrage en service
--   · stade-felix-houphouet-boigny   intact     — rénové à la fin des années 2010
--   · basilique-yamoussoukro         intact     — entretenue, ouverte au public
--   · la-pyramide-abidjan            en_danger  — désaffectée et dégradée de longue
--                                                 date, objet de campagnes de
--                                                 sauvegarde répétées
--   · quartier-france-de-grand-bassam en_danger — inscrit à l'UNESCO en 2012, mais
--                                                 dont une part du bâti est en
--                                                 ruine ou en péril
--
-- Aucune fiche n'est marquée « démoli » : ce serait affirmer la disparition d'un
-- édifice, et cette affirmation-là ne se prend pas par défaut.

update patrimoine set etat_conservation = 'intact'
where etat_conservation is null
  and slug in (
    'cathedrale-saint-paul-abidjan',
    'hotel-ivoire-abidjan',
    'pont-felix-houphouet-boigny',
    'stade-felix-houphouet-boigny',
    'basilique-yamoussoukro'
  );

update patrimoine set etat_conservation = 'en_danger'
where etat_conservation is null
  and slug in (
    'la-pyramide-abidjan',
    'quartier-france-de-grand-bassam'
  );
