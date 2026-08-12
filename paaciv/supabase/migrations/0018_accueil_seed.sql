-- Phase 5 · Seed de la page d'accueil. Textes repris de la référence de
-- design ; toute valeur factuelle inventée par celle-ci (adresse, téléphone,
-- montant d'adhésion, moyens de paiement) est marquée « À COMPLÉTER » et
-- doit être renseignée par l'association avant mise en ligne (spec §8).

insert into contenu_site (cle, valeur_fr, valeur_en, type) values
  ('hero_titre',           'Ce qui tient debout raconte encore', 'What still stands still speaks', 'texte'),
  ('hero_intro',           'Nous documentons, photographions et inventorions le patrimoine bâti ivoirien — des maisons à galeries de Grand-Bassam aux mosquées de terre du Nord. Une archive ouverte, tenue par une association.', 'We document, photograph and inventory Ivorian built heritage — from the veranda houses of Grand-Bassam to the earthen mosques of the North. An open archive, kept by an association.', 'texte'),
  ('association_surtitre', 'L''association', 'The association', 'texte'),
  ('association_titre',    'Une archive tenue à la main, bâtiment par bâtiment', 'An archive kept by hand, building by building', 'texte'),
  ('association_texte',    'PAACIV réunit des architectes, des photographes, des historiens et des habitants autour d''un même travail : relever, dater et publier ce qui reste du patrimoine bâti national, du poste colonial à la case à impluvium, de la mosquée de terre à l''école des années 1960.', 'PAACIV brings together architects, photographers, historians and residents around a single task: surveying, dating and publishing what remains of the national built heritage.', 'texte'),
  ('travail_surtitre',     'Notre travail', 'Our work', 'texte'),
  ('travail_titre',        'Documenter avant que la pluie ne s''en charge', 'Documenting before the rain does it for us', 'texte'),
  ('travail_texte',        'Une maison à galerie perd sa toiture en une saison des pluies. Nos équipes relèvent les façades, photographient les décors, notent les matériaux et recueillent la parole des occupants. Chaque fiche entre dans une base publique, consultable par les mairies, les étudiants et les propriétaires.', 'A veranda house loses its roof in a single rainy season. Our teams survey façades, photograph ornament, record materials and gather the words of those who live there.', 'texte'),
  ('travail_releve_titre', 'Relevé', 'Survey', 'texte'),
  ('travail_releve_texte', 'Plans, coupes, matériaux.', 'Plans, sections, materials.', 'texte'),
  ('travail_recit_titre',  'Récit', 'Account', 'texte'),
  ('travail_recit_texte',  'Entretiens, archives familiales.', 'Interviews, family archives.', 'texte'),
  ('pourquoi_titre',       'Pourquoi nous suivre ?', 'Why follow us?', 'texte'),
  ('activites_surtitre',   'Nos activités', 'Our activities', 'texte'),
  ('activites_titre',      'Ce que nous faisons', 'What we do', 'texte'),
  ('activites_intro',      'Quatre chantiers permanents, ouverts aux adhérents comme aux curieux.', 'Four ongoing programmes, open to members and to the merely curious.', 'texte'),
  ('carte_surtitre',       'Le territoire', 'The territory', 'texte'),
  ('carte_titre',          'Chaque édifice à sa place', 'Every building in its place', 'texte'),
  ('carte_texte',          'Toutes les fiches publiées sont géolocalisées. La carte se parcourt par type, par programme, par district et par époque.', 'Every published record is geolocated. The map can be browsed by type, programme, district and period.', 'texte'),
  ('raisons_surtitre',     'Raisons', 'Reasons', 'texte'),
  ('raisons_titre',        'Cinq raisons de regarder ces bâtiments de près', 'Five reasons to look closely at these buildings', 'texte'),
  ('agenda_surtitre',      'Agenda', 'Calendar', 'texte'),
  ('agenda_titre',         'Prochaines visites', 'Upcoming visits', 'texte'),
  ('parallaxe_texte',      'Vous détenez des plans, des photographies, des archives de famille ?', 'Do you hold plans, photographs, family archives?', 'texte'),
  ('archive_surtitre',     'Collections', 'Collections', 'texte'),
  ('archive_titre',        'Archive photographique', 'Photographic archive', 'texte'),
  ('temoignages_surtitre', 'Paroles', 'Voices', 'texte'),
  ('temoignages_titre',    'Ils travaillent avec nous', 'They work with us', 'texte'),
  ('journal_surtitre',     'Journal', 'Journal', 'texte'),
  ('journal_titre',        'Ce que nous publions', 'What we publish', 'texte'),
  ('newsletter_titre',     'Recevoir nos relevés', 'Receive our surveys', 'texte'),
  ('newsletter_texte',     'Une lettre par mois : nouvelles fiches, chantiers en cours, dates de visites.', 'One letter a month: new records, work in progress, visit dates.', 'texte'),
  ('footer_description',   'Patrimoine Architectural et des Arts de Côte d''Ivoire. Association déclarée, Abidjan.', 'Architectural and Arts Heritage of Côte d''Ivoire. Registered association, Abidjan.', 'texte'),
  -- Valeurs factuelles : à renseigner par l'association (spec §8).
  ('footer_adresse',       'À COMPLÉTER — adresse postale', 'À COMPLÉTER — postal address', 'texte'),
  ('footer_telephone',     'À COMPLÉTER — téléphone', 'À COMPLÉTER — phone', 'texte'),
  ('footer_email',         'À COMPLÉTER — adresse de contact', 'À COMPLÉTER — contact address', 'texte'),
  ('soutien_adhesion_montant', 'À COMPLÉTER — montant de l''adhésion annuelle', 'À COMPLÉTER — annual membership fee', 'texte'),
  ('soutien_paiement',     'À COMPLÉTER — coordonnées bancaires, Wave, Orange Money', 'À COMPLÉTER — bank details, Wave, Orange Money', 'texte');

insert into points_cles (bloc, titre_fr, titre_en, texte_fr, texte_en, ordre, statut) values
  ('pourquoi', 'Un inventaire ouvert',      'An open inventory',      'Toutes les fiches sont publiques et téléchargeables, sans compte ni abonnement.', 'Every record is public and downloadable, with no account or subscription.', 1, 'publie'),
  ('pourquoi', 'Des relevés rigoureux',     'Rigorous surveys',       'Protocole commun, datation croisée avec les archives nationales et les familles.', 'A shared protocol, dating cross-checked against national archives and families.', 2, 'publie'),
  ('pourquoi', 'Un réseau de bénévoles',    'A volunteer network',    'Des correspondants dans plusieurs villes, formés au relevé et à la photographie.', 'Correspondents in several towns, trained in surveying and photography.', 3, 'publie'),
  ('pourquoi', 'Une mémoire partagée',      'A shared memory',        'Les habitants racontent leurs maisons ; leurs récits accompagnent les images.', 'Residents tell the story of their houses; their accounts accompany the images.', 4, 'publie'),
  ('raisons',  'Grand-Bassam',              'Grand-Bassam',           'Inscrite au patrimoine mondial depuis 2012. Sa ville coloniale et le village N''zima s''y répondent rue par rue.', 'A World Heritage Site since 2012. Its colonial town and the N''zima village answer each other street by street.', 1, 'publie'),
  ('raisons',  'Les mosquées soudanaises',  'The Sudanese mosques',   'Huit mosquées de style soudanais du Nord ivoirien ont rejoint la liste en 2021 : terre crue, contreforts, charpentes saillantes.', 'Eight Sudanese-style mosques of northern Côte d''Ivoire joined the list in 2021: raw earth, buttresses, projecting timbers.', 2, 'publie'),
  ('raisons',  'La maison à galerie',       'The veranda house',      'Ce n''est pas qu''un décor colonial : sa véranda, sa ventilation et son sol surélevé répondent au climat lagunaire.', 'Not merely colonial decor: its veranda, ventilation and raised floor answer the lagoon climate.', 3, 'publie'),
  ('raisons',  'Le moderne ivoirien',       'Ivorian modernism',      'L''architecture des années 1960-1980 appartient déjà à l''histoire et reste très peu documentée.', 'The architecture of the 1960s to 1980s already belongs to history and remains very poorly documented.', 4, 'publie'),
  ('raisons',  'La transmission des gestes','Passing on the craft',   'Un enduit de terre se refait chaque année. Sans transmission des gestes, le bâtiment disparaît avant le souvenir qu''on en a.', 'An earthen render is redone every year. Without the craft being passed on, the building vanishes before the memory of it.', 5, 'publie'),
  -- Brouillon piège : rend discriminant le test RLS de la Task 4. S'il
  -- apparaissait côté public, la policy serait cassée.
  ('raisons',  'Raison en brouillon',       'Draft reason',           'Ne doit jamais apparaître côté public.', 'Must never appear publicly.', 99, 'brouillon');

insert into activites (titre_fr, titre_en, cadence_fr, cadence_en, description_fr, description_en, cta_libelle_fr, cta_libelle_en, cta_href, ordre, statut) values
  ('Inventaire photographique', 'Photographic inventory', 'Toute l''année', 'All year round', 'Campagnes régulières à Grand-Bassam, Abidjan et Bondoukou. Chaque bâtiment reçoit une fiche : datation, matériaux, état, propriétaires successifs.', 'Regular campaigns in Grand-Bassam, Abidjan and Bondoukou. Each building receives a record: dating, materials, condition, successive owners.', 'Consulter', 'Browse', '/archives', 1, 'publie'),
  ('Visites guidées', 'Guided walks', 'Deux samedis par mois', 'Two Saturdays a month', 'Deux heures de marche commentée entre la lagune et l''océan, de la Maison du Résident au palais royal N''zima. Groupes de quinze personnes.', 'Two hours of guided walking between lagoon and ocean, from the Resident''s House to the N''zima royal palace. Groups of fifteen.', 'Voir l''agenda', 'See the calendar', '/evenements', 2, 'publie'),
  ('Publications', 'Publications', 'Deux titres par an', 'Two titles a year', 'Un cahier annuel de relevés, plus des monographies courtes consacrées à un édifice.', 'An annual book of surveys, plus short monographs devoted to a single building.', 'Lire', 'Read', '/articles', 3, 'publie'),
  ('Formations à la terre crue', 'Earth building workshops', 'Sessions à Kong et Tengréla', 'Sessions in Kong and Tengréla', 'Cinq jours avec les maçons des mosquées du Nord : préparation du banco, pose des torons, réfection des contreforts avant la saison des pluies.', 'Five days with the masons of the northern mosques: preparing banco, setting the timbers, repairing buttresses before the rains.', 'Nous écrire', 'Contact us', '#contact', 4, 'publie');

-- `temoignages` reste VOLONTAIREMENT vide. Les quatre paroles de la référence
-- de design sont des personnes nommées, avec rôle et citation attribuée :
-- les seeder reviendrait à fabriquer de faux témoignages, avec le risque
-- qu'ils partent en production tels quels. Le bloc ne s'affiche pas tant que
-- la table est vide (spec §4.4).
