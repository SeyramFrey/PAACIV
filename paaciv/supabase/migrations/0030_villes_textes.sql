-- Pages de commune · texte de présentation éditable.
--
-- Les communes elles-mêmes ne sont PAS une table : elles sont dérivées de
-- `patrimoine.ville`, un champ libre déjà rempli et déjà utilisé tel quel par le
-- bandeau de l'accueil, la carte du territoire et la recherche de l'archive
-- (voir l'en-tête de `lib/villes.ts` pour le raisonnement complet). La seule
-- chose qu'on ne peut pas dériver du corpus, c'est le PARAGRAPHE qui présente la
-- commune. Il vit donc ici, dans `contenu_site`, sous une clé dérivée du slug.
--
-- Le préfixe `ville_` n'est pas cosmétique : `/admin/contenu` range les lignes
-- par PRÉFIXE de clé (`GROUPES` dans app/[locale]/admin/contenu/page.tsx) et
-- déverse dans un fourre-tout « autre » tout ce qui ne correspond à aucun
-- groupe. C'est exactement la faute que la migration 0026 a dû corriger après
-- coup ; le groupe `ville` est ajouté à `GROUPES` dans le même changement.
--
-- Le slug est calculé EN SQL et doit reproduire `slugify()` de lib/slug.ts :
-- décomposition Unicode, suppression des diacritiques, minuscules, tout ce qui
-- n'est ni lettre ni chiffre devient un tiret, tirets de bord retirés. Les deux
-- moitiés doivent rester d'accord — un slug qui divergerait ferait chercher à la
-- page `ville_grand-bassam_intro` pendant que la base porterait autre chose, et
-- le paragraphe ne s'afficherait jamais sans qu'aucune erreur ne soit levée.
--
-- `normalize(… , NFD)` + suppression de la plage des diacritiques combinants
-- plutôt que `unaccent` : l'extension n'est pas installée sur ce projet
-- (migration 0001 n'installe que PostGIS), et cette forme est exactement celle
-- que le code TypeScript applique.

create or replace function slug_ville(v text) returns text
language sql immutable strict as $$
  select trim(both '-' from regexp_replace(
    lower(regexp_replace(normalize(v, NFD), '[̀-ͯ]', '', 'g')),
    '[^a-z0-9]+', '-', 'g'))
$$;

comment on function slug_ville(text) is
  'Slug d''URL d''une commune. Doit rester identique à slugify() de lib/slug.ts.';

-- Une ligne par commune ACTUELLEMENT publiée, avec le marqueur de chantier.
--
-- La valeur « À COMPLÉTER » n'atteint jamais un visiteur : la page de commune lit
-- ce texte par `libelleOuNull()`, qui rend `null` sur une valeur vide, absente ou
-- encore marquée, et la page se passe alors de paragraphe. Seed avec marqueur
-- plutôt que rien, parce qu'une ligne présente dans `/admin/contenu` se voit et
-- s'écrit, là où une ligne absente ne se devine pas.
--
-- CONSÉQUENCE À CONNAÎTRE : une commune ajoutée plus tard n'aura pas sa ligne.
-- Sa page fonctionnera (fiches, carte, frise) mais sans paragraphe, jusqu'à ce
-- qu'on insère la clé. C'est un compromis assumé face à la seule alternative —
-- un déclencheur sur `patrimoine` qui écrirait dans `contenu_site` à chaque
-- enregistrement d'une fiche, pour un paragraphe facultatif.
insert into contenu_site (cle, valeur_fr, valeur_en, type)
select distinct
  'ville_' || slug_ville(ville) || '_intro',
  'À COMPLÉTER — présentation de ' || trim(ville) || ' : son histoire urbaine, ce qui fait la valeur de son bâti, ce que l''association y documente.',
  'TO BE COMPLETED — introduction to ' || trim(ville) || ': its urban history, what makes its built fabric valuable, and what the association documents there.',
  'texte'
from patrimoine
where statut = 'publie'
  and coalesce(trim(ville), '') <> ''
  and slug_ville(ville) <> ''
on conflict (cle) do nothing;
