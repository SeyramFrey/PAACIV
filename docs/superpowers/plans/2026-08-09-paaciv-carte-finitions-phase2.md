# Carte & finitions Phase 2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger la carte (satellite, détail via MapTiler, survol enrichi), ajouter une barre de filtres sur la carte et un débounce sur la recherche des archives.

**Architecture:** Le fond de carte passe à MapTiler (style vectoriel + tuiles satellite) avec **fallback automatique OpenFreeMap/Esri si `NEXT_PUBLIC_MAPTILER_KEY` est absente**. Le bug satellite est corrigé en insérant la couche raster **sans `beforeId`** (au-dessus du fond, sous les points). Les filtres carte sont un **état client** dans `CarteClient` qui re-fetch `/api/carte/points` et met à jour la source GeoJSON via `setData` (aucun remount WebGL). Un hook `useDebouncedCallback` partagé sert la recherche carte + archives.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, next-intl, maplibre-gl v4, Supabase, Vitest (+ jsdom, @testing-library/react), Playwright (workers: 2).

## Global Constraints

- Répertoire de travail du code : `paaciv/` (toutes les commandes se lancent depuis `paaciv/`).
- Fallback obligatoire : sans `NEXT_PUBLIC_MAPTILER_KEY`, la carte doit se charger (style OpenFreeMap, satellite Esri). Les tests CI tournent **sans** clé.
- Popup construit en **DOM sûr** : jamais `setHTML`/`innerHTML` avec des données BDD ; uniquement `textContent` / création d'éléments.
- L'effet d'initialisation de la carte reste **mount-only** (`[]`) ; router/locale/typeInfo lus via des refs. Ne pas ajouter de dépendances qui recréeraient la carte.
- Ne pas modifier la version de maplibre-gl (v4, imports nommés).
- Commits fréquents (un par tâche minimum), messages en français, préfixe conventionnel.
- Tests : `npm test` (Vitest unit), `npm run e2e` (Playwright). Lint : `npm run lint`.
- Terminer chaque commit par la ligne `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

### Task 1: Hook `useDebouncedCallback`

**Files:**
- Create: `paaciv/lib/hooks/useDebouncedCallback.ts`
- Test: `paaciv/lib/hooks/__tests__/useDebouncedCallback.test.ts`

**Interfaces:**
- Produces: `useDebouncedCallback<A extends unknown[]>(callback: (...args: A) => void, delay: number): (...args: A) => void` — retourne une fonction stable qui n'appelle `callback` (dernière référence connue) qu'après `delay` ms sans nouvel appel ; nettoie le timer au démontage.

- [ ] **Step 1: Write the failing test**

```ts
// paaciv/lib/hooks/__tests__/useDebouncedCallback.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('n\'appelle le callback qu\'une fois, avec les derniers arguments', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 300))
    result.current('a')
    result.current('b')
    result.current('c')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('utilise la dernière référence du callback', () => {
    const premier = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 200), {
      initialProps: { cb: premier },
    })
    result.current('x')
    rerender({ cb: second })
    vi.advanceTimersByTime(200)
    expect(premier).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('x')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd paaciv && npx vitest run lib/hooks/__tests__/useDebouncedCallback.test.ts`
Expected: FAIL (module introuvable / `useDebouncedCallback` non défini).

- [ ] **Step 3: Write minimal implementation**

```ts
// paaciv/lib/hooks/useDebouncedCallback.ts
import { useEffect, useMemo, useRef } from 'react'

export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return useMemo(
    () =>
      (...args: A) => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => cbRef.current(...args), delay)
      },
    [delay],
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd paaciv && npx vitest run lib/hooks/__tests__/useDebouncedCallback.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add paaciv/lib/hooks/useDebouncedCallback.ts paaciv/lib/hooks/__tests__/useDebouncedCallback.test.ts
git commit -m "feat(hooks): useDebouncedCallback partagé (carte + archives)"
```

---

### Task 2: Extraire `chargerReferences` dans un module partagé

Refactor DRY : `chargerReferences` est aujourd'hui défini localement dans `archives/page.tsx` ; la carte en a besoin aussi. On l'extrait sans changer le comportement.

**Files:**
- Create: `paaciv/lib/data/references.ts`
- Modify: `paaciv/app/[locale]/archives/page.tsx:9-23` (supprimer la fonction locale, importer le module)

**Interfaces:**
- Produces: `type ReferencesFiltres = { types: Ref[]; programmes: Ref[]; districts: Ref[]; epoques: Ref[] }` et `async function chargerReferences(): Promise<ReferencesFiltres>`.
- Consumes: `createServerClient` (`@/lib/supabase/server`), `Ref` (`@/lib/data/patrimoine`).

- [ ] **Step 1: Create the module**

```ts
// paaciv/lib/data/references.ts
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

