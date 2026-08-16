-- L'état de conservation cesse d'être du texte libre pour devenir une
-- catégorie. La colonne existe depuis 0004 (`etat_conservation text`) et le
-- formulaire d'admin l'expose depuis toujours en champ texte : deux éditeurs
-- pouvaient donc écrire « en danger », « En danger » et « menacé » pour le
-- même fait, et aucun filtre ne pouvait s'y fier.
--
-- Vocabulaire arrêté : intact / en_restauration / en_danger / demoli.
-- « en_restauration » vaut d'être distingué de « en_danger » — la carte de la
-- page d'accueil s'appelait « Chantiers », et un chantier en cours n'est ni
-- intact ni en péril ; sans cette valeur une restauration active resterait
-- classée « en danger », ce qui est faux et décourageant à afficher.
--
-- `null` reste permis : c'est « non renseigné », l'état des 8 fiches au jour
-- de cette migration (vérifié : `count(etat_conservation) = 0`), d'où l'absence
-- de toute reprise de données ici.
--
-- Contrainte `check` et non type `enum` : un enum Postgres se modifie mal
-- (`alter type … add value` ne tourne pas dans une transaction, et retirer une
-- valeur est impossible), là où une contrainte se remplace d'un `drop`/`add`.
-- Le pendant applicatif est `lib/etats-conservation.ts` — les deux moitiés
-- doivent bouger ensemble.

alter table patrimoine
  add constraint patrimoine_etat_conservation_valide
  check (
    etat_conservation is null
    or etat_conservation in ('intact', 'en_restauration', 'en_danger', 'demoli')
  );

-- Index partiel : les filtres publics (archive et carte) interrogent toujours
-- une valeur précise, jamais l'absence de valeur. Exclure les `null` garde
-- l'index proportionnel aux fiches réellement classées.
create index if not exists patrimoine_etat_conservation_idx
  on patrimoine (etat_conservation)
  where etat_conservation is not null;
