-- Phase 2 · Seed de démonstration. Contenus génériques + images libres de droit
-- (placeholders remplaçables dans l'admin). Idempotent via slug unique.
insert into patrimoine
 (slug, titre_fr, titre_en, resume_fr, resume_en, type_id, programme_id,
  date_texte, annee_debut, epoque_id, style_fr, lat, lng, district_id, ville, statut)
values
 ('cathedrale-saint-paul-abidjan','Cathédrale Saint-Paul d''Abidjan','St Paul''s Cathedral, Abidjan',
  'Cathédrale moderne du Plateau, silhouette en voile de béton.','Modernist cathedral of the Plateau district.',
  'religieux','religieux','1985',1985,'post_independance','Moderne',5.3247,-4.0206,'abidjan','Abidjan','publie'),
 ('la-pyramide-abidjan','La Pyramide','La Pyramide',
  'Immeuble emblématique de Rinaldo Olivieri au Plateau.','Rinaldo Olivieri''s landmark building in the Plateau.',
  'batiment','administratif','1973',1973,'post_independance','Brutaliste',5.3268,-4.0179,'abidjan','Abidjan','publie'),
 ('hotel-ivoire-abidjan','Hôtel Ivoire','Hotel Ivoire',
  'Complexe hôtelier moderniste de Cocody.','Modernist hotel complex in Cocody.',
  'batiment','hotelier','1963',1963,'post_independance','Moderne',5.3226,-3.9975,'abidjan','Abidjan','publie'),
 ('basilique-yamoussoukro','Basilique Notre-Dame de la Paix','Our Lady of Peace Basilica',
  'Plus grande basilique du monde, à Yamoussoukro.','The world''s largest basilica, in Yamoussoukro.',
  'religieux','religieux','1990',1990,'post_independance','Néo-classique',6.8100,-5.2986,'yamoussoukro','Yamoussoukro','publie'),
 ('quartier-france-grand-bassam','Quartier France de Grand-Bassam','Grand-Bassam French Quarter',
  'Ensemble colonial classé au patrimoine mondial.','Colonial ensemble, UNESCO World Heritage.',
  'ensemble','administratif','fin XIXᵉ – début XXᵉ',1893,'colonial','Colonial',5.1996,-3.7386,'comoe','Grand-Bassam','publie'),
 ('stade-felix-houphouet-boigny','Stade Félix Houphouët-Boigny','Félix Houphouët-Boigny Stadium',
  'Stade historique du Plateau.','Historic stadium in the Plateau.',
  'batiment','sportif','1964',1964,'post_independance','Moderne',5.3186,-4.0206,'abidjan','Abidjan','publie'),
 ('pont-felix-houphouet-boigny','Pont Félix Houphouët-Boigny','Félix Houphouët-Boigny Bridge',
  'Ouvrage reliant le Plateau à Treichville.','Bridge linking the Plateau to Treichville.',
  'ouvrage','ouvrage_art','1957',1957,'colonial','Ouvrage d''art',5.3111,-4.0164,'abidjan','Abidjan','publie'),
 ('aeroport-felix-houphouet-boigny','Aéroport Félix Houphouët-Boigny','Félix Houphouët-Boigny Airport',
  'Principal aéroport international du pays.','The country''s main international airport.',
  'batiment','aeroportuaire','1970',1970,'post_independance','Moderne',5.2614,-3.9263,'abidjan','Abidjan','brouillon')
on conflict (slug) do nothing;

-- Une image principale par patrimoine (placeholder libre de droit).
insert into images (patrimoine_id, chemin, credit, ordre, est_principale)
select p.id,
       'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=60',
       'Placeholder — Unsplash', 0, true
from patrimoine p
where p.slug in (
  'cathedrale-saint-paul-abidjan','la-pyramide-abidjan','hotel-ivoire-abidjan',
  'basilique-yamoussoukro','quartier-france-grand-bassam',
  'stade-felix-houphouet-boigny','pont-felix-houphouet-boigny','aeroport-felix-houphouet-boigny'
)
and not exists (select 1 from images i where i.patrimoine_id = p.id);