export type ReferencesFiltres = {
  types: Ref[]
  programmes: Ref[]
  districts: Ref[]
  epoques: Ref[]
}

export async function chargerReferences(): Promise<ReferencesFiltres> {
  const sb = await createServerClient()
  const [types, programmes, districts, epoques] = await Promise.all([
    sb.from('types').select('*').order('ordre'),
    sb.from('programmes').select('*').order('ordre'),
    sb.from('districts').select('*').order('ordre'),
    sb.from('epoques').select('*').order('ordre'),
  ])
  return {
    types: (types.data ?? []) as Ref[],
    programmes: (programmes.data ?? []) as Ref[],
    districts: (districts.data ?? []) as Ref[],
    epoques: (epoques.data ?? []) as Ref[],
  }
}
```

- [ ] **Step 2: Update archives page to use it**

Dans `paaciv/app/[locale]/archives/page.tsx` : supprimer la fonction locale `chargerReferences` (lignes ~9-23) et son type `Ref` s'il n'est plus utilisé ailleurs dans le fichier, puis ajouter l'import :

```ts
import { chargerReferences } from '@/lib/data/references'
```

Le reste du fichier (`Promise.all([listePatrimoine(...), chargerReferences()])`) est inchangé.

- [ ] **Step 3: Run lint + existing tests**

Run: `cd paaciv && npm run lint && npx vitest run && npx playwright test tests/archives.spec.ts`
Expected: lint OK, unit PASS, e2e archives PASS (comportement inchangé).

- [ ] **Step 4: Commit**

```bash
git add paaciv/lib/data/references.ts paaciv/app/[locale]/archives/page.tsx
git commit -m "refactor(data): extraire chargerReferences (réutilisé par la carte)"
```

---

### Task 3: Débounce de la recherche des archives

**Files:**
- Modify: `paaciv/components/patrimoine/FiltresArchives.tsx` (champ `q`)
- Test: `paaciv/tests/archives-debounce.spec.ts` (create)

**Interfaces:**
- Consumes: `useDebouncedCallback` (Task 1).

- [ ] **Step 1: Write the failing E2E test**

```ts
// paaciv/tests/archives-debounce.spec.ts
import { test, expect } from '@playwright/test'

