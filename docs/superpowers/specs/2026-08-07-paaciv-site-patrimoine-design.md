# PAACIV — Site du patrimoine architectural de Côte d'Ivoire
## Document de conception (spec)

**Date :** 2026-08-07
**Client :** Doukouré (Dkr) — association PAACIV
**Statut :** Validé pour rédaction du plan d'implémentation
**Révision :** v2 — intègre le document de cadrage de Dkr (architectes, programmes, éditorial)

---

## 1. Contexte & vision

**PAACIV** = *Patrimoine Architectural et des Arts de Côte d'Ivoire* — association dédiée à la valorisation du **patrimoine bâti ivoirien**.

Le site est à la fois :
- une **archive/musée en ligne** du patrimoine, dont le **cœur est une carte interactive** (chaque édifice géolocalisé → fiche détaillée) ;
- le **site vitrine de l'association** (missions, architectes, activités, actualités) ;
- un **média éditorial** (articles, reportages vidéo, événements).

Bilingue **FR/EN**. Un **back-office** permet à Dkr de tout gérer (patrimoine, architectes, articles, reportages, événements).

Références client : IraqMemory (profondeur documentaire, esprit musée — **direction retenue**), MapsArch & ISPADA (UX carte), MAMMA (élégance éditoriale). Instagram : https://www.instagram.com/paaciv

## 2. Objectifs / non-objectifs

**Objectifs (v1) :**
- Carte interactive détaillée et élégante, aux couleurs PAACIV.
- Fiches patrimoine documentées, reliées à leurs **architectes**.
- Entité **Architectes** (ivoiriens & étrangers) avec timeline, parcours, réalisations.
- Volet **éditorial** : articles, reportages vidéo, événements/expositions.
- **Newsletter** (capture d'emails).
- Page d'accueil « association + archive » riche, bilingue FR/EN.
- Admin unique (Dkr) couvrant tous les contenus.
- Bon SEO + partage social.
- Coût d'exploitation ~nul (offres gratuites).

**Non-objectifs (hors v1, YAGNI) :**
- Pas de comptes/inscription publics, pas de communauté.
- Pas d'œuvres d'art / fresques / sculptures comme *type* de patrimoine (décision client).
- Pas d'audio, pas de Street View, pas d'annuaire de commerces.
- Pas de rôles admin différenciés (un seul niveau).
- Pas d'envoi automatisé de newsletter en v1 (juste la **collecte** des emails ; l'envoi via un service se branchera plus tard).
- Pas de formulaire de contact complexe (page contact = email + réseaux).

## 3. Public cible
Ivoiriens, diaspora, touristes, chercheurs, curieux → **bilingue FR/EN** (FR principal, EN pouvant être partiel).

## 4. Direction artistique — « Terre & Ocre »

Chaleureux, enraciné, authentique (architecture de terre, latérite, Grand-Bassam colonial).

| Rôle | Couleur | Hex |
|---|---|---|
| Primaire (terracotta) | Terre | `#B5581F` |
| Primaire foncé (latérite) | Brun | `#8A3E1B` |
| Accent | Or | `#D9A441` |
| Secondaire | Vert forêt | `#46603F` |
| Fond clair (sable) | Crème | `#F4EBDD` |
| Fond crème 2 | | `#EADFCB` |
| Texte | Encre | `#2A2320` |

**Typo :** titres serif chaleureux (ex. *Fraunces*), corps sans-serif (ex. *Inter*/system-ui). Polices auto-hébergées.

## 5. Architecture technique

| Brique | Choix |
|---|---|
| Framework | **Next.js** (App Router), React, TypeScript |
| i18n | Routage FR/EN (ex. `next-intl`) |
| Base de données | **Supabase** — Postgres + **PostGIS** |
| Auth | **Supabase Auth** (e-mail/mot de passe, **sur invitation**) |
| Stockage médias | **Supabase Storage** |
| Carte | **MapLibre GL JS** (style « Atlas Terre » + satellite Esri) |
| Hébergement | **Vercel** |
| Domaine | `*.vercel.app` au début ; vrai domaine (`.org`/`.ci`) plus tard |

Toutes les briques tiennent dans les offres gratuites au volume attendu.

## 6. Plan de site & pages

Routes préfixées par la langue (`/fr/…`, `/en/…`, défaut FR).

