-- Douze libellés de la page d'accueil passent en base, pour tenir l'objectif
-- déclaré : tout le contenu de la landing doit être éditable depuis l'admin.
--
-- Ces clés sont un REMPLACEMENT FACULTATIF, pas la source unique. Le libellé
-- i18n reste le plancher garanti côté code (`libelleOuNull` renvoie `null` si
-- la ligne est vide, supprimée ou encore « À COMPLÉTER », et l'appelant retombe
-- sur `t(...)`). Un paragraphe absent laisse un trou acceptable dans la page ;
-- un libellé absent laisserait un bouton muet — d'où la différence de
-- traitement avec les clés de `contenu_site` seedées jusqu'ici.
--
-- Conséquence pratique : les valeurs ci-dessous reprennent EXACTEMENT le
-- wording actuel. Cette migration ne change donc rien à l'écran ; elle ouvre
-- seulement la main à l'association.
--
-- Deux libellés de la liste initiale restent volontairement au code :
-- `toutArchive` (« Toute l'archive — {n} fiches ») et `noteSur`
-- (« {note} sur 5 ») portent une variable, et `contenu_site` rend des chaînes
-- brutes sans interpolation. Ce sont des mécaniques d'interface à compteur,
-- pas de la copie éditoriale.

insert into contenu_site (cle, valeur_fr, valeur_en, type) values
  ('hero_accroche', 'Découvrir le patrimoine de la Côte d''Ivoire', 'Discover the heritage of Côte d''Ivoire', 'texte'),
  ('film_libelle', 'Film', 'Film', 'texte'),
  ('archives_cta', 'Confier une archive', 'Entrust an archive', 'texte'),
  ('raisons_cta', 'Voir le programme', 'See the programme', 'texte'),
  ('chiffres_fiches', 'Fiches', 'Records', 'texte'),
  ('chiffres_villes', 'Communes', 'Towns', 'texte'),
  ('chiffres_architectes', 'Architectes', 'Architects', 'texte'),
  ('chiffres_articles', 'Publications', 'Publications', 'texte'),
  ('soutien_en_danger_titre', 'Patrimoine en danger', 'Heritage at risk', 'texte'),
  ('soutien_demoli_titre', 'Patrimoine démoli', 'Lost heritage', 'texte'),
  ('soutien_adhesion_titre', 'Adhérer', 'Join', 'texte'),
  ('soutien_don_titre', 'Faire un don', 'Donate', 'texte')
on conflict (cle) do nothing;
