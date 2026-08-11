# PAACIV — Volet éditorial (Phase 4)
## Document de conception (spec)

**Date :** 2026-08-11
**Client :** Doukouré (Dkr) — association PAACIV
**Statut :** Validé pour rédaction du plan d'implémentation
**Phase :** 4 · Éditorial (articles, reportages vidéo, événements)
**Spec maîtresse :** `docs/superpowers/specs/2026-08-07-paaciv-site-patrimoine-design.md` (§13 volet éditorial, §10 modèle de données, §14 back-office)

---

## 1. Objet

Construire le volet **média** du site : articles, reportages vidéo et événements, avec
leurs pages publiques et leur back-office. C'est la 4ᵉ des 6 phases du §19 de la spec
maîtresse ; les Phases 1 à 3 (fondations, cœur carte/archives/patrimoine, architectes)
sont livrées et fusionnées dans `main`.

Ce document ne rouvre pas ce que la spec maîtresse a déjà tranché. Il **complète** ses
trous et **fixe** les décisions prises en brainstorming le 2026-08-11.

## 2. Décisions prises en brainstorming

| Sujet | Décision | Raison |
|---|---|---|
| Structure | **Trois index séparés**, pas de page `/actualites`. « Actualités » devient un **menu déroulant** dans le header | URLs thématiques et SEO par section ; un fil mélangé pourra s'ajouter plus tard |
| Reportages | **Page de détail `/reportages/[slug]`** (la spec maîtresse ne la listait pas — oubli) | Rend chaque reportage partageable et indexable ; cohérent avec articles et événements |
| Vidéos YouTube | **Façade « clic pour lire »** : miniature + bouton, iframe `youtube-nocookie.com` chargée au clic seulement | Aucun cookie Google avant action utilisateur (pas de bandeau de consentement) et ~500 Ko économisés par page |
| Catégories d'articles | **Table de référence, une catégorie par article** | Cohérent avec `types`/`programmes`/`epoques` déjà en place ; évite la dérive des étiquettes libres avec un seul rédacteur |
| Événements | **Deux sections « À venir » / « Passés »** sur le même index, les passés restent publiés | Les activités passées sont la vitrine de l'association ; aucune action manuelle quand une date passe |
| Liaisons | **Un seul patrimoine lié** (clé optionnelle), plus un bloc « À lire / À voir » sur la fiche patrimoine | Le sens utile de la relation est la lecture inverse ; N–N coûterait 2 tables et 2 UI pour un volume inconnu |
| Architecture | **Trois tables + primitives d'UI partagées** | Contraintes SQL propres à chaque type, sans tripler l'interface |
| Seed vidéo | **Placeholders marqués démo**, remplacés par Dkr dans l'admin | Ne bloque pas l'implémentation ; à nettoyer avant mise en ligne |

## 3. Modèle de données

Paires `*_fr`/`*_en` = bilingues (EN facultatif → repli FR via `champ`).
Toutes les tables : RLS activée à la création, `statut ∈ {brouillon, publie}`,
`created_at`/`updated_at` avec le trigger `public.touch_updated_at()` existant.

### `categories_article` (table de référence)
`id` (slug, PK text) · `nom_fr` · `nom_en` · `ordre`.
Seed : `histoires`, `temps-forts`, `archives`, `livres` (§13 spec maîtresse). Extensible.
Lecture publique inconditionnelle, comme les autres tables de référence.

### `articles`
`id` (uuid) · `slug` (unique) · `titre_fr/en` (fr requis) · `chapo_fr/en` · `corps_fr/en`
(riche) · `image_couverture` · `categorie_id` → `categories_article` (optionnel,
`on delete set null`) · `patrimoine_id` → `patrimoine` (optionnel, `on delete set null`) ·
`date_publication` (date) · `statut` · timestamps.

Le **chapô est du texte simple**, pas du HTML riche : il alimente les cartes d'index et la
`meta description`, où du balisage serait nuisible.

**La visibilité dépend de `statut` seul.** `date_publication` est une métadonnée
d'affichage et de tri : elle peut être antidatée, et un article publié dont la date est
dans le futur **apparaît quand même**. Pas de publication programmée en v1 — elle
supposerait une tâche planifiée, hors périmètre. Même règle pour `reportages.date`.

### `reportages`
`id` · `slug` (unique) · `titre_fr/en` · `video_url` · `description_fr/en` (riche) ·
`patrimoine_id` (optionnel, `on delete set null`) · `date` · `statut` · timestamps.

Pas de champ image : la miniature se déduit de l'identifiant vidéo.

