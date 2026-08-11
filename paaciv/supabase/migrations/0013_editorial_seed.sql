-- Phase 4 · Seed éditorial de démonstration (articles, reportages, événements).
-- Rejouable : chaque insert utilise ON CONFLICT ... DO NOTHING.
-- Les dates d'événements sont relatives à current_date (jamais en dur) pour
-- que « à venir » / « passé » restent vrais quelle que soit la date d'exécution.

-- 1. Catégories d'articles -----------------------------------------------

insert into categories_article (id, nom_fr, nom_en, ordre) values
  ('histoires',   'Histoires',   'Stories',    1),
  ('temps-forts', 'Temps forts', 'Highlights', 2),
  ('archives',    'Archives',    'Archives',   3),
  ('livres',      'Livres',      'Books',      4)
on conflict (id) do nothing;

-- 2. Articles ---------------------------------------------------------------
-- pyramide-abidjan-histoire est publié, catégorie « histoires », lié à un
-- patrimoine publié (La Pyramide) ; article-brouillon est lié au même
-- patrimoine et sert de piège pour vérifier que le bloc « À lire » filtre
-- bien les brouillons.

insert into articles (
  slug, titre_fr, titre_en, chapo_fr, chapo_en, corps_fr, corps_en,
  categorie_id, patrimoine_id, date_publication, statut
) values
(
  'pyramide-abidjan-histoire',
  'La Pyramide d''Abidjan : histoire d''un chef-d''œuvre architectural',
  'The Pyramid of Abidjan: history of an architectural masterpiece',
  'Retour sur la conception et la construction de La Pyramide, symbole du Plateau abidjanais.',
  'A look back at the design and construction of La Pyramide, a landmark of Abidjan''s Plateau district.',
  '<p>Achevée en 1973, La Pyramide reste l''une des réalisations les plus audacieuses de l''architecture ivoirienne d''après l''indépendance.</p><p>Conçue par l''architecte italien Rinaldo Olivieri, elle devait accueillir un vaste marché sur plusieurs niveaux, prouesse rare pour l''époque.</p>',
  '<p>Completed in 1973, La Pyramide remains one of the boldest achievements of post-independence Ivorian architecture.</p><p>Designed by Italian architect Rinaldo Olivieri, it was meant to house a large multi-level market, a rare feat for its time.</p>',
  'histoires',
  (select id from patrimoine where slug = 'la-pyramide-abidjan'),
  (current_date - interval '10 days')::date,
  'publie'
),
(
  'portrait-cathedrale-saint-paul',
  'Cathédrale Saint-Paul : le geste architectural de Rinaldo Olivieri',
  'Saint-Paul Cathedral: Rinaldo Olivieri''s architectural gesture',
  'Portrait de la cathédrale qui domine la lagune Ébrié depuis 1985.',
  'A portrait of the cathedral overlooking the Ébrié lagoon since 1985.',
  '<p>La cathédrale Saint-Paul d''Abidjan frappe par sa silhouette évoquant un homme en prière tourné vers la lagune.</p>',
  '<p>Abidjan''s Saint-Paul Cathedral strikes visitors with a silhouette evoking a man in prayer facing the lagoon.</p>',
  'histoires',
  (select id from patrimoine where slug = 'cathedrale-saint-paul-abidjan'),
  (current_date - interval '25 days')::date,
  'publie'
),
(
  'un-siecle-architecture-ivoirienne',
  'Un siècle d''architecture ivoirienne en dix dates',
  'A century of Ivorian architecture in ten dates',
  'Les temps forts qui ont façonné le patrimoine bâti de Côte d''Ivoire.',
  'The highlights that shaped Côte d''Ivoire''s built heritage.',
  '<p>De l''époque coloniale aux grands chantiers post-indépendance, voici les jalons qui ont marqué l''architecture ivoirienne.</p>',
  '<p>From the colonial era to the major post-independence projects, here are the milestones that shaped Ivorian architecture.</p>',
  'temps-forts',
  null,
  (current_date - interval '40 days')::date,
  'publie'
),
(
  'archives-quartier-france-bassam',
  'Archives : le Quartier France de Grand-Bassam avant son classement',
  'Archives: Grand-Bassam''s Quartier France before its heritage listing',
  'Photographies et plans retrouvés dans les archives municipales.',
  'Photographs and plans recovered from the municipal archives.',
  '<p>Avant son inscription au patrimoine mondial de l''UNESCO en 2012, le Quartier France a connu plusieurs phases de transformation que ces archives documentent.</p>',
  '<p>Before its inscription on the UNESCO World Heritage list in 2012, the Quartier France went through several phases of transformation documented in these archives.</p>',
  'archives',
  (select id from patrimoine where slug = 'quartier-france-grand-bassam'),
  (current_date - interval '55 days')::date,
  'publie'
),
(
  'livre-patrimoine-architectural-cote-ivoire',
  'Un livre pour redécouvrir le patrimoine architectural de Côte d''Ivoire',
  'A book to rediscover Côte d''Ivoire''s architectural heritage',
  'Notre sélection d''ouvrages pour approfondir la connaissance du patrimoine bâti.',
  'Our selection of books for a deeper look at Ivorian built heritage.',
  '<p>Plusieurs ouvrages récents proposent un regard neuf sur l''architecture ivoirienne, entre héritage colonial et modernité post-indépendance.</p>',
  '<p>Several recent books offer a fresh look at Ivorian architecture, spanning colonial heritage and post-independence modernity.</p>',
  'livres',
  null,
  (current_date - interval '70 days')::date,
  'publie'
),
(
  'article-brouillon',
  'Article BROUILLON — ne pas publier',
  'DRAFT article — do not publish',
  'Contenu en cours de rédaction, non destiné au public.',
  'Content still being drafted, not intended for the public.',
  '<p>Ce brouillon sert de piège de test : il est lié au même patrimoine que l''article publié et ne doit jamais apparaître sur les pages publiques.</p>',
  '<p>This draft acts as a test trap: it is linked to the same patrimoine as the published article and must never appear on public pages.</p>',
  'histoires',
  (select id from patrimoine where slug = 'la-pyramide-abidjan'),
  current_date,
  'brouillon'
)
on conflict (slug) do nothing;

