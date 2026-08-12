-- Phase 5 · Page d'accueil : index manquants sur `statut`.
--
-- points_cles, activites et temoignages sont filtrées par `statut = 'publie'`
-- à chaque lecture publique (clause USING des policies RLS de la migration
-- 0016), mais aucune des trois n'indexait cette colonne : points_cles n'a
-- qu'un composite (bloc, ordre) qui ne la couvre pas, activites et
-- temoignages n'indexent que `ordre`. C'est un écart au patron du reste du
-- projet — patrimoine, architectes, articles, reportages et evenements
-- indexent tous systématiquement leur colonne `statut`. Chaque affichage de
-- l'accueil forçait donc un parcours séquentiel de la table.
--
-- Un composite par table plutôt que deux index séparés : chaque lecture
-- publique filtre par `statut` (imposé par RLS) PUIS trie par `ordre` — et,
-- pour points_cles, filtre aussi par `bloc` pour séparer les deux écrans
-- (« pourquoi nous suivre » / « raisons de regarder »). Un seul index
-- couvrant filtre(s) + tri sert la requête réelle en un seul parcours
-- d'index, sans avoir à combiner deux index par bitmap AND.
create index idx_points_cles_statut_bloc_ordre on points_cles(statut, bloc, ordre);
create index idx_activites_statut_ordre        on activites(statut, ordre);
create index idx_temoignages_statut_ordre      on temoignages(statut, ordre);
