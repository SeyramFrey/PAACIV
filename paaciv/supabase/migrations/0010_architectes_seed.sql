-- Phase 3 · Seed de démonstration : architectes (ivoiriens & étrangers) + liaisons
-- avec le patrimoine existant (0007_patrimoine_seed.sql). Idempotent via slug unique
-- (architectes) et clé primaire composite (patrimoine_architecte).

insert into architectes
 (slug, nom, origine, annee_naissance, periode_texte, bio_fr, bio_en, statut, ordre)
values
 ('aka-adjo',          'Aka Adjo',            'ivoirien', 1935, 'XXᵉ s.',
  '<p>Pionnier de l''architecture moderne ivoirienne.</p>',
  '<p>Pioneer of modern Ivorian architecture.</p>', 'publie', 1),
 ('goly-kouassi',      'Michel Goly Kouassi', 'ivoirien', 1940, 'XXᵉ s.',
  '<p>Figure de la génération post-indépendance.</p>',
  '<p>Figure of the post-independence generation.</p>', 'publie', 2),
 ('jean-leon',         'Jean Léon',           'ivoirien', 1955, 'XXᵉ s.',
  '<p>Architecte de nombreux édifices publics.</p>',
  '<p>Architect of many public buildings.</p>', 'publie', 3),
 ('pierre-fakhoury',   'Pierre Fakhoury',     'ivoirien', 1943, 'XXᵉ–XXIᵉ s.',
  '<p>Concepteur de la Basilique de Yamoussoukro.</p>',
  '<p>Designer of the Yamoussoukro Basilica.</p>', 'publie', 4),
 ('henri-chomette',    'Henri Chomette',      'etranger', 1921, 'XXᵉ s.',
  '<p>Architecte français actif en Afrique de l''Ouest.</p>',
  '<p>French architect active in West Africa.</p>', 'publie', 1),
 ('rinaldo-olivieri',  'Rinaldo Olivieri',    'etranger', 1931, 'XXᵉ s.',
  '<p>Auteur de la Pyramide d''Abidjan.</p>',
  '<p>Author of the Pyramid of Abidjan.</p>', 'publie', 2),
 -- Ligne brouillon : garantit que le test « le public ne voit que les publiés »
 -- est réellement discriminant (sinon vacuously true en l'absence de brouillon).
 ('architecte-brouillon', 'Amara Koffi',      'ivoirien', 1960, 'XXᵉ s.',
  '<p>Fiche en cours de rédaction.</p>',
  '<p>Profile currently being drafted.</p>', 'brouillon', 5)
on conflict (slug) do nothing;

-- Liaisons publiées (architecte publié ↔ patrimoine publié) : visibles du public.
-- Liaisons « pièges » (architecte brouillon ou patrimoine brouillon) : doivent
-- rester invisibles du public — couvre le prédicat AND de la policy RLS
-- « patarch select public » sur les deux branches.
insert into patrimoine_architecte (patrimoine_id, architecte_id, role)
select p.id, a.id, 'architecte'
from patrimoine p, architectes a
where (p.slug, a.slug) in (
  ('basilique-yamoussoukro',           'pierre-fakhoury'),      -- publié ↔ publié → visible
  ('la-pyramide-abidjan',              'rinaldo-olivieri'),     -- publié ↔ publié → visible
  ('aeroport-felix-houphouet-boigny',  'jean-leon'),            -- patrimoine brouillon → invisible
  ('hotel-ivoire-abidjan',             'architecte-brouillon')  -- architecte brouillon → invisible
)
on conflict (patrimoine_id, architecte_id) do nothing;