### `evenements`
`id` · `slug` (unique) · `titre_fr/en` · `description_fr/en` (riche) · `image` · `lieu` ·
`date_debut` (date, requis) · `date_fin` (date, optionnel — événement d'un jour) ·
`statut` · timestamps.

**`statut_temporel` n'est pas stocké.** Il se calcule à l'affichage à partir des dates,
sinon il devient faux dès le lendemain.

### Index
`statut` sur les trois tables ; `date_publication` / `date` / `date_debut` pour le tri ;
`categorie_id` et `patrimoine_id` pour les jointures et filtres.

## 4. Sécurité (RLS)

Alignée sur le patrimoine et les architectes :

- **anon** : `select` uniquement sur `statut = 'publie'` (trois tables) ; lecture libre de
  `categories_article`.
- **authenticated** : accès complet (`for all using (true) with check (true)`).
- Aucune écriture publique.

Un brouillon ne doit être atteignable ni par l'index, ni par URL directe (→ 404), ni via
le bloc « À lire / À voir » de la fiche patrimoine.

## 5. Intégration YouTube

Module pur `paaciv/lib/youtube.ts` :

- `extraireIdYoutube(url: string | null): string | null` — accepte `watch?v=`, `youtu.be/`,
  `/embed/`, `/shorts/` ; renvoie `null` si l'URL est illisible ou l'identifiant invalide.
- `miniatureYoutube(id): string` → `https://i.ytimg.com/vi/<id>/hqdefault.jpg`
  (aucune clé API nécessaire).
- `lecteurYoutube(id): string` → `https://www.youtube-nocookie.com/embed/<id>`.

Composant client `components/editorial/FacadeVideo.tsx` : affiche la miniature et un bouton
de lecture accessible ; **n'insère l'iframe qu'au clic**. L'attribut `title` de l'iframe
porte le titre du reportage.

L'URL est **validée à l'enregistrement** dans la server action : une URL non reconnue est
refusée avec un message, jamais stockée silencieusement.

**Remplacement d'un existant.** La fiche patrimoine porte déjà un helper local
`embedYoutube` (`app/[locale]/patrimoine/[slug]/page.tsx:55`) : une regex plus faible
(elle ne reconnaît que `youtu.be/` et `v=`, pas `/embed/` ni `/shorts/`) qui produit une
iframe `youtube.com` chargée immédiatement. Cette phase le **supprime** au profit du module
partagé et de `FacadeVideo`. La fiche patrimoine y gagne la couverture des formes d'URL
manquantes, le domaine `nocookie` et le chargement différé — et le dépôt ne garde pas deux
implémentations concurrentes.

## 6. Pages publiques

Routes préfixées par la langue. **Toutes rendues dynamiquement** (voir §9).

| Route | Contenu |
|---|---|
| `/articles` | Grille de cartes (couverture, badge catégorie, date, titre, chapô), triée par `date_publication` décroissante. **Filtre par catégorie via l'URL**, sur le modèle de `/archives`. État vide si aucun article. |
| `/articles/[slug]` | Couverture, badge catégorie, date, titre, chapô, corps riche (`TexteRiche`), bloc « patrimoine lié » si présent, OpenGraph (image = couverture) |
| `/reportages` | Grille de vignettes YouTube avec pastille de lecture, triée par `date` décroissante |
| `/reportages/[slug]` | Façade vidéo, titre, date, description riche, bloc « patrimoine lié », OpenGraph (image = miniature YouTube) |
| `/evenements` | Section « À venir » (date croissante) puis « Passés » (décroissante). Chaque section a son état vide. |
| `/evenements/[slug]` | Image, dates formatées, lieu, description riche, OpenGraph |

**Fiche patrimoine** — nouveau bloc « À lire / À voir » listant les articles et reportages
publiés qui référencent cet édifice. Masqué si vide.

**Navigation** — le header remplace le lien mort `/actualites` par un groupe déroulant
« Actualités » vers les trois index ; le footer gagne les trois liens.

Comportements repris de l'existant : `statut='brouillon'` → `notFound()` ; slug inconnu →
404 ; `setRequestLocale(locale)` ; liens internes via `@/i18n/navigation`.

## 7. Back-office

Trois sections calquées sur l'admin architectes (Phase 3) : page liste, formulaire
`nouveau`/`[id]`, server actions `enregistrerX` / `supprimerX`. Le tableau de bord
`/admin` gagne trois liens.

| Formulaire | Champs |
|---|---|
| Article | onglets FR/EN · titre · slug (optionnel, dérivé du titre) · chapô (texte) · corps (`EditeurRiche`) · couverture (upload) · catégorie · patrimoine lié · date de publication · statut |
| Reportage | titre · slug · `video_url` **avec aperçu de la miniature dès que l'URL est reconnue** · description (`EditeurRiche`) · patrimoine lié · date · statut |
| Événement | titre · slug · description (`EditeurRiche`) · image (upload) · lieu · date début · date fin (optionnelle) · statut |

**Assainissement** : tous les champs riches passent par `richeOuNull` (`lib/admin/champs.ts`)
à l'enregistrement et par `TexteRiche` au rendu — la double barrière déjà en place.

**Retour d'erreur** : les formulaires reprennent le `catch` + région d'erreur visible
ajoutés en fin de Phase 3 (une collision de slug doit être visible, pas silencieuse).

**Médias** : bucket `patrimoine` existant, préfixes `articles/<id>/` et `evenements/<id>/`.
Les policies du bucket ne filtrent pas par préfixe (vérifié en Phase 3) — aucune migration
Storage nécessaire.

## 8. Composants partagés

- `components/editorial/CarteContenu.tsx` — carte paramétrée (visuel, badge, date, titre,
  extrait, lien), utilisée par les trois index. **Resservira en Phase 5** pour les blocs
  « Événements » et actualités de l'accueil.
- `components/editorial/FacadeVideo.tsx` — voir §5.
- Coque d'index partagée (titre, intro, grille, état vide) et page de liste admin
  paramétrée par ses colonnes, plutôt que trois copies.

Réutilisés sans modification : `EditeurRiche`, `TexteRiche`, `assainirHtml`,
`lib/admin/champs.ts`, `BoutonSupprimer`, `slugify`, `champ`, `imageUrl`, `Container`,
`Badge`.

## 9. Rendu dynamique — contrainte non négociable

Une page de contenu sans segment dynamique ni `searchParams` est **pré-rendue en statique
par Next 16** et ne revalide jamais. C'est arrivé à `/architectes` en Phase 3 et seule la
revue finale l'a vu, parce que la suite e2e tourne contre `next dev` où tout est dynamique.

Les pages de cette phase y sont **encore plus sensibles** : un index d'événements figé au
build afficherait éternellement « à venir » un événement passé.

⇒ Chaque nouvelle page publique déclare `export const dynamic = 'force-dynamic'`, et le
plan comporte une **vérification explicite de la table de routes de `npm run build`**
(`ƒ` attendu, jamais `●`).

## 10. Tests

- **Unitaires (Vitest), sur logique pure extraite :**
  - `extraireIdYoutube` — toutes les formes d'URL acceptées, rejets (URL vide, non-YouTube,
    identifiant malformé) ;
  - la partition à-venir/passé des événements, qui **prend une date de référence en
    paramètre** — sinon le test dépend du jour où on le lance et pourrit tout seul ;
  - le mapping des contenus liés d'une fiche patrimoine (filtrage des brouillons), sur le
    modèle des mappers purs de la Phase 3 : la RLS masque les lignes avant le code JS, donc
    un test d'intégration anon ne peut pas prouver un filtre applicatif.