**Navigation principale :** Carte · Nos archives · Architectes · Actualités (▾ Articles · Reportages · Événements) · À propos · Contact · **FR·EN** · 🔍

| Route | Rôle |
|---|---|
| `/` | Accueil (voir §7) |
| `/carte` | Carte plein écran (voir §8) — **cœur** |
| `/archives` | « Nos archives » : catalogue filtrable (type, programme, région, époque, recherche) |
| `/patrimoine/[slug]` | Fiche patrimoine (page dédiée) |
| `/architectes` | Liste : architectes ivoiriens (timeline) + étrangers |
| `/architectes/[slug]` | Fiche architecte (parcours + réalisations liées) |
| `/articles` et `/articles/[slug]` | Blog éditorial |
| `/reportages` | Reportages / interviews (vidéos YouTube) |
| `/evenements` et `/evenements/[slug]` | Expositions & événements |
| `/a-propos` | Histoire, vision, missions, activités, équipe |
| `/contact` | Email + réseaux (contribuer / s'informer) |
| `/admin/**` | Back-office (protégé) |

## 7. Page d'accueil (blocs, dans l'ordre)

1. **En-tête** — logo PAACIV, navigation, **FR·EN**, recherche.
2. **Hero** — accroche forte + **image aérienne historique** + CTA « Explorer la carte » / « Nos archives ».
3. **La carte** — aperçu + inset « CI en Afrique » + bouton plein écran *(bloc mis très haut : c'est ce qui rend le site unique)*.
4. **Nos 3 missions** — icônes simples (contenu à fournir par Dkr).
5. **Nos architectes** — aperçu (pastilles/photos circulaires) + « Voir plus » → `/architectes`.
6. **Nos archives** — aperçu (bâtiments majeurs / par programme) + « Voir plus » → `/archives`.
7. **Chiffres clés** — patrimoines · architectes · villes · époques (dynamiques).
8. **Événements & expositions** — prochaines activités (aperçu).
9. **Newsletter** — « Restez informé » + champ email + s'abonner.
10. **À propos (court)** + lien Instagram.
11. **Pied de page** — navigation, réseaux (**Instagram, LinkedIn**), e-mail `contact@paaciv.com`, conditions d'utilisation.

## 8. La carte en détail (MapLibre)

- **Style « Atlas Terre »** (teintes chaudes) — style MapLibre personnalisé.
- **Fonds vectoriels** libres **sans clé/carte bancaire** (recommandé : **OpenFreeMap** ; alt. MapTiler clé gratuite). Données **OpenStreetMap**.
- **Satellite** : imagerie **Esri World Imagery**, en 1 clic.
- **Marqueurs par *type*** (icône SVG dessinée + couleur du type) ; **clustering** natif au dézoom.
- **Inset « CI en Afrique »** en haut à gauche.
- **Filtres** : type, **programme**, région, époque ; **recherche** ; compteur.
- **Aperçu au survol** : vignette + type + titre + lieu + « Voir la fiche ».
- **Bascule Plan / Satellite**, zoom, **légende**.
- Clic marqueur → fiche `/patrimoine/[slug]`.
- **Perf** : seuls les items **publiés** ; points servis en GeoJSON léger.

## 9. Fiche patrimoine (`/patrimoine/[slug]`)
Galerie photos (+ **crédit/source** par image) · titre · type (badge) · **programme** · résumé · description riche · datation (date/période, époque) · **style** · **architecte(s)** (liens vers fiches) · localisation (mini-carte + district/ville/adresse) · **état actuel** & statut patrimonial · **vidéo YouTube** · sources · partage + OpenGraph · bascule FR/EN.

## 10. Modèle de données (Supabase / PostGIS)

> Paires `*_fr`/`*_en` = **bilingues** (🌍, EN facultatif → repli FR).

### Références
- **types** : `id`(slug) · `nom_fr/en` · `icone`(svg) · `couleur` · `ordre` — **7 types** (§11).
- **programmes** : `id`(slug) · `nom_fr/en` · `ordre` — **~10 programmes** (§11).
- **districts** : `id` · `nom_fr/en` · `ordre` — **14 districts** (§11).
- **epoques** : `id` · `nom_fr/en` · `borne` · `couleur` · `ordre` — **3 époques** (§11).

### `patrimoine`
`id`(uuid) · `slug`(unique) · `titre_fr/en`🌍(fr requis) · `resume_fr/en`🌍 · `description_fr/en`🌍 · `type_id`→types · `programme_id`→programmes · `date_texte` · `annee_debut/fin`(int) · `epoque_id`→epoques · `style_fr/en`🌍 · `lat`/`lng`(double) · `geom`(geography Point 4326) · `district_id`→districts · `ville` · `adresse_fr/en`🌍 · `statut_patrimonial` · `etat_conservation` · `video_url` · `sources_fr/en`🌍 · `statut`(brouillon/publie) · `created_at`/`updated_at`.

### `images`
`id` · `patrimoine_id`→patrimoine (cascade) · `chemin` · `legende_fr/en`🌍 · `credit`(source image) · `ordre` · `est_principale`(bool) · `created_at`.

### `architectes`
`id`(uuid) · `slug`(unique) · `nom` · `origine`(`ivoirien`/`etranger`) · `photo`(chemin) · `annee_naissance`/`annee_deces`(int, opt.) · `periode_texte`(ex. « XXᵉ s. ») · `bio_fr/en`🌍 · `parcours_fr/en`🌍 · `realisations_texte_fr/en`🌍 *(projets listés en texte si pas encore de fiches liées)* · `statut`(brouillon/publie) · `ordre` · timestamps.

### `patrimoine_architecte` (liaison N–N)
`patrimoine_id` · `architecte_id` · `role`(opt. : architecte, co-auteur, bureau) — un bâtiment peut avoir plusieurs architectes, un architecte plusieurs bâtiments.

### `articles`
`id` · `slug` · `titre_fr/en`🌍 · `chapo_fr/en`🌍 · `corps_fr/en`🌍(riche) · `image_couverture` · `patrimoine_lie`(opt.→patrimoine) · `date_publication` · `statut` · timestamps.

### `reportages`
`id` · `slug` · `titre_fr/en`🌍 · `video_url`(YouTube) · `description_fr/en`🌍 · `patrimoine_lie`(opt.) · `date` · `statut`.

### `evenements`
`id` · `slug` · `titre_fr/en`🌍 · `description_fr/en`🌍 · `image` · `lieu` · `date_debut`/`date_fin` · `statut_temporel`(à venir/passé, dérivé) · `statut`(brouillon/publie).

### `newsletter_abonnes`
`id` · `email`(unique) · `langue` · `created_at`. *(Collecte seule ; export/branchement service plus tard.)*

### `equipe` (À propos)
`id` · `nom` · `role_fr/en`🌍 · `photo` · `ordre`. *(Simple ; peut rester statique en v1.)*

## 11. Taxonomies de référence

**7 types (icône + couleur, pilotent la carte) :**
Bâtiment 🏛️ `#B5581F` · Édifice religieux ⛪ `#8A3E1B` · Monument/mémorial 🗿 `#D9A441` · Site 🏞️ `#46603F` · Lieu culturel 🎭 `#7A5B8A` · Ensemble/quartier 🏘️ `#3F6B63` · Ouvrage d'art 🌉 `#5E6B8A`. *(Icônes SVG dessinées en production.)*

**~10 programmes (fonction — classement « Nos archives ») :**
Résidentiel · Administratif · Hôtelier · Religieux · Sanitaire · Culturel · Sportif · Industriel/logistique/agricole · Infrastructure aéroportuaire · Ouvrage d'art. *(Liste extensible.)*

**14 districts :** Abidjan (aut.), Yamoussoukro (aut.), Bas-Sassandra, Comoé, Denguélé, Gôh-Djiboua, Lacs, Lagunes, Montagnes, Sassandra-Marahoué, Savanes, Vallée du Bandama, Woroba, Zanzan.

**3 époques :** Précolonial (avant 1893) · Colonial (1893–1960) · Post-indépendance (depuis 1960).

## 12. Architectes (page & fiches)

- **`/architectes`** — deux sections :
  - **Ivoiriens** : **frise chronologique** (bande de dates 1960→2000…) + pastilles/photos.
  - **Étrangers** : grille de photos/pastilles.
- **Fiche architecte** — au clic : photo, **parcours**, **réalisations** (fiches patrimoine liées via `patrimoine_architecte`, sinon liste texte).
- **Données à amorcer (seed)** :
  - *Ivoiriens :* Aka Adjo, Michel Goly Kouassi, Jean Léon, N'Douba Amon, Télesphore Kouamé, Pierre Fakhoury, Doukouré Yolande *(à compléter)*.
  - *Étrangers :* DLM (Ducharme, Larras, Minost), Henri Chomette, Robert Boy, Rinaldo Olivieri, Clément Cacoub, Jean Sémichon, Daniel Badani, Pierre Roux-Dorlut.

## 13. Volet éditorial

- **Articles** (`/articles`) — blog : histoires, temps forts, archives, livres. Liste + page article (SEO, OpenGraph), lien optionnel vers un patrimoine.
- **Reportages / interviews** (`/reportages`) — vidéos YouTube produites, avec description ; lien optionnel vers un patrimoine.
- **Événements / expositions** (`/evenements`) — activités & conférences (à venir / passées).

## 14. Back-office (admin)

- Route `/admin` protégée (Supabase Auth, **sur invitation** ; **1 admin : Dkr**).
- **Sections CRUD** : Patrimoine · Architectes · Articles · Reportages · Événements · Équipe · Abonnés (lecture/export).
- **Formulaire patrimoine** : onglets FR/EN ; **sélecteur de point sur carte** (clic pour poser le lieu) ; listes (type, programme, district, époque, statut, état) ; **liaison architecte(s)** ; **upload multi-images** (ordre, image principale, légende, crédit) ; lien YouTube ; **brouillon/publier**.
- **Formulaire architecte** : origine (ivoirien/étranger), photo, dates, bio, parcours, réalisations liées.
- Éditeur de **texte riche** (FR/EN) pour descriptions & articles.

## 15. Médias & stockage
Supabase Storage (lecture publique, écriture admin) pour photos & couvertures. **Optimisation** (redimensionnement / formats modernes via `next/image` et/ou transformations Supabase) pour des vignettes légères (carte, catalogue).

## 16. Sécurité (RLS)
- **Public (anon)** : lecture des contenus **`statut = 'publie'`** (patrimoine, architectes, articles, reportages, événements) + images/liaisons associées + tables de référence.
- **Authentifié (admin)** : CRUD complet + brouillons.
- **`newsletter_abonnes`** : INSERT public (s'abonner) ; lecture réservée admin.
- Storage : lecture publique, écriture authentifiée.

## 17. SEO & partage
SSR/SSG des pages publiques · **URLs propres** (patrimoine, architectes, articles, événements) · métadonnées + **OpenGraph/Twitter** (image de couverture) · **sitemap** + hreflang FR/EN.

## 18. Déploiement
Vercel (CI/CD depuis Git). Variables d'env : URL/clés Supabase (clé publique côté client ; clé service côté serveur admin), config fournisseur de tuiles. Démarrage `*.vercel.app`, domaine plus tard.

## 19. Phasage d'implémentation (le périmètre v1 reste entier)
1. **Fondations** : projet Next.js, Supabase (schéma + RLS), i18n, design system Terre & Ocre, layout/nav, admin auth.
2. **Cœur** : Carte MapLibre + Nos archives + Fiches patrimoine + admin patrimoine.
3. **Architectes** : entité + pages + liaisons + admin.
4. **Éditorial** : Articles, Reportages, Événements + admin.
5. **Accueil complet** (tous les blocs) + Newsletter + À propos + Contact + Footer.
6. **Finitions** : SEO, OpenGraph, sitemap, perf, accessibilité, contenu de démo.

## 20. Décisions & hypothèses
- Décisions validées client : direction musée/archive, **tous modules en v1**, **double taxonomie Type + Programme**, entité Architectes, FR/EN, carte MapLibre « Atlas Terre » + satellite, Next.js + Supabase + Vercel, admin unique Dkr, réseaux (Instagram, LinkedIn), contact email `contact@paaciv.com`.
- **Hypothèses à confirmer en revue** :
  - Newsletter : **collecte** d'emails en base en v1 (envoi via service externe = plus tard).
  - Équipe (À propos) : table simple ou contenu statique en v1.
  - Contenu des **3 missions**, textes « À propos », accroche hero, image aérienne : **à fournir par Dkr**.
  - Liaison architecte : **N–N** (plusieurs architectes par bâtiment possible).
- À produire : **logo PAACIV** (identité construite ici depuis zéro) ; **icônes SVG** par type.
