-- Correctif de nommage sur les clés de 0025. L'écran `/admin/contenu` range les
-- lignes par PRÉFIXE de clé (`GROUPES` dans app/[locale]/admin/contenu/page.tsx)
-- et déverse dans un fourre-tout « autre » tout ce qui ne correspond à aucun
-- groupe. Six des douze libellés y tombaient — précisément l'inverse de
-- l'objectif, qui est de rendre le contenu trouvable par l'association.
--
-- Les clés rejoignent donc les groupes existants :
--   * les quatre chiffres clés sont rendus DANS le bloc « L'association »
--     (`Compteurs` est monté par `Association.tsx`), d'où le préfixe
--     `association_` ;
--   * le bloc `AppelArchives` lit déjà `parallaxe_texte`, donc son libellé de
--     bouton devient `parallaxe_cta` et non `archives_cta`.
-- Seul `film_libelle` n'a aucun groupe d'accueil : `film` est ajouté à
-- `GROUPES` plutôt que de tordre la clé.
--
-- Renommage plutôt que suppression/réinsertion : si l'association a déjà
-- réécrit un de ces libellés entre 0025 et ici, sa valeur suit.

update contenu_site set cle = 'association_chiffre_fiches'      where cle = 'chiffres_fiches';
update contenu_site set cle = 'association_chiffre_villes'      where cle = 'chiffres_villes';
update contenu_site set cle = 'association_chiffre_architectes' where cle = 'chiffres_architectes';
update contenu_site set cle = 'association_chiffre_articles'    where cle = 'chiffres_articles';
update contenu_site set cle = 'parallaxe_cta'                   where cle = 'archives_cta';