-- 3. Reportages vidéo ---------------------------------------------------
-- visite-basilique est lié au même patrimoine publié que l'article
-- pyramide-abidjan-histoire (exigence de la Task 10).

insert into reportages (
  slug, titre_fr, titre_en, video_url, description_fr, description_en,
  patrimoine_id, date, statut
) values
(
  'visite-basilique',
  'Immersion au cœur du patrimoine ivoirien — VIDÉO DE DÉMO',
  'Immersion in Ivorian heritage — DEMO VIDEO',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  '<p>Reportage vidéo de démonstration, à remplacer par le contenu final.</p>',
  '<p>Demo video report, to be replaced with final content.</p>',
  (select id from patrimoine where slug = 'la-pyramide-abidjan'),
  (current_date - interval '5 days')::date,
  'publie'
),
(
  'survol-hotel-ivoire',
  'Survol de l''Hôtel Ivoire — VIDÉO DE DÉMO',
  'Flying over Hôtel Ivoire — DEMO VIDEO',
  'https://youtu.be/eIho2S0ZahI',
  '<p>Reportage vidéo de démonstration, à remplacer par le contenu final.</p>',
  '<p>Demo video report, to be replaced with final content.</p>',
  (select id from patrimoine where slug = 'hotel-ivoire-abidjan'),
  (current_date - interval '20 days')::date,
  'publie'
),
(
  'reportage-brouillon',
  'Reportage en préparation — VIDÉO DE DÉMO (brouillon)',
  'Report in progress — DEMO VIDEO (draft)',
  'https://www.youtube.com/watch?v=xvFZjo5PgG0',
  '<p>Brouillon non publié, ne doit jamais apparaître sur les pages publiques.</p>',
  '<p>Unpublished draft, must never appear on public pages.</p>',
  null,
  current_date,
  'brouillon'
)
on conflict (slug) do nothing;

-- 4. Événements -----------------------------------------------------------
-- Dates calculées par rapport à current_date pour rester vraies dans le temps.

insert into evenements (
  slug, titre_fr, titre_en, description_fr, description_en, lieu,
  date_debut, date_fin, statut
) values
(
  'exposition-a-venir',
  'Exposition : regards sur le patrimoine ivoirien',
  'Exhibition: perspectives on Ivorian heritage',
  '<p>Une exposition photographique consacrée aux grands édifices du patrimoine architectural ivoirien.</p>',
  '<p>A photography exhibition dedicated to the great buildings of Ivorian architectural heritage.</p>',
  'Abidjan, Le Plateau',
  (current_date + interval '30 days')::date,
  (current_date + interval '37 days')::date,
  'publie'
),
(
  'conference-passee',
  'Conférence : sauvegarder le patrimoine architectural ivoirien',
  'Conference: safeguarding Ivorian architectural heritage',
  '<p>Une conférence réunissant architectes et historiens autour des enjeux de conservation.</p>',
  '<p>A conference bringing together architects and historians on conservation issues.</p>',
  'Yamoussoukro',
  (current_date - interval '60 days')::date,
  (current_date - interval '58 days')::date,
  'publie'
),
(
  'evenement-brouillon',
  'Journée portes ouvertes (brouillon)',
  'Open house day (draft)',
  '<p>Événement en préparation, non publié.</p>',
  '<p>Event in preparation, not published.</p>',
  'À déterminer',
  (current_date + interval '15 days')::date,
  null,
  'brouillon'
)
on conflict (slug) do nothing;
