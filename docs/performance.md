# Performance

*Mesures du 12 novembre 2026, sur `staging.paaciv.com`.*

## Ce qu'on vise

Un téléphone Android de milieu de gamme, en 4G lente, à Abidjan. Les cibles
viennent de l'exploration immersive (`docs/design-ref/exploration-immersive.md`,
§ 4) :

- l'image principale affichée en moins de **2,5 s** (LCP) ;
- **170 Ko** de JavaScript au plus par page, en gzip ;
- la 3D de l'éléphant chargée **après** le premier écran, et seulement sur un
  appareil capable.

## Comment mesurer

**Le poids chargé d'emblée**, page par page, comparé aux budgets :

```bash
cd paaciv
node scripts/mesure-poids.mjs --budgets https://staging.paaciv.com
```

Les budgets (`scripts/budgets-poids.json`) sont des **cliquets** : les valeurs
mesurées, plus une petite marge, pour qu'aucune page n'empire. Chaque gain doit
faire baisser le cliquet.

Ce contrôle ne tourne pas dans la CI : les pages lisent la vraie base, et la CI
n'a que des identifiants factices. Il fait partie de la vérification après
chaque déploiement (`docs/deploiement.md`).

**Le temps de chargement et les médias** : Chrome DevTools, onglet Performance,
avec « Slow 4G », processeur ralenti 4 fois, écran de 390 × 844 et cache vidé.
On regarde le LCP, puis la liste des requêtes : les vidéos et le modèle 3D ne
comptent pas dans le script ci-dessus.

## Résultats du 12 novembre 2026

**Accueil, en 4G lente sur téléphone :** LCP de 2,4 s, sans décalage de mise en
page (CLS 0) et avec une interaction rapide (INP 16 ms).

**JavaScript chargé d'emblée, en gzip :**

| Page | JS | Écart à la cible de 170 Ko |
|---|---|---|
| Accueil | 272 Ko | +102 Ko |
| À propos, Archive, Architectes | 254 à 256 Ko | +85 Ko environ |
| Fiche patrimoine, Carte | 497 à 500 Ko | +330 Ko (MapLibre) |

**Médias téléchargés sur l'accueil, sans défiler, sur téléphone :**

| Avant | Après correction |
|---|---|
| 6 Mo environ | 2,4 Mo, dont 1,1 Mo pour la vidéo du haut de page |

Deux causes, corrigées le jour même :

- **La galerie du film d'intro** (2,9 Mo) se téléchargeait en entier dès
  l'apparition du bouton « Commencer l'expérience », même sans clic. Elle ne
  lit plus que son début avant le clic (68 Ko en local, environ 500 Ko sur le
  staging, où Chrome met davantage en mémoire tampon), puis se lit pendant son
  téléchargement.
- **L'éléphant 3D** (1,2 Mo) partait dès l'arrivée sur la page, sa section
  étant juste sous le premier écran. Il ne se charge plus de lui-même que sur
  un grand écran à souris. Sur téléphone, l'image fixe et la légende restent,
  avec un bouton « Voir en 3D ».

## Ce qui reste

- **La vidéo du haut de page** (1,1 Mo en 720p) se charge sur téléphone,
  conformément à la décision du 7 novembre. Si l'accueil doit s'alléger encore,
  c'est le premier poste : ne la lancer que sur une bonne connexion, ou la
  réduire.
- **Le mode léger** ne se déclenche que si le navigateur annonce une connexion
  2G ou 3G, ou l'économiseur de données. Un téléphone en 4G lente se déclare
  « 4G » et ne l'active pas.
- **MapLibre sur les fiches** (environ 200 Ko) : à ne charger qu'à l'approche
  de la mini-carte.
- **Le JS commun** à toutes les pages (environ 250 Ko) : à analyser.
- **L'affiche du haut de page** sert la version de 1 600 px aux téléphones à
  écran dense, alors qu'une version plus petite suffirait (environ 170 Ko
  gaspillés selon Chrome).
- **Un vrai téléphone Android** reste à tester.
