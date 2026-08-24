# Brief visuel PAACIV — ce dont le site a besoin

*État au 24 août 2026, après la refonte « Matières ».*

Ce document liste **exactement** les images dont le site a besoin, emplacement par
emplacement : le format, le cadrage, ce qu'il faut y voir, et ce qu'il ne faut
surtout pas y mettre. Il est écrit pour être donné tel quel à un·e photographe.

Trois règles valent partout, et elles priment sur le reste :

1. **Aucune image sans crédit.** Le site reproche publiquement à ses propres
   photographies de n'être pas créditées ; livrer une image sans nom d'auteur ni
   licence rouvre le problème. Chaque fichier arrive avec : auteur, année, lieu,
   licence (ou « © PAACIV, tous droits réservés »).
2. **Format de livraison** : JPEG qualité 85 ou WebP, profil **sRGB**, sans
   filigrane, sans retouche de couleur marquée. Le site applique lui-même son
   traitement (voir « Le duotone » plus bas) ; une image déjà virée sépia ou
   fortement contrastée s'accumulerait avec.
3. **Nommage** : `slug-de-la-fiche-01.jpg`, `slug-de-la-fiche-02.jpg`… en
   commençant par la vue qui doit servir de couverture.

---

## 1. Urgent — les sept fiches de patrimoine

**C'est le manque le plus visible du site.** Les sept fiches publiées partagent
aujourd'hui **la même photographie**, un cliché générique d'Unsplash sans rapport
avec la Côte d'Ivoire. On la voit sept fois dans la grille de l'archive, trois
fois sur les vignettes de commune, et sur chaque fiche ouverte.

Pour **chacun** des sept édifices : **3 à 6 vues**, dont une désignée couverture.

| # | Édifice | Ville |
|---|---|---|
| 1 | Hôtel Ivoire | Abidjan (Cocody) |
| 2 | La Pyramide (Rinaldo Olivieri) | Abidjan (Plateau) |
| 3 | Cathédrale Saint-Paul | Abidjan (Plateau) |
| 4 | Stade Félix-Houphouët-Boigny | Abidjan (Plateau) |
| 5 | Pont Félix-Houphouët-Boigny | Abidjan |
| 6 | Quartier France | Grand-Bassam |
| 7 | Basilique Notre-Dame-de-la-Paix | Yamoussoukro |

### Spécifications

- **Résolution** : côté long **≥ 2400 px**. La couverture est recadrée en **4:3**
  dans la grille et en **16:10** dans la galerie de la fiche — donc **laisser de
  l'air en haut et en bas**, un sujet cadré au ras des bords perd sa tête dans
  l'un des deux recadrages.
- **La vue de couverture** doit être lisible **en vignette de 380 px de large** :
  une silhouette nette, un sujet qui occupe la moitié du cadre, pas un plan
  d'ensemble où le bâtiment fait 10 % de l'image.

### Ce qu'il faut dans la série de chaque édifice

1. **Une vue d'ensemble frontale** — la silhouette, celle qu'on reconnaît. C'est
   la couverture.
2. **Un angle de trois-quarts** — qui donne le volume et la profondeur.
3. **Un détail de matière** — l'appareillage, le béton brut, la ferronnerie, la
   claustra, le carrelage. C'est ce qui manque partout et c'est ce qui fait la
   différence entre un site de patrimoine et un répertoire d'adresses.
4. **Le cas échéant, l'état** — pour *La Pyramide* et le *Quartier France*, tous
   deux marqués « en danger », une vue qui **montre** la dégradation : béton
   éclaté, toiture ouverte, végétation qui reprend. Sans cette image, la mention
   « en danger » reste une étiquette abstraite.

### Ce qu'il ne faut pas

