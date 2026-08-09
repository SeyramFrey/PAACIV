# Spec B2 — Architectes (Phase 3)

**Date** : 2026-08-10
**Statut** : validé (brainstorming)
**Périmètre** : entité Architectes du site PAACIV — schéma, pages publiques, admin CRUD,
liaison N–N avec le patrimoine, seed. Réutilise l'éditeur riche (Spec B1, déjà mergée).

## Contexte

La spec produit (2026-08-07, §12) prévoit une entité **Architectes** (ivoiriens & étrangers)
avec frise chronologique, fiches (parcours + réalisations liées), et liaison N–N au
patrimoine. La fiche patrimoine réserve déjà un emplacement « architectes » (Phase 2).
Le lien `/architectes` est déjà dans le header (il 404 aujourd'hui). L'éditeur riche
(`EditeurRiche`) et le rendu assaini (`TexteRiche`) livrés en Spec B1 sont réutilisés ici.

## Décisions

- **Liaison N–N avec rôle** : `patrimoine_architecte(patrimoine_id, architecte_id, role)`
  (rôle optionnel : architecte / co-auteur / bureau).
- **Frise Ivoiriens = grille chronologique triée** (option C validée en compagnon visuel) :
  pastilles triées par année, badge d'année. Étrangers = grille de pastilles simple.
- **Champs riches** (bio, parcours, réalisations texte) via `EditeurRiche` + rendu `TexteRiche`,
  assainis à l'enregistrement (double barrière, comme la description patrimoine).
- **Photo architecte** : une seule photo, bucket `patrimoine` existant, préfixe `architectes/`
  (policies déjà en place, pas de nouvelle migration Storage).

## Architecture & composants

### 1. Schéma & sécurité (migrations Supabase)

**Table `architectes`** (uuid `id` défaut `gen_random_uuid()`) :
`slug` (unique, not null) · `nom` (not null) · `origine` (text not null,
check `in ('ivoirien','etranger')`) · `photo` (text, nullable) ·
`annee_naissance`/`annee_deces` (int, nullable) · `periode_texte` (text) ·
`bio_fr`/`bio_en` · `parcours_fr`/`parcours_en` ·
`realisations_texte_fr`/`realisations_texte_en` (HTML riche assaini) ·
`statut` (text not null default `'brouillon'`, check `in ('brouillon','publie')`) ·
`ordre` (int not null default 0) · `created_at`/`updated_at` (timestamptz).
Trigger `touch_updated_at` (fonction existante). Index sur `statut`, `origine`.

**Table `patrimoine_architecte`** :
`patrimoine_id` (uuid not null → patrimoine on delete cascade) ·
`architecte_id` (uuid not null → architectes on delete cascade) ·
`role` (text, nullable) · primary key `(patrimoine_id, architecte_id)`.
Index sur `patrimoine_id` et `architecte_id`.

**RLS** (alignées sur patrimoine) :
- `architectes` : `select` anon `using (statut = 'publie')` ; `all` authenticated.
- `patrimoine_architecte` : `select` anon si l'architecte publié ET le patrimoine publié
  (double `exists`) ; `all` authenticated.
- RLS activé dès la création des tables.

**Storage** : réutilise le bucket `patrimoine` (public), chemins `architectes/<id>/…`.

### 2. Data layer — `lib/data/architectes.ts`

- Types `Architecte`, `ArchitecteListItem`, `ArchitecteDetail`, `RealisationLiee`.
- `listeArchitectes()` → publiés, lecture via `createReadClient()` (cookieless).
  Renvoie `{ id, slug, nom, origine, photo, annee_naissance, periode_texte, ordre }`.
  Tri : ivoiriens par `annee_naissance` asc (nulls en dernier) puis `ordre` ; étrangers
  par `ordre`/`nom`. (Le tri final des Ivoiriens peut se faire côté page.)
- `getArchitecteParSlug(slug)` → fiche complète + réalisations liées :
  jointure `patrimoine_architecte → patrimoine` filtrée sur patrimoines `publie`, avec
  `role`, titre/slug/image du patrimoine. `null` si architecte non publié/inexistant.
  Mémoïsé via `cache` (comme `getPatrimoineParSlugCache`).

### 3. Pages publiques

- **`/architectes`** (`app/[locale]/architectes/page.tsx`, SSR) :
  - Section **Ivoiriens** : grille chronologique triée (pastille photo, nom, badge année =
    `annee_naissance` ou `periode_texte`), lien `/architectes/[slug]`.
  - Section **Étrangers** : grille de pastilles simple.
  - Composant `PastilleArchitecte` réutilisé par les deux sections.
- **`/architectes/[slug]`** (`app/[locale]/architectes/[slug]/page.tsx`, SSR +
  `generateMetadata` OpenGraph) :
  - photo, nom, dates (`annee_naissance – annee_deces` ou `periode_texte`) ;
  - **bio** et **parcours** via `TexteRiche` ;
  - **réalisations** : cartes des patrimoines liés (réutilise `CartePatrimoine`) avec rôle ;
    repli sur `realisations_texte` (`TexteRiche`) si aucune liaison ;
  - brouillon → `notFound()` (comme la fiche patrimoine).

### 4. Admin

- **`/admin/architectes`** : liste (nom, origine, statut, éditer, supprimer + confirmation
  `BoutonSupprimer`).
- **`/admin/architectes/nouveau`** et **`/admin/architectes/[id]`** :
  `FormulaireArchitecte` (client) — origine (select), **upload photo** (bucket `patrimoine`,
  préfixe `architectes/<id>/`, remplace l'ancienne au changement), `annee_naissance`/
  `annee_deces`/`periode_texte`, **bio / parcours / réalisations** en `EditeurRiche`
  (onglets FR/EN), `ordre`, statut (brouillon/publie).
- Server actions (`app/[locale]/admin/architectes/actions.ts`) : `enregistrerArchitecte`
  (**assainit** bio/parcours/réalisations FR/EN via `assainirHtml`), `supprimerArchitecte`,
  upload photo. Écritures via `createServerClient()` (session admin).

### 5. Liaison dans le formulaire patrimoine

- Nouveau bloc « Architectes » dans `FormulairePatrimoine` : **liste de cases à cocher** de
  tous les architectes ; chaque ligne cochée révèle un **select de rôle** optionnel
  (architecte / co-auteur / bureau).
- `enregistrerPatrimoine` : après upsert du patrimoine, **remplace** les liaisons
  (`delete where patrimoine_id = …` puis `insert` des paires cochées avec leur rôle).
- La page d'édition patrimoine charge la liste des architectes + les liaisons existantes
  pour pré-cocher.

### 6. Fiche patrimoine — emplacement architectes

- L'emplacement réservé (aside) est rempli : liste des architectes liés
  (nom → lien `/architectes/[slug]`) + rôle entre parenthèses. Données via une jointure
  ajoutée à `getPatrimoineParSlug` (architectes publiés liés).

## Flux de données

1. Admin crée un architecte (photo + champs riches assainis) → `architectes`.
2. Admin lie des architectes à un patrimoine (cases + rôles) → `patrimoine_architecte`.
3. `/architectes` liste (grille triée) ; fiche architecte affiche bio/parcours + réalisations
   liées (patrimoines publiés) ; fiche patrimoine affiche ses architectes liés.

## i18n

Nouveaux namespaces `architectes`, `ficheArchitecte`, `adminArchitectes`, `formArchitecte`
dans `i18n/messages/fr.json` + `en.json`.

## Sécurité

- Champs riches assainis à l'enregistrement ET au rendu (`TexteRiche`) — double barrière.
- RLS : le public ne voit que le contenu publié (architectes, liaisons) ; écritures admin only.
- Upload photo réservé à l'admin authentifié (policies bucket existantes).

## Tests

- **DB/RLS** (`tests/db`) : public ne lit que les architectes `publie` ; une liaison n'est
  lue que si architecte ET patrimoine publiés ; anon ne peut pas insérer.
- **Data layer** (`tests/db`) : `listeArchitectes` (publiés, tri) ; `getArchitecteParSlug`
  (réalisations liées publiées + rôle ; `null` sur brouillon).
- **E2E public** : `/architectes` affiche les 2 sections (grille triée + badges) ;
  fiche architecte rend bio/parcours/réalisations ; brouillon → 404 ; fiche patrimoine
  affiche ses architectes liés.
- **E2E admin** (authentifié) : création d'un architecte (le formulaire monte l'éditeur) ;
  le bloc liaison architecte apparaît dans le formulaire patrimoine.

## Hors périmètre (YAGNI)

- Galerie multi-photos par architecte (une seule photo).
- Réordonnancement drag-and-drop.
- Frise horizontale animée (grille triée retenue).
- Éditeur riche sur d'autres entités (articles → phase éditoriale).

## Suite

Après merge : Phase 4 (éditorial : articles/reportages/événements) puis Phase 5
(accueil complet + newsletter). Voir la spec produit
`docs/superpowers/specs/2026-08-07-paaciv-site-patrimoine-design.md`.
