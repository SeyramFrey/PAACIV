# Éditorial (Phase 4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le volet éditorial (articles, reportages vidéo, événements) : schéma + RLS + seed, pages publiques, intégration YouTube sans cookie, back-office CRUD, et bloc « À lire / À voir » sur la fiche patrimoine.

**Architecture:** Trois tables indépendantes (contraintes SQL propres à chaque type) + une table de référence `categories_article`, avec des **primitives d'UI partagées** (`CarteContenu`, `FacadeVideo`) plutôt que trois copies. La logique non triviale (parsing d'URL YouTube, partition à-venir/passé, filtrage des contenus liés) vit dans des **fonctions pures exportées**, testées unitairement — la RLS masque les lignes avant le code JS, donc un test d'intégration anonyme ne peut pas prouver un filtre applicatif.

**Tech Stack:** Next.js 16.3 (App Router), React 19.2, TypeScript, next-intl, Tailwind v4, Supabase (Postgres + RLS + Storage), Tiptap 3, Vitest, Playwright (`workers: 2`, projet `e2e` authentifié).

## Global Constraints

- Répertoire de travail du code : `paaciv/`. Migrations appliquées via le MCP `supabase-paaciv` (projet ref `yognzzhrrllomokvoooy`) **ET** écrites en fichier `paaciv/supabase/migrations/NNNN_*.sql` (numérotation à la suite de `0010`).
- **RLS obligatoire**, activée à la création de chaque table : `anon` lit uniquement `statut = 'publie'` ; `authenticated` a l'accès complet. `categories_article` = lecture publique inconditionnelle (table de référence).
- **Double assainissement** de tout champ riche : `richeOuNull` (`@/lib/admin/champs`, qui appelle `assainirHtml`) à l'enregistrement **ET** `TexteRiche` (`@/components/patrimoine/TexteRiche`) au rendu. Aucun `dangerouslySetInnerHTML` hors `TexteRiche`.
- Lectures publiques via `createReadClient()` (`@/lib/supabase/reader`, cookieless) ; écritures admin via `createServerClient()` (`@/lib/supabase/server`, session cookie). Ne jamais utiliser le client cookie dans un test Node.
- `statut ∈ {brouillon, publie}` (check SQL) sur les trois tables. Brouillon ⇒ `notFound()` côté public.
- **`export const dynamic = 'force-dynamic'` sur CHAQUE nouvelle page publique.** Sans segment dynamique, Next 16 pré-rend en statique et ne revalide jamais (bug réel de la Phase 3 sur `/architectes`, invisible en e2e qui tourne contre `next dev`).
- Helpers existants à réutiliser, signatures exactes : `slugify(texte: string): string` (`@/lib/slug`) · `champ(fr, en, locale): string` (`@/lib/i18n-champ`) · `imageUrl(chemin: string): string` (`@/lib/media`) · `texteOuNull` / `intOuNull` / `richeOuNull` (`@/lib/admin/champs`).
- Liens internes via `import { Link } from '@/i18n/navigation'` (jamais `next/link`).
- Images distantes : balise `<img>` avec `{/* eslint-disable-next-line @next/next/no-img-element */}`, comme `components/patrimoine/CartePatrimoine.tsx`. `next.config.ts` ne déclare aucun `images.remotePatterns` — ne pas en ajouter.
- Uploads dans le bucket Storage **existant** `patrimoine`, préfixes `articles/<id>/` et `evenements/<id>/`. Les policies du bucket ne filtrent pas par préfixe (vérifié en Phase 3) — aucune migration Storage.
- Clés i18n ajoutées dans **les deux** fichiers `paaciv/i18n/messages/fr.json` et `en.json`, structurellement synchronisés. **Gotcha :** Turbopack ne recharge pas fiablement ces JSON — sur un `MISSING_MESSAGE` d'une clé présente sur disque, redémarrer `next dev` (au besoin `rm -rf .next`).
- Pas de nouveau `any` (le dépôt lint `@typescript-eslint/no-explicit-any`).
- Tests : `npm test` (Vitest), `npm run e2e` (Playwright), `npm run lint`, `npm run build`. Projet e2e authentifié via `test.use({ storageState: 'playwright/.auth/admin.json' })`.
- **Aucun test ne doit modifier ni supprimer les lignes du seed.** Un test qui crée une ligne la supprime dans un `afterAll` **et assert que la suppression a réussi** (une suppression muette sous RLS empoisonne la campagne suivante).
- Commits fréquents (un par tâche minimum), messages FR, préfixe conventionnel, terminés par `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `supabase/migrations/0011_editorial.sql` | Tables `categories_article`, `articles`, `reportages`, `evenements` + index + triggers + `enable row level security` |
| `supabase/migrations/0012_editorial_rls.sql` | Politiques RLS des quatre tables |
| `supabase/migrations/0013_editorial_seed.sql` | Seed de démo, **un brouillon par table** |
| `lib/youtube.ts` | Fonctions pures : extraction d'identifiant, URL de miniature, URL de lecteur |
| `lib/evenements-dates.ts` | Fonction pure : partition à-venir / passés à date de référence donnée |
| `lib/data/articles.ts` | Lecture publique des articles (liste filtrée, détail) |
| `lib/data/reportages.ts` | Lecture publique des reportages (liste, détail) |
| `lib/data/evenements.ts` | Lecture publique des événements (liste, détail) |
| `lib/data/patrimoine.ts` (modifié) | Ajout de `contenusLies(patrimoineId)` + mapper pur |
| `components/editorial/FacadeVideo.tsx` | Lecteur YouTube différé au clic (client) |
| `components/editorial/CarteContenu.tsx` | Carte d'index partagée (visuel, badge, date, titre, extrait, lien) |
| `app/[locale]/articles/page.tsx` · `[slug]/page.tsx` | Index + fiche article |
| `app/[locale]/reportages/page.tsx` · `[slug]/page.tsx` | Index + fiche reportage |
| `app/[locale]/evenements/page.tsx` · `[slug]/page.tsx` | Index + fiche événement |
| `app/[locale]/admin/{articles,reportages,evenements}/**` | Liste, actions, formulaires `nouveau`/`[id]` |
| `components/admin/Formulaire{Article,Reportage,Evenement}.tsx` | Formulaires client |

---

### Task 1: Schéma éditorial + RLS

**Files:**
- Create: `paaciv/supabase/migrations/0011_editorial.sql`
- Create: `paaciv/supabase/migrations/0012_editorial_rls.sql`
- Apply: via MCP `supabase-paaciv` `apply_migration`, une par fichier, **dans l'ordre**
- Test: `paaciv/tests/db/editorial.spec.ts`

**Interfaces:**
- Produces (tables) : `categories_article(id, nom_fr, nom_en, ordre)` · `articles(id, slug, titre_fr/en, chapo_fr/en, corps_fr/en, image_couverture, categorie_id, patrimoine_id, date_publication, statut, created_at, updated_at)` · `reportages(id, slug, titre_fr/en, video_url, description_fr/en, patrimoine_id, date, statut, timestamps)` · `evenements(id, slug, titre_fr/en, description_fr/en, image, lieu, date_debut, date_fin, statut, timestamps)`

- [ ] **Step 1: Read the existing patterns first**

Lire `paaciv/supabase/migrations/0008_architectes.sql` et `0009_architectes_rls.sql` : ce sont les modèles à suivre (style, nommage des index, forme des politiques). `public.touch_updated_at()` est défini en `0005_patrimoine_rls.sql` avec `search_path` déjà épinglé — le réutiliser tel quel, ne pas le redéfinir.

- [ ] **Step 2: Write the schema migration**

```sql
-- paaciv/supabase/migrations/0011_editorial.sql
-- Phase 4 · Volet éditorial : articles, reportages vidéo, événements.

create table categories_article (
  id      text primary key,
  nom_fr  text not null,
  nom_en  text,
  ordre   int  not null default 0
);

create table articles (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  titre_fr          text not null,
  titre_en          text,
  chapo_fr          text,
  chapo_en          text,
  corps_fr          text,
  corps_en          text,
  image_couverture  text,
  categorie_id      text references categories_article(id) on delete set null,
  patrimoine_id     uuid references patrimoine(id)         on delete set null,
  date_publication  date not null default current_date,
  statut            text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table reportages (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  titre_fr        text not null,
  titre_en        text,
  video_url       text not null,
  description_fr  text,
  description_en  text,
  patrimoine_id   uuid references patrimoine(id) on delete set null,
  date            date not null default current_date,
  statut          text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table evenements (
  id              uuid primary key default gen_random_uuid(),
  slug            text unique not null,
  titre_fr        text not null,
  titre_en        text,
  description_fr  text,
  description_en  text,
  image           text,
  lieu            text,
  date_debut      date not null,
  date_fin        date,
  statut          text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint evenements_dates_coherentes check (date_fin is null or date_fin >= date_debut)
);

create index idx_articles_statut      on articles(statut);
create index idx_articles_date        on articles(date_publication desc);
create index idx_articles_categorie   on articles(categorie_id);
create index idx_articles_patrimoine  on articles(patrimoine_id);
create index idx_reportages_statut    on reportages(statut);
create index idx_reportages_date      on reportages(date desc);
create index idx_reportages_patrimoine on reportages(patrimoine_id);
create index idx_evenements_statut    on evenements(statut);
create index idx_evenements_debut     on evenements(date_debut);

create trigger trg_articles_touch   before update on articles
  for each row execute function public.touch_updated_at();
create trigger trg_reportages_touch before update on reportages
  for each row execute function public.touch_updated_at();
create trigger trg_evenements_touch before update on evenements
  for each row execute function public.touch_updated_at();

alter table categories_article enable row level security;
alter table articles           enable row level security;
alter table reportages         enable row level security;
alter table evenements         enable row level security;
```

- [ ] **Step 3: Write the RLS migration**

```sql
-- paaciv/supabase/migrations/0012_editorial_rls.sql
-- Phase 4 · Politiques RLS du volet éditorial.

-- Table de référence : lecture publique inconditionnelle.
create policy "categories_article select public"
  on categories_article for select to anon using (true);
create policy "categories_article all admin"
  on categories_article for all to authenticated using (true) with check (true);

create policy "articles select public"
  on articles for select to anon using (statut = 'publie');
create policy "articles all admin"
  on articles for all to authenticated using (true) with check (true);

create policy "reportages select public"
  on reportages for select to anon using (statut = 'publie');
create policy "reportages all admin"
  on reportages for all to authenticated using (true) with check (true);

create policy "evenements select public"
  on evenements for select to anon using (statut = 'publie');
create policy "evenements all admin"
  on evenements for all to authenticated using (true) with check (true);
```

- [ ] **Step 4: Apply both migrations via MCP**

Charger les outils différés : `ToolSearch` avec `select:mcp__supabase-paaciv__apply_migration,mcp__supabase-paaciv__execute_sql,mcp__supabase-paaciv__list_tables`. Appliquer `0011_editorial` puis `0012_editorial_rls` (`name` = nom de fichier sans extension, `query` = contenu). Confirmer avec `list_tables` que les quatre tables existent avec `rls_enabled: true`.

- [ ] **Step 5: Write the RLS test**

```ts
// paaciv/tests/db/editorial.spec.ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const sb = () => createClient(url, anon)

for (const table of ['articles', 'reportages', 'evenements'] as const) {
  test(`RLS : un anonyme ne peut pas insérer dans ${table}`, async () => {
    const { error } = await sb().from(table).insert({ slug: `x-test-${table}`, titre_fr: 'X', video_url: 'x', date_debut: '2026-01-01' })
    expect(error).not.toBeNull()
  })
}

test('les catégories d\'articles sont lisibles publiquement', async () => {
  const { data, error } = await sb().from('categories_article').select('id')
  expect(error).toBeNull()
  expect(data).not.toBeNull()
})
```

Note : l'insert envoie volontairement les colonnes des trois tables à la fois ; peu importe laquelle échoue en premier, l'assertion porte sur le refus. Les tests « le public ne voit que les publiés » arrivent en Task 2, une fois qu'il y a des brouillons à masquer — les écrire maintenant les rendrait vrais par vacuité.

- [ ] **Step 6: Run the test**

Run: `cd paaciv && npx playwright test tests/db/editorial.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add paaciv/supabase/migrations/0011_editorial.sql paaciv/supabase/migrations/0012_editorial_rls.sql paaciv/tests/db/editorial.spec.ts
git commit -m "feat(editorial): schéma articles/reportages/événements + RLS"
```

---

### Task 2: Seed éditorial (avec un brouillon par table)

**Files:**
- Create: `paaciv/supabase/migrations/0013_editorial_seed.sql`
- Modify: `paaciv/tests/db/editorial.spec.ts` (ajouter les tests de visibilité)
- Apply: via MCP `supabase-paaciv`

**Interfaces:**
- Consumes: tables de la Task 1 ; s'appuie sur des lignes `patrimoine` existantes pour les liaisons.
- Produces (valeurs sur lesquelles les tâches suivantes s'appuient) : catégories `histoires`, `temps-forts`, `archives`, `livres` ; articles publiés dont `pyramide-abidjan-histoire` (catégorie `histoires`, lié à un patrimoine publié) ; article brouillon `article-brouillon` ; reportages publiés dont `visite-basilique` ; reportage brouillon `reportage-brouillon` ; événement **à venir** `exposition-a-venir`, événement **passé** `conference-passee`, événement brouillon `evenement-brouillon`.

- [ ] **Step 1: Inspect real patrimoine slugs**

Via MCP `execute_sql` : `select slug, titre_fr, statut from patrimoine order by titre_fr;`. Noter un slug **publié** pour les liaisons (le seed de la Phase 2 en contient plusieurs, dont `basilique-yamoussoukro`). Ne pas inventer de slug.

- [ ] **Step 2: Write the seed migration**

Contraintes impératives :
- **Un brouillon par table** (`article-brouillon`, `reportage-brouillon`, `evenement-brouillon`) — sans eux, les tests « le public ne voit que les publiés » sont vrais par vacuité.
- **Dates d'événements relatives à `current_date`**, jamais en dur : `current_date + interval '30 days'` pour l'à-venir, `current_date - interval '60 days'` pour le passé. Un seed daté en dur bascule tout seul dans le passé et casse les tests quelques mois plus tard.
- `video_url` : placeholders **explicitement marqués démo** dans le titre (ex. `Titre — VIDÉO DE DÉMO`), à remplacer par le client. Utiliser des URLs YouTube de forme valide et variée (`https://www.youtube.com/watch?v=<11car>` et `https://youtu.be/<11car>`) pour que le parsing soit exercé sur les deux formes.
- HTML riche limité à l'allowlist de l'assainisseur (`p, br, strong, em, u, s, h2, h3, ul, ol, li, blockquote, a`) — se contenter de `<p>…</p>`.
- Échappement SQL des apostrophes françaises (`l''histoire`).
- `on conflict (id) do nothing` / `on conflict (slug) do nothing` pour rester rejouable.
- Lier au moins un article **et** un reportage publiés au **même** patrimoine publié (Task 10 en dépend), plus un article **brouillon** lié à ce même patrimoine (piège : il ne doit pas apparaître dans le bloc « À lire »).

- [ ] **Step 3: Apply via MCP and verify counts**

`apply_migration` (name `0013_editorial_seed`), puis `execute_sql` :
`select statut, count(*) from articles group by statut;` (et idem pour les deux autres tables). Attendu : au moins 2 publiés et exactement 1 brouillon par table.

- [ ] **Step 4: Add the visibility tests**

```ts
// à ajouter dans paaciv/tests/db/editorial.spec.ts
const BROUILLONS = { articles: 'article-brouillon', reportages: 'reportage-brouillon', evenements: 'evenement-brouillon' } as const

for (const [table, slugBrouillon] of Object.entries(BROUILLONS)) {
  test(`le public ne voit que les ${table} publiés`, async () => {
    const { data, error } = await sb().from(table).select('slug, statut')
    expect(error).toBeNull()
    const lignes = data ?? []
    expect(lignes.length).toBeGreaterThan(0)                                  // sinon l'assertion suivante est vide de sens
    expect(lignes.every((l) => l.statut === 'publie')).toBe(true)
    expect(lignes.some((l) => l.slug === slugBrouillon)).toBe(false)          // le brouillon existe en base et doit rester invisible
  })
}
```

- [ ] **Step 5: Run the tests**

Run: `cd paaciv && npx playwright test tests/db/editorial.spec.ts`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
git add paaciv/supabase/migrations/0013_editorial_seed.sql paaciv/tests/db/editorial.spec.ts
git commit -m "feat(editorial): seed démo (articles, reportages, événements + brouillons)"
```

---

### Task 3: Module YouTube pur

**Files:**
- Create: `paaciv/lib/youtube.ts`
- Test: `paaciv/lib/__tests__/youtube.test.ts`

**Interfaces:**
- Produces: `extraireIdYoutube(url: string | null | undefined): string | null` · `miniatureYoutube(id: string): string` · `lecteurYoutube(id: string): string`

- [ ] **Step 1: Write the failing test**

```ts
// paaciv/lib/__tests__/youtube.test.ts
import { describe, expect, it } from 'vitest'
import { extraireIdYoutube, lecteurYoutube, miniatureYoutube } from '@/lib/youtube'

describe('extraireIdYoutube', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=PL1&v=dQw4w9WgXcQ&t=42', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?t=42', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extrait l\'identifiant de %s', (url, attendu) => {
    expect(extraireIdYoutube(url)).toBe(attendu)
  })

  it.each([
    [null], [undefined], [''], ['   '],
    ['https://example.com/watch?v=dQw4w9WgXcQ'],   // bon motif, mauvais domaine
    ['https://www.youtube.com/watch?v=trop-court'], // identifiant non conforme
    ['pas une url du tout'],
  ])('rejette %s', (url) => {
    expect(extraireIdYoutube(url as string | null | undefined)).toBeNull()
  })
})

it('construit les URL de miniature et de lecteur sans cookie', () => {
  expect(miniatureYoutube('dQw4w9WgXcQ')).toBe('https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  expect(lecteurYoutube('dQw4w9WgXcQ')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npm test -- youtube`
Expected: FAIL (module `@/lib/youtube` introuvable).

- [ ] **Step 3: Implement**

```ts
// paaciv/lib/youtube.ts
// Parsing d'URL YouTube — fonctions pures, testées sans réseau ni base.

const HOTES = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com']
const ID = /^[\w-]{11}$/

/** Renvoie l'identifiant de 11 caractères, ou null si l'URL n'est pas une vidéo YouTube exploitable. */
export function extraireIdYoutube(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  if (!HOTES.includes(u.hostname)) return null

  const candidat =
    u.searchParams.get('v') ??
    (u.hostname.endsWith('youtu.be')
      ? u.pathname.slice(1)
      : u.pathname.replace(/^\/(embed|shorts)\//, ''))

  return ID.test(candidat) ? candidat : null
}

export function miniatureYoutube(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

export function lecteurYoutube(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd paaciv && npm test -- youtube && npm run lint`
Expected: PASS (tous les cas), lint clean.

- [ ] **Step 5: Commit**

```bash
git add paaciv/lib/youtube.ts paaciv/lib/__tests__/youtube.test.ts
git commit -m "feat(editorial): module pur d'analyse des URL YouTube"
```

---

### Task 4: `FacadeVideo` + suppression du helper local du patrimoine

**Files:**
- Create: `paaciv/components/editorial/FacadeVideo.tsx`
- Modify: `paaciv/app/[locale]/patrimoine/[slug]/page.tsx` (supprimer `embedYoutube` local, utiliser `FacadeVideo`)
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (clé `video.lire`)
- Test: `paaciv/tests/video-facade.spec.ts`

**Interfaces:**
- Consumes: `extraireIdYoutube`, `miniatureYoutube`, `lecteurYoutube` (Task 3).
- Produces: `<FacadeVideo url={string | null} titre={string} labelLire={string} />` — rend `null` si l'URL est inexploitable.

- [ ] **Step 1: Read the code being replaced**

`paaciv/app/[locale]/patrimoine/[slug]/page.tsx:55-60` contient un helper local `embedYoutube` : regex `/(?:youtu\.be\/|v=)([\w-]{11})/` (ne reconnaît ni `/embed/` ni `/shorts/`) produisant une iframe `youtube.com` chargée immédiatement. Il doit **disparaître** — pas rester en parallèle du module partagé.

- [ ] **Step 2: Write the failing e2e test**

```ts
// paaciv/tests/video-facade.spec.ts
import { test, expect } from '@playwright/test'

// Le seed lie un reportage publié à un patrimoine publié ; on teste ici la fiche patrimoine,
// qui porte déjà une video_url dans le seed de la Phase 2.
test('la vidéo ne charge son iframe qu\'après le clic', async ({ page }) => {
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  const facade = page.getByTestId('facade-video')
  await expect(facade).toBeVisible()
  await expect(page.locator('iframe')).toHaveCount(0)      // aucun contenu Google avant action
  await facade.getByRole('button').click()
  await expect(page.locator('iframe')).toHaveCount(1)
  await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//)
})
```

Si le patrimoine `basilique-yamoussoukro` n'a pas de `video_url` dans le seed, en choisir un qui en a (`execute_sql` : `select slug from patrimoine where video_url is not null and statut='publie' limit 1;`) et adapter le slug du test.

- [ ] **Step 3: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/video-facade.spec.ts`
Expected: FAIL — `facade-video` absent (la page rend encore une iframe immédiate).

- [ ] **Step 4: Implement the component**

```tsx
// paaciv/components/editorial/FacadeVideo.tsx
'use client'

import { useState } from 'react'
import { extraireIdYoutube, lecteurYoutube, miniatureYoutube } from '@/lib/youtube'

type Props = { url: string | null; titre: string; labelLire: string }

/**
 * Lecteur YouTube différé : on n'affiche que la miniature jusqu'au clic, puis on insère
 * l'iframe sur youtube-nocookie.com. Aucun script ni cookie Google avant action de
 * l'utilisateur — donc pas de bandeau de consentement, et ~500 Ko économisés par page.
 */
export function FacadeVideo({ url, titre, labelLire }: Props) {
  const [lecture, setLecture] = useState(false)
  const id = extraireIdYoutube(url)
  if (!id) return null

  if (lecture) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl" data-testid="facade-video">
        <iframe
          src={`${lecteurYoutube(id)}?autoplay=1`}
          title={titre}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-encre" data-testid="facade-video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={miniatureYoutube(id)} alt="" aria-hidden="true" className="h-full w-full object-cover" loading="lazy" />
      <button
        type="button"
        onClick={() => setLecture(true)}
        aria-label={`${labelLire} : ${titre}`}
        className="absolute inset-0 flex items-center justify-center transition hover:bg-encre/20"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terre text-2xl text-sable shadow-lg">
          ▶
        </span>
      </button>
    </div>
  )
}
```

Note d'accessibilité : la miniature est décorative (`alt=""`, `aria-hidden`) parce que le bouton porte déjà le nom accessible complet — sinon un lecteur d'écran annoncerait deux fois le titre.

- [ ] **Step 5: Add the i18n key**

`fr.json` → `"video": { "lire": "Lire la vidéo" }` · `en.json` → `"video": { "lire": "Play video" }`

- [ ] **Step 6: Replace the local helper in the patrimoine page**

Dans `paaciv/app/[locale]/patrimoine/[slug]/page.tsx` : supprimer la fonction locale `embedYoutube` et la variable `yt`, importer `FacadeVideo`, et remplacer le bloc d'iframe existant par
`<FacadeVideo url={p.video_url} titre={champ(p.titre_fr, p.titre_en, locale)} labelLire={tVideo('lire')} />`
(avec `const tVideo = await getTranslations('video')`). Vérifier qu'aucune référence à `embedYoutube` ne subsiste : `grep -rn "embedYoutube" paaciv/` doit ne rien renvoyer.

- [ ] **Step 7: Run to verify it passes**

Run: `cd paaciv && npm run lint && npx playwright test tests/video-facade.spec.ts tests/fiche.spec.ts`
Expected: PASS (la fiche patrimoine ne doit pas régresser).

- [ ] **Step 8: Commit**

```bash
git add paaciv/components/editorial/FacadeVideo.tsx "paaciv/app/[locale]/patrimoine/[slug]/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/video-facade.spec.ts
git commit -m "feat(editorial): façade vidéo YouTube différée, en remplacement du helper local"
```

---

### Task 5: `CarteContenu` — carte d'index partagée

**Files:**
- Create: `paaciv/components/editorial/CarteContenu.tsx`
- Test: `paaciv/components/editorial/__tests__/CarteContenu.test.tsx`

**Interfaces:**
- Produces: `<CarteContenu href image badge date titre extrait testId />` avec
  `{ href: string; image: string | null; badge?: string | null; date?: string | null; titre: string; extrait?: string | null; testId?: string }`
- Consommée par les Tasks 6, 7, 8, et réutilisée en Phase 5 pour l'accueil.

- [ ] **Step 1: Read the sibling component**

`paaciv/components/patrimoine/CartePatrimoine.tsx` — mêmes conventions à respecter (structure du lien, `<img>` + eslint-disable, arrondis, transitions, couleurs Terre & Ocre).

- [ ] **Step 2: Write the failing test**

Vérifier comment les tests de composants existants sont écrits (`paaciv/components/**/__tests__/`) et suivre la même configuration. Le test doit couvrir :
- le titre et le lien sont rendus ;
- le badge et la date sont **omis du DOM** quand ils valent `null`/`undefined` (et non rendus vides) ;
- une image `null` ne produit pas de balise `<img>` avec `src` vide (cas réel : un article sans couverture).

```tsx
// paaciv/components/editorial/__tests__/CarteContenu.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CarteContenu } from '@/components/editorial/CarteContenu'

describe('CarteContenu', () => {
  it('rend le titre dans un lien', () => {
    render(<CarteContenu href="/fr/articles/a" image={null} titre="Mon titre" />)
    expect(screen.getByRole('link', { name: /Mon titre/ })).toHaveAttribute('href', '/fr/articles/a')
  })

  it('omet le badge, la date et l\'image quand ils sont absents', () => {
    const { container } = render(<CarteContenu href="/x" image={null} titre="T" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByTestId('carte-badge')).toBeNull()
    expect(screen.queryByTestId('carte-date')).toBeNull()
  })

  it('rend le badge, la date et l\'image quand ils sont fournis', () => {
    render(<CarteContenu href="/x" image="https://exemple.test/i.jpg" badge="Histoires" date="12 mars 2026" titre="T" extrait="Chapô" />)
    expect(screen.getByTestId('carte-badge')).toHaveTextContent('Histoires')
    expect(screen.getByTestId('carte-date')).toHaveTextContent('12 mars 2026')
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://exemple.test/i.jpg')
  })
})
```

Si `@testing-library/react` n'est pas déjà une dépendance du projet, **ne pas l'ajouter** : convertir ces trois cas en assertions e2e Playwright dans `tests/articles.spec.ts` (Task 6) et le signaler dans le rapport. Vérifier avec `grep -l "@testing-library/react" paaciv/package.json`.

- [ ] **Step 3: Run to verify it fails**

Run: `cd paaciv && npm test -- CarteContenu`
Expected: FAIL (composant introuvable).

- [ ] **Step 4: Implement**

Composant serveur (pas de `'use client'` — il ne fait qu'afficher). Lien via `import { Link } from '@/i18n/navigation'`. Structure : conteneur `<Link>` arrondi bordé `border-creme2` avec `transition hover:border-or` ; visuel en `aspect-video object-cover` si `image` ; badge (`data-testid="carte-badge"`) et date (`data-testid="carte-date"`) sur une ligne ; titre en `font-serif text-brun` ; extrait en `text-sm text-encre/70 line-clamp-3`. `testId` (défaut `carte-contenu`) posé sur le lien racine.

- [ ] **Step 5: Run to verify it passes + lint**

Run: `cd paaciv && npm test -- CarteContenu && npm run lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add paaciv/components/editorial/CarteContenu.tsx paaciv/components/editorial/__tests__/CarteContenu.test.tsx
git commit -m "feat(editorial): carte de contenu partagée pour les index"
```

---

### Task 6: Articles — data layer + index + fiche

**Files:**
- Create: `paaciv/lib/data/articles.ts`
- Create: `paaciv/app/[locale]/articles/page.tsx`
- Create: `paaciv/app/[locale]/articles/[slug]/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespaces `articles`, `ficheArticle`)
- Test: `paaciv/tests/db/data-articles.spec.ts`, `paaciv/tests/articles.spec.ts`

**Interfaces:**
- Consumes: `createReadClient`, `imageUrl`, `champ`, `CarteContenu` (Task 5), `TexteRiche`.
- Produces:
  - `ArticleListItem = { id: string; slug: string; titre_fr: string; titre_en: string | null; chapo_fr: string | null; chapo_en: string | null; image: string | null; categorie: { id: string; nom_fr: string; nom_en: string | null } | null; date_publication: string }`
  - `ArticleDetail = ArticleListItem & { corps_fr: string | null; corps_en: string | null; patrimoine: { slug: string; titre_fr: string; titre_en: string | null } | null }`
  - `listeArticles(categorie?: string): Promise<ArticleListItem[]>` (publiés, triés `date_publication` desc)
  - `getArticleParSlug(slug): Promise<ArticleDetail | null>` + `getArticleParSlugCache`
  - `listeCategoriesArticle(): Promise<{ id: string; nom_fr: string; nom_en: string | null }[]>`

- [ ] **Step 1: Read the sibling module**

`paaciv/lib/data/architectes.ts` — même forme à suivre : client cookieless, `if (error) throw error`, `imageUrl` pour résoudre les chemins, `cache()` de React pour la variante mémoïsée, mappers purs exportés si un filtrage applicatif existe.

- [ ] **Step 2: Write the failing data test**

```ts
// paaciv/tests/db/data-articles.spec.ts
import { test, expect } from '@playwright/test'
import { listeArticles, getArticleParSlug } from '@/lib/data/articles'

test('listeArticles ne renvoie que des publiés, triés du plus récent au plus ancien', async () => {
  const items = await listeArticles()
  expect(items.length).toBeGreaterThan(0)
  expect(items.some((a) => a.slug === 'article-brouillon')).toBe(false)
  const dates = items.map((a) => a.date_publication)
  expect([...dates].sort().reverse()).toEqual(dates)   // échoue si le tri est retiré
})

test('listeArticles filtre par catégorie', async () => {
  const tous = await listeArticles()
  const filtres = await listeArticles('histoires')
  expect(filtres.length).toBeGreaterThan(0)
  expect(filtres.length).toBeLessThan(tous.length)     // le seed contient d'autres catégories
  expect(filtres.every((a) => a.categorie?.id === 'histoires')).toBe(true)
})

test('getArticleParSlug renvoie le détail, null pour un brouillon ou un slug inconnu', async () => {
  const a = await getArticleParSlug('pyramide-abidjan-histoire')
  expect(a).not.toBeNull()
  expect(a!.patrimoine).not.toBeNull()
  expect(await getArticleParSlug('article-brouillon')).toBeNull()
  expect(await getArticleParSlug('nexiste-pas')).toBeNull()
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/db/data-articles.spec.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 4: Implement the data layer**

`select` de la liste : `'id, slug, titre_fr, titre_en, chapo_fr, chapo_en, image_couverture, date_publication, categorie:categories_article(id, nom_fr, nom_en)'`, `.eq('statut','publie')`, `.order('date_publication', { ascending: false })`, plus `.eq('categorie_id', categorie)` quand l'argument est fourni.
Détail : même `select` + `corps_fr, corps_en, patrimoine:patrimoine(slug, titre_fr, titre_en, statut)`, `.eq('slug', slug).eq('statut','publie').maybeSingle()`.
Le patrimoine lié doit être **ignoré s'il n'est pas publié** — extraire ce filtrage dans une petite fonction pure exportée et la couvrir dans `paaciv/lib/data/__tests__/articles.test.ts` (la RLS le masque déjà côté anon, donc seul un test unitaire prouve que le code fait son travail ; c'est la leçon de la Phase 3).
`image` = `imageUrl(image_couverture)` ou `null`.

- [ ] **Step 5: Run the data test**

Run: `cd paaciv && npx playwright test tests/db/data-articles.spec.ts && npm test -- articles`
Expected: PASS.

- [ ] **Step 6: Add i18n**

`fr.json` : `"articles": { "titre": "Articles", "intro": "Récits, temps forts et lectures autour du patrimoine ivoirien.", "toutes": "Toutes les catégories", "aucun": "Aucun article pour le moment." }` et `"ficheArticle": { "patrimoineLie": "Patrimoine lié", "retour": "Tous les articles" }`.
`en.json` : `"articles": { "titre": "Articles", "intro": "Stories, highlights and readings on Ivorian heritage.", "toutes": "All categories", "aucun": "No articles yet." }` et `"ficheArticle": { "patrimoineLie": "Related heritage", "retour": "All articles" }`.

- [ ] **Step 7: Write the failing e2e test**

```ts
// paaciv/tests/articles.spec.ts
import { test, expect } from '@playwright/test'

test('l\'index articles liste les publiés et masque les brouillons', async ({ page }) => {
  await page.goto('/fr/articles')
  await expect(page.getByRole('heading', { name: 'Articles', level: 1 })).toBeVisible()
  await expect(page.getByTestId('carte-article').first()).toBeVisible()
  await expect(page.getByText('BROUILLON', { exact: false })).toHaveCount(0)
})

test('le filtre par catégorie restreint réellement les résultats', async ({ page }) => {
  await page.goto('/fr/articles')
  const total = await page.getByTestId('carte-article').count()
  await page.goto('/fr/articles?categorie=histoires')
  const filtre = await page.getByTestId('carte-article').count()
  expect(filtre).toBeGreaterThan(0)
  expect(filtre).toBeLessThan(total)
})

test('la fiche article rend le corps riche et le patrimoine lié', async ({ page }) => {
  await page.goto('/fr/articles/pyramide-abidjan-histoire')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('patrimoine-lie')).toBeVisible()
})

test('un article brouillon renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/articles/article-brouillon')
  expect(res?.status()).toBe(404)
})
```

Le titre de l'article brouillon dans le seed doit contenir le mot `BROUILLON` pour que la première assertion soit discriminante.

- [ ] **Step 8: Implement both pages**

Index (`app/[locale]/articles/page.tsx`) : **`export const dynamic = 'force-dynamic'`**, `setRequestLocale(locale)`, lecture de `searchParams.categorie`, barre de filtre par catégorie (liens vers `?categorie=<id>` + « Toutes les catégories », en miroir de `components/patrimoine/FiltresArchives.tsx`), grille de `<CarteContenu testId="carte-article" …>`, état vide `t('aucun')`.
Fiche (`[slug]/page.tsx`) : `generateMetadata` avec OpenGraph (image = couverture, description = chapô, **sans balises**), `notFound()` si null, couverture, badge catégorie, date localisée, chapô, `<TexteRiche html={champ(a.corps_fr, a.corps_en, locale)} />`, bloc `data-testid="patrimoine-lie"` avec lien vers `/patrimoine/[slug]` (masqué si absent).

- [ ] **Step 9: Run everything**

Run: `cd paaciv && npm run lint && npx playwright test tests/articles.spec.ts tests/db/data-articles.spec.ts && npm run build`
Expected: PASS. **Dans la sortie de build, vérifier que `/[locale]/articles` apparaît en `ƒ` et jamais en `●`.**

- [ ] **Step 10: Commit**

```bash
git add paaciv/lib/data/articles.ts paaciv/lib/data/__tests__/articles.test.ts "paaciv/app/[locale]/articles" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/articles.spec.ts paaciv/tests/db/data-articles.spec.ts
git commit -m "feat(editorial): articles (data layer, index filtrable, fiche)"
```

---

### Task 7: Reportages — data layer + index + fiche

**Files:**
- Create: `paaciv/lib/data/reportages.ts`
- Create: `paaciv/app/[locale]/reportages/page.tsx`, `paaciv/app/[locale]/reportages/[slug]/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespaces `reportages`, `ficheReportage`)
- Test: `paaciv/tests/db/data-reportages.spec.ts`, `paaciv/tests/reportages.spec.ts`

**Interfaces:**
- Consumes: `FacadeVideo` (Task 4), `miniatureYoutube`/`extraireIdYoutube` (Task 3), `CarteContenu` (Task 5).
- Produces:
  - `ReportageListItem = { id: string; slug: string; titre_fr: string; titre_en: string | null; video_url: string; date: string }`
  - `ReportageDetail = ReportageListItem & { description_fr: string | null; description_en: string | null; patrimoine: { slug: string; titre_fr: string; titre_en: string | null } | null }`
  - `listeReportages(): Promise<ReportageListItem[]>` (publiés, `date` desc) · `getReportageParSlug(slug)` + variante `…Cache`

- [ ] **Step 1: Write the failing data test**

```ts
// paaciv/tests/db/data-reportages.spec.ts
import { test, expect } from '@playwright/test'
import { listeReportages, getReportageParSlug } from '@/lib/data/reportages'
import { extraireIdYoutube } from '@/lib/youtube'

test('listeReportages ne renvoie que des publiés, avec des URL vidéo exploitables', async () => {
  const items = await listeReportages()
  expect(items.length).toBeGreaterThan(0)
  expect(items.some((r) => r.slug === 'reportage-brouillon')).toBe(false)
  expect(items.every((r) => extraireIdYoutube(r.video_url) !== null)).toBe(true)
})

test('getReportageParSlug : détail pour un publié, null pour un brouillon', async () => {
  expect(await getReportageParSlug('visite-basilique')).not.toBeNull()
  expect(await getReportageParSlug('reportage-brouillon')).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/db/data-reportages.spec.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implement the data layer**

Miroir de `lib/data/articles.ts` (Task 6), sans catégorie ni image de couverture. Le patrimoine lié subit le même filtrage « publié seulement » via une fonction pure exportée et testée.

- [ ] **Step 4: Add i18n**

`fr.json` : `"reportages": { "titre": "Reportages", "intro": "Vidéos et entretiens produits par PAACIV.", "aucun": "Aucun reportage pour le moment." }`, `"ficheReportage": { "patrimoineLie": "Patrimoine lié", "retour": "Tous les reportages" }`. Équivalents EN.

- [ ] **Step 5: Write the failing e2e test**

```ts
// paaciv/tests/reportages.spec.ts
import { test, expect } from '@playwright/test'

test('l\'index reportages affiche des vignettes vidéo', async ({ page }) => {
  await page.goto('/fr/reportages')
  await expect(page.getByRole('heading', { name: 'Reportages', level: 1 })).toBeVisible()
  const premiere = page.getByTestId('carte-reportage').first()
  await expect(premiere).toBeVisible()
  await expect(premiere.locator('img')).toHaveAttribute('src', /i\.ytimg\.com/)
})

test('la fiche reportage ne charge l\'iframe qu\'au clic', async ({ page }) => {
  await page.goto('/fr/reportages/visite-basilique')
  await expect(page.locator('iframe')).toHaveCount(0)
  await page.getByTestId('facade-video').getByRole('button').click()
  await expect(page.locator('iframe')).toHaveAttribute('src', /youtube-nocookie\.com/)
})

test('un reportage brouillon renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/reportages/reportage-brouillon')
  expect(res?.status()).toBe(404)
})
```

- [ ] **Step 6: Implement both pages**

Index : `force-dynamic`, grille de `<CarteContenu testId="carte-reportage" image={miniatureYoutube(id)} …>` — l'identifiant vient de `extraireIdYoutube(r.video_url)`; si l'extraction échoue, passer `image={null}` plutôt que planter.
Fiche : `force-dynamic` implicite via le segment dynamique, `notFound()` si null, `<FacadeVideo …>`, titre, date, `TexteRiche` pour la description, bloc patrimoine lié, `generateMetadata` avec `openGraph.images = [miniatureYoutube(id)]`.

- [ ] **Step 7: Run everything**

Run: `cd paaciv && npm run lint && npx playwright test tests/reportages.spec.ts tests/db/data-reportages.spec.ts && npm run build`
Expected: PASS ; `/[locale]/reportages` en `ƒ`.

- [ ] **Step 8: Commit**

```bash
git add paaciv/lib/data/reportages.ts "paaciv/app/[locale]/reportages" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/reportages.spec.ts paaciv/tests/db/data-reportages.spec.ts
git commit -m "feat(editorial): reportages (data layer, index, fiche avec façade vidéo)"
```

---

### Task 8: Événements — partition pure + data layer + index + fiche

**Files:**
- Create: `paaciv/lib/evenements-dates.ts`, `paaciv/lib/__tests__/evenements-dates.test.ts`
- Create: `paaciv/lib/data/evenements.ts`
- Create: `paaciv/app/[locale]/evenements/page.tsx`, `paaciv/app/[locale]/evenements/[slug]/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (namespace `evenements`, `ficheEvenement`)
- Test: `paaciv/tests/db/data-evenements.spec.ts`, `paaciv/tests/evenements.spec.ts`

**Interfaces:**
- Produces:
  - `type AvecDates = { date_debut: string; date_fin: string | null }`
  - `partitionnerEvenements<T extends AvecDates>(evts: T[], reference: Date): { aVenir: T[]; passes: T[] }`
  - `EvenementListItem = { id: string; slug: string; titre_fr: string; titre_en: string | null; image: string | null; lieu: string | null; date_debut: string; date_fin: string | null }`
  - `EvenementDetail = EvenementListItem & { description_fr: string | null; description_en: string | null }`
  - `listeEvenements(): Promise<EvenementListItem[]>` · `getEvenementParSlug(slug)` + variante `…Cache`

- [ ] **Step 1: Write the failing unit test for the pure partition**

```ts
// paaciv/lib/__tests__/evenements-dates.test.ts
import { describe, expect, it } from 'vitest'
import { partitionnerEvenements } from '@/lib/evenements-dates'

const REF = new Date('2026-06-15T12:00:00Z')
const e = (slug: string, date_debut: string, date_fin: string | null = null) => ({ slug, date_debut, date_fin })

describe('partitionnerEvenements', () => {
  it('sépare à venir et passés autour de la date de référence', () => {
    const { aVenir, passes } = partitionnerEvenements(
      [e('futur', '2026-07-01'), e('vieux', '2026-01-10'), e('proche', '2026-06-20')],
      REF,
    )
    expect(aVenir.map((x) => x.slug)).toEqual(['proche', 'futur'])   // croissant
    expect(passes.map((x) => x.slug)).toEqual(['vieux'])
  })

  it('trie les passés du plus récent au plus ancien', () => {
    const { passes } = partitionnerEvenements([e('a', '2026-01-10'), e('b', '2026-05-01')], REF)
    expect(passes.map((x) => x.slug)).toEqual(['b', 'a'])
  })

  it('utilise date_fin quand elle existe : un événement en cours est « à venir »', () => {
    const { aVenir } = partitionnerEvenements([e('encours', '2026-06-01', '2026-06-30')], REF)
    expect(aVenir.map((x) => x.slug)).toEqual(['encours'])
  })

  it('considère le jour même comme non passé', () => {
    const { aVenir, passes } = partitionnerEvenements([e('aujourdhui', '2026-06-15')], REF)
    expect(aVenir).toHaveLength(1)
    expect(passes).toHaveLength(0)
  })
})
```

La date de référence est **un paramètre**, jamais `new Date()` interne : sinon le test dépend du jour où on le lance et pourrit tout seul.

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npm test -- evenements-dates`
Expected: FAIL (module introuvable).

- [ ] **Step 3: Implement the pure module**

```ts
// paaciv/lib/evenements-dates.ts
// Partition à-venir / passés. La date de référence est injectée pour rester testable.

export type AvecDates = { date_debut: string; date_fin: string | null }

/** Un événement n'est passé qu'une fois son dernier jour terminé (date_fin, sinon date_debut). */
function estPasse(e: AvecDates, reference: Date): boolean {
  const dernierJour = e.date_fin ?? e.date_debut
  return new Date(`${dernierJour}T23:59:59.999Z`).getTime() < reference.getTime()
}

export function partitionnerEvenements<T extends AvecDates>(
  evenements: T[],
  reference: Date,
): { aVenir: T[]; passes: T[] } {
  const aVenir: T[] = []
  const passes: T[] = []
  for (const e of evenements) (estPasse(e, reference) ? passes : aVenir).push(e)
  aVenir.sort((a, b) => a.date_debut.localeCompare(b.date_debut))
  passes.sort((a, b) => b.date_debut.localeCompare(a.date_debut))
  return { aVenir, passes }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd paaciv && npm test -- evenements-dates`
Expected: PASS (4 tests).

- [ ] **Step 5: Write the failing data test and implement the data layer**

```ts
// paaciv/tests/db/data-evenements.spec.ts
import { test, expect } from '@playwright/test'
import { listeEvenements, getEvenementParSlug } from '@/lib/data/evenements'

test('listeEvenements ne renvoie que des publiés', async () => {
  const items = await listeEvenements()
  expect(items.length).toBeGreaterThan(0)
  expect(items.some((e) => e.slug === 'evenement-brouillon')).toBe(false)
})

test('le seed contient un événement à venir et un passé', async () => {
  const items = await listeEvenements()
  expect(items.some((e) => e.slug === 'exposition-a-venir')).toBe(true)
  expect(items.some((e) => e.slug === 'conference-passee')).toBe(true)
})

test('getEvenementParSlug : null pour un brouillon', async () => {
  expect(await getEvenementParSlug('evenement-brouillon')).toBeNull()
})
```

Data layer en miroir de `lib/data/articles.ts` ; `image` résolue via `imageUrl`. Pas de tri en SQL : c'est `partitionnerEvenements` qui ordonne.

- [ ] **Step 6: Add i18n**

`fr.json` : `"evenements": { "titre": "Événements", "intro": "Expositions, conférences et activités de l'association.", "aVenir": "À venir", "passes": "Passés", "aucunAVenir": "Aucun événement à venir pour le moment.", "aucunPasse": "Aucun événement passé." }`, `"ficheEvenement": { "lieu": "Lieu", "retour": "Tous les événements" }`. Équivalents EN.

- [ ] **Step 7: Write the failing e2e test**

```ts
// paaciv/tests/evenements.spec.ts
import { test, expect } from '@playwright/test'

test('l\'index affiche les deux sections, chacune avec le bon événement', async ({ page }) => {
  await page.goto('/fr/evenements')
  const aVenir = page.getByRole('region', { name: 'À venir' })
  const passes = page.getByRole('region', { name: 'Passés' })
  await expect(aVenir.getByText('Exposition', { exact: false })).toBeVisible()
  await expect(passes.getByText('Conférence', { exact: false })).toBeVisible()
  // l'événement à venir ne doit pas se retrouver dans les passés
  await expect(passes.getByText('Exposition', { exact: false })).toHaveCount(0)
})

test('un événement brouillon renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/evenements/evenement-brouillon')
  expect(res?.status()).toBe(404)
})

test('la fiche événement affiche le lieu et les dates', async ({ page }) => {
  await page.goto('/fr/evenements/exposition-a-venir')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByTestId('evenement-dates')).toBeVisible()
})
```

Adapter les libellés (`Exposition`, `Conférence`) aux titres réellement seedés en Task 2.

- [ ] **Step 8: Implement both pages**

Index : **`force-dynamic`** (impératif : la partition dépend de `new Date()` au moment du rendu), `partitionnerEvenements(items, new Date())`, deux `<section aria-label>` avec état vide chacune, `<CarteContenu testId="carte-evenement">`.
Fiche : `notFound()` si null, image, `data-testid="evenement-dates"` (dates formatées via `Intl.DateTimeFormat(locale)`), lieu, `TexteRiche`, `generateMetadata` + OpenGraph.

- [ ] **Step 9: Run everything**

Run: `cd paaciv && npm run lint && npm test && npx playwright test tests/evenements.spec.ts tests/db/data-evenements.spec.ts && npm run build`
Expected: PASS ; `/[locale]/evenements` en `ƒ`.

- [ ] **Step 10: Commit**

```bash
git add paaciv/lib/evenements-dates.ts paaciv/lib/__tests__/evenements-dates.test.ts paaciv/lib/data/evenements.ts "paaciv/app/[locale]/evenements" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/evenements.spec.ts paaciv/tests/db/data-evenements.spec.ts
git commit -m "feat(editorial): événements (partition à venir/passés, index, fiche)"
```

---

### Task 9: Navigation « Actualités »

**Files:**
- Modify: `paaciv/components/SiteHeader.tsx` (remplacer le lien mort `/actualites` par un groupe)
- Modify: `paaciv/components/SiteFooter.tsx` (ajouter les trois liens)
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (libellés de nav)
- Test: `paaciv/tests/shell.spec.ts` (ajouter un cas)

**Interfaces:** aucune nouvelle interface de code.

- [ ] **Step 1: Read the current nav**

`SiteHeader.tsx:6-13` définit `navItems`, dont `{ href: '/actualites', key: 'actualites' }` — une route qui **n'existe pas** et renvoie 404 aujourd'hui. `SiteFooter.tsx:5-14` définit `explorerLinks` et `infosLinks`.

- [ ] **Step 2: Write the failing test**

```ts
// à ajouter dans paaciv/tests/shell.spec.ts
test('la navigation expose les trois rubriques éditoriales', async ({ page }) => {
  await page.goto('/fr')
  const nav = page.getByRole('navigation').first()
  for (const [libelle, href] of [['Articles', '/fr/articles'], ['Reportages', '/fr/reportages'], ['Événements', '/fr/evenements']] as const) {
    await expect(nav.getByRole('link', { name: libelle })).toHaveAttribute('href', href)
  }
})

test('aucun lien de navigation ne pointe vers /actualites', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('a[href$="/actualites"]')).toHaveCount(0)
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/shell.spec.ts`
Expected: FAIL (les trois liens n'existent pas, `/actualites` est encore là).

- [ ] **Step 4: Implement**

Header : remplacer l'entrée `/actualites` par un groupe « Actualités » contenant les trois liens. **Le menu doit être utilisable au clavier et sans JavaScript** : utiliser `<details><summary>` (ou un simple sous-groupe de liens visibles si le design le permet) plutôt qu'un survol JS. Ne pas introduire de dépendance de menu.
Footer : ajouter les trois liens à `explorerLinks`.
i18n : clés `nav.articles`, `nav.reportages`, `nav.evenements` (le libellé `nav.actualites` reste, il nomme le groupe).

- [ ] **Step 5: Run to verify it passes**

Run: `cd paaciv && npm run lint && npx playwright test tests/shell.spec.ts tests/i18n.spec.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add paaciv/components/SiteHeader.tsx paaciv/components/SiteFooter.tsx paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/shell.spec.ts
git commit -m "feat(editorial): navigation Actualités (articles, reportages, événements)"
```

---

### Task 10: Fiche patrimoine — bloc « À lire / À voir »

**Files:**
- Modify: `paaciv/lib/data/patrimoine.ts` (ajouter `contenusLies`)
- Modify: `paaciv/app/[locale]/patrimoine/[slug]/page.tsx`
- Modify: `paaciv/i18n/messages/fr.json` + `en.json` (clés `fiche.aLire`, `fiche.aVoir`)
- Test: `paaciv/lib/data/__tests__/patrimoine.test.ts` (compléter), `paaciv/tests/fiche.spec.ts` (compléter)

**Interfaces:**
- Produces: `contenusLies(patrimoineId: string): Promise<{ articles: { slug: string; titre_fr: string; titre_en: string | null }[]; reportages: { slug: string; titre_fr: string; titre_en: string | null }[] }>`

- [ ] **Step 1: Write the failing e2e test**

```ts
// à ajouter dans paaciv/tests/fiche.spec.ts — adapter le slug à celui lié dans le seed (Task 2)
test('la fiche patrimoine liste les contenus éditoriaux qui la citent', async ({ page }) => {
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  const bloc = page.getByTestId('contenus-lies')
  await expect(bloc).toBeVisible()
  await expect(bloc.getByRole('link', { name: /BROUILLON/ })).toHaveCount(0)  // l'article brouillon lié ne doit pas fuiter
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd paaciv && npx playwright test tests/fiche.spec.ts -g "contenus éditoriaux"`
Expected: FAIL (`contenus-lies` absent).

- [ ] **Step 3: Implement `contenusLies`**

Dans `lib/data/patrimoine.ts`, deux `select` via `createReadClient()` sur `articles` et `reportages`, filtrés `.eq('patrimoine_id', patrimoineId).eq('statut','publie')`, triés par date décroissante. Le filtre `statut` doit être **explicite dans la requête** et pas seulement délégué à la RLS.

- [ ] **Step 4: Wire it into the page**

Appeler `contenusLies(p.id)` dans la fiche et rendre un bloc `data-testid="contenus-lies"` avec deux sous-listes (« À lire » = articles, « À voir » = reportages), **masqué entièrement si les deux listes sont vides**. Liens vers `/articles/[slug]` et `/reportages/[slug]`.

- [ ] **Step 5: Run to verify it passes**

Run: `cd paaciv && npm run lint && npx playwright test tests/fiche.spec.ts && npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add paaciv/lib/data/patrimoine.ts "paaciv/app/[locale]/patrimoine/[slug]/page.tsx" paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/fiche.spec.ts
git commit -m "feat(patrimoine): bloc « À lire / À voir » des contenus liés"
```

---

### Task 11: Admin articles (liste + actions + formulaire)

**Files:**
- Create: `paaciv/app/[locale]/admin/articles/actions.ts`, `page.tsx`, `nouveau/page.tsx`, `[id]/page.tsx`
- Create: `paaciv/components/admin/FormulaireArticle.tsx`
- Modify: `paaciv/app/[locale]/admin/page.tsx` (lien), `paaciv/i18n/messages/*.json` (`adminArticles`, `formArticle`)
- Test: `paaciv/tests/admin-article.spec.ts`

**Interfaces:**
- Produces: `enregistrerArticle(formData: FormData): Promise<{ id: string }>` · `supprimerArticle(id: string): Promise<void>`
- Noms de champs du formulaire (contrat avec l'action) : `id`, `titre_fr`, `titre_en`, `slug`, `chapo_fr`, `chapo_en`, `corps_fr`, `corps_en`, `categorie_id`, `patrimoine_id`, `date_publication`, `statut`, `image` (fichier).

- [ ] **Step 1: Read the model to mirror**

`paaciv/app/[locale]/admin/architectes/actions.ts`, `.../architectes/page.tsx`, `.../architectes/[id]/page.tsx`, `.../architectes/nouveau/page.tsx`, et `paaciv/components/admin/FormulaireArchitecte.tsx`. Reproduire leur structure, y compris le `catch` + région d'erreur visible du formulaire (un slug en collision doit se voir).

- [ ] **Step 2: Implement the server actions**

Écritures via `createServerClient()`. Champs texte via `texteOuNull`, champs riches (`corps_fr`, `corps_en`) via **`richeOuNull`** — jamais bruts. Le chapô passe par `texteOuNull` (texte simple, pas de HTML). `slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)`. Upload de couverture optionnel dans le bucket `patrimoine`, chemin `articles/<id>/<timestamp>.<ext>` (mirror exact de l'upload photo de `architectes/actions.ts`) ; ne toucher à `image_couverture` que si un fichier non vide est fourni, sinon un enregistrement sans nouvelle image effacerait l'ancienne. `revalidatePath('/[locale]/admin/articles', 'page')`.

- [ ] **Step 3: Implement the list page and the dashboard link**

Miroir de `admin/architectes/page.tsx` : tableau titre / catégorie / date / statut, lien « éditer » vers `/admin/articles/[id]`, `BoutonSupprimer` lié à `supprimerArticle.bind(null, id)`, bouton « Nouvel article ». Lecture via `createServerClient()` (l'admin voit les brouillons), `.order('date_publication', { ascending: false })`. Ajouter le lien au tableau de bord dans le conteneur `flex flex-col gap-2` existant.

- [ ] **Step 4: Implement the form**

Miroir de `FormulaireArchitecte.tsx` : onglets FR/EN, `EditeurRiche` pour `corps_fr`/`corps_en`, `<textarea>` pour les chapôs, listes déroulantes catégorie (chargée depuis `categories_article`) et patrimoine lié (chargée depuis `patrimoine`, option vide en tête), `<input type="date" name="date_publication">`, `<input type="file" name="image" accept="image/*">` avec aperçu de l'image actuelle, select statut. La page `[id]` charge la ligne via `createServerClient()` et passe `initial`.

- [ ] **Step 5: Write the round-trip e2e test**

```ts
// paaciv/tests/admin-article.spec.ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
test.use({ storageState: 'playwright/.auth/admin.json' })

const SLUG = 'test-article-e2e'

test('création, persistance et relecture d\'un article', async ({ page }) => {
  await page.goto('/fr/admin/articles/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Article E2E')
  await page.getByRole('button', { name: 'Gras' }).first().waitFor()   // l'éditeur riche est monté
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/admin\/articles(\?|$)/)
  await expect(page.getByText('Test Article E2E')).toBeVisible()

  // Rouvrir en fiche d'édition : même motif que tests/admin-architecte.spec.ts
  // (ligne du tableau + lien « Éditer »), pas un lien portant le titre.
  await page.getByRole('row', { name: /Test Article E2E/ }).getByRole('link', { name: 'Éditer' }).click()
  await expect(page.getByLabel('Titre (FR)')).toHaveValue('Test Article E2E')
})

test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,       // noms réels du dépôt — PAS E2E_ADMIN_*
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  // Sans cette assertion, un échec de connexion rend le delete suivant un no-op
  // silencieux (RLS) : les lignes de test persistent et la relance suivante
  // échoue sur le conflit de slug unique.
  expect(erreurConnexion).toBeNull()
  const { error: erreurSuppression } = await db.from('articles').delete().like('slug', `${SLUG}%`)
  expect(erreurSuppression).toBeNull()
})
```

Reprendre **exactement** le mécanisme de connexion et de nettoyage de `paaciv/tests/admin-architecte.spec.ts` (mêmes variables d'environnement, même motif de slug) — le lire avant d'écrire ce test. Ne jamais supprimer autre chose que le préfixe de test.

- [ ] **Step 6: Run everything**

Run: `cd paaciv && npm run lint && npx playwright test tests/admin-article.spec.ts && npm run build`
Expected: PASS ; aucune ligne de test résiduelle en base.

- [ ] **Step 7: Commit**

```bash
git add "paaciv/app/[locale]/admin/articles" "paaciv/app/[locale]/admin/page.tsx" paaciv/components/admin/FormulaireArticle.tsx paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/admin-article.spec.ts
git commit -m "feat(admin): CRUD articles (éditeur riche, couverture, catégorie)"
```

---

### Task 12: Admin reportages

**Files:**
- Create: `paaciv/app/[locale]/admin/reportages/{actions.ts,page.tsx,nouveau/page.tsx,[id]/page.tsx}`, `paaciv/components/admin/FormulaireReportage.tsx`
- Modify: `paaciv/app/[locale]/admin/page.tsx`, `paaciv/i18n/messages/*.json` (`adminReportages`, `formReportage`)
- Test: `paaciv/tests/admin-reportage.spec.ts`

**Interfaces:**
- Produces: `enregistrerReportage(formData): Promise<{ id: string }>` · `supprimerReportage(id): Promise<void>`
- Champs : `id`, `titre_fr`, `titre_en`, `slug`, `video_url`, `description_fr`, `description_en`, `patrimoine_id`, `date`, `statut`.

- [ ] **Step 1: Implement actions with URL validation**

Miroir de Task 11, **plus une validation** : `if (!extraireIdYoutube(video_url)) throw new Error('URL YouTube invalide')` avant toute écriture. Une URL illisible ne doit jamais atteindre la base — sinon l'index affiche une carte sans vignette et la fiche un lecteur vide.

- [ ] **Step 2: Implement the list page, form and dashboard link**

Formulaire client avec **aperçu de la miniature** : à la saisie de `video_url`, appeler `extraireIdYoutube` côté client et afficher `<img src={miniatureYoutube(id)}>` dès que l'identifiant est reconnu, ou un message « URL non reconnue » sinon (`data-testid="apercu-miniature"` / `data-testid="url-invalide"`). C'est ce qui attrape les fautes de frappe avant l'enregistrement.

- [ ] **Step 3: Write the e2e test**

Couvrir deux comportements : (a) coller une URL valide fait apparaître `apercu-miniature` ; (b) coller `https://exemple.test/x` fait apparaître `url-invalide` et **n'enregistre pas**. Nettoyage `afterAll` identique à la Task 11 (préfixe `test-reportage-e2e`), avec assertions sur la connexion et la suppression.

- [ ] **Step 4: Run everything**

Run: `cd paaciv && npm run lint && npx playwright test tests/admin-reportage.spec.ts && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "paaciv/app/[locale]/admin/reportages" "paaciv/app/[locale]/admin/page.tsx" paaciv/components/admin/FormulaireReportage.tsx paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/admin-reportage.spec.ts
git commit -m "feat(admin): CRUD reportages (validation d'URL + aperçu de miniature)"
```

---

### Task 13: Admin événements

**Files:**
- Create: `paaciv/app/[locale]/admin/evenements/{actions.ts,page.tsx,nouveau/page.tsx,[id]/page.tsx}`, `paaciv/components/admin/FormulaireEvenement.tsx`
- Modify: `paaciv/app/[locale]/admin/page.tsx`, `paaciv/i18n/messages/*.json` (`adminEvenements`, `formEvenement`)
- Test: `paaciv/tests/admin-evenement.spec.ts`

**Interfaces:**
- Produces: `enregistrerEvenement(formData): Promise<{ id: string }>` · `supprimerEvenement(id): Promise<void>`
- Champs : `id`, `titre_fr`, `titre_en`, `slug`, `description_fr`, `description_en`, `lieu`, `date_debut`, `date_fin`, `statut`, `image` (fichier).

- [ ] **Step 1: Implement actions**

Miroir de Task 11. `date_debut` est **requis** : lever une erreur explicite si absent. `date_fin` optionnelle ; si les deux sont fournies et `date_fin < date_debut`, lever une erreur claire côté action **en plus** de la contrainte SQL `evenements_dates_coherentes` (l'erreur Postgres brute est illisible pour l'utilisateur). Upload d'image sous `evenements/<id>/`.

- [ ] **Step 2: Implement the list page, form and dashboard link**

Miroir de Task 11 ; deux `<input type="date">`, champ `lieu` en texte simple, `EditeurRiche` pour les descriptions.

- [ ] **Step 3: Write the e2e test**

Aller-retour création → persistance → relecture (préfixe `test-evenement-e2e`), **plus** un cas : saisir `date_fin` antérieure à `date_debut` affiche la région d'erreur du formulaire et n'enregistre rien. Nettoyage `afterAll` avec assertions, comme Task 11.

- [ ] **Step 4: Run everything**

Run: `cd paaciv && npm run lint && npx playwright test tests/admin-evenement.spec.ts && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "paaciv/app/[locale]/admin/evenements" "paaciv/app/[locale]/admin/page.tsx" paaciv/components/admin/FormulaireEvenement.tsx paaciv/i18n/messages/fr.json paaciv/i18n/messages/en.json paaciv/tests/admin-evenement.spec.ts
git commit -m "feat(admin): CRUD événements (dates cohérentes, image)"
```

---

### Task 14: Vérification finale

**Files:** aucun nouveau.

- [ ] **Step 1: Full suite**

Run: `cd paaciv && npm run lint && npm test && npm run e2e && npm run build`
Expected: tout vert.

- [ ] **Step 2: Route table check (obligatoire)**

Dans la sortie de `npm run build`, vérifier que **`/[locale]/articles`, `/[locale]/reportages` et `/[locale]/evenements` apparaissent en `ƒ` (Dynamic)** et qu'aucune n'apparaît sous `●` (SSG). Une page d'index statique n'afficherait jamais un contenu publié après le build, et un index d'événements figé annoncerait éternellement « à venir » un événement passé. Coller la table de routes dans le rapport.

- [ ] **Step 3: No leftover test rows**

Via MCP `execute_sql` : `select slug from articles where slug like 'test-%' union all select slug from reportages where slug like 'test-%' union all select slug from evenements where slug like 'test-%';`
Expected: 0 ligne. Sinon, un `afterAll` a échoué silencieusement — corriger le test, pas la base.

- [ ] **Step 4: Dead-link sanity check**

`grep -rn "actualites" paaciv/components/` ne doit plus renvoyer de `href`. Les liens `/a-propos`, `/contact` et `/conditions-utilisation` **restent volontairement morts** (décision client, Phase 5) — ne pas les « réparer » ici.

- [ ] **Step 5: Commit any fixes**

---

## Self-Review

**Spec coverage :**
- §3 modèle de données (4 tables, index, triggers) → Task 1. ✔
- §4 RLS → Task 1 (politiques) + Tasks 1–2 (tests discriminants). ✔
- §5 intégration YouTube (module pur, façade, validation, remplacement du helper local) → Tasks 3, 4, 12. ✔
- §6 six pages publiques + bloc fiche patrimoine + navigation → Tasks 6, 7, 8, 9, 10. ✔
- §7 back-office (3 sections, assainissement, retour d'erreur, médias) → Tasks 11, 12, 13. ✔
- §8 composants partagés (`CarteContenu`, `FacadeVideo`) → Tasks 4, 5. ✔
- §9 rendu dynamique → contrainte globale + vérification explicite en Tasks 6, 7, 8 et 14. ✔
- §10 tests (unitaires purs, RLS discriminante, e2e, nettoyage asserté) → réparti, contrôlé en Task 14. ✔
- §11 hors périmètre → aucune tâche n'introduit pagination, recherche plein texte, auteur, fil mélangé ni liaison N–N. ✔
- §12 à fournir par le client → seed marqué démo (Task 2), rappelé en Task 14. ✔

**Placeholder scan :** le code non trivial (SQL, `lib/youtube.ts`, `lib/evenements-dates.ts`, `FacadeVideo`, tous les tests discriminants) est fourni intégralement. Les squelettes CRUD (Tasks 11–13) sont décrits par **miroir explicite d'un fichier existant nommé**, avec chaque point de divergence détaillé (champs, validations, chemins d'upload) — pas de « similaire à la tâche N » sans contenu. Aucun « TODO ».

**Type consistency :** `ArticleListItem`/`ArticleDetail` (T6), `ReportageListItem`/`ReportageDetail` (T7), `EvenementListItem`/`EvenementDetail` + `AvecDates`/`partitionnerEvenements` (T8) sont définis avant leurs consommateurs. `extraireIdYoutube`/`miniatureYoutube`/`lecteurYoutube` (T3) sont consommés en T4, T7, T12 sous les mêmes noms. Les props de `CarteContenu` (T5) correspondent aux appels des T6/T7/T8. Les noms de champs de formulaire des T11–T13 sont listés dans leurs blocs `Interfaces` et repris tels quels par les actions.

**Notes d'exécution :**
- Tasks 1 et 2 appliquent de vraies migrations sur le projet distant — dans l'ordre, sans les rejouer.
- Task 4 modifie la fiche patrimoine (suppression du helper local) : les tests `tests/fiche.spec.ts` font partie du périmètre de vérification.
- Task 10 modifie de nouveau la fiche patrimoine — l'exécuter après la Task 4.
- Tasks 11–13 se ressemblent : la Task 11 pose le patron, les deux suivantes le suivent avec leurs divergences explicites. Si un reviewer signale de la duplication mécanisable, la factoriser au moment où la troisième copie apparaît (Task 13), pas avant.
