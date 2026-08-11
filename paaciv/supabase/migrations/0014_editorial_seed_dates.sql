-- Phase 4 · Correctif du seed éditorial : repousse l'horizon de l'événement
-- « à venir ». La migration 0013 posait `exposition-a-venir` à
-- current_date + 30 jours ; passé ce délai il bascule côté « passé » et vide
-- la section « À venir » de /evenements sans qu'aucun code n'ait changé.
-- On porte l'horizon à 365 jours pour que le seed reste valable des mois,
-- pas des semaines. Le 0013 est corrigé en parallèle pour qu'une
-- installation neuve obtienne directement le même résultat (son
-- `on conflict (slug) do nothing` empêche toute réapplication ici d'avoir un
-- effet sur une base déjà seedée, d'où cet update ciblé).

update evenements
set
  date_debut = (current_date + interval '365 days')::date,
  date_fin   = (current_date + interval '372 days')::date
where slug = 'exposition-a-venir';
