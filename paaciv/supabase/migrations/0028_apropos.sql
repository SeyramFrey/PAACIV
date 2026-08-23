-- Page « À propos », ajoutée à la barre de navigation.
--
-- Deux clés seulement, et volontairement : la page se construit d'abord sur le
-- contenu qui existe DÉJÀ et que l'association a écrit — `association_titre`,
-- `association_texte`, le bloc « Notre travail », les points clés « Pourquoi
-- nous suivre », les activités et les chiffres. Rien n'est inventé ici, et la
-- page n'est jamais vide.
--
-- Ces deux clés sont un REMPLACEMENT FACULTATIF (même patron que 0025) : tant
-- qu'elles portent le marqueur, la page retombe sur le titre et le texte de
-- l'association. Elles existent pour que celle-ci puisse écrire une
-- présentation PLUS LONGUE que le paragraphe de la page d'accueil, sans être
-- obligée de le faire pour que la page tienne debout.
insert into contenu_site (cle, valeur_fr, valeur_en, type) values
  ('apropos_titre',
   'À COMPLÉTER — titre de la page « À propos »',
   'À COMPLÉTER — title of the “About” page',
   'texte'),
  ('apropos_texte',
   'À COMPLÉTER — présentation longue de l''association',
   'À COMPLÉTER — long presentation of the association',
   'texte')
on conflict (cle) do nothing;