test('la recherche archives est débouncée (une seule navigation)', async ({ page }) => {
  await page.goto('/fr/archives')
  const recherche = page.getByRole('searchbox')
  await recherche.pressSequentially('gare', { delay: 20 }) // ~80 ms < 300 ms
  // Juste après une frappe rapide, l'URL n'a pas encore le paramètre q.
  await page.waitForTimeout(150)
  expect(page.url()).not.toContain('q=gare')
  // Après le délai de débounce, la navigation a eu lieu.
  await expect(page).toHaveURL(/q=gare/)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd paaciv && npx playwright test tests/archives-debounce.spec.ts`
Expected: FAIL (l'URL contient `q=gare` immédiatement, sans débounce).

- [ ] **Step 3: Add debounce to the search field**

Dans `paaciv/components/patrimoine/FiltresArchives.tsx` :

Ajouter l'import en haut :
```ts
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'
```

Après la définition de `maj` (dans le composant), ajouter :
```ts
  const majDebounce = useDebouncedCallback(maj, 300)
```

Puis, sur l'`<input type="search">`, remplacer :
```ts
          onChange={(e) => maj('q', e.target.value)}
```
par :
```ts
          onChange={(e) => majDebounce('q', e.target.value)}
```
(Les `<select>` gardent `maj` immédiat. Le champ reste en `defaultValue` — non contrôlé — donc la frappe n'est pas bloquée.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd paaciv && npx playwright test tests/archives-debounce.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add paaciv/components/patrimoine/FiltresArchives.tsx paaciv/tests/archives-debounce.spec.ts
git commit -m "feat(archives): débounce de la recherche (300 ms)"
```

---

### Task 4: Fond MapTiler + correctif satellite + hooks de test

Change le fond de plan pour MapTiler (fallback OpenFreeMap), corrige l'insertion de la couche satellite, fait charger les 4 jeux de références par la page carte, et expose l'objet carte pour les tests E2E.

**Files:**
- Modify: `paaciv/components/carte/CarteClient.tsx`
- Modify: `paaciv/app/[locale]/carte/page.tsx`
- Modify: `paaciv/.env.local.example`
- Test: `paaciv/tests/carte-satellite.spec.ts` (create)

**Interfaces:**
- La prop de `CarteClient` passe de `{ types: Ref[]; locale: string }` à `{ options: ReferencesFiltres; locale: string }`. La légende utilise `options.types`.
- Produces (pour tests et tâches suivantes) : `window.__carteMap` (instance `Map`) et `window.__carteReady` (booléen, `true` à la fin du `load`).
- Consumes: `chargerReferences` / `ReferencesFiltres` (Task 2).

- [ ] **Step 1: Write the failing E2E test**

```ts
// paaciv/tests/carte-satellite.spec.ts
import { test, expect } from '@playwright/test'

test('la bascule Satellite affiche la couche raster au-dessus du fond', async ({ page }) => {
  await page.goto('/fr/carte')
  await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)

  // Avant clic : couche satellite masquée.
  const avant = await page.evaluate(() => {
    const m = (window as unknown as { __carteMap: any }).__carteMap
    return m.getLayoutProperty('satellite', 'visibility')
  })
  expect(avant).toBe('none')

  await page.getByRole('button', { name: 'Satellite' }).click()

  const etat = await page.evaluate(() => {
    const m = (window as unknown as { __carteMap: any }).__carteMap
    const ids = m.getStyle().layers.map((l: { id: string }) => l.id)
    return {
      vis: m.getLayoutProperty('satellite', 'visibility'),
      satIdx: ids.indexOf('satellite'),
      pointsIdx: ids.indexOf('points'),
    }
  })
  expect(etat.vis).toBe('visible')
  expect(etat.satIdx).toBeGreaterThan(0) // au-dessus du fond (pas en position 0)
  expect(etat.pointsIdx).toBeGreaterThan(etat.satIdx) // les points restent au-dessus du satellite
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd paaciv && npx playwright test tests/carte-satellite.spec.ts`
Expected: FAIL (`__carteReady` jamais défini → timeout ; et/ou satellite sous le fond).

- [ ] **Step 3: Update the carte page to load references and pass options**

Remplacer le contenu de `paaciv/app/[locale]/carte/page.tsx` par :

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteClient } from '@/components/carte/CarteClient'
import { chargerReferences } from '@/lib/data/references'

export default async function CartePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('carte')
  const options = await chargerReferences()

  return (
    <main className="flex-1">
      <Container className="py-6">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
      </Container>
      <CarteClient options={options} locale={locale} />
    </main>
  )
}
```

- [ ] **Step 4: Update `.env.local.example`**

Ajouter à la fin de `paaciv/.env.local.example` :
```
# Clé MapTiler (fond de carte + satellite). Si absente : fallback OpenFreeMap/Esri.
NEXT_PUBLIC_MAPTILER_KEY=
```

- [ ] **Step 5: Update `CarteClient.tsx` — style, prop, satellite, hooks de test**

Dans `paaciv/components/carte/CarteClient.tsx` :

(a) Remplacer le bloc de constantes `STYLE` / `ESRI` (lignes ~11-13) par :
```ts
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY
const STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/liberty'
const SATELLITE_TILES = MAPTILER_KEY
  ? `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`
  : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = MAPTILER_KEY
  ? '© MapTiler © OpenStreetMap contributors'
  : '© Esri'
