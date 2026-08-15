# PAACIV — Page d'accueil « Ce qui tient debout »
## Document de conception (spec)

**Date :** 2026-08-12
**Phase :** 5 — Accueil, contenus éditables, newsletter & soutien
**Statut :** Validé pour rédaction du plan d'implémentation
**Référence visuelle :** `docs/design-ref/Accueil PAACIV.dc.html` (design fourni par Claude Design)

---

## 1. Contexte

Un design complet de page d'accueil a été fourni : un one-pager de 16 blocs, animé,
en mode sombre par défaut. Il est adopté tel quel sur le plan visuel et structurel,
à deux exceptions près (couleurs, polices — voir §2).

Le design est un **prototype statique** : tous ses liens sont des ancres (`#archive`,
`#agenda`…), aucun ne mène à une vraie route ; tous ses contenus sont inventés
(« 1 240 fiches », « 15 000 F CFA », témoignages signés, adresse et téléphone).
Le travail consiste à conserver son apparence à l'identique tout en remplaçant
sa mécanique par du réel : routes, base de données, formulaires.

### Ce qui existe déjà et ne doit rien perdre

Phases 1 à 4 livrées et mergées dans `main` : socle bilingue FR/EN (`next-intl`),
thème, auth Supabase, carte MapLibre, archives filtrables, fiches patrimoine,
architectes, articles, reportages, événements, et un back-office complet.

**Aucune page, migration, table ou test existant n'est supprimé par cette phase.**

---

## 2. Direction artistique

### 2.1 Ce qu'on garde du design

Mode sombre par défaut avec bascule mémorisée · grain fixe en `soft-light` ·
barre de progression de lecture · révélations au scroll (fondu + translation +
flou, avec délais échelonnés) · révélation par `clip-path` des grands titres ·
filets qui se déploient horizontalement · parallaxe · marquee des villes ·
halo lumineux qui suit le curseur dans le hero · compteurs animés ·
respect de `prefers-reduced-motion` · toute la composition et tous les espacements.

### 2.2 Ce qu'on remplace

**Les polices.** Fraunces remplace Instrument Serif, Inter remplace Karla —
les deux polices déjà chargées par le projet via `next/font/google`.

> Fraunces est plus large et plus grasse qu'Instrument Serif à taille égale.
> Les `clamp()` des grands titres et leurs interlignes sont recalés pour que la
> composition reste identique à l'œil, pas identique en chiffres.

**Les couleurs.** Le jaune du design (`--gold`) est banni. Le token est
**renommé `--accent`** pour qu'aucun jaune ne puisse revenir par inadvertance —
un `grep -r "gold"` vide sert de garde-fou.

### 2.3 Table des tokens

Exprimés en oklch pour que les transparences (`/.28`), les `color-mix()` et les
dégradés du design continuent de fonctionner sans réécriture.

| Token | Rôle | Clair | Sombre |
|---|---|---|---|
| `--bg` | fond principal | Sable `#F4EBDD` — `oklch(0.943 0.021 79)` | `oklch(0.148 0.014 45)` |
| `--bg2` | fond alterné | Crème2 `#EADFCB` — `oklch(0.907 0.029 83)` | `oklch(0.196 0.020 47)` |
| `--bg3` | fond appuyé | `oklch(0.868 0.034 81)` | `oklch(0.245 0.024 49)` |
| `--ink` | texte | Encre `#2A2320` — `oklch(0.263 0.012 45)` | `oklch(0.945 0.020 82)` |
| `--soft` | texte secondaire | `oklch(0.470 0.030 50)` | `oklch(0.735 0.028 70)` |
| `--line` | filets, bordures | `oklch(0.840 0.025 78)` | `oklch(0.305 0.028 50)` |
| `--terra` | liens, puces | Terracotta `#B5581F` — `oklch(0.566 0.138 48)` | `oklch(0.680 0.150 48)` |
| `--ocre` | aplats chauds | Brun latérite `#8A3E1B` — `oklch(0.458 0.114 43)` | `oklch(0.600 0.130 45)` |
| `--accent` | survols, boutons, halo | **Ocre brûlé `#CE7A33`** — `oklch(0.642 0.129 53)` | `oklch(0.730 0.140 53)` |
| `--vert` | réserve, non utilisé en v1 | Vert forêt `#46603F` — `oklch(0.459 0.061 139)` | `oklch(0.657 0.065 138)` |
| `--deep` | sections sombres | `oklch(0.190 0.012 45)` | `oklch(0.115 0.012 45)` |
| `--onDeep` | texte sur sections sombres | Sable `oklch(0.943 0.021 79)` | idem |
| `--veil` | voile sur photos | dégradé de `--deep` | idem, plus dense |
| `--imgf` | filtre photo | `saturate(1.02) contrast(1.02)` | `saturate(.92) contrast(1.08) brightness(.86)` |

