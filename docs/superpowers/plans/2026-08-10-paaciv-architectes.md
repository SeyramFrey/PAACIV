# Architectes (Phase 3) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter l'entité Architectes (ivoiriens & étrangers) : schéma N–N avec le patrimoine, pages publiques (`/architectes` + fiche), admin CRUD réutilisant l'éditeur riche, liaison dans le formulaire patrimoine, et seed de démo.

**Architecture:** Deux tables (`architectes`, `patrimoine_architecte`) avec RLS alignée sur le patrimoine (public = publié, admin = tout). Data layer cookieless pour la lecture publique. Pages SSR réutilisant `TexteRiche` (rendu riche assaini) et `CartePatrimoine` (cartes de réalisations). Admin CRUD calqué sur le patrimoine, réutilisant `EditeurRiche` (bio/parcours/réalisations) et l'assainisseur `assainirHtml`. Liaison N–N éditée par cases à cocher + rôle dans le formulaire patrimoine.

**Tech Stack:** Next.js 16.3 (App Router), React 19.2, TypeScript, next-intl, Supabase (Postgres + RLS + Storage), MapLibre (réutilisé indirectement), Vitest, Playwright (workers: 2, projet e2e authentifié).

## Global Constraints

- Répertoire de travail du code : `paaciv/`. Migrations Supabase appliquées via le MCP `supabase-paaciv` (projet ref `yognzzhrrllomokvoooy`) ET écrites en fichier `paaciv/supabase/migrations/NNNN_*.sql` (numérotation à la suite de `0007`).
- **RLS obligatoire** : public (anon) lit uniquement `statut='publie'` ; une liaison n'est lisible que si l'architecte ET le patrimoine liés sont publiés ; écritures réservées à `authenticated`. RLS activé dès la création de chaque table.
- **Double assainissement** des champs riches (bio, parcours, réalisations) : `assainirHtml` à l'enregistrement (server action) ET `TexteRiche` au rendu. Import : `assainirHtml` depuis `@/lib/richtext`, `TexteRiche` depuis `@/components/patrimoine/TexteRiche`, `EditeurRiche` depuis `@/components/admin/EditeurRiche`.
- Lectures publiques via `createReadClient()` (cookieless, `@/lib/supabase/reader`) ; écritures admin via `createServerClient()` (session cookie, `@/lib/supabase/server`).
- `origine ∈ {ivoirien, etranger}` ; `statut ∈ {brouillon, publie}` (checks SQL).
- Photos dans le bucket Storage `patrimoine`, chemins `architectes/<id>/…` (policies existantes).
- Slug via `slugify` (`@/lib/slug`) ; texte bilingue rendu via `champ` (`@/lib/i18n-champ`).
- Pas de nouveau `any` (repo lint `@typescript-eslint/no-explicit-any`).
- Tests : `npm test` (Vitest), `npm run e2e` (Playwright, projet `e2e` authentifié via `tests/auth.setup.ts`), `npm run lint`, `npm run build`.
- Commits fréquents (un par tâche min.), messages FR, préfixe conventionnel, terminés par `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Après une migration MCP, régénérer les types si le projet en dépend n'est PAS requis ici (le code type les lignes localement).

---

### Task 1: Schéma `architectes` + `patrimoine_architecte` + RLS

**Files:**
- Create: `paaciv/supabase/migrations/0008_architectes.sql`
- Create: `paaciv/supabase/migrations/0009_architectes_rls.sql`
- Apply: via MCP `supabase-paaciv` `apply_migration` (une par fichier).
- Test: `paaciv/tests/db/architectes.spec.ts`

**Interfaces:**
- Produces (tables) : `architectes(id uuid, slug, nom, origine, photo, annee_naissance, annee_deces, periode_texte, bio_fr/en, parcours_fr/en, realisations_texte_fr/en, statut, ordre, created_at, updated_at)` ; `patrimoine_architecte(patrimoine_id, architecte_id, role, pk(patrimoine_id, architecte_id))`.

- [ ] **Step 1: Write the schema migration file**

```sql
-- paaciv/supabase/migrations/0008_architectes.sql
-- Phase 3 · Architectes (ivoiriens & étrangers) + liaison N–N avec le patrimoine.

