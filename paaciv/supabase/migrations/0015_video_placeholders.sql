-- Phase 4 · Éditorial — vidéos de démonstration.
--
-- Deux corrections de données de démo :
--
-- 1. Le seed de la Phase 2 (0007_patrimoine_seed.sql) ne renseigne jamais
--    `video_url` sur `patrimoine`, alors que la fiche patrimoine doit pouvoir
--    afficher une façade vidéo. Sans donnée, ce chemin n'est couvert par aucun
--    test e2e.
--
-- 2. Le seed 0013 utilisait des identifiants de vraies vidéos YouTube choisies
--    au hasard (dont `dQw4w9WgXcQ`, le « Rickroll »). Du contenu tiers non
--    vérifié n'a rien à faire dans le seed d'un site de patrimoine : il
--    survivrait jusqu'en production si personne ne pensait à le remplacer.
--
-- On utilise donc des identifiants au format valide (11 caractères, acceptés
-- par extraireIdYoutube) mais manifestement factices. La miniature sera cassée
-- à l'affichage : c'est voulu — le contenu réel est à fournir par le client,
-- qui remplacera ces URLs dans le back-office.
--
-- Rejouable : chaque instruction est bornée par une condition.

update patrimoine
set video_url = 'https://www.youtube.com/watch?v=PAACIVdemo1'
where slug = 'basilique-yamoussoukro'
  and video_url is null;

update reportages
set video_url = 'https://www.youtube.com/watch?v=PAACIVdemo2'
where slug = 'visite-basilique'
  and video_url <> 'https://www.youtube.com/watch?v=PAACIVdemo2';

-- Conserve la forme courte youtu.be : le parseur doit rester exercé sur les
-- deux formes d'URL (cf. tests/db/data-reportages.spec.ts, tâche 7).
update reportages
set video_url = 'https://youtu.be/PAACIVdemo3'
where slug = 'survol-hotel-ivoire'
  and video_url <> 'https://youtu.be/PAACIVdemo3';

update reportages
set video_url = 'https://www.youtube.com/watch?v=PAACIVdemo4'
where slug = 'reportage-brouillon'
  and video_url <> 'https://www.youtube.com/watch?v=PAACIVdemo4';
