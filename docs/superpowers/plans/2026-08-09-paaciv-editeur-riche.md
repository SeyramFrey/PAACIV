# Éditeur de texte riche (Tiptap) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doter l'admin PAACIV d'un éditeur de texte riche (Tiptap) pour la description patrimoine, avec stockage HTML assaini et rendu public sécurisé.

**Architecture:** Un assainisseur pur partagé (`lib/richtext.ts`, via `sanitize-html`) est appliqué en double barrière : à l'enregistrement (server action) et au rendu (composant serveur `TexteRiche`). L'éditeur admin (`EditeurRiche`, Tiptap `'use client'`) produit du HTML synchronisé dans un input caché capté par le `FormData` existant. La description patrimoine, aujourd'hui un `<input>` mono-ligne, devient riche ; la fiche la rend via `TexteRiche`.

**Tech Stack:** Next.js 16.3 (App Router), React 19.2, TypeScript, Tailwind v4, Tiptap 3 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/pm`), `sanitize-html`, Vitest (+ jsdom, @testing-library/react), Playwright (workers: 2, projet e2e authentifié via storageState).

## Global Constraints

- Répertoire de travail du code : `paaciv/` (toutes les commandes se lancent depuis `paaciv/`).
- **Double assainissement obligatoire** : on ne stocke jamais de HTML non assaini (server action) ET on ré-assainit au rendu (`TexteRiche`). Allowlist stricte, aucun `script`/`style`/`img`/`iframe`/attribut `on*`/schéma `javascript:`.
- Éditeur Tiptap : composant `'use client'` avec `useEditor({ immediatelyRender: false })` (pattern officiel Next.js — évite le mismatch d'hydratation).
- **Tiptap 3** (compat React 19). Ne pas installer Tiptap 2 (peerDeps React ≤18 → échec d'install).
- Pas d'ajout du plugin `@tailwindcss/typography` : styliser le rendu riche via variantes arbitraires Tailwind (`[&_ul]:list-disc`, etc.).
- Repo lint `@typescript-eslint/no-explicit-any` — pas de nouveau `any`.
- Tests : `npm test` (Vitest), `npm run e2e` (Playwright), `npm run lint`. Les specs e2e admin tournent sous le projet `e2e` (auth via `playwright/.auth/admin.json`, cf. `tests/auth.setup.ts`).
- Commits fréquents (un par tâche min.), messages FR, préfixe conventionnel, terminés par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Assainisseur `lib/richtext.ts`

**Files:**
- Modify: `paaciv/package.json` (dépendances)
- Create: `paaciv/lib/richtext.ts`
- Test: `paaciv/lib/__tests__/richtext.test.ts`

**Interfaces:**
- Produces: `assainirHtml(html: string | null | undefined): string` — assainit via `sanitize-html` avec une allowlist stricte ; entrée nulle/vide → `''` ; liens forcés en `rel="noopener nofollow" target="_blank"`.

- [ ] **Step 1: Install dependencies**

Run (depuis `paaciv/`):
```bash
npm install sanitize-html && npm install -D @types/sanitize-html
```
Vérifier que l'installation réussit sans erreur de peer-deps.

- [ ] **Step 2: Write the failing test**

```ts
// paaciv/lib/__tests__/richtext.test.ts
import { describe, it, expect } from 'vitest'
import { assainirHtml } from '@/lib/richtext'