Les valeurs en mode sombre sont éclaircies par rapport au mode clair pour tenir le
contraste sur fond profond, en suivant les mêmes écarts que le design d'origine.

### 2.4 Où vivent les tokens

Dans `app/globals.css`, en remplacement du bloc `@theme` actuel. Les sept couleurs
Tailwind existantes (`terracotta`, `brun`, `or`, `vert`, `sable`, `creme2`, `encre`)
**restent déclarées et inchangées** : les pages existantes s'en servent plus de
cent fois et ne doivent pas bouger avant l'étape 2. Les nouveaux tokens sont
ajoutés à côté.

`--or` (`#D9A441`) reste donc dans le thème mais n'est **pas** utilisé par
l'accueil. Son sort sera tranché à l'étape 2.

### 2.5 Mode sombre

Attribut `data-theme` sur `<html>`, valeurs `dark` (défaut) et `light`, mémorisé
en `localStorage` sous la clé `paaciv-theme`. Un script inline dans le `<head>`
applique la valeur mémorisée avant le premier rendu, pour éviter le flash blanc.

---

## 3. Structure de la page

Seize blocs, dans l'ordre. Chaque bloc est un composant sous `components/accueil/`.

| # | Bloc | Client ? | Source de données |
|---|---|---|---|
| 1 | Header fixe translucide | ✅ | routes |
| 2 | Hero — 5 photos en rotation | ✅ | `patrimoine` + `images` |
| 3 | Carte « Film » flottante | ❌ | dernier `reportage` publié |
| 4 | Marquee des villes | ❌ | villes distinctes de `patrimoine` |
| 5 | L'association + compteurs + 3 cartes | ✅ (compteurs) | `contenu_site` + `count()` |
| 6 | Notre travail | ❌ | `contenu_site` |
| 7 | Pourquoi nous suivre — 4 arguments | ❌ | `points_cles` (bloc `pourquoi`) |
| 8 | Ce que nous faisons — 4 onglets | ✅ | `activites` |
| 9 | **La carte** (ajouté) | ✅ | `/api/carte/points` |
| 10 | Cinq raisons de regarder | ❌ | `points_cles` (bloc `raisons`) |
| 11 | Agenda — prochaines visites | ❌ | `evenements` à venir |
| 12 | Parallaxe « Vous détenez des plans… » | ✅ (modal) | `contenu_site` |
| 13 | Archive photographique — filtres + grille | ✅ | `patrimoine` + `images` + `types` |
| 14 | Ils travaillent avec nous — carrousel | ✅ | `temoignages` |
| 15 | Journal — carrousel d'articles | ✅ | `articles` |
| 16 | Newsletter + footer | ✅ (formulaire) | `newsletter_abonnes` + `contenu_site` |

Les blocs non-client sont des Server Components : ils lisent Supabase côté serveur
et n'envoient aucun JavaScript. Les animations au scroll leur sont appliquées par
`Reveal` (§3.1), qui est le seul client component qu'ils touchent.

### 3.1 `Reveal` — le moteur d'animation

Un unique client component monté dans le layout, qui installe un `IntersectionObserver`
sur tous les `[data-rv]`, `[data-clip]`, `[data-line]` et `[data-count]` de la page.
Les Server Components n'ont qu'à poser l'attribut, sans devenir clients eux-mêmes.

Il reprend la logique du design : seuil 0,12, marge basse -8 %, délai lu dans
`data-d`, `unobserve` après déclenchement, et un filet de sécurité qui révèle tout
au bout de 4 s si l'observateur n'a rien vu. Sous `prefers-reduced-motion`,
tout est révélé immédiatement sans transition.

### 3.2 Le hero (bloc 2)

Cinq édifices publiés ayant une image principale, les plus récents d'abord.
Rotation automatique toutes les 6,5 s, rail de cinq vignettes cliquables,
légende en fondu (titre + ville + datation), pastilles de villes,
halo qui suit le curseur, deux CTA :

- « Explorer l'archive » → `/archives`
- « Soutenir l'association » → ouvre le modal Don