create table architectes (
  id                     uuid primary key default gen_random_uuid(),
  slug                   text unique not null,
  nom                    text not null,
  origine                text not null check (origine in ('ivoirien', 'etranger')),
  photo                  text,
  annee_naissance        int,
  annee_deces            int,
  periode_texte          text,
  bio_fr                 text,
  bio_en                 text,
  parcours_fr            text,
  parcours_en            text,
  realisations_texte_fr  text,
  realisations_texte_en  text,
  statut                 text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  ordre                  int  not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create table patrimoine_architecte (
  patrimoine_id uuid not null references patrimoine(id)  on delete cascade,
  architecte_id uuid not null references architectes(id) on delete cascade,
  role          text,
  primary key (patrimoine_id, architecte_id)
);

create index idx_architectes_statut   on architectes(statut);
create index idx_architectes_origine  on architectes(origine);
create index idx_patarch_patrimoine   on patrimoine_architecte(patrimoine_id);
create index idx_patarch_architecte   on patrimoine_architecte(architecte_id);

-- updated_at maintenu par la fonction existante (search_path déjà épinglé).
create trigger trg_architectes_touch
  before update on architectes
  for each row execute function public.touch_updated_at();

-- RLS activé dès la création (politiques posées en 0009).
alter table architectes            enable row level security;
alter table patrimoine_architecte  enable row level security;
```

- [ ] **Step 2: Write the RLS migration file**

```sql
-- paaciv/supabase/migrations/0009_architectes_rls.sql
-- Phase 3 · Politiques RLS architectes + liaison.

-- Architectes : lecture publique des publiés ; accès complet admin.
create policy "architectes select public"
  on architectes for select to anon using (statut = 'publie');
create policy "architectes all admin"
  on architectes for all to authenticated using (true) with check (true);

-- Liaison : lisible par le public seulement si l'architecte ET le patrimoine sont publiés.
create policy "patarch select public"
  on patrimoine_architecte for select to anon
  using (
    (select exists (select 1 from architectes a where a.id = patrimoine_architecte.architecte_id and a.statut = 'publie'))
    and
    (select exists (select 1 from patrimoine p where p.id = patrimoine_architecte.patrimoine_id and p.statut = 'publie'))
  );
create policy "patarch all admin"
  on patrimoine_architecte for all to authenticated using (true) with check (true);
```

- [ ] **Step 3: Apply both migrations via MCP**

Via l'outil MCP `supabase-paaciv` `apply_migration` : appliquer `0008_architectes` puis `0009_architectes_rls` (name = nom de fichier sans extension, query = contenu). Vérifier le succès (pas d'erreur) et, en cas de besoin, `list_tables` pour confirmer la présence des deux tables.

- [ ] **Step 4: Write the failing RLS test**

```ts
// paaciv/tests/db/architectes.spec.ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

test('RLS : un anonyme ne peut pas insérer d\'architecte', async () => {
  const sb = createClient(url, anon)
  const { error } = await sb.from('architectes').insert({ slug: 'x-test', nom: 'X', origine: 'ivoirien' })
  expect(error).not.toBeNull()
})

test('le public ne voit que les architectes publiés', async () => {
  const sb = createClient(url, anon)
  const { data, error } = await sb.from('architectes').select('id, statut')
  expect(error).toBeNull()
  expect((data ?? []).every((a) => a.statut === 'publie')).toBe(true)
})
```

- [ ] **Step 5: Run test to verify it fails (then passes after seed)**

Run: `cd paaciv && npx playwright test tests/db/architectes.spec.ts`
Expected AVANT seed (Task 2) : le 1er test PASSE (insert refusé) ; le 2e PASSE trivialement (0 ligne). Après le seed (Task 2) le 2e test reste vert (ne renvoie que des publiés). Si aucune ligne n'existe encore, le test est vert par vacuité — c'est acceptable ici ; Task 2 ajoute les données publiées qui le rendent significatif.

- [ ] **Step 6: Commit**

```bash
git add paaciv/supabase/migrations/0008_architectes.sql paaciv/supabase/migrations/0009_architectes_rls.sql paaciv/tests/db/architectes.spec.ts
git commit -m "feat(architectes): schéma architectes + liaison N–N + RLS"
```

---

### Task 2: Seed architectes + liaisons

**Files:**
- Create: `paaciv/supabase/migrations/0010_architectes_seed.sql`
- Apply: via MCP `supabase-paaciv`.

**Interfaces:**
- Consumes: tables de Task 1. S'appuie sur des patrimoines existants pour 1–2 liaisons.

- [ ] **Step 1: Inspect existing patrimoine ids for linking**

Via MCP `supabase-paaciv` `execute_sql` : `select id, slug from patrimoine where statut = 'publie' order by titre_fr limit 3;` — noter 1–2 ids réels à lier.

- [ ] **Step 2: Write the seed migration**

Insérer ~4 ivoiriens publiés + ~2 étrangers publiés (bio/parcours en HTML simple assaini-compatible : `<p>…</p>`), puis 1–2 lignes `patrimoine_architecte` reliant un architecte à un patrimoine réel (utiliser les ids/ slugs relevés à l'étape 1 via sous-requête sur `slug`). Exemple de structure (adapter les slugs de patrimoine aux valeurs réelles) :

```sql
-- paaciv/supabase/migrations/0010_architectes_seed.sql
insert into architectes (slug, nom, origine, annee_naissance, periode_texte, bio_fr, bio_en, statut, ordre) values
  ('aka-adjo',        'Aka Adjo',            'ivoirien', 1935, 'XXᵉ s.', '<p>Pionnier de l''architecture moderne ivoirienne.</p>', '<p>Pioneer of modern Ivorian architecture.</p>', 'publie', 1),
  ('goly-kouassi',    'Michel Goly Kouassi', 'ivoirien', 1940, 'XXᵉ s.', '<p>Figure de la génération post-indépendance.</p>',      '<p>Figure of the post-independence generation.</p>', 'publie', 2),
  ('jean-leon',       'Jean Léon',           'ivoirien', 1955, 'XXᵉ s.', '<p>Architecte de nombreux édifices publics.</p>',        '<p>Architect of many public buildings.</p>',       'publie', 3),
  ('pierre-fakhoury', 'Pierre Fakhoury',     'ivoirien', 1943, 'XXᵉ–XXIᵉ s.', '<p>Concepteur de la Basilique de Yamoussoukro.</p>', '<p>Designer of the Yamoussoukro Basilica.</p>',  'publie', 4),
  ('henri-chomette',  'Henri Chomette',      'etranger', 1921, 'XXᵉ s.', '<p>Architecte français actif en Afrique de l''Ouest.</p>', '<p>French architect active in West Africa.</p>', 'publie', 1),
  ('rinaldo-olivieri','Rinaldo Olivieri',    'etranger', 1931, 'XXᵉ s.', '<p>Auteur de la Pyramide d''Abidjan.</p>',                '<p>Author of the Pyramid of Abidjan.</p>',       'publie', 2);

-- Liaisons (adapter les slugs de patrimoine aux valeurs réelles relevées à l'étape 1).
insert into patrimoine_architecte (patrimoine_id, architecte_id, role)
select p.id, a.id, 'architecte'
from patrimoine p, architectes a
where p.statut = 'publie' and a.slug = 'pierre-fakhoury'
order by p.titre_fr
limit 1;
```

- [ ] **Step 3: Apply the seed via MCP**

Via MCP `supabase-paaciv` `apply_migration` (name `0010_architectes_seed`). Vérifier via `execute_sql` : `select count(*) from architectes where statut='publie';` (≥ 6) et `select count(*) from patrimoine_architecte;` (≥ 1).

- [ ] **Step 4: Re-run the RLS test (now meaningful)**

Run: `cd paaciv && npx playwright test tests/db/architectes.spec.ts`
Expected: PASS (le public voit ≥ 6 publiés, tous `publie`).

- [ ] **Step 5: Commit**

```bash
git add paaciv/supabase/migrations/0010_architectes_seed.sql
git commit -m "feat(architectes): seed démo (ivoiriens + étrangers + liaison)"
```

---

### Task 3: Data layer `lib/data/architectes.ts` + tests

**Files:**
- Create: `paaciv/lib/data/architectes.ts`
- Test: `paaciv/tests/db/data-architectes.spec.ts`

**Interfaces:**
- Consumes: `createReadClient` (`@/lib/supabase/reader`), `imageUrl` (`@/lib/media`) pour résoudre le chemin photo.
- Produces:
  - types `ArchitecteListItem = { id, slug, nom, origine: 'ivoirien'|'etranger', photo: string|null, annee_naissance: number|null, periode_texte: string|null, ordre: number }`
  - `ArchitecteDetail` (tous les champs + `realisations: RealisationLiee[]`)
  - `RealisationLiee = { slug: string, titre_fr: string, titre_en: string|null, image: string|null, role: string|null }`
  - `listeArchitectes(): Promise<ArchitecteListItem[]>` (publiés)
  - `getArchitecteParSlug(slug): Promise<ArchitecteDetail|null>` (+ `getArchitecteParSlugCache`)

- [ ] **Step 1: Write the failing test**

```ts
// paaciv/tests/db/data-architectes.spec.ts
import { test, expect } from '@playwright/test'
import { listeArchitectes, getArchitecteParSlug } from '@/lib/data/architectes'

test('listeArchitectes ne renvoie que des publiés, avec origine', async () => {
  const items = await listeArchitectes()
  expect(items.length).toBeGreaterThan(0)
  expect(items.every((a) => a.origine === 'ivoirien' || a.origine === 'etranger')).toBe(true)
})

test('getArchitecteParSlug renvoie le détail + réalisations liées publiées', async () => {
  const a = await getArchitecteParSlug('pierre-fakhoury')
  expect(a).not.toBeNull()
  expect(a!.nom).toBe('Pierre Fakhoury')
  // réalisations liées : tableau (peut être non vide selon le seed)
  expect(Array.isArray(a!.realisations)).toBe(true)
})

test('getArchitecteParSlug renvoie null pour un slug inexistant', async () => {
  expect(await getArchitecteParSlug('nexiste-pas')).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/db/data-architectes.spec.ts`
Expected: FAIL (module `@/lib/data/architectes` introuvable).

- [ ] **Step 3: Implement the data layer**

```ts
// paaciv/lib/data/architectes.ts
import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl } from '@/lib/media'

export type ArchitecteListItem = {
  id: string
  slug: string
  nom: string
  origine: 'ivoirien' | 'etranger'
  photo: string | null
  annee_naissance: number | null
  periode_texte: string | null
  ordre: number
}

export type RealisationLiee = {
  slug: string
  titre_fr: string
  titre_en: string | null
  image: string | null
  role: string | null
}

export type ArchitecteDetail = {
  id: string
  slug: string
  nom: string
  origine: 'ivoirien' | 'etranger'
  photo: string | null
  annee_naissance: number | null
  annee_deces: number | null
  periode_texte: string | null
  bio_fr: string | null
  bio_en: string | null
  parcours_fr: string | null
  parcours_en: string | null
  realisations_texte_fr: string | null
  realisations_texte_en: string | null
  realisations: RealisationLiee[]
}

function photoUrl(chemin: string | null): string | null {
  return chemin ? imageUrl(chemin) : null
}

export async function listeArchitectes(): Promise<ArchitecteListItem[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('architectes')
    .select('id, slug, nom, origine, photo, annee_naissance, periode_texte, ordre')
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return (data ?? []).map((a: Omit<ArchitecteListItem, 'photo'> & { photo: string | null }) => ({
    ...a,
    photo: photoUrl(a.photo),
  })) as ArchitecteListItem[]
}

type LiaisonRow = {
  role: string | null
  patrimoine: {
    slug: string; titre_fr: string; titre_en: string | null; statut: string
    images: { chemin: string; est_principale: boolean; ordre: number }[]
  } | null
}

function imagePrincipale(images: { chemin: string; est_principale: boolean; ordre: number }[] | null): string | null {
  if (!images || images.length === 0) return null
  const principale = images.find((i) => i.est_principale) ?? [...images].sort((a, b) => a.ordre - b.ordre)[0]
  return principale ? imageUrl(principale.chemin) : null
}

export async function getArchitecteParSlug(slug: string): Promise<ArchitecteDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('architectes')
    .select(
      '*, patrimoine_architecte(role, patrimoine(slug, titre_fr, titre_en, statut, images(chemin, est_principale, ordre)))',
    )
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as unknown as ArchitecteDetail & { patrimoine_architecte: LiaisonRow[] }
  const realisations: RealisationLiee[] = (row.patrimoine_architecte ?? [])
    .filter((l) => l.patrimoine && l.patrimoine.statut === 'publie')
    .map((l) => ({
      slug: l.patrimoine!.slug,
      titre_fr: l.patrimoine!.titre_fr,
      titre_en: l.patrimoine!.titre_en,
      image: imagePrincipale(l.patrimoine!.images),
      role: l.role,
    }))
  return {
    id: row.id, slug: row.slug, nom: row.nom, origine: row.origine,
    photo: photoUrl(row.photo), annee_naissance: row.annee_naissance, annee_deces: row.annee_deces,
    periode_texte: row.periode_texte, bio_fr: row.bio_fr, bio_en: row.bio_en,
    parcours_fr: row.parcours_fr, parcours_en: row.parcours_en,
    realisations_texte_fr: row.realisations_texte_fr, realisations_texte_en: row.realisations_texte_en,
    realisations,
  }
}

export const getArchitecteParSlugCache = cache(getArchitecteParSlug)
```

Note : vérifier le nom exact de la fonction d'URL d'image dans `@/lib/media` (`imageUrl`) et de `createReadClient` dans `@/lib/supabase/reader` — s'aligner sur `lib/data/patrimoine.ts` qui les utilise déjà.

- [ ] **Step 4: Run to verify it passes**

Run: `cd paaciv && npx playwright test tests/db/data-architectes.spec.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add paaciv/lib/data/architectes.ts paaciv/tests/db/data-architectes.spec.ts
git commit -m "feat(architectes): data layer (liste + fiche avec réalisations liées)"
```

---

### Task 4: Fiche patrimoine — architectes liés (data + affichage)

**Files:**
- Modify: `paaciv/lib/data/patrimoine.ts` (`getPatrimoineParSlug` : joindre les architectes publiés liés ; type `PatrimoineDetail`)
- Modify: `paaciv/app/[locale]/patrimoine/[slug]/page.tsx` (remplir l'emplacement architectes)
- Test: `paaciv/tests/db/data-patrimoine.spec.ts` (ajouter un cas)

**Interfaces:**
- Produces: `PatrimoineDetail.architectes: { slug: string; nom: string; role: string | null }[]`

- [ ] **Step 1: Add a failing data test**

Ajouter dans `paaciv/tests/db/data-patrimoine.spec.ts` :
```ts
test('getPatrimoineParSlug expose les architectes liés (publiés)', async () => {
  // le patrimoine lié dans le seed doit exposer au moins un architecte
  const { pointsPublies } = await import('@/lib/data/patrimoine')
  const points = await pointsPublies()
  const cible = points[0]
  const { getPatrimoineParSlug } = await import('@/lib/data/patrimoine')
  const p = await getPatrimoineParSlug(cible.slug)
  expect(p).not.toBeNull()
  expect(Array.isArray(p!.architectes)).toBe(true)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/db/data-patrimoine.spec.ts -g "architectes liés"`
Expected: FAIL (`architectes` absent de `PatrimoineDetail`).

- [ ] **Step 3: Extend the patrimoine query + type**

Dans `paaciv/lib/data/patrimoine.ts` :
- Ajouter au type `PatrimoineDetail` : `architectes: { slug: string; nom: string; role: string | null }[]`.
- Dans `getPatrimoineParSlug`, étendre le `select` avec la liaison :
  `'*, type:types(*), programme:programmes(*), district:districts(*), epoque:epoques(*), images(*), patrimoine_architecte(role, architectes(slug, nom, statut))'`
- Après récupération, mapper :
  ```ts
  const liaisons = (data as unknown as { patrimoine_architecte?: { role: string | null; architectes: { slug: string; nom: string; statut: string } | null }[] }).patrimoine_architecte ?? []
  detail.architectes = liaisons
    .filter((l) => l.architectes && l.architectes.statut === 'publie')
    .map((l) => ({ slug: l.architectes!.slug, nom: l.architectes!.nom, role: l.role }))
  ```
  (Placer avant le `return detail`.)

- [ ] **Step 4: Fill the reserved slot in the fiche**

Dans `paaciv/app/[locale]/patrimoine/[slug]/page.tsx`, remplacer le commentaire
`{/* Emplacement architectes — rempli en Phase 3 (patrimoine_architecte). */}` par :
```tsx
          {p.architectes.length > 0 && (
            <section>
              <h2 className="mb-2 font-serif text-lg text-brun">{t('architectes')}</h2>
              <ul className="space-y-1 text-sm">
                {p.architectes.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/architectes/${a.slug}`} className="text-brun underline">
                      {a.nom}
                    </Link>
                    {a.role ? <span className="text-encre/60"> ({a.role})</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
```
Ajouter les imports nécessaires : `import { Link } from '@/i18n/navigation'` (s'il n'y est pas) et la clé i18n `fiche.architectes` (FR « Architectes », EN « Architects ») dans `i18n/messages/*.json`.

- [ ] **Step 5: Run to verify it passes + lint**

Run: `cd paaciv && npm run lint && npx playwright test tests/db/data-patrimoine.spec.ts tests/fiche.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add "paaciv/lib/data/patrimoine.ts" "paaciv/app/[locale]/patrimoine/[slug]/page.tsx" paaciv/tests/db/data-patrimoine.spec.ts paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json
git commit -m "feat(fiche): afficher les architectes liés au patrimoine"
```

---

### Task 5: Page publique `/architectes` (grille triée + grille étrangers)

**Files:**
- Create: `paaciv/components/architectes/PastilleArchitecte.tsx`
- Create: `paaciv/app/[locale]/architectes/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespace `architectes`)
- Test: `paaciv/tests/architectes.spec.ts`

**Interfaces:**
- Consumes: `listeArchitectes` (Task 3).

- [ ] **Step 1: Write the failing e2e test**

```ts
// paaciv/tests/architectes.spec.ts
import { test, expect } from '@playwright/test'

test('la page architectes affiche les sections ivoiriens et étrangers', async ({ page }) => {
  await page.goto('/fr/architectes')
  await expect(page.getByRole('heading', { name: 'Architectes' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Ivoiriens' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Étrangers' })).toBeVisible()
  // au moins une pastille menant vers une fiche
  await expect(page.getByTestId('pastille-architecte').first()).toBeVisible()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/architectes.spec.ts`
Expected: FAIL (route `/fr/architectes` 404).

- [ ] **Step 3: Add i18n keys**

Dans `fr.json` ajouter le namespace :
```json
  "architectes": { "titre": "Architectes", "ivoiriens": "Ivoiriens", "etrangers": "Étrangers", "intro": "Les concepteurs du patrimoine documenté par PAACIV." },
```
Dans `en.json` :
```json
  "architectes": { "titre": "Architects", "ivoiriens": "Ivorians", "etrangers": "Foreign", "intro": "The designers of the heritage documented by PAACIV." },
```

- [ ] **Step 4: Implement the PastilleArchitecte component**

```tsx
// paaciv/components/architectes/PastilleArchitecte.tsx
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
import type { ArchitecteListItem } from '@/lib/data/architectes'

export function PastilleArchitecte({ a }: { a: ArchitecteListItem }) {
  const badge = a.annee_naissance ? String(a.annee_naissance) : a.periode_texte
  const initiales = a.nom.split(' ').map((m) => m[0]).slice(0, 2).join('').toUpperCase()
  return (
    <Link
      href={`/architectes/${a.slug}`}
      data-testid="pastille-architecte"
      className="relative flex flex-col items-center gap-2 rounded-2xl border border-creme2 bg-white p-4 text-center transition hover:border-or"
    >
      {badge && (
        <span className="absolute right-2 top-2 rounded-md bg-creme2 px-1.5 py-0.5 text-[10px] text-encre/60">
          {badge}
        </span>
      )}
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-ocre text-sable">
        {a.photo ? (
          <Image src={a.photo} alt={a.nom} width={64} height={64} className="h-16 w-16 object-cover" />
        ) : (
          <span className="text-sm font-bold">{initiales}</span>
        )}
      </span>
      <span className="text-sm text-encre">{a.nom}</span>
    </Link>
  )
}
```
Note : vérifier que le domaine Storage Supabase est autorisé dans `next.config.ts` (`images.remotePatterns`) — s'aligner sur ce que la `Galerie`/`CartePatrimoine` patrimoine utilise déjà pour les images distantes. Si le patrimoine utilise une balise `<img>` simple plutôt que `next/image`, faire de même ici (mirror `CartePatrimoine`).

- [ ] **Step 5: Implement the page**

```tsx
// paaciv/app/[locale]/architectes/page.tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { PastilleArchitecte } from '@/components/architectes/PastilleArchitecte'
import { listeArchitectes } from '@/lib/data/architectes'

export default async function ArchitectesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('architectes')
  const tous = await listeArchitectes()

  const ivoiriens = tous
    .filter((a) => a.origine === 'ivoirien')
    .sort((x, y) => (x.annee_naissance ?? 9999) - (y.annee_naissance ?? 9999) || x.ordre - y.ordre)
  const etrangers = tous.filter((a) => a.origine === 'etranger')

  return (
    <main className="flex-1 py-10">
      <Container className="space-y-10">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        <section aria-label={t('ivoiriens')} className="space-y-4">
          <h2 className="font-serif text-2xl text-brun">{t('ivoiriens')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {ivoiriens.map((a) => <PastilleArchitecte key={a.id} a={a} />)}
          </div>
        </section>

        <section aria-label={t('etrangers')} className="space-y-4">
          <h2 className="font-serif text-2xl text-brun">{t('etrangers')}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {etrangers.map((a) => <PastilleArchitecte key={a.id} a={a} />)}
          </div>
        </section>
      </Container>
    </main>
  )
}
```

- [ ] **Step 6: Run to verify it passes + lint**

Run: `cd paaciv && npm run lint && npx playwright test tests/architectes.spec.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add paaciv/components/architectes/PastilleArchitecte.tsx "paaciv/app/[locale]/architectes/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/architectes.spec.ts
git commit -m "feat(architectes): page /architectes (grille chronologique + étrangers)"
```

---

### Task 6: Fiche publique `/architectes/[slug]`

**Files:**
- Create: `paaciv/app/[locale]/architectes/[slug]/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespace `ficheArchitecte`)
- Test: `paaciv/tests/fiche-architecte.spec.ts`

**Interfaces:**
- Consumes: `getArchitecteParSlugCache` (Task 3), `TexteRiche`, `CartePatrimoine` (`@/components/patrimoine/CartePatrimoine`), `champ`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// paaciv/tests/fiche-architecte.spec.ts
import { test, expect } from '@playwright/test'

test('la fiche architecte affiche le nom et la bio', async ({ page }) => {
  await page.goto('/fr/architectes/pierre-fakhoury')
  await expect(page.getByRole('heading', { name: 'Pierre Fakhoury' })).toBeVisible()
})

test('un architecte inexistant renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/architectes/nexiste-pas')
  expect(res?.status()).toBe(404)
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/fiche-architecte.spec.ts`
Expected: FAIL (route inexistante).

- [ ] **Step 3: Add i18n keys**

`fr.json` → `"ficheArchitecte": { "bio": "Biographie", "parcours": "Parcours", "realisations": "Réalisations" }`
`en.json` → `"ficheArchitecte": { "bio": "Biography", "parcours": "Career", "realisations": "Works" }`

- [ ] **Step 4: Implement the page (SSR + OpenGraph + 404 brouillon)**

```tsx
// paaciv/app/[locale]/architectes/[slug]/page.tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { getArchitecteParSlugCache as getArchitecte } from '@/lib/data/architectes'
import { champ } from '@/lib/i18n-champ'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const a = await getArchitecte(slug)
  if (!a) return {}
  const description = champ(a.bio_fr, a.bio_en, locale)?.replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${a.nom} — PAACIV`,
    description,
    openGraph: { title: a.nom, description, images: a.photo ? [a.photo] : [], type: 'profile' },
  }
}

export default async function FicheArchitecte({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ficheArchitecte')
  const a = await getArchitecte(slug)
  if (!a) notFound()

  const dates = a.annee_naissance
    ? `${a.annee_naissance}${a.annee_deces ? ` – ${a.annee_deces}` : ''}`
    : a.periode_texte

  return (
    <main className="flex-1 py-10">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          {a.photo && (
            // mirror l'usage image du patrimoine (next/image ou <img>)
            <img src={a.photo} alt={a.nom} className="w-full rounded-2xl object-cover" />
          )}
          <h1 className="font-serif text-3xl text-brun">{a.nom}</h1>
          {dates && <p className="text-encre/60">{dates}</p>}
        </aside>

        <div className="space-y-8">
          {champ(a.bio_fr, a.bio_en, locale) && (
            <section>
              <h2 className="mb-2 font-serif text-xl text-brun">{t('bio')}</h2>
              <TexteRiche html={champ(a.bio_fr, a.bio_en, locale)} />
            </section>
          )}
          {champ(a.parcours_fr, a.parcours_en, locale) && (
            <section>
              <h2 className="mb-2 font-serif text-xl text-brun">{t('parcours')}</h2>
              <TexteRiche html={champ(a.parcours_fr, a.parcours_en, locale)} />
            </section>
          )}

          <section>
            <h2 className="mb-3 font-serif text-xl text-brun">{t('realisations')}</h2>
            {a.realisations.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2">
                {a.realisations.map((r) => (
                  <CartePatrimoine
                    key={r.slug}
                    locale={locale}
                    item={{
                      id: r.slug, slug: r.slug, titre_fr: r.titre_fr, titre_en: r.titre_en,
                      resume_fr: r.role, resume_en: r.role,
                      type_id: null, programme_id: null, district_id: null, epoque_id: null,
                      ville: null, images: [],
                    }}
                  />
                ))}
              </div>
            ) : (
              <TexteRiche html={champ(a.realisations_texte_fr, a.realisations_texte_en, locale)} />
            )}
          </section>
        </div>
      </Container>
    </main>
  )
}
```
Note : vérifier la signature exacte de `CartePatrimoine` (`item: PatrimoineListItem`) dans `components/patrimoine/CartePatrimoine.tsx` et adapter l'objet passé (champs requis) — mirror la page archives. Si adapter l'`item` est trop rigide, créer une petite carte locale `CarteRealisation` (titre + rôle + lien) plutôt que réutiliser `CartePatrimoine`. Choisir l'option la plus simple qui compile proprement.

- [ ] **Step 5: Run to verify it passes + lint + build**

Run: `cd paaciv && npm run lint && npx playwright test tests/fiche-architecte.spec.ts && npm run build`
Expected: PASS ; build OK.

- [ ] **Step 6: Commit**

```bash
git add "paaciv/app/[locale]/architectes/[slug]/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/fiche-architecte.spec.ts
git commit -m "feat(architectes): fiche /architectes/[slug] (bio, parcours, réalisations)"
```

---

### Task 7: Admin — liste architectes + actions + lien dashboard

**Files:**
- Create: `paaciv/app/[locale]/admin/architectes/page.tsx`
- Create: `paaciv/app/[locale]/admin/architectes/actions.ts`
- Modify: `paaciv/app/[locale]/admin/page.tsx` (lien vers architectes)
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespace `adminArchitectes`)

**Interfaces:**
- Produces (actions) : `enregistrerArchitecte(formData): Promise<{ id: string }>`, `supprimerArchitecte(id): Promise<void>`. Écritures via `createServerClient()`. Assainit bio/parcours/réalisations FR/EN via `assainirHtml`. Upload photo dans le bucket `patrimoine`, préfixe `architectes/<id>/`.

- [ ] **Step 1: Implement the server actions**

Calquer sur `app/[locale]/admin/patrimoine/actions.ts`. Points spécifiques :
```ts
// paaciv/app/[locale]/admin/architectes/actions.ts
'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { assainirHtml } from '@/lib/richtext'

function texteOuNull(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim(); return s === '' ? null : s
}
function intOuNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim(); return s === '' ? null : Number.parseInt(s, 10)
}
function richeOuNull(v: FormDataEntryValue | null): string | null {
  const p = assainirHtml((v ?? '').toString()); return p.trim() === '' ? null : p
}

export async function enregistrerArchitecte(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const nom = (formData.get('nom') ?? '').toString().trim()
  if (!nom) throw new Error('Nom requis')
  const slug = texteOuNull(formData.get('slug')) ?? slugify(nom)

  const valeurs = {
    slug, nom,
    origine: (formData.get('origine') ?? 'ivoirien').toString(),
    annee_naissance: intOuNull(formData.get('annee_naissance')),
    annee_deces: intOuNull(formData.get('annee_deces')),
    periode_texte: texteOuNull(formData.get('periode_texte')),
    bio_fr: richeOuNull(formData.get('bio_fr')),
    bio_en: richeOuNull(formData.get('bio_en')),
    parcours_fr: richeOuNull(formData.get('parcours_fr')),
    parcours_en: richeOuNull(formData.get('parcours_en')),
    realisations_texte_fr: richeOuNull(formData.get('realisations_texte_fr')),
    realisations_texte_en: richeOuNull(formData.get('realisations_texte_en')),
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('architectes').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('architectes').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  // Photo (optionnelle) : upload dans le bucket patrimoine, préfixe architectes/<id>/.
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const chemin = `architectes/${resultId}/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, photo, {
      contentType: photo.type || 'image/jpeg', upsert: false,
    })
    if (upErr) throw upErr
    const { error } = await sb.from('architectes').update({ photo: chemin }).eq('id', resultId)
    if (error) throw error
  }

  revalidatePath('/[locale]/admin/architectes', 'page')
  return { id: resultId }
}

export async function supprimerArchitecte(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('architectes').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/architectes', 'page')
}
```

- [ ] **Step 2: Implement the list page + i18n**

Calquer sur `app/[locale]/admin/patrimoine/page.tsx` (tableau nom/origine/statut, lien éditer vers `/admin/architectes/[id]`, `BoutonSupprimer` avec `supprimerArchitecte.bind(null, id)`, bouton « Nouveau » vers `/admin/architectes/nouveau`). Lecture via `createServerClient()` : `select('id, slug, nom, origine, statut').order('ordre')`. Ajouter le namespace i18n `adminArchitectes` (`titre`, `nouveau`, `aucun`, `nom`, `origine`, `statut`, `publie`, `brouillon`, `editer`, `supprimer`, `confirmer`) en FR/EN.

- [ ] **Step 3: Add the dashboard link**

Dans `app/[locale]/admin/page.tsx`, ajouter sous le lien patrimoine :
```tsx
      <Link href="/admin/architectes" className="text-brun underline">
        {tArchitectes('titre')}
      </Link>
```
(avec `const tArchitectes = await getTranslations('adminArchitectes')`).

- [ ] **Step 4: Lint + build**

Run: `cd paaciv && npm run lint && npm run build`
Expected: OK (les pages compilent ; le formulaire arrive en Task 8).

- [ ] **Step 5: Commit**

```bash
git add "paaciv/app/[locale]/admin/architectes/page.tsx" "paaciv/app/[locale]/admin/architectes/actions.ts" "paaciv/app/[locale]/admin/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json
git commit -m "feat(admin): liste architectes + actions (assainissement, upload photo)"
```

---

### Task 8: Admin — formulaire architecte + pages nouveau/[id]

**Files:**
- Create: `paaciv/components/admin/FormulaireArchitecte.tsx`
- Create: `paaciv/app/[locale]/admin/architectes/nouveau/page.tsx`
- Create: `paaciv/app/[locale]/admin/architectes/[id]/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespace `formArchitecte`)
- Test: `paaciv/tests/admin-architecte.spec.ts`

**Interfaces:**
- Consumes: `enregistrerArchitecte` (Task 7), `EditeurRiche`.

- [ ] **Step 1: Write the failing e2e test**

```ts
// paaciv/tests/admin-architecte.spec.ts
import { test, expect } from '@playwright/test'
test.use({ storageState: 'playwright/.auth/admin.json' })

test('le formulaire architecte monte l\'éditeur riche', async ({ page }) => {
  await page.goto('/fr/admin/architectes/nouveau')
  await expect(page.getByRole('button', { name: 'Gras' })).toBeVisible()
  await expect(page.getByLabel('Nom')).toBeVisible()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/admin-architecte.spec.ts`
Expected: FAIL (route inexistante).

- [ ] **Step 3: Implement `FormulaireArchitecte` (client)**

Calquer la structure de `FormulairePatrimoine.tsx` (onglets FR/EN, `onSubmit` → `new FormData` → `enregistrerArchitecte`, redirection). Champs :
- `nom` (input, `aria-label="Nom"`), `slug` (optionnel), `origine` (select ivoirien/étranger), `annee_naissance`/`annee_deces` (number), `periode_texte`, `ordre` (number), `statut` (select).
- **Onglet FR** : `EditeurRiche name="bio_fr"`, `parcours_fr`, `realisations_texte_fr` (avec `defaultValue={initial?.…}`). **Onglet EN** : équivalents `_en`.
- **Photo** : `<input type="file" name="photo" accept="image/*" />` + aperçu de la photo actuelle si `initial?.photo`.
Props : `{ initial?: Partial<ArchitecteDetail> | null; locale: string }`.

- [ ] **Step 4: Implement the pages (mirror patrimoine nouveau/[id])**

- `nouveau/page.tsx` : titre + `<FormulaireArchitecte locale={locale} />`.
- `[id]/page.tsx` : charge l'architecte via `createServerClient().from('architectes').select('*').eq('id', id).maybeSingle()`, `notFound()` si absent, `<FormulaireArchitecte initial={a} locale={locale} />`.

- [ ] **Step 5: Add i18n `formArchitecte`**

FR : `{ nom, slug, origine, ivoirien, etranger, anneeNaissance, anneeDeces, periode, bio, parcours, realisations, photo, ordre, statut, brouillon, publie, ongletFr, ongletEn, enregistrer, choisir }`. EN : équivalents.

- [ ] **Step 6: Run to verify it passes + lint + build**

Run: `cd paaciv && npm run lint && npx playwright test tests/admin-architecte.spec.ts && npm run build`
Expected: PASS ; build OK.

- [ ] **Step 7: Commit**

```bash
git add paaciv/components/admin/FormulaireArchitecte.tsx "paaciv/app/[locale]/admin/architectes/nouveau/page.tsx" "paaciv/app/[locale]/admin/architectes/[id]/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/admin-architecte.spec.ts
git commit -m "feat(admin): formulaire architecte (éditeur riche FR/EN, upload photo)"
```

---

### Task 9: Liaison architectes dans le formulaire patrimoine

**Files:**
- Create: `paaciv/components/admin/LiaisonArchitectes.tsx`
- Modify: `paaciv/components/admin/FormulairePatrimoine.tsx` (bloc liaison)
- Modify: `paaciv/app/[locale]/admin/patrimoine/actions.ts` (`enregistrerPatrimoine` : remplacer les liaisons)
- Modify: `paaciv/app/[locale]/admin/patrimoine/[id]/page.tsx` + `nouveau/page.tsx` (charger architectes + liaisons)
- Test: `paaciv/tests/admin-patrimoine.spec.ts` (ajouter un cas) ou nouveau `tests/admin-liaison.spec.ts`

**Interfaces:**
- Consumes: liste des architectes (`id`, `nom`) + liaisons existantes (`architecte_id`, `role`).
- Le composant émet, par architecte coché, deux champs de formulaire : `architecte_ids` (valeur = id, multiple) et `role_<id>` (rôle optionnel).

- [ ] **Step 1: Write the failing e2e test**

```ts
// paaciv/tests/admin-liaison.spec.ts
import { test, expect } from '@playwright/test'
test.use({ storageState: 'playwright/.auth/admin.json' })

test('le formulaire patrimoine propose la liaison architectes', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await expect(page.getByRole('group', { name: 'Architectes' })).toBeVisible()
  // au moins un architecte listé (issu du seed)
  await expect(page.getByTestId('liaison-architecte').first()).toBeVisible()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/admin-liaison.spec.ts`
Expected: FAIL (bloc absent).

- [ ] **Step 3: Implement `LiaisonArchitectes` (client)**

```tsx
// paaciv/components/admin/LiaisonArchitectes.tsx
'use client'
import { useState } from 'react'

type ArchitecteOpt = { id: string; nom: string }
type LiaisonInit = { architecte_id: string; role: string | null }

const ROLES = ['architecte', 'co-auteur', 'bureau']

export function LiaisonArchitectes({
  architectes, initial, label,
}: { architectes: ArchitecteOpt[]; initial: LiaisonInit[]; label: string }) {
  const [coches, setCoches] = useState<Record<string, boolean>>(
    Object.fromEntries(initial.map((l) => [l.architecte_id, true])),
  )
  const roleInit = Object.fromEntries(initial.map((l) => [l.architecte_id, l.role ?? '']))

  return (
    <fieldset className="space-y-2" aria-label={label}>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {architectes.map((a) => (
          <div key={a.id} data-testid="liaison-architecte" className="flex items-center gap-2 rounded-lg border border-encre/15 p-2 text-sm">
            <input
              type="checkbox" name="architecte_ids" value={a.id}
              defaultChecked={!!coches[a.id]}
              onChange={(e) => setCoches((c) => ({ ...c, [a.id]: e.target.checked }))}
            />
            <span className="flex-1">{a.nom}</span>
            {coches[a.id] && (
              <select name={`role_${a.id}`} defaultValue={roleInit[a.id] ?? ''} aria-label={`rôle ${a.nom}`} className="rounded border border-encre/20 px-2 py-1 text-xs">
                <option value="">—</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  )
}
```

- [ ] **Step 4: Wire into `FormulairePatrimoine`**

- Ajouter aux props : `architectes: { id: string; nom: string }[]` et `liaisons: { architecte_id: string; role: string | null }[]`.
- Insérer `<LiaisonArchitectes architectes={architectes} initial={liaisons} label={t('architectes')} />` dans le formulaire (bloc dédié), avec une clé i18n `formPatrimoine.architectes`.

- [ ] **Step 5: Replace links on save**

Dans `enregistrerPatrimoine` (`actions.ts`), après avoir obtenu `resultId` :
```ts
  // Remplace les liaisons architectes.
  const ids = formData.getAll('architecte_ids').map((v) => v.toString())
  await sb.from('patrimoine_architecte').delete().eq('patrimoine_id', resultId)
  if (ids.length > 0) {
    const rows = ids.map((architecte_id) => {
      const role = (formData.get(`role_${architecte_id}`) ?? '').toString().trim()
      return { patrimoine_id: resultId, architecte_id, role: role === '' ? null : role }
    })
    const { error } = await sb.from('patrimoine_architecte').insert(rows)
    if (error) throw error
  }
```
(Placer avant `revalidatePath`/`return`.)

- [ ] **Step 6: Load architectes + liaisons in the patrimoine pages**

- `nouveau/page.tsx` : charger `architectes (id, nom)` (order nom) → passer `architectes={…} liaisons={[]}`.
- `[id]/page.tsx` : charger aussi `patrimoine_architecte(architecte_id, role)` du patrimoine → passer `liaisons`.
- Charger via `createServerClient()`.

- [ ] **Step 7: Run to verify it passes + full suite + build**

Run: `cd paaciv && npm run lint && npx playwright test tests/admin-liaison.spec.ts && npm run build`
Expected: PASS ; build OK.

- [ ] **Step 8: Commit**

```bash
git add paaciv/components/admin/LiaisonArchitectes.tsx paaciv/components/admin/FormulairePatrimoine.tsx "paaciv/app/[locale]/admin/patrimoine/actions.ts" "paaciv/app/[locale]/admin/patrimoine/[id]/page.tsx" "paaciv/app/[locale]/admin/patrimoine/nouveau/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/admin-liaison.spec.ts
git commit -m "feat(admin): liaison architectes (cases + rôle) dans le formulaire patrimoine"
```

---

### Task 10: Vérification finale de la fonctionnalité (suite complète)

**Files:** aucun nouveau (tâche de vérification transverse).

- [ ] **Step 1: Full suite + lint + build**

Run: `cd paaciv && npm run lint && npm test && npm run e2e && npm run build`
Expected: lint OK ; tous les tests unit + e2e PASS ; build OK.

- [ ] **Step 2: Smoke manuel (facultatif, si serveur dispo)**

`npm run dev`, vérifier : `/fr/architectes` (2 sections, badges d'année), une fiche architecte (bio/parcours/réalisations), une fiche patrimoine lié (architectes affichés), admin architectes (création + éditeur), liaison dans le form patrimoine.

- [ ] **Step 3: Commit (si ajustements)**

Committer tout correctif de cohérence trouvé pendant la vérification.

---

## Self-Review

**Spec coverage :**
- Schéma `architectes` + `patrimoine_architecte(role)` + RLS → Task 1. ✔
- Seed démo (ivoiriens/étrangers + liaison) → Task 2. ✔
- Data layer (liste + fiche avec réalisations liées) → Task 3. ✔
- Fiche patrimoine : architectes liés → Task 4. ✔
- Page `/architectes` (grille triée Ivoiriens + grille Étrangers) → Task 5. ✔
- Fiche `/architectes/[slug]` (bio/parcours/réalisations, OpenGraph, 404) → Task 6. ✔
- Admin liste + actions (assainissement, upload photo) → Task 7. ✔
- Admin formulaire (EditeurRiche FR/EN, photo) → Task 8. ✔
- Liaison dans le formulaire patrimoine (cases + rôle, remplacement) → Task 9. ✔
- i18n (architectes, ficheArchitecte, adminArchitectes, formArchitecte) → Tasks 5–8. ✔
- Tests DB/RLS, data, e2e public + admin → Tasks 1–9 ; vérif transverse → Task 10. ✔

**Placeholder scan :** les squelettes CRUD (Tasks 7/8 liste, pages nouveau/[id]) sont décrits par **mirror explicite d'un fichier existant nommé** (patrimoine équivalent) plutôt que dupliqués — chaque point de divergence (champs, tables, i18n) est explicité. Le code non-évident (schéma, RLS, assainissement, jointures data, remplacement des liaisons, composants nouveaux) est fourni intégralement. Pas de « TODO ».

**Type consistency :** `ArchitecteListItem`/`ArchitecteDetail`/`RealisationLiee` (Task 3) consommés en Tasks 5/6/8 ; `PatrimoineDetail.architectes` (Task 4) consommé par la fiche ; `enregistrerArchitecte`/`supprimerArchitecte` (Task 7) consommés en Task 8 ; champs de formulaire liaison `architecte_ids`/`role_<id>` (Task 9) cohérents entre `LiaisonArchitectes` et `enregistrerPatrimoine`. ✔

**Notes d'exécution :**
- Tasks 1/2 appliquent des migrations via le MCP `supabase-paaciv` (effets réels sur le projet distant) — appliquer dans l'ordre.
- Tasks 4 et 9 modifient `FormulairePatrimoine`/`actions.ts`/pages patrimoine — Task 9 après Task 4.
- Vérifier à l'implémentation les signatures exactes réutilisées (`imageUrl`, `createReadClient`, `CartePatrimoine` item, usage `next/image` vs `<img>`) en s'alignant sur les fichiers patrimoine existants.
