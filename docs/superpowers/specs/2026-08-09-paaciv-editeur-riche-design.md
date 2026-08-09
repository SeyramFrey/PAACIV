# Spec B1 — Éditeur de texte riche (Tiptap)

**Date** : 2026-08-09
**Statut** : validé (brainstorming)
**Périmètre** : fondation transversale « texte riche » pour l'admin PAACIV, appliquée
d'abord à la **description patrimoine**. Prérequis de la **Spec B2 — Architectes**
(qui réutilisera l'éditeur et le rendu assaini pour bio/parcours/réalisations).

## Contexte

La spec produit (2026-08-07, §15) prévoit un « éditeur de texte riche (FR/EN) pour
descriptions & articles ». En Phase 2, la description patrimoine a été livrée en
`<input>` mono-ligne (`FormulairePatrimoine.tsx`), ce qui est insuffisant. L'utilisateur
veut un vrai éditeur WYSIWYG, stockant du HTML, avec rendu assaini — et l'harmoniser
avec la future saisie des architectes. Comme c'est transversal et sécurité-sensible,
on le traite comme une **spec/plan préalable** avant les Architectes.

## Décisions

- **WYSIWYG Tiptap**, stockage **HTML** (colonnes `text` existantes), rendu **assaini**.
- **Périmètre resserré** : seule la **description patrimoine** (`description_fr`/`_en`)
  devient riche maintenant. Résumé, sources, style, adresse restent des inputs simples.
- **Barre d'outils minimale** : gras, italique, titres H2/H3, listes (puces / numérotées),
  lien. Pas d'images/tableaux/couleurs (YAGNI).
- **Double assainissement** : à l'enregistrement (server action) ET au rendu (composant
  serveur). On ne stocke jamais de HTML non assaini ; on ne rend jamais sans ré-assainir.
- **SSR sûr** : `'use client'` + `useEditor({ immediatelyRender: false })` (pattern
  officiel Tiptap pour Next.js — évite les mismatch d'hydratation ; Tiptap = ProseMirror
  côté client, pas de web worker, donc pas de souci Turbopack type MapLibre).

## Dépendances

- `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/pm`
  (éditeur, client). Versions épinglées compatibles React 19, vérifiées à l'implémentation.
- `sanitize-html` (assainissement, côté serveur Node — utilisable en server action et
  server component).

## Architecture & composants

### 1. Assainissement — `lib/richtext.ts`

- `assainirHtml(html: string | null | undefined): string` — via `sanitize-html`.
  - `allowedTags` : `p, br, strong, em, u, s, h2, h3, ul, ol, li, blockquote, a`.
  - `allowedAttributes` : `a: ['href', 'target', 'rel']` (rien d'autre).
  - `allowedSchemes` : `http, https, mailto`.
  - `transformTags.a` : force `rel="noopener nofollow"` et `target="_blank"`.
  - Tout le reste (`script`, `style`, `img`, `iframe`, attributs `on*`, styles inline)
    est supprimé. Entrée nulle/vide → `''`.
- Fonction pure, sans I/O : testable directement.

### 2. Éditeur admin — `components/admin/EditeurRiche.tsx` (`'use client'`)

- Props : `{ name: string; defaultValue?: string; ariaLabel?: string }`.
- `useEditor({ extensions: [StarterKit (configuré), Link], content: defaultValue ?? '',
  immediatelyRender: false })`. Rend `null`/placeholder tant que `editor` est nul.
- `StarterKit` configuré pour n'exposer que le nécessaire (titres limités à H2/H3 ;
  pas de codeBlock/horizontalRule). `Link` en `openOnClick: false`, `autolink: true`.
