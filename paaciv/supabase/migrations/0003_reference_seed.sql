-- Phase 1 · Données de référence (seed)
-- Valeurs exactes de la spec §11. Idempotent : `on conflict do nothing` permet
-- de rejouer la migration sans erreur si les lignes existent déjà.

insert into types (id,nom_fr,nom_en,icone,couleur,ordre) values
 ('batiment','Bâtiment','Building','batiment','#B5581F',1),
 ('religieux','Édifice religieux','Religious building','religieux','#8A3E1B',2),
 ('monument','Monument / mémorial','Monument / memorial','monument','#D9A441',3),
 ('site','Site','Site','site','#46603F',4),
 ('lieu_culturel','Lieu culturel','Cultural venue','lieu_culturel','#7A5B8A',5),
 ('ensemble','Ensemble / quartier','Ensemble / district','ensemble','#3F6B63',6),
 ('ouvrage','Ouvrage d''art','Engineering structure','ouvrage','#5E6B8A',7)
on conflict (id) do nothing;

insert into programmes (id,nom_fr,nom_en,ordre) values
 ('residentiel','Résidentiel','Residential',1),
 ('administratif','Administratif','Administrative',2),
 ('hotelier','Hôtelier','Hospitality',3),
 ('religieux','Religieux','Religious',4),
 ('sanitaire','Sanitaire','Healthcare',5),
 ('culturel','Culturel','Cultural',6),
 ('sportif','Sportif','Sports',7),
 ('industriel','Industriel / logistique / agricole','Industrial / logistics / agricultural',8),
 ('aeroportuaire','Infrastructure aéroportuaire','Airport infrastructure',9),
 ('ouvrage_art','Ouvrage d''art','Engineering structure',10)
on conflict (id) do nothing;

insert into districts (id,nom_fr,nom_en,ordre) values
 ('abidjan','Abidjan','Abidjan',1),
 ('yamoussoukro','Yamoussoukro','Yamoussoukro',2),
 ('bas_sassandra','Bas-Sassandra','Bas-Sassandra',3),
 ('comoe','Comoé','Comoé',4),
 ('denguele','Denguélé','Denguélé',5),
 ('goh_djiboua','Gôh-Djiboua','Gôh-Djiboua',6),
 ('lacs','Lacs','Lacs',7),
 ('lagunes','Lagunes','Lagunes',8),
 ('montagnes','Montagnes','Montagnes',9),
 ('sassandra_marahoue','Sassandra-Marahoué','Sassandra-Marahoué',10),
 ('savanes','Savanes','Savanes',11),
 ('vallee_bandama','Vallée du Bandama','Bandama Valley',12),
 ('woroba','Woroba','Woroba',13),
 ('zanzan','Zanzan','Zanzan',14)
on conflict (id) do nothing;

insert into epoques (id,nom_fr,nom_en,borne,couleur,ordre) values
 ('precolonial','Précolonial','Pre-colonial','avant 1893','#46603F',1),
 ('colonial','Colonial','Colonial','1893–1960','#B5581F',2),
 ('post_independance','Post-indépendance','Post-independence','depuis 1960','#D9A441',3)
on conflict (id) do nothing;
