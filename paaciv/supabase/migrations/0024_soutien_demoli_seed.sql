-- Les cartes de soutien de la page d'accueil suivent le vocabulaire posé par
-- 0023. La carte « Chantiers » devient « Patrimoine en danger » et une
-- quatrième carte « Patrimoine démoli » s'ajoute ; toutes deux mènent
-- désormais vers l'archive filtrée (`/archives?etat=…`) et non plus vers
-- `/articles`.
--
-- La clé `soutien_chantiers_texte` (0021) porte le texte de la carte
-- renommée : on la renomme avec elle. Un `update` sur la clé primaire plutôt
-- qu'un couple suppression/insertion, pour ne pas perdre le contenu si
-- l'association l'a déjà rédigé entre-temps. Au jour de cette migration la
-- valeur est encore le marqueur « À COMPLÉTER », donc sans risque — mais la
-- forme choisie reste la bonne dans les deux cas.
update contenu_site
   set cle = 'soutien_en_danger_texte'
 where cle = 'soutien_chantiers_texte';

-- Même patron que 0021 : pas de contenu réel inventé. Ni le nombre d'édifices
-- démolis ni les circonstances de leur disparition ne peuvent être affirmés
-- sans que l'association ne les rédige. Tant que la clé porte le marqueur, le
-- paragraphe reste masqué côté public (cf. `renseigne()` dans
-- lib/data/contenu-site.ts) — la carte, elle, s'affiche dès qu'une fiche est
-- classée « demoli ».
insert into contenu_site (cle, valeur_fr, valeur_en, type) values
  ('soutien_demoli_texte',
   'À COMPLÉTER — édifices disparus et ce qu''il en reste',
   'À COMPLÉTER — lost buildings and what remains of them',
   'texte')
on conflict (cle) do nothing;
