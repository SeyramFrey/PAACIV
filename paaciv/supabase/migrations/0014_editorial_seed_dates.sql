-- Phase 4 · Correctif du seed éditorial : repousse l'horizon de l'événement
-- « à venir ». La migration 0013 posait `exposition-a-venir` à
-- current_date + 30 jours ; passé ce délai il bascule côté « passé » et vide
-- la section « À venir » de /evenements sans qu'aucun code n'ait changé.
-- On porte l'horizon à 365 jours pour que le seed reste valable des mois,
-- pas des semaines. Le 0013 est corrigé en parallèle pour qu'une
-- installation neuve obtienne directement le même résultat (son
-- `on conflict (slug) do nothing` empêche toute réapplication ici d'avoir un
-- effet sur une base déjà seedée, d'où cet update ciblé).
--
-- ⚠️ Fuse à retardement : `current_date` est évalué une seule fois, au moment
-- où cette migration a été appliquée sur la base PAACIV (ref
-- yognzzhrrllomokvoooy) — pas à chaque lecture. Sur cette base, cela a figé
-- `date_debut = 2027-08-11` et `date_fin = 2027-08-18`, en dur, pour de bon.
-- Aux alentours de cette date, `exposition-a-venir` basculera côté « Passés »
-- et la section « À venir » de /evenements redeviendra vide sans qu'aucun
-- code n'ait changé — et tests/evenements.spec.ts recommencera à échouer.
-- Ce n'est PAS un bug à corriger dans ce fichier (ne pas changer ces dates
-- ici) : c'est un événement seed de démonstration qui doit être remplacé par
-- du contenu réel — ou sa date repoussée par une nouvelle migration — avant
-- cette échéance.

update evenements
set
  date_debut = (current_date + interval '365 days')::date,
  date_fin   = (current_date + interval '372 days')::date
where slug = 'exposition-a-venir';
