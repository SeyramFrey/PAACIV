-- Task 11 (révision) · Trois clés `contenu_site` pour les descriptions des
-- cartes de soutien de la page d'accueil (Chantiers / Adhérer / Faire un
-- don). Non seedées avec un contenu réel : ni le nombre de chantiers en
-- cours, ni la liste des avantages d'adhésion, ni l'usage précis des dons ne
-- peuvent être affirmés sans que l'association ne les rédige elle-même —
-- même patron que `soutien_adhesion_montant` et `soutien_paiement`
-- (migration 0018). Tant que ces clés portent le marqueur, le paragraphe
-- correspondant reste masqué côté public (cf. `renseigne()` dans
-- lib/data/contenu-site.ts).

insert into contenu_site (cle, valeur_fr, valeur_en, type) values
  ('soutien_chantiers_texte',    'À COMPLÉTER — description des chantiers suivis', 'À COMPLÉTER — description of ongoing restoration projects', 'texte'),
  ('soutien_adhesion_avantages', 'À COMPLÉTER — avantages de l''adhésion',          'À COMPLÉTER — membership benefits', 'texte'),
  ('soutien_don_usage',          'À COMPLÉTER — usage des dons',                    'À COMPLÉTER — how donations are used', 'texte');