describe('assainirHtml', () => {
  it('supprime les scripts (balise et contenu)', () => {
    const out = assainirHtml('<p>Bonjour</p><script>alert(1)</script>')
    expect(out).toContain('<p>Bonjour</p>')
    expect(out).not.toContain('script')
    expect(out).not.toContain('alert(1)')
  })

  it('supprime les gestionnaires on*', () => {
    const out = assainirHtml('<p onclick="evil()">x</p>')
    expect(out).not.toContain('onclick')
    expect(out).toContain('x')
  })

  it('neutralise un href javascript:', () => {
    const out = assainirHtml('<a href="javascript:alert(1)">lien</a>')
    expect(out).not.toContain('javascript:')
  })

  it('conserve le formatage autorisé', () => {
    const out = assainirHtml('<h2>T</h2><strong>gras</strong><ul><li>a</li></ul>')
    expect(out).toContain('<h2>T</h2>')
    expect(out).toContain('<strong>gras</strong>')
    expect(out).toContain('<li>a</li>')
  })

  it('force rel et target sur les liens', () => {
    const out = assainirHtml('<a href="https://x.test">y</a>')
    expect(out).toContain('rel="noopener nofollow"')
    expect(out).toContain('target="_blank"')
  })

  it('entrée nulle ou vide → chaîne vide', () => {
    expect(assainirHtml(null)).toBe('')
    expect(assainirHtml(undefined)).toBe('')
    expect(assainirHtml('')).toBe('')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd paaciv && npx vitest run lib/__tests__/richtext.test.ts`
Expected: FAIL (module `@/lib/richtext` introuvable).

- [ ] **Step 4: Implement the sanitizer**

```ts
// paaciv/lib/richtext.ts
import sanitizeHtml from 'sanitize-html'

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ['p', 'br', 'strong', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Force la sécurité des liens sortants (fusionne avec les attributs existants).
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener nofollow', target: '_blank' }),
  },
}

/** Assainit du HTML riche (double barrière : enregistrement + rendu). */
export function assainirHtml(html: string | null | undefined): string {
  if (!html) return ''
  return sanitizeHtml(html, OPTIONS)
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd paaciv && npx vitest run lib/__tests__/richtext.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add paaciv/package.json paaciv/package-lock.json paaciv/lib/richtext.ts paaciv/lib/__tests__/richtext.test.ts
git commit -m "feat(richtext): assainisseur HTML partagé (sanitize-html, allowlist stricte)"
```

---

### Task 2: Rendu public `TexteRiche` + intégration fiche

**Files:**
- Create: `paaciv/components/patrimoine/TexteRiche.tsx`
- Test: `paaciv/components/patrimoine/__tests__/TexteRiche.test.tsx`
- Modify: `paaciv/app/[locale]/patrimoine/[slug]/page.tsx` (bloc description)

**Interfaces:**
- Consumes: `assainirHtml` (Task 1).
- Produces: `TexteRiche({ html, className }: { html: string | null | undefined; className?: string })` — composant serveur ; ré-assainit puis `dangerouslySetInnerHTML` dans un conteneur stylé (variantes arbitraires) ; retourne `null` si vide.

- [ ] **Step 1: Write the failing test**

```tsx
// paaciv/components/patrimoine/__tests__/TexteRiche.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'

describe('TexteRiche', () => {
  it('rend le HTML assaini et retire le script', () => {
    const { container } = render(<TexteRiche html={'<p>Salut</p><script>alert(1)</script>'} />)
    expect(container.querySelector('p')?.textContent).toBe('Salut')
    expect(container.querySelector('script')).toBeNull()
  })

  it('conserve les listes et titres autorisés', () => {
    const { container } = render(<TexteRiche html={'<h2>T</h2><ul><li>a</li></ul>'} />)
    expect(container.querySelector('h2')?.textContent).toBe('T')
    expect(container.querySelector('li')?.textContent).toBe('a')
  })

  it('vide → ne rend rien', () => {
    const { container } = render(<TexteRiche html={null} />)
    expect(container.firstChild).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd paaciv && npx vitest run components/patrimoine/__tests__/TexteRiche.test.tsx`
Expected: FAIL (composant introuvable).

- [ ] **Step 3: Implement the component**

```tsx
// paaciv/components/patrimoine/TexteRiche.tsx
import { assainirHtml } from '@/lib/richtext'

const STYLES =
  'max-w-none text-encre/90 ' +
  '[&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-brun ' +
  '[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-brun ' +
  '[&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 ' +
  '[&_li]:mb-1 [&_a]:text-brun [&_a]:underline ' +
  '[&_blockquote]:border-l-4 [&_blockquote]:border-or [&_blockquote]:pl-4 [&_blockquote]:italic'

/** Rendu public de HTML riche : ré-assaini avant injection (défense en profondeur). */
export function TexteRiche({ html, className }: { html: string | null | undefined; className?: string }) {
  const propre = assainirHtml(html)
  if (!propre) return null
  return (
    <div
      className={className ? `${className} ${STYLES}` : STYLES}
      dangerouslySetInnerHTML={{ __html: propre }}
    />
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd paaciv && npx vitest run components/patrimoine/__tests__/TexteRiche.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire into the fiche**

Dans `paaciv/app/[locale]/patrimoine/[slug]/page.tsx` :

Ajouter l'import :
```tsx
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
```

Remplacer le bloc description actuel :
```tsx
          {champ(p.description_fr, p.description_en, locale) && (
            <div className="prose max-w-none whitespace-pre-line text-encre/90">
              {champ(p.description_fr, p.description_en, locale)}
            </div>
          )}
```
par :
```tsx
          <TexteRiche html={champ(p.description_fr, p.description_en, locale)} />
```

- [ ] **Step 6: Verify lint + fiche e2e (no regression)**

Run: `cd paaciv && npm run lint && npx vitest run && npx playwright test tests/fiche.spec.ts`
Expected: lint OK, unit PASS, fiche e2e PASS (la fiche rend toujours, description via `TexteRiche`).

- [ ] **Step 7: Commit**

```bash
git add paaciv/components/patrimoine/TexteRiche.tsx paaciv/components/patrimoine/__tests__/TexteRiche.test.tsx "paaciv/app/[locale]/patrimoine/[slug]/page.tsx"
git commit -m "feat(fiche): rendu de la description via TexteRiche (HTML assaini)"
```

---

### Task 3: Éditeur Tiptap + intégration formulaire + assainissement à l'enregistrement

**Files:**
- Modify: `paaciv/package.json` (dépendances Tiptap)
- Create: `paaciv/components/admin/EditeurRiche.tsx`
- Modify: `paaciv/components/admin/FormulairePatrimoine.tsx` (champs description FR/EN)
- Modify: `paaciv/app/[locale]/admin/patrimoine/actions.ts` (assainir description à l'enregistrement)
- Test: `paaciv/tests/admin-editeur.spec.ts` (create)

**Interfaces:**
- Consumes: `assainirHtml` (Task 1).
- Produces: `EditeurRiche({ name, defaultValue, ariaLabel }: { name: string; defaultValue?: string; ariaLabel?: string })` — éditeur Tiptap `'use client'` qui synchronise `editor.getHTML()` dans un `<input type="hidden" name={name}>`.

- [ ] **Step 1: Install Tiptap 3**

Run (depuis `paaciv/`):
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/pm
```
Vérifier l'install (compat React 19, pas d'erreur ERESOLVE). **Note de version** : en Tiptap 3, `StarterKit` embarque de nombreuses extensions (dont le lien). Avant d'écrire le composant, vérifier ce que `StarterKit` inclut pour la version installée (docs ou `node_modules/@tiptap/starter-kit`) et **éviter toute double-inscription d'extension** (sinon avertissement ProseMirror « duplicate extension »). Si `StarterKit` inclut déjà `Link`, le configurer via `StarterKit.configure({ link: { openOnClick: false } })` ; sinon installer et ajouter `@tiptap/extension-link` séparément.

- [ ] **Step 2: Write the failing e2e test**

```ts
// paaciv/tests/admin-editeur.spec.ts
import { test, expect } from '@playwright/test'

test('l\'éditeur riche est monté dans le formulaire patrimoine', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  // La barre d'outils Tiptap est rendue côté client après hydratation.
  await expect(page.getByRole('button', { name: 'Gras' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Liste à puces' })).toBeVisible()
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd paaciv && npx playwright test tests/admin-editeur.spec.ts`
Expected: FAIL (pas de bouton « Gras » — éditeur pas encore intégré).

- [ ] **Step 4: Implement `EditeurRiche`**

Template (adapter la config Link à la version Tiptap installée, cf. Step 1) :
```tsx
// paaciv/components/admin/EditeurRiche.tsx
'use client'

import { useState } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export function EditeurRiche({
  name,
  defaultValue = '',
  ariaLabel,
}: {
  name: string
  defaultValue?: string
  ariaLabel?: string
}) {
  const [html, setHtml] = useState(defaultValue)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // heading limité à H2/H3 ; pas de codeBlock/horizontalRule.
      // Si StarterKit v3 inclut Link, ajouter `link: { openOnClick: false }` ici.
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        horizontalRule: false,
      }),
    ],
    content: defaultValue,
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  })

  const btn = (actif: boolean, onClick: () => void, label: string) => (
    <button
      type="button"
      aria-label={label}
      aria-pressed={actif}
      onClick={onClick}
      className={`rounded border border-encre/20 px-2 py-1 text-sm ${actif ? 'bg-or text-encre' : 'bg-white text-brun'}`}
    >
      {label}
    </button>
  )

  const lien = (ed: Editor) => {
    const url = window.prompt('URL du lien')
    if (url === null) return
    if (url === '') ed.chain().focus().unsetLink().run()
    else ed.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="rounded-xl border border-encre/20 bg-white">
      <input type="hidden" name={name} value={html} readOnly />
      {editor && (
        <div className="flex flex-wrap gap-1 border-b border-encre/10 p-2">
          {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Gras')}
          {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italique')}
          {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Titre 2')}
          {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Titre 3')}
          {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Liste à puces')}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Liste numérotée')}
          {btn(editor.isActive('link'), () => lien(editor), 'Lien')}
          {btn(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), 'Effacer le format')}
        </div>
      )}
      <EditorContent
        editor={editor}
        aria-label={ariaLabel}
        className="min-h-[8rem] px-3 py-2 [&_.ProseMirror]:min-h-[6rem] [&_.ProseMirror]:outline-none [&_.ProseMirror_h2]:font-serif [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6"
      />
    </div>
  )
}
```
Si `setLink`/`toggleBold` etc. ne sont pas typés (selon les extensions incluses), s'assurer que les extensions correspondantes sont bien présentes dans `StarterKit` de la version installée (Link notamment).

- [ ] **Step 5: Integrate into `FormulairePatrimoine`**

Dans `paaciv/components/admin/FormulairePatrimoine.tsx` :

Ajouter l'import :
```tsx
import { EditeurRiche } from '@/components/admin/EditeurRiche'
```

Dans l'onglet FR (`grid gap-4 sm:grid-cols-2`), remplacer `{champ('description_fr', t('description'))}` par :
```tsx
        <div className="flex flex-col text-sm sm:col-span-2">
          <span className="mb-1 font-semibold">{t('description')}</span>
          <EditeurRiche name="description_fr" defaultValue={initial?.description_fr ?? ''} ariaLabel={t('description')} />
        </div>
```

Dans l'onglet EN, remplacer `{champ('description_en', t('description'))}` par l'équivalent :
```tsx
        <div className="flex flex-col text-sm sm:col-span-2">
          <span className="mb-1 font-semibold">{t('description')}</span>
          <EditeurRiche name="description_en" defaultValue={initial?.description_en ?? ''} ariaLabel={t('description')} />
        </div>
```

- [ ] **Step 6: Sanitize on save**

Dans `paaciv/app/[locale]/admin/patrimoine/actions.ts` :

Ajouter l'import :
```ts
import { assainirHtml } from '@/lib/richtext'
```

Ajouter un helper module-local (non exporté, comme `texteOuNull`) :
```ts
function assainirDescription(v: FormDataEntryValue | null): string | null {
  const propre = assainirHtml((v ?? '').toString())
  return propre.trim() === '' ? null : propre
}
```

Dans `enregistrerPatrimoine`, remplacer :
```ts
    description_fr: texteOuNull(formData.get('description_fr')),
    description_en: texteOuNull(formData.get('description_en')),
```
par :
```ts
    description_fr: assainirDescription(formData.get('description_fr')),
    description_en: assainirDescription(formData.get('description_en')),
```

- [ ] **Step 7: Run test to verify it passes + lint + build**

Run: `cd paaciv && npm run lint && npx playwright test tests/admin-editeur.spec.ts && npm run build`
Expected: lint OK ; `admin-editeur` PASS (barre d'outils visible) ; `next build` réussit (valide l'intégration Tiptap client/SSR sous Turbopack).
Si `next build` échoue sur un souci d'hydratation/SSR Tiptap, vérifier `immediatelyRender: false` et le garde `editor &&` avant la barre d'outils.

- [ ] **Step 8: Full suite**

Run: `cd paaciv && npm test && npm run e2e`
Expected: tous les tests unit + e2e PASS (dont `fiche`, `admin-patrimoine`, `admin-editeur`).

- [ ] **Step 9: Commit**

```bash
git add paaciv/package.json paaciv/package-lock.json paaciv/components/admin/EditeurRiche.tsx paaciv/components/admin/FormulairePatrimoine.tsx "paaciv/app/[locale]/admin/patrimoine/actions.ts" paaciv/tests/admin-editeur.spec.ts
git commit -m "feat(admin): éditeur riche Tiptap pour la description patrimoine + assainissement à l'enregistrement"
```

---

## Self-Review

**Spec coverage :**
- Assainisseur `lib/richtext.ts` (allowlist stricte, liens forcés) → Task 1. ✔
- `TexteRiche` rendu public ré-assaini + intégration fiche → Task 2. ✔
- `EditeurRiche` Tiptap (`immediatelyRender: false`, barre minimale) → Task 3. ✔
- Intégration `FormulairePatrimoine` (input caché capté par FormData) → Task 3. ✔
- Assainissement à l'enregistrement (server action) → Task 3. ✔
- Double barrière (save + render) → Tasks 2 + 3. ✔
- Périmètre resserré (description patrimoine seule) → Tasks 2/3. ✔
- Legacy sans migration (texte brut reste valide, assaini au rendu) → couvert par `TexteRiche` (Task 2). ✔
- Tests : sanitizer (sécurité), TexteRiche, éditeur monté (e2e), fiche non régressée → Tasks 1/2/3. ✔

**Placeholder scan :** aucun TBD/TODO ; code fourni. La seule adaptation laissée à l'implémenteur (config Link selon la version Tiptap 3 installée) est explicite et justifiée par la dérive de version, avec instruction de vérification.

**Type consistency :** `assainirHtml(html: string|null|undefined): string` défini en Task 1, consommé identiquement en Tasks 2 (TexteRiche) et 3 (action) ; `EditeurRiche` produit un `<input name={name}>` capté par le `new FormData(form)` existant, cohérent avec les champs `description_fr/_en` lus par `enregistrerPatrimoine`. ✔

**Note :** Tasks 1 et 3 modifient toutes deux `package.json` (dépendances distinctes : sanitize-html en T1, Tiptap en T3) — exécuter dans l'ordre.