Si moins de cinq édifices publiés ont une image, le hero affiche ce qu'il a
et le rail s'ajuste. En dessous d'un seul, il bascule sur une image de repli
servie depuis `public/`.

### 3.3 Le bloc carte (bloc 9, ajouté au design)

Le design n'a aucune carte, alors que c'est le cœur du projet. On **ajoute** une
section plutôt que d'en retirer une.

- Conteneur **carré** (`aspect-ratio: 1`), largeur limitée, centré, section sombre
- Vue cadrée sur la Côte d'Ivoire, points servis par `/api/carte/points`
- Marqueurs aux couleurs de `types`, sans clustering (volume faible)
- Défilement à la molette désactivé sur la carte, pour ne pas piéger le scroll de la page
- Compteur réel d'édifices publiés
- Bouton « Ouvrir la carte » → `/carte`

Nouveau composant `CarteApercu`. `MiniCarte` n'est pas modifié : il est
mono-point, zoom 14, avec un gestionnaire de clic destiné au formulaire admin —
des contraintes incompatibles avec une vue d'ensemble.

### 3.4 La grille d'archive (bloc 13)

Le design utilise une mosaïque éclatée (colonnes de 2, 3 ou 4, hauteurs toutes
différentes, décalages verticaux individuels). Elle est remplacée par une
**grille régulière** : 4 colonnes (2 en tablette, 1 en téléphone), vignettes
toutes identiques en 4/3, `object-fit: cover`, légendes alignées.

La régularité est compensée par l'animation : les vignettes montent en cascade
avec un délai croissant de 60 ms, et gardent le survol qui les soulève de 8 px.

C'est aussi le choix robuste : avec de vraies photos aux proportions variables,
la mosaïque d'origine se serait déformée de façon imprévisible.

Filtres par `types` réels (au lieu des quatre catégories inventées du design),
filtrage côté client sur les douze édifices chargés, bouton « Toute l'archive »
avec le compte réel → `/archives`.

### 3.5 Navigation

**Six entrées** dans le header, plus le bouton Adhérer :

La carte (`/carte`) · L'archive (`/archives`) · Architectes (`/architectes`) ·
Journal (`/articles`) · Reportages (`/reportages`) · Agenda (`/evenements`)
· bascule de thème · FR/EN · **Adhérer** (modal)

Le header est fixe et transparent au-dessus du hero, puis prend un fond
translucide au-delà de 85 % de la hauteur d'écran, comme dans le design.

**Menu mobile** (absent du design, à créer) : sous 900 px, un bouton hamburger
ouvre un panneau plein écran sur fond `--deep`, entrées en Fraunces à grande
taille entrant en cascade, plus la bascule de thème et FR/EN. Fermeture par
`Échap`, par le bouton, ou en suivant un lien. Focus piégé pendant l'ouverture,
défilement du corps bloqué.

**Liens supprimés :** `/a-propos`, `/contact` et `/conditions-utilisation`
disparaissent du header et du footer. Ces trois pages n'ont jamais été créées —
ce sont des 404 aujourd'hui. « À propos » devient le bloc *L'association*,
« Contact » devient le pied de page.

---

## 4. Modèle de données

Migration `0016_accueil.sql`. Toutes les paires `*_fr` / `*_en` suivent la
convention du projet : FR requis, EN facultatif avec repli sur FR
(`lib/i18n-champ.ts`).

### 4.1 Contenus éditoriaux

**`contenu_site`** — textes de bloc, en clé/valeur.
`cle` (PK, texte) · `valeur_fr` · `valeur_en` · `type` (`texte` | `html` | `image`) · `updated_at`

Clés prévues : `hero_titre`, `hero_intro`, `association_surtitre`, `association_titre`,
`association_texte`, `travail_titre`, `travail_texte`, `travail_releve`, `travail_recit`,
`activites_titre`, `activites_intro`, `raisons_titre`, `agenda_titre`, `parallaxe_texte`,
`archive_titre`, `temoignages_titre`, `journal_titre`, `newsletter_titre`,
`newsletter_texte`, `footer_description`, `footer_adresse`, `footer_email`,
`footer_telephone`, `soutien_adhesion_montant`, `soutien_paiement`.

**`points_cles`** — les listes numérotées des blocs 7 et 10, dans une seule table.
`id` (uuid) · `bloc` (`pourquoi` | `raisons`) · `titre_fr` · `titre_en` ·
`texte_fr` · `texte_en` · `ordre` · `statut`

Une seule table plutôt que deux : même forme, même cycle de vie, même écran d'admin.
Le champ `bloc` les sépare à la lecture.

