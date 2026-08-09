# Spec A — Carte & finitions Phase 2 (PAACIV)

**Date** : 2026-08-09
**Statut** : validé (brainstorming)
**Périmètre** : correctifs et finitions de la carte MapLibre + restes optionnels de la Phase 2.
Sera suivi d'une **Spec B — Phase 3 Architectes** (cycle séparé).

## Contexte

Phase 1 (Fondations) et Phase 2 (Cœur) sont terminées et fusionnées dans `main`.
La carte (`components/carte/CarteClient.tsx`) fonctionne (clustering + `fitBounds`) mais
présente trois problèmes signalés par l'utilisateur :

1. **La bascule « Satellite » ne fait rien visuellement.**
2. **Le niveau de détail du fond de plan est faible** (source gratuite OpenFreeMap,
   densité pauvre en Côte d'Ivoire).
3. **Le survol des points n'affiche presque rien** (titre + ville seulement).

Restes optionnels Phase 2 encore à faire : barre de **filtres sur la carte**
(l'endpoint `/api/carte/points` accepte déjà `type/programme/district/epoque/q`, il
manque l'UI) et **débounce** de la recherche des archives.

## Décisions

- **Fournisseur de tuiles : MapTiler** (clé API gratuite jusqu'à 100k chargements/mois).
  L'utilisateur crée la clé ; le code lit `NEXT_PUBLIC_MAPTILER_KEY` et **retombe
  automatiquement sur OpenFreeMap si la clé est absente** (le site tourne sans clé).
- **Survol enrichi** : vignette image + titre + badge de type coloré + ville.
- **Filtres carte** : complets (type, programme, district, époque, recherche), comme les
  archives, mais en **état client** (pas de navigation → pas de remount de la carte WebGL).

## Architecture & composants

### 1. Fond de carte MapTiler + correctif satellite

- Constantes de style dans `CarteClient.tsx` :
  - `MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY`
  - `STYLE_PLAN` = `https://api.maptiler.com/maps/streets-v2/style.json?key=…` si clé,
    sinon `https://tiles.openfreemap.org/styles/liberty` (fallback actuel).
  - Tuiles satellite = MapTiler `satellite-v2`
    (`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=…`) si clé,
    sinon Esri World Imagery (fallback actuel).
- **Correctif du bug satellite** : la couche raster `satellite` est aujourd'hui insérée
  avec `beforeId = map.getStyle().layers?.[0]?.id`, donc **sous** le fond vectoriel opaque
  → invisible. Correctif : l'insérer **sans `beforeId`**, ce qui la place au-dessus du fond
  vectoriel mais sous les couches `clusters`/`cluster-count`/`points` (ajoutées après dans
  le `load`). La bascule Plan/Satellite (`setLayoutProperty('satellite', 'visibility', …)`)
  fonctionne alors réellement.
- L'attribution s'adapte à la source (MapTiler vs Esri/OpenFreeMap).

### 2. Survol enrichi des points

- L'API `/api/carte/points` renvoie déjà `image`, `type_id`, `titre_fr/en`, `ville`, `slug`.
- Popup (survol desktop) construit en **DOM sûr** (pas de `setHTML`) :
  - `<img>` vignette (~64×48, `loading="lazy"`) si `properties.image`, sinon masquée ;
  - `<strong>` titre (locale courante) ;
  - **badge de type** : pastille couleur (depuis une map `type_id → {nom, couleur}` dérivée
    des `types` déjà chargés) + libellé du type dans la locale ;
  - ville en dessous si présente.
- **Mobile** : inchangé (pas de survol ; le tap ouvre la fiche `/patrimoine/{slug}`).

### 3. Barre de filtres sur la carte

- Nouveau composant de présentation contrôlé `components/carte/FiltresCarte.tsx`
  (type, programme, district, époque, recherche), aligné visuellement sur
  `FiltresArchives.tsx`. Reçoit `options` (4 jeux de `Ref`), `valeurs`, `onChange`, `locale`.
- **Mécanique (différence clé avec les archives)** : état **client** dans `CarteClient`.
  À chaque changement : re-`fetch('/api/carte/points?…')`, mise à jour de la source GeoJSON
  via `source.setData(...)`, puis `fitBounds` sur les nouveaux points. **Aucune navigation,
  aucun remount** de la carte.
- Si 0 résultat : la vue courante est conservée ; affichage d'un petit compteur
  « n résultats ».
- La recherche texte `q` est **débouncée** (~300 ms) ; les `<select>` sont immédiats.
- `app/[locale]/carte/page.tsx` charge désormais les **4 jeux de références** (extraction
  d'un helper `chargerReferences`, identique aux archives) et les passe à `CarteClient`.

### 4. Débounce recherche archives + hook partagé

- Ajout d'un hook `useDebouncedCallback(fn, delay)` (dossier `lib/hooks/` ou équivalent),
  réutilisé par la carte et les archives.
- `FiltresArchives.tsx` : le champ `q` (`onChange` → `router.push`) est **débouncé ~300 ms**
  (les `<select>` restent immédiats).

### 5. i18n

- Nouvelles clés dans `messages/fr.json` + `messages/en.json` pour les filtres carte,
  en réutilisant au maximum les clés archives (`type`, `programme`, `district`, `epoque`,
  `recherche`, `tous`, `resultats`). Ajout au besoin d'un libellé « n résultats » côté carte.

## Flux de données

1. `carte/page.tsx` (serveur) → charge `types/programmes/districts/epoques` → `CarteClient`.
2. `CarteClient` monte la carte **une seule fois** (init au montage, refs pour router/locale).
3. Interaction filtres → état client → `fetch('/api/carte/points?…')` →
   `source.setData` → `fitBounds`.
4. Survol point → popup DOM enrichi ; clic point → navigation fiche ; clic cluster → zoom.

## Gestion d'erreurs

- Fetch points en échec : la carte conserve la vue/données courantes (repli déjà en place).
- Clé MapTiler absente : fallback OpenFreeMap/Esri, aucune erreur bloquante.
- Image de vignette en échec : `onerror` → vignette masquée, popup reste lisible.

## Tests (Playwright, `workers: 2`)

- **Satellite** : après clic sur « Satellite », la couche `satellite` est `visibility: visible`
  **et** positionnée au-dessus du fond (vérif via `getLayoutProperty` + ordre des couches).
- **Filtres carte** : sélectionner un type réduit le nombre de features de la source
  `patrimoine` et recadre la carte.
- **Survol** : le popup contient titre + type + ville (image tolérée absente en test).
- **Fallback** : sans `NEXT_PUBLIC_MAPTILER_KEY`, la carte se charge (style OpenFreeMap).
- **Débounce archives** : une saisie rapide ne produit qu'une seule navigation.

## Hors périmètre (YAGNI)

- Pas de clustering spécifique en mode satellite.
- Pas de géolocalisation utilisateur.
- Pas de persistance des filtres carte dans l'URL (état client uniquement).
- Pas de mode « hybride » (labels vectoriels par-dessus le satellite) — satellite = imagerie pure.

## Suite

Après implémentation et merge : **Spec B — Phase 3 Architectes** (tables `architectes` +
`patrimoine_architecte` N–N, pages `/architectes` frise + fiches, liaison admin, insertion
dans la fiche patrimoine), brainstormée séparément.
