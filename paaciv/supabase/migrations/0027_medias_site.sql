-- Les douze photographies de la page d'accueil n'avaient aucun emplacement en
-- base : elles étaient codées en dur dans cinq composants, sous forme de liens
-- directs vers Wikimedia, SANS attribution ni licence — sur le site d'une
-- association patrimoniale. C'est ce manque, et non le stockage, qui motive
-- cette table.
--
-- Le bucket `patrimoine` porte le FICHIER, cette table porte la RÉFÉRENCE et
-- ses métadonnées. `lib/media.ts:imageUrl` résout déjà les deux formes : un
-- `chemin` relatif est résolu contre le bucket, une URL absolue est renvoyée
-- telle quelle. Les liens Wikimedia actuels et les futurs téléversements de
-- l'association peuvent donc cohabiter pendant toute la bascule, sans rupture
-- d'affichage et sans migration de données à orchestrer.
--
-- `emplacement` est une clé primaire textuelle SANS contrainte `check`, à la
-- différence de `patrimoine.etat_conservation` (0023). La différence est
-- délibérée : là-bas une valeur hors vocabulaire corrompait le filtrage, donc
-- la base devait la refuser ; ici le code lit des emplacements connus et
-- ignore le reste, une ligne orpheline est inerte. Ajouter un emplacement ne
-- doit pas coûter une migration.
--
-- Les noms suivent les préfixes de blocs déjà en usage dans `contenu_site`
-- (`parallaxe_`, `soutien_`, `raisons_`, `journal_`, `travail_`), pour que les
-- deux tables se lisent avec la même carte mentale.

create table medias_site (
  emplacement text primary key,
  -- Chemin dans le bucket `patrimoine`, ou URL absolue. `not null` : une ligne
  -- sans image n'a pas de raison d'exister — l'absence se dit en supprimant la
  -- ligne, et le composant retombe alors sur son visuel codé.
  chemin      text not null,
  -- `null` = image décorative (`alt=""`). C'est le cas juste pour neuf des
  -- douze : elles illustrent un bloc dont le texte porte déjà l'information.
  -- Un `alt` inventé serait du bruit pour un lecteur d'écran.
  alt_fr      text,
  alt_en      text,
  -- Auteur et licence. Séparés du crédit libre pour pouvoir, plus tard,
  -- afficher une licence en lien cliquable sans reparser une chaîne.
  credit      text,
  licence     text,
  licence_url text,
  updated_at  timestamptz not null default now()
);

alter table medias_site enable row level security;

-- Même patron que `contenu_site` (0016) : lecture publique, écriture admin.
-- Pas de colonne `statut` — une image est là ou elle n'y est pas.
create policy "medias_site select public"
  on medias_site for select to anon using (true);
create policy "medias_site all admin"
  on medias_site for all to authenticated using (true) with check (true);

-- Seed : les douze URL ACTUELLES, reprises telles quelles depuis les cinq
-- composants. L'écran ne bouge donc pas d'un pixel. Ce que la migration change,
-- c'est qu'il existe désormais un endroit où porter l'attribution — et que le
-- manque devient visible dans l'admin, au lieu d'être invisible dans le code.
--
-- `credit` et `licence` portent le marqueur « À COMPLÉTER » : tant qu'il y est,
-- `renseigne()` empêche la valeur d'atteindre le public (cf. lib/data/
-- contenu-site.ts). Rien n'est inventé ici : l'auteur et la licence de chaque
-- fichier Wikimedia doivent être relevés à la source, ou les photographies
-- remplacées par celles de l'association.
--
-- Les `alt` reprennent ceux du code. Ils y étaient écrits en français quelle
-- que soit la langue de la page ; les deux colonnes corrigent cela au passage.
insert into medias_site (emplacement, chemin, alt_fr, alt_en, credit, licence) values
  ('parallaxe_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Basilique%20notre%20Dame%20de%20la%20Paix%20de%20Yamoussoukro%2020.jpg?width=1800', 'Basilique Notre-Dame de la Paix, Yamoussoukro', 'Our Lady of Peace Basilica, Yamoussoukro', 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('soutien_en_danger_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/L''hopital%20colonial%20europeen%20(construit%20en%201905%2C%20il%20a%20ete%20le%201er%20hopital%20moderne%20en%20CI).jpg?width=900', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('soutien_adhesion_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/WikiConvFr23%20en%20Cote%20d''Ivoire%20visite%20B%C3%A2timents%20sites%20historiques%20de%20Grand-Bassam%2002.jpg?width=900', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('soutien_don_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Le%20Puits%20de%20la%20Mosqu%C3%A9e%20Dieng%201.jpg?width=900', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('raisons_1_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20des%20artistes%20plasticiens%20de%20Grand-Bassam.jpg?width=700', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('raisons_2_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Le%20Puits%20de%20la%20Mosqu%C3%A9e%20Dieng%201.jpg?width=700', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('raisons_3_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cath%C3%A9drale%20Saint-Paul%203.jpg?width=700', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('raisons_4_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Basilique%20notre%20Dame%20de%20la%20Paix%20de%20Yamoussoukro%204.jpg?width=700', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('raisons_5_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20du%20Resident%20(c''etait%20le%20logement%20du%20directeur%20de%20l''ecole%20regionale%20a%20l''epoque%20coloniale).jpg?width=700', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('journal_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Cathedrale%20St%20Paul%20Abidjan%201.jpg?width=1800', null, null, 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('travail_1_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Maison%20du%20Resident%20(c''etait%20le%20logement%20du%20directeur%20de%20l''ecole%20regionale%20a%20l''epoque%20coloniale).jpg?width=1100', 'Maison du Résident, Grand-Bassam', 'Maison du Résident, Grand-Bassam', 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence'),
  ('travail_2_image', 'https://commons.wikimedia.org/wiki/Special:FilePath/Int%C3%A9rieur%20Mosqu%C3%A9e%20Dieng%20%C3%A0%20Grand-Bassam.jpg?width=1100', 'Intérieur de la mosquée Dieng', 'Interior of the Dieng Mosque', 'À COMPLÉTER — auteur de la photographie', 'À COMPLÉTER — licence');