- **Barre d'outils** : boutons gras, italique, H2, H3, liste à puces, liste numérotée,
  lien (prompt d'URL), effacer le format. Chaque bouton reflète l'état actif (`isActive`).
- **Intégration formulaire** : un `<input type="hidden" name={name} />` **contrôlé**,
  dont la `value` suit `editor.getHTML()` via `onUpdate`. Ainsi le
  `new FormData(form)` existant de `FormulairePatrimoine` capture le HTML sans changer
  la logique `onSubmit`.
- Accessibilité : `aria-label` sur la zone éditable ; boutons avec `aria-pressed`.

### 3. Rendu public — `components/patrimoine/TexteRiche.tsx` (composant serveur)

- Props : `{ html: string | null | undefined; className?: string }`.
- Ré-assainit via `assainirHtml`, puis `dangerouslySetInnerHTML` dans un conteneur
  stylé `prose` (classes Tailwind cohérentes avec la fiche). Retourne `null` si vide.
- C'est la **seule** voie de rendu de HTML riche côté public.

### 4. Intégration `FormulairePatrimoine.tsx`

- Remplace les deux `champ('description_fr'|'description_en', …)` (inputs) par
  `<EditeurRiche name="description_fr" defaultValue={initial?.description_fr ?? ''} … />`
  et l'équivalent `_en`, dans leurs onglets FR/EN respectifs.
- Le reste du formulaire (onglets, autres champs, `onSubmit`, `MiniCarte`) est inchangé.

### 5. Enregistrement — `app/[locale]/admin/patrimoine/actions.ts`

- Dans `enregistrerPatrimoine`, `description_fr`/`description_en` passent par
  `assainirHtml(...)` (au lieu de `texteOuNull` brut) avant insertion/mise à jour ;
  résultat vide → `null`.

### 6. Fiche — `app/[locale]/patrimoine/[slug]/page.tsx`

- Le bloc description (actuellement `whitespace-pre-line`) devient
  `<TexteRiche html={champ(p.description_fr, p.description_en, locale)} />`.

## Flux de données

1. Admin saisit → Tiptap produit du HTML → input caché → `FormData`.
2. `enregistrerPatrimoine` **assainit** → stocke le HTML assaini en base.
3. Fiche (serveur) lit le HTML → `TexteRiche` **ré-assainit** → `dangerouslySetInnerHTML`.

## Legacy / migration

- Les descriptions existantes (texte brut mono-ligne issu du seed) restent valides :
  assainies, elles s'affichent tel quel (pas de balise → rendu texte). **Aucune migration
  de données requise.**

## Gestion d'erreurs & sécurité

- XSS : neutralisé par la double barrière (allowlist stricte, pas de `script`/`on*`/
  `javascript:`), même si du HTML non assaini arrivait en base par une autre voie.
- L'éditeur est réservé à l'admin authentifié (routes `/admin` déjà protégées).
- Liens sortants forcés en `rel="noopener nofollow" target="_blank"`.

## Tests

- **Unit (sécurité — cœur)** `lib/__tests__/richtext.test.ts` : `assainirHtml`
  - supprime `<script>…</script>` et le texte de script ;
  - supprime `onerror=`/handlers `on*` ;
  - neutralise un `href="javascript:…"` ;
  - conserve `<strong>`, `<h2>`, `<ul><li>` ;
  - force `rel="noopener nofollow"` + `target="_blank"` sur `<a href>` ;
  - entrée nulle/vide → `''`.
- **Unit** `components/patrimoine/__tests__/TexteRiche.test.tsx` : rend le HTML assaini
  (contenu autorisé présent, script absent) ; vide → ne rend rien.
- **E2E léger** :
  - la fiche d'un patrimoine publié rend toujours sa description ;
  - le formulaire admin patrimoine monte l'éditeur (barre d'outils visible).

## Hors périmètre (YAGNI)

- Images / tableaux / couleurs dans l'éditeur.
- Application aux autres champs (résumé, sources, style) ou aux articles (Phase éditoriale).
- Migration des données existantes.

## Suite

Après merge : **Spec B2 — Architectes** (tables `architectes` + `patrimoine_architecte`
N–N, pages `/architectes` frise + fiches, admin CRUD réutilisant `EditeurRiche` pour
bio/parcours/réalisations et `TexteRiche` pour le rendu, liaison dans le formulaire
patrimoine, remplissage de l'emplacement architectes réservé dans la fiche, seed de démo).
Voir `docs/superpowers/specs/2026-08-07-paaciv-site-patrimoine-design.md` §12.