- **Intégration BDD / RLS :** pour chacune des trois tables, un anonyme ne voit que les
  publiés et ne peut pas écrire. **Le seed contient un brouillon par table**, sinon ces
  tests sont vrais par vacuité.
- **E2E (Playwright) :** chaque index affiche le publié et masque le brouillon ; chaque page
  de détail rend ; un brouillon donne 404 en accès direct ; le filtre par catégorie
  restreint réellement les résultats ; les deux sections d'événements se répartissent
  correctement ; la façade vidéo n'insère l'iframe qu'après le clic ; un aller-retour admin
  création → persistance → **nettoyage `afterAll`** pour au moins une entité.
- Les tests de nettoyage **assertent** que la suppression a réussi (une suppression muette
  sous RLS empoisonne la campagne suivante).

Critère de sortie : `npm run lint`, `npm test`, `npm run e2e`, `npm run build` verts sur
l'arbre réel, et la table de routes vérifiée.

## 11. Hors périmètre

Pas de pagination (volume trop faible pour la justifier), pas de recherche plein texte dans
les articles, pas d'auteur/signature (un seul rédacteur), pas de fil mélangé `/actualites`,
pas de liaison N–N vers plusieurs patrimoines ni vers les architectes, pas d'envoi de
newsletter.

**Reporté en Phase 5** : accueil complet, newsletter, `/a-propos`, `/contact`, et
**`/conditions-utilisation`** — cette dernière n'était dans aucune phase alors que le footer
y renvoie depuis la Phase 1 ; elle devient obligatoire dès que la newsletter collecte des
emails (mentions légales + confidentialité). Le texte juridique est à fournir par le client.

Les liens morts actuels du header et du footer (`/a-propos`, `/contact`,
`/conditions-utilisation`) sont **laissés en l'état** jusqu'à leur phase — décision client,
le site n'étant pas encore public. Le lien `/actualites` est le seul réparé par cette phase.

## 12. À fournir par le client (aucun agent ne peut le faire)

- Les **vraies URLs YouTube** des reportages : le seed utilise des placeholders explicitement
  marqués démo, à remplacer dans le back-office avant mise en ligne.
- Les **vrais textes** d'articles et d'événements (le seed est générique).
- Le **texte des conditions d'utilisation** (Phase 5).