- Pas de personnes reconnaissables au premier plan (droit à l'image).
- Pas de ciel entièrement blanc surexposé : le site pose un traitement duotone au
  repos, et un ciel cramé y devient une tache.
- Pas de photo de nuit pour la couverture (illisible en vignette).

---

## 2. Les trois vignettes de commune

Les pages `/villes/abidjan`, `/villes/grand-bassam`, `/villes/yamoussoukro`
prennent aujourd'hui, faute de mieux, l'image de leur première fiche. Une **vue
urbaine** dirait bien mieux ce qu'est la commune.

- **Format** : **16:10**, ≥ 2000 × 1250 px.
- **Sujet** : un plan large qui donne le **tissu urbain**, pas un monument isolé
  — une rue de Grand-Bassam avec ses maisons à galerie alignées, la ligne du
  Plateau depuis la lagune, l'axe de Yamoussoukro. Un point de vue élevé
  fonctionne bien.
- **Cadrage** : sujet centré verticalement ; le titre de la commune est écrit
  **sous** l'image, pas dessus, donc pas besoin de zone calme.

---

## 3. Les douze images de la page d'accueil

Elles existent déjà mais viennent de Wikimedia Commons et sont publiées **sans
nom d'auteur ni licence**. Deux issues, au choix par emplacement : soit vous
renseignez le crédit et la licence dans `/admin/medias`, soit vous téléversez une
photographie de l'association.

| Emplacement | Rôle sur la page | Format utile | Contrainte de cadrage |
|---|---|---|---|
| `parallaxe_image` | Bandeau plein écran « Confier une archive » | **21:9**, ≥ 2800 px de large | Du **texte clair est posé au centre** : il faut une zone calme et plutôt sombre au milieu |
| `journal_image` | Panneau du bloc Journal | **3:4** vertical, ≥ 1400 px | Sujet dans le tiers haut |
| `travail_1_image`, `travail_2_image` | Deux colonnes « Notre travail » | **4:5** vertical, ≥ 1400 px | — |
| `raisons_1` à `raisons_5_image` | **Losanges** (carrés tournés à 45°) | **carré**, ≥ 1200 × 1200 px | Le cadre est pivoté : **le sujet doit tenir dans le cercle inscrit**, les quatre coins sont coupés |
| `soutien_adhesion_image`, `soutien_don_image`, `soutien_en_danger_image` | Cartes d'appel au soutien | **4:5** vertical, ≥ 1200 px | Un titre blanc est posé **en bas** : bas de l'image plutôt sombre et calme |

Le losange des « cinq raisons » est le piège le plus fréquent : une photo cadrée
serré y perd ses quatre angles.

---

## 4. Le hero de l'accueil

Le hero passe en revue les fiches de patrimoine ; il se sert donc des images du
point 1. Deux exigences supplémentaires pour les **couvertures**, puisqu'elles
peuvent y atterrir :

- Elles sont affichées **plein écran, hauteur totale de la fenêtre**, donc
  recadrées très verticalement sur mobile. Un sujet centré horizontalement
  survit ; un sujet collé à un bord disparaît.
- Un voile sombre est posé du haut vers le bas et le titre s'écrit en bas à
  gauche : **le tiers inférieur gauche doit rester peu détaillé**.

---

## 5. Photographies anciennes — la seule chose qui manque vraiment au propos

Le site sait maintenant afficher une **frise chronologique** qui remonte à
1870. Elle est, pour l'instant, illustrée uniquement par des photographies
contemporaines. Une archive du patrimoine qui ne montre que l'état actuel ne peut
pas montrer ce qui a changé — et c'est exactement ce que l'association veut
montrer.

Ce qui serait précieux, par ordre d'utilité :

1. **Des vues anciennes des sept édifices** — chantier, inauguration, premières
   décennies. Même de qualité médiocre : un tirage scanné à 1200 px vaut mieux
   que rien.
2. **Le Quartier France de Grand-Bassam avant/après**, à cadrage identique si
   possible. C'est l'image qui porterait à elle seule le propos du site.
3. **Des édifices démolis.** Aucune fiche n'est marquée « démoli » aujourd'hui,
   faute de documentation. Une seule photographie d'un bâtiment disparu, avec sa
   date et son adresse, ouvrirait la rubrique.

**Format** : scan à **300 dpi minimum**, non retouché, non détouré, non
« restauré ». Le site applique lui-même un duotone qui unifie les tirages ; une
image déjà colorisée s'y accumulerait.

**À fournir avec chaque scan** : la date (même approximative), le lieu exact, et
le **détenteur des droits** — c'est le point qui bloque le plus souvent la
publication d'un fonds ancien.

---

## 6. Le motif tissé — une décision à prendre, pas une image à fournir

Les séparateurs de section portent désormais une trame géométrique inspirée du
**principe** du tissage aux bandes ouest-africain : losanges à 45°, coutures
verticales. Elle ne cite **aucun motif existant**, et c'est délibéré — les
dessins du pagne baoulé, du kita ou des toiles sénoufo portent chacun un nom et
un propriétaire, et en reproduire un sans crédit serait exactement la faute que
le site reproche à ses propres photographies.

**Si l'association obtient le droit d'utiliser un motif précis**, il remplacera
celui-ci et sera crédité. Il faudrait alors :

- Le **nom** du motif, son **origine** (peuple, région) et son **sens**, s'il en
  a un — c'est ce qui sera écrit dans le crédit.
- L'accord écrit du ou des ayants droit.
- Un **relevé au trait**, en SVG ou en dessin vectoriel propre, d'**un seul
  motif répétable** (une tuile). Pas une photographie de pagne : le motif est
  affiché à très faible opacité, en trait fin, et une photo y devient une bouillie
  grise.

En l'absence de cet accord, la géométrie générique actuelle reste en place et ne
pose aucun problème. **Ce n'est pas un blocage.**

---

## 7. Ce dont le site n'a *pas* besoin

Pour éviter du travail inutile :

- **Les pictogrammes de typologie** (tour à torons des mosquées du Nord, façade
  à galerie, tablier de pont…) sont dessinés en interne, en SVG, dans
  `components/ui/PictoType.tsx`. Rien à fournir.
- **La carte du pays et les quatorze districts** sont vectoriels, tracés depuis
  les données geoBoundaries. Rien à fournir.
- **Le logo et l'emblème** sont en place.
- **Les textures** (grain de papier, filets d'inventaire, duotone) sont générées
  en CSS. Aucun fichier image.

---

## Le duotone, pour comprendre le rendu

Les vignettes d'archive et de commune sont affichées **au repos** dans un duotone
qui ramène toutes les photographies aux deux mêmes bornes — une ombre bleu-nuit
prise à la tôle des toitures, une lumière crème prise à la chaux de Grand-Bassam.
**La couleur revient au survol** et au focus clavier.

C'est ce qui permet à des tirages anciens, des scans de presse et des clichés
récents de tenir dans la même grille sans donner un patchwork. Deux conséquences
pour la prise de vue :

- **La couleur d'origine compte peu** dans la vignette ; c'est le **contraste** et
  la **silhouette** qui portent l'image.
- Une photo déjà virée ou fortement teintée passe deux fois dans le même
  traitement. **Livrer neutre.**

Pour revenir à des vignettes en couleur permanente, il suffit de retirer une
classe CSS — c'est documenté dans `components/patrimoine/CartePatrimoine.tsx`.

---

## Récapitulatif — par ordre de priorité

| Priorité | Quoi | Volume |
|---|---|---|
| **1** | Photos des 7 édifices, 3 à 6 vues chacun | ~30 images |
| **2** | Crédits et licences des 12 images de l'accueil (ou leur remplacement) | 12 lignes à renseigner |
| **3** | 3 vues urbaines pour les pages de commune | 3 images |
| **4** | Photographies anciennes, avant/après, édifices démolis | tout ce qui existe |
| **5** | Motif de tissage sous licence, si accord obtenu | 1 tuile SVG |