```

(b) Changer l'import du type et la signature du composant :
```ts
import type { Ref } from '@/lib/data/patrimoine'
import type { ReferencesFiltres } from '@/lib/data/references'
```
```ts
export function CarteClient({ options, locale }: { options: ReferencesFiltres; locale: string }) {
```
Remplacer partout `types` par `options.types` dans le corps (memo `couleurExpression`, légende `options.types.map`, etc.). `nomType` reste inchangé (prend un `Ref`).

(c) Dans `map.on('load', ...)`, remplacer le bloc « Fond satellite » par (source renommée, **sans `beforeId`**) :
```ts
      // Fond satellite (masqué par défaut). Inséré SANS beforeId : il se place
      // au-dessus du fond vectoriel mais sous les couches clusters/points
      // ajoutées ensuite — c'est le correctif du bug « satellite invisible ».
      map.addSource('satellite-src', {
        type: 'raster',
        tiles: [SATELLITE_TILES],
        tileSize: 256,
        attribution: SATELLITE_ATTR,
      })
      map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite-src', layout: { visibility: 'none' } })
```

(d) Juste après `mapRef.current = map` (avant `addControl`), exposer l'instance pour les tests :
```ts
    ;(window as unknown as { __carteMap?: Map }).__carteMap = map
```

(e) Tout à la fin du handler `map.on('load', async () => { ... })`, après le `fitBounds`, ajouter :
```ts
      ;(window as unknown as { __carteReady?: boolean }).__carteReady = true
```

- [ ] **Step 6: Run lint + tests**

Run: `cd paaciv && npm run lint && npx playwright test tests/carte-satellite.spec.ts tests/carte.spec.ts`
Expected: lint OK ; `carte-satellite` PASS ; `carte.spec` toujours PASS (légende 7 types via `options.types`).

- [ ] **Step 7: Commit**

```bash
git add paaciv/components/carte/CarteClient.tsx paaciv/app/[locale]/carte/page.tsx paaciv/.env.local.example paaciv/tests/carte-satellite.spec.ts
git commit -m "fix(carte): fond MapTiler + fallback, correctif couche satellite, hooks de test"
```

---

### Task 5: Survol enrichi (constructeur de popup isolé + testé)

Extrait la construction du contenu du popup dans une fonction pure (testable en jsdom), puis la branche dans `CarteClient`.

**Files:**
- Create: `paaciv/components/carte/popup.ts`
- Test: `paaciv/components/carte/__tests__/popup.test.ts`
- Modify: `paaciv/components/carte/CarteClient.tsx` (handler `mouseenter`)

**Interfaces:**
- Produces:
  - `type PopupProps = { titre: string; ville: string | null; image: string | null; typeNom: string | null; typeCouleur: string | null }`
  - `construirePopupContenu(p: PopupProps): HTMLElement` — renvoie un `<div>` contenant, dans l'ordre : vignette `<img>` (si `image`), `<strong>` titre, badge type (pastille couleur + libellé) si `typeNom`, ligne ville si `ville`. Aucune interpolation HTML (DOM sûr).

- [ ] **Step 1: Write the failing test**

```ts
// paaciv/components/carte/__tests__/popup.test.ts
import { describe, it, expect } from 'vitest'
import { construirePopupContenu } from '@/components/carte/popup'

describe('construirePopupContenu', () => {
  it('affiche titre, badge de type et ville', () => {
    const el = construirePopupContenu({
      titre: 'Cathédrale Saint-Paul',
      ville: 'Abidjan',
      image: null,
      typeNom: 'Religieux',
      typeCouleur: '#8A3E1B',
    })
    expect(el.querySelector('strong')?.textContent).toBe('Cathédrale Saint-Paul')
    expect(el.textContent).toContain('Religieux')
    expect(el.textContent).toContain('Abidjan')
    expect(el.querySelector('img')).toBeNull()
  })

  it('ajoute une vignette quand image est fournie', () => {
    const el = construirePopupContenu({
      titre: 'Gare de Bouaké',
      ville: null,
      image: 'https://example.test/img.jpg',
      typeNom: null,
      typeCouleur: null,
    })
    const img = el.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('src')).toBe('https://example.test/img.jpg')
    expect(el.textContent).toContain('Gare de Bouaké')
  })

  it('n\'interprète pas le HTML dans le titre (DOM sûr)', () => {
    const el = construirePopupContenu({
      titre: '<img src=x onerror=alert(1)>',
      ville: null, image: null, typeNom: null, typeCouleur: null,
    })
    // Le titre est posé via textContent : aucun <img> injecté.
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('strong')?.textContent).toBe('<img src=x onerror=alert(1)>')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd paaciv && npx vitest run components/carte/__tests__/popup.test.ts`
Expected: FAIL (module `popup` introuvable).

- [ ] **Step 3: Implement the popup builder**

```ts
// paaciv/components/carte/popup.ts
export type PopupProps = {
  titre: string
  ville: string | null
  image: string | null
  typeNom: string | null
  typeCouleur: string | null
}

export function construirePopupContenu(p: PopupProps): HTMLElement {
  const contenu = document.createElement('div')
  contenu.style.maxWidth = '180px'

  if (p.image) {
    const img = document.createElement('img')
    img.src = p.image
    img.loading = 'lazy'
    img.alt = ''
    img.style.cssText =
      'width:100%;height:96px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px'
    img.onerror = () => img.remove()
    contenu.appendChild(img)
  }

  const fort = document.createElement('strong')
  fort.textContent = p.titre
  contenu.appendChild(fort)

  if (p.typeNom) {
    const badge = document.createElement('div')
    badge.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;margin-top:4px'
    const dot = document.createElement('span')
    dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:9999px;background:${
      p.typeCouleur ?? '#8A3E1B'
    }`
    const lab = document.createElement('span')
    lab.textContent = p.typeNom
    badge.append(dot, lab)
    contenu.appendChild(badge)
  }

  if (p.ville) {
    const v = document.createElement('div')
    v.textContent = p.ville
    v.style.cssText = 'font-size:12px;margin-top:2px'
    contenu.appendChild(v)
  }

  return contenu
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd paaciv && npx vitest run components/carte/__tests__/popup.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Wire the builder into CarteClient**

Dans `paaciv/components/carte/CarteClient.tsx` :

(a) Importer le constructeur :
```ts
import { construirePopupContenu } from '@/components/carte/popup'
```

(b) Après `couleurExpression`, ajouter une map `type_id → { nom, couleur }` et sa ref (pour l'effet mount-only) :
```ts
  const typeInfo = useMemo(() => {
    const m = new globalThis.Map<string, { nom: string; couleur: string }>()
    for (const ty of options.types) m.set(ty.id, { nom: nomType(ty), couleur: ty.couleur ?? '#8A3E1B' })
    return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.types, locale])
  const typeInfoRef = useRef(typeInfo)
  useEffect(() => {
    typeInfoRef.current = typeInfo
  }, [typeInfo])
```
(Note : `Map` de maplibre est importé ; on utilise `globalThis.Map` pour la structure de données afin d'éviter la collision de nom.)

(c) Dans le handler `map.on('mouseenter', 'points', ...)`, remplacer la construction manuelle du `contenu` (le bloc qui crée `div`/`strong`/`br`) par :
```ts
        const props = f.properties as {
          titre_fr: string; titre_en: string | null; ville: string | null
          type_id: string | null; image: string | null
        }
        const titre = localeRef.current === 'en' ? props.titre_en || props.titre_fr : props.titre_fr
        const info = props.type_id ? typeInfoRef.current.get(props.type_id) : undefined
        const contenu = construirePopupContenu({
          titre,
          ville: props.ville,
          image: props.image,
          typeNom: info?.nom ?? null,
          typeCouleur: info?.couleur ?? null,
        })
```
(Le `.setDOMContent(contenu)` en aval reste inchangé.)

- [ ] **Step 6: Run lint + tests**

Run: `cd paaciv && npm run lint && npx vitest run && npx playwright test tests/carte.spec.ts`
Expected: lint OK, unit PASS, e2e carte PASS.

- [ ] **Step 7: Commit**

```bash
git add paaciv/components/carte/popup.ts paaciv/components/carte/__tests__/popup.test.ts paaciv/components/carte/CarteClient.tsx
git commit -m "feat(carte): survol enrichi (vignette + badge de type + ville)"
```

---

### Task 6: i18n filtres carte + composant `FiltresCarte`

Composant de présentation contrôlé (aucune logique réseau). Ajout des libellés dans le namespace `carte`.

**Files:**
- Modify: `paaciv/i18n/messages/fr.json` (namespace `carte`)
- Modify: `paaciv/i18n/messages/en.json` (namespace `carte`)
- Create: `paaciv/components/carte/FiltresCarte.tsx`
- Test: `paaciv/components/carte/__tests__/FiltresCarte.test.tsx`

**Interfaces:**
- Produces: `FiltresCarte({ options, valeurs, onChange, locale }: { options: ReferencesFiltres; valeurs: Record<'type'|'programme'|'district'|'epoque', string>; onChange: (cle: string, valeur: string) => void; locale: string })`. Le champ recherche appelle `onChange('q', value)`. Les `<select>` sont contrôlés par `valeurs` ; le champ recherche est **non contrôlé** (`defaultValue`).
- Consumes: `ReferencesFiltres` (Task 2).

- [ ] **Step 1: Add i18n keys**

Dans `paaciv/i18n/messages/fr.json`, namespace `carte`, ajouter les clés (garder les existantes `titre/plan/satellite/legende/compteur/voirFiche`) :
```json
    "recherche": "Rechercher un édifice…",
    "type": "Type",
    "programme": "Programme",
    "district": "District",
    "epoque": "Époque",
    "tous": "Tous"
```
Dans `paaciv/i18n/messages/en.json`, namespace `carte`, ajouter :
```json
    "recherche": "Search a building…",
    "type": "Type",
    "programme": "Programme",
    "district": "District",
    "epoque": "Period",
    "tous": "All"
```
(Vérifier que `carte.compteur` existe déjà en EN ; sinon ajouter `"compteur": "{n} building(s)"`.)

- [ ] **Step 2: Write the failing test**

```tsx
// paaciv/components/carte/__tests__/FiltresCarte.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { FiltresCarte } from '@/components/carte/FiltresCarte'

const messages = {
  carte: { recherche: 'Rechercher un édifice…', type: 'Type', programme: 'Programme', district: 'District', epoque: 'Époque', tous: 'Tous' },
}
const options = {
  types: [{ id: 'religieux', nom_fr: 'Religieux', nom_en: 'Religious', couleur: '#8A3E1B', ordre: 1 }],
  programmes: [], districts: [], epoques: [],
} as never

function renderFiltres(onChange = vi.fn()) {
  render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <FiltresCarte options={options} valeurs={{ type: '', programme: '', district: '', epoque: '' }} onChange={onChange} locale="fr" />
    </NextIntlClientProvider>,
  )
  return onChange
}

describe('FiltresCarte', () => {
  it('émet onChange(type, valeur) au changement de select', () => {
    const onChange = renderFiltres()
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'religieux' } })
    expect(onChange).toHaveBeenCalledWith('type', 'religieux')
  })

  it('émet onChange(q, valeur) à la saisie de recherche', () => {
    const onChange = renderFiltres()
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'gare' } })
    expect(onChange).toHaveBeenCalledWith('q', 'gare')
  })
})
```

- [ ] **Step 2b: Run test to verify it fails**

Run: `cd paaciv && npx vitest run components/carte/__tests__/FiltresCarte.test.tsx`
Expected: FAIL (composant introuvable).

- [ ] **Step 3: Implement the component**

```tsx
// paaciv/components/carte/FiltresCarte.tsx
'use client'