**`activites`** — les quatre onglets du bloc 8.
`id` · `titre_fr/en` · `cadence_fr/en` (« Toute l'année », « Deux samedis par mois ») ·
`description_fr/en` · `cta_libelle_fr/en` · `cta_href` · `image` · `ordre` · `statut`

**`temoignages`** — le carrousel du bloc 14.
`id` · `nom` · `role_fr/en` · `citation_fr/en` · `note` (1–5) · `ordre` · `statut`

### 4.2 Collecte

**`newsletter_abonnes`**
`id` · `email` (unique, normalisé en minuscules) · `langue` · `created_at`

**`demandes`**
`id` · `type` (`adhesion` | `don` | `archive`) · `nom` · `email` · `telephone` ·
`montant` (numérique, nullable) · `message` · `statut` (`nouvelle` | `traitee`) ·
`created_at`

### 4.3 Sécurité (RLS)

Les quatre tables de contenu suivent le patron déjà en place dans le projet :
**lecture publique des lignes publiées, écriture réservée à l'admin authentifié**.
`contenu_site` n'a pas de statut : lecture publique intégrale.

Les deux tables de collecte suivent le patron **inverse** :
**insertion publique, lecture réservée à l'admin**.

> C'est le point de sécurité de cette phase. Sans lecture restreinte, la liste
> des abonnés et les coordonnées des donateurs seraient lisibles par n'importe
> qui via l'API publique Supabase. Les policies doivent être vérifiées par un
> test qui tente une lecture avec la clé anonyme et attend zéro ligne.

### 4.4 Seed

`0017_accueil_seed.sql` reprend les textes du design comme point de départ,
**avec les chiffres et coordonnées inventés retirés** :

- Les compteurs deviennent des `count()` réels, pas des valeurs en base
- « 1 240 fiches » devient le compte réel de patrimoines publiés
- Adresse, téléphone, e-mail, montant d'adhésion et moyens de paiement sont
  seedés avec un marqueur `À COMPLÉTER` visible, listé en §8
- Les quatre témoignages du design ne sont **pas** seedés : ce sont des personnes
  nommées et des citations attribuées, qui ne peuvent pas être inventées.
  La table est créée vide et le bloc 14 ne s'affiche pas tant qu'elle l'est.

---

## 5. Les parcours

### 5.1 Le composant `Modal`

`components/ui/Modal.tsx` — un `<dialog>` natif :
ouverture par `showModal()`, `Échap` ferme, clic sur le fond ferme, focus piégé
par le navigateur, focus rendu à l'élément déclencheur à la fermeture,
`aria-labelledby` sur le titre. Habillé aux tokens du design.

### 5.2 Les trois modals de soutien

`components/soutenir/` — `ModalAdhesion`, `ModalDon`, `ModalArchive`.

| Modal | Déclencheurs | Champs | Écrit |
|---|---|---|---|
| Adhésion | bouton « Adhérer » du header et du menu mobile, carte « Adhérer » du bloc 5 | nom, e-mail, téléphone, message | `demandes(type='adhesion')` |
| Don | « Soutenir l'association » du hero, carte « Faire un don » du bloc 5 | nom, e-mail, montant (libre ou suggéré), message | `demandes(type='don')` |
| Archive | « Confier une archive » du bloc 12 | nom, e-mail, téléphone, description du fonds | `demandes(type='archive')` |

Après enregistrement, chaque modal affiche les moyens de paiement lus depuis
`contenu_site.soutien_paiement` (virement, Wave, Orange Money).

**Aucun paiement en ligne en v1.** Pas de compte marchand, pas de clés, pas de
webhook. Le parcours enregistre une intention et donne les coordonnées.

### 5.3 Écriture

Server Actions dans `app/[locale]/actions/`. Pour chacune :

- Validation côté serveur (e-mail bien formé, champs requis, montant positif)
- Retour d'erreur **par valeur de retour**, jamais par exception —
  c'est la convention établie en Phase 4 (`033dec0`)
- Message de confirmation dans le modal, sans le fermer brutalement
- Erreur affichée à l'utilisateur, jamais avalée silencieusement

**Newsletter :** e-mail normalisé en minuscules et détouré. Un doublon renvoie
le même message de succès qu'une inscription réussie — on ne révèle pas si une
adresse est déjà inscrite.

### 5.4 Tous les autres boutons

| Élément | Destination |
|---|---|
| « Explorer l'archive » (hero) | `/archives` |
| Vignettes du hero | change l'image affichée |
| Carte « Film » | `/reportages/[slug]` du dernier reportage |
| « Voir » (carte Chantiers, bloc 5) | `/articles` |
| Onglets d'activités | change le panneau affiché |
| CTA d'activité | `activites.cta_href` |
| « Ouvrir la carte » | `/carte` |
| « Voir le programme » (bloc 10) | `/evenements` |
| Chaque événement de l'agenda | `/evenements/[slug]` |
| Filtres d'archive | filtrent la grille |
| Chaque vignette d'archive | `/patrimoine/[slug]` |
| « Toute l'archive — N fiches » | `/archives` |
| Flèches du carrousel de témoignages | font défiler |
| Chaque article du journal | `/articles/[slug]` |
| Flèches du carrousel du journal | font défiler |
| Liens du footer | leurs routes réelles |
| FR / EN | bascule de langue `next-intl` |
| Bascule de thème | `data-theme` + `localStorage` |

Aucun `href="#"`, aucun `onClick` vide ne doit subsister.

---

## 6. Le back-office

Six écrans en plus, dans le style admin existant (mêmes composants de formulaire,
mêmes onglets FR/EN, mêmes actions serveur) :

| Écran | Rôle |
|---|---|
| Contenu du site | édition des clés de `contenu_site`, groupées par bloc |
| Points clés | CRUD, avec le filtre `pourquoi` / `raisons` |
| Activités | CRUD complet avec image |
| Témoignages | CRUD complet |
| Abonnés | liste en lecture seule + export CSV |
| Demandes | liste filtrable par type, passage en « traitée » |

---

## 7. Découpage en lots

| Lot | Contenu | Vérifiable par |
|---|---|---|
| 1 | Tokens, polices, mode sombre, `Reveal`, `Modal` | la page actuelle s'affiche en sombre, sans régression |
| 2 | Migrations `0016` + `0017`, couche `lib/data/accueil.ts` | tests unitaires de lecture, test RLS |
| 3 | Header 6 entrées + menu mobile + footer | navigation complète depuis toute page |
| 4 | Blocs 2 à 8 de l'accueil | comparaison visuelle avec la référence |
| 5 | Blocs 9 à 16, dont carte carrée et grille uniforme | idem |
| 6 | Les trois modals + newsletter, branchés | une demande déposée apparaît en base |
| 7 | Les six écrans d'admin | un texte modifié en admin change sur l'accueil |
| 8 | Tests (unitaires, e2e des parcours), lint, type-check, build | tout vert |

L'**étape 2** — propagation de l'identité aux pages existantes — fera l'objet
d'une spec distincte, après validation de celle-ci en production.

---

## 8. À fournir par l'association

Ces valeurs sont seedées avec un marqueur `À COMPLÉTER` et doivent être remplacées
avant mise en ligne. Le design en propose des versions inventées qui ne peuvent
pas être conservées.

1. **Adresse postale** exacte (le design invente « Rue des Jardins, Cocody »)
2. **Téléphone** (le design invente « +225 27 22 00 00 00 »)
3. **E-mail de contact** — `contact@paaciv.ci` dans le design,
   `contact@paaciv.com` dans le footer actuel du projet : lequel fait foi ?
4. **Montant de l'adhésion annuelle** (le design invente 15 000 F CFA)
5. **Moyens de paiement** : coordonnées bancaires, numéro Wave, numéro Orange Money
6. **Quatre témoignages réels** — nom, rôle, citation, et l'accord des personnes
7. **Statut juridique exact** — le design écrit « association loi 1901 de droit
   ivoirien », ce qui est un mélange : la loi de 1901 est française
8. **Réseaux sociaux** : le design affiche Instagram, Facebook et YouTube ;
   le projet référence Instagram et LinkedIn. Lesquels sont actifs ?
9. **Vrais textes** des blocs 5 à 8 et 10, si ceux du design ne conviennent pas —
   ils sont éditables en admin, donc modifiables à tout moment sans intervention

---

## 9. Ce qui n'est pas fait

- Pas de paiement en ligne (§5.2)
- Pas d'envoi de newsletter, seulement la collecte — conforme au spec d'origine
- Pas de propagation de l'identité aux pages existantes : c'est l'étape 2
- Pas de recherche globale : le bouton loupe du header actuel est retiré,
  il n'a jamais rien fait
- Pas de page `/a-propos` ni `/contact` : absorbées par l'accueil (§3.5)