import { useTranslations } from 'next-intl'
import type { Ref } from '@/lib/data/patrimoine'
import type { ReferencesFiltres } from '@/lib/data/references'

type Valeurs = { type: string; programme: string; district: string; epoque: string }

export function FiltresCarte({
  options,
  valeurs,
  onChange,
  locale,
}: {
  options: ReferencesFiltres
  valeurs: Valeurs
  onChange: (cle: string, valeur: string) => void
  locale: string
}) {
  const t = useTranslations('carte')
  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  const selects: [keyof Valeurs, Ref[]][] = [
    ['type', options.types],
    ['programme', options.programmes],
    ['district', options.districts],
    ['epoque', options.epoques],
  ]

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('recherche')}</span>
        <input
          type="search"
          defaultValue=""
          onChange={(e) => onChange('q', e.target.value)}
          placeholder={t('recherche')}
          className="rounded-xl border border-encre/20 bg-white px-3 py-2"
        />
      </label>
      {selects.map(([cle, refs]) => (
        <label key={cle} className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t(cle)}</span>
          <select
            value={valeurs[cle]}
            onChange={(e) => onChange(cle, e.target.value)}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          >
            <option value="">{t('tous')}</option>
            {refs.map((r) => (
              <option key={r.id} value={r.id}>
                {nom(r)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd paaciv && npx vitest run components/carte/__tests__/FiltresCarte.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add paaciv/components/carte/FiltresCarte.tsx paaciv/components/carte/__tests__/FiltresCarte.test.tsx paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json
git commit -m "feat(carte): composant FiltresCarte + libellés i18n"
```

---

### Task 7: Câbler les filtres dans `CarteClient` (état client + refetch + fitBounds + compteur)

**Files:**
- Modify: `paaciv/components/carte/CarteClient.tsx`
- Test: `paaciv/tests/carte-filtres.spec.ts` (create)

**Interfaces:**
- Consumes: `FiltresCarte` (Task 6), `useDebouncedCallback` (Task 1), `window.__carteMap`/`__carteReady` (Task 4), source `patrimoine` (`GeoJSONSource`).
- Produces: élément `data-testid="compteur-carte"` affichant `t('compteur', { n })`.

- [ ] **Step 1: Write the failing E2E test**

```ts
// paaciv/tests/carte-filtres.spec.ts
import { test, expect } from '@playwright/test'

test('les filtres carte réduisent le nombre de points', async ({ page, request }) => {
  // Nombre attendu pour le type « religieux », source de vérité = l'API.
  const res = await request.get('/api/carte/points?type=religieux')
  const attendu = (await res.json()).features.length
  expect(attendu).toBeGreaterThan(0)

  await page.goto('/fr/carte')
  await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)

  // Total initial : 7 édifices publiés.
  await expect(page.getByTestId('compteur-carte')).toContainText('7')

  await page.getByLabel('Type').selectOption('religieux')

  await expect(page.getByTestId('compteur-carte')).toContainText(new RegExp(`\\b${attendu}\\b`))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd paaciv && npx playwright test tests/carte-filtres.spec.ts`
Expected: FAIL (pas de `compteur-carte`, pas de sélecteur `Type`).

- [ ] **Step 3: Add filter state, refetch/setData/fitBounds, and compteur to CarteClient**

Dans `paaciv/components/carte/CarteClient.tsx` :

(a) Imports :
```ts
import { FiltresCarte } from '@/components/carte/FiltresCarte'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'
```

(b) États (près des autres `useState`) :
```ts
  const [filtres, setFiltres] = useState({ type: '', programme: '', district: '', epoque: '', q: '' })
  const [nombre, setNombre] = useState(0)
  const [mapPret, setMapPret] = useState(false)
```

(c) Dans `map.on('load', ...)`, remplacer la ligne finale ajoutée en Task 4
`;(window as unknown as { __carteReady?: boolean }).__carteReady = true`
par :
```ts
      setNombre(fc.features.length)
      setMapPret(true)
      ;(window as unknown as { __carteReady?: boolean }).__carteReady = true
```

(d) Après l'effet d'initialisation (mount-only), ajouter un effet de re-fetch sur changement de filtres. Il applique les nouveaux points sans remonter la carte :
```ts
  // Re-fetch des points à chaque changement de filtres, une fois la carte prête.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapPret) return
    let annule = false
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries(filtres)) if (v) qs.set(k, v)

    ;(async () => {
      let fc: { features: { geometry: { coordinates: [number, number] } }[] } = { features: [] }
      try {
        fc = await (await fetch(`/api/carte/points?${qs.toString()}`)).json()
      } catch {
        return
      }
      if (annule) return
      const src = map.getSource('patrimoine') as GeoJSONSource | undefined
      src?.setData(fc as unknown as GeoJSON.FeatureCollection)
      setNombre(fc.features.length)
      const coords = fc.features.map((feat) => feat.geometry.coordinates)
      if (coords.length > 0) {
        const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]))
        map.fitBounds(bounds, { padding: 80, maxZoom: 11, duration: 300 })
      }
    })()

    return () => {
      annule = true
    }
  }, [filtres, mapPret])
```

(e) Handlers de changement (débounce uniquement pour `q`) :
```ts
  const majFiltre = (cle: string, valeur: string) => setFiltres((f) => ({ ...f, [cle]: valeur }))
  const majFiltreDebounce = useDebouncedCallback(majFiltre, 300)
  const onChangeFiltre = (cle: string, valeur: string) =>
    cle === 'q' ? majFiltreDebounce(cle, valeur) : majFiltre(cle, valeur)
```

(f) Dans le `return`, au-dessus du conteneur de carte (dans le `<div className="relative ...">`, ou juste avant), insérer la barre de filtres + le compteur. Placer ce bloc en haut de la zone carte :
```tsx
      <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-end gap-3 rounded-2xl bg-white/95 p-3 shadow">
        <FiltresCarte
          options={options}
          valeurs={{ type: filtres.type, programme: filtres.programme, district: filtres.district, epoque: filtres.epoque }}
          onChange={onChangeFiltre}
          locale={locale}
        />
        <span data-testid="compteur-carte" className="text-sm text-encre/70">
          {t('compteur', { n: nombre })}
        </span>
      </div>
```
Note : la bascule Plan/Satellite existante est aussi en `absolute left-3 top-3`. Déplacer la bascule Plan/Satellite vers `top-20` (ou l'intégrer dans la barre) pour éviter le chevauchement — ajuster la classe de son conteneur de `top-3` à `top-24`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd paaciv && npx playwright test tests/carte-filtres.spec.ts`
Expected: PASS.

- [ ] **Step 5: Full suite + lint**

Run: `cd paaciv && npm run lint && npm test && npm run e2e`
Expected: lint OK ; tous les tests unit + e2e PASS.

- [ ] **Step 6: Commit**

```bash
git add paaciv/components/carte/CarteClient.tsx paaciv/tests/carte-filtres.spec.ts
git commit -m "feat(carte): barre de filtres (état client, refetch, fitBounds, compteur)"
```

---

## Self-Review

**Spec coverage :**
- Fond MapTiler + fallback → Task 4. ✔
- Correctif satellite (insertion sans `beforeId`) → Task 4. ✔
- Survol enrichi (vignette + badge type + ville, DOM sûr) → Task 5. ✔
- Barre de filtres carte (type/programme/district/époque/recherche, état client, refetch/setData/fitBounds, compteur, 0 résultat conserve la vue) → Tasks 6 + 7. ✔
- Débounce recherche archives → Task 3 ; hook partagé → Task 1 ; réutilisé carte → Task 7. ✔
- `chargerReferences` partagé, carte charge les 4 refs → Tasks 2 + 4. ✔
- i18n → Task 6. ✔
- Tests satellite / filtres / survol / fallback / débounce → Tasks 3,4,5,6,7 (fallback couvert par CI sans clé sur les tests carte). ✔

**Placeholder scan :** aucun TBD/TODO ; tout le code est fourni.

**Type consistency :** `ReferencesFiltres` (Task 2) consommé identiquement en Tasks 4/6/7 ; prop `CarteClient` = `{ options, locale }` posée en Task 4 et utilisée ensuite ; `construirePopupContenu(PopupProps)` défini et appelé avec les mêmes champs ; `window.__carteMap`/`__carteReady` produits en Task 4, consommés en Tasks 4/7 ; source `patrimoine` (`GeoJSONSource`) déjà présente, réutilisée via `setData` en Task 7 ; `onChange(cle, valeur)` cohérent entre FiltresCarte et CarteClient. ✔

**Note d'exécution :** Tasks 4, 5, 7 modifient toutes `CarteClient.tsx` — exécuter dans l'ordre (édits séquentiels sur le même fichier).
