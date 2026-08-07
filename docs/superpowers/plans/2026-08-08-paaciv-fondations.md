# PAACIV — Plan d'implémentation : Phase 1 · Fondations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place le socle technique de PAACIV — un site Next.js bilingue FR/EN, au design « Terre & Ocre », connecté à Supabase (Postgres + PostGIS) avec les tables de référence, une authentification admin protégée, et une coque (header/footer) — sur lequel les phases suivantes (carte, archives, architectes, éditorial) se brancheront.

**Architecture :** App Next.js (App Router, TypeScript) déployée sur Vercel. Données dans Supabase (Postgres + PostGIS), accédées via `@supabase/ssr` (client navigateur + client serveur). i18n par sous-chemin (`/fr`, `/en`) avec `next-intl`. Design system en Tailwind CSS (thème custom = palette + typo). Tests : Vitest (unitaire) + Playwright (e2e/smoke).

**Tech Stack :** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, `next-intl`, `@supabase/supabase-js`, `@supabase/ssr`, Vitest, Playwright.

## Global Constraints

- **Locales :** `fr` (défaut) et `en`. Toutes les routes publiques sont préfixées (`/fr/...`, `/en/...`). Racine `/` → redirige vers `/fr`.
- **Palette (valeurs exactes) :** terracotta `#B5581F` · brun `#8A3E1B` · or `#D9A441` · vert `#46603F` · sable `#F4EBDD` · crème2 `#EADFCB` · encre `#2A2320`.
- **Typographie :** titres = *Fraunces* (serif) ; corps = *Inter* (sans-serif). Polices **auto-hébergées** via `next/font` (aucune requête externe bloquante).
- **Base de données :** toute table a **RLS activé**. Lecture publique = contenus `statut = 'publie'` uniquement (pour les tables de contenu des phases suivantes) ; les tables de **référence** sont en lecture publique intégrale.
- **Nommage BDD :** tables et colonnes en `snake_case`, français (ex. `patrimoine`, `titre_fr`).
- **Secrets :** `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` côté client ; `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement (jamais exposé au client).
- **Commits :** fréquents, un par étape « Commit ». Messages en français, préfixe conventionnel (`feat:`, `chore:`, `test:`…).

---

## Structure des fichiers (Phase 1)

```
paaciv/
├─ package.json, tsconfig.json, next.config.ts, .env.local(.example)
├─ tailwind.config.ts / app/globals.css      # thème Terre & Ocre
├─ vitest.config.ts, playwright.config.ts
├─ middleware.ts                              # i18n + garde /admin
├─ i18n/
│  ├─ routing.ts                              # config locales next-intl
│  ├─ request.ts                              # chargement des messages
│  └─ messages/{fr,en}.json                   # libellés d'interface
├─ lib/
│  ├─ theme.ts                                # tokens palette (source de vérité)
│  └─ supabase/{client.ts,server.ts}          # fabriques de clients Supabase
├─ components/
│  ├─ ui/{Button.tsx,Container.tsx,Badge.tsx}
│  ├─ LanguageSwitcher.tsx
│  ├─ SiteHeader.tsx
│  └─ SiteFooter.tsx
├─ app/
│  ├─ layout.tsx                              # <html> + polices
│  ├─ [locale]/layout.tsx                     # provider intl + header/footer
│  ├─ [locale]/page.tsx                       # accueil (placeholder Phase 1)
│  ├─ [locale]/admin/layout.tsx               # garde session
│  ├─ [locale]/admin/page.tsx                 # tableau de bord (placeholder)
│  └─ [locale]/login/page.tsx                 # connexion admin
└─ supabase/migrations/
   ├─ 0001_extensions.sql                     # PostGIS
   ├─ 0002_reference_tables.sql               # types, programmes, districts, epoques
   └─ 0003_reference_seed.sql                 # données de référence
```

---

### Task 1: Scaffolding Next.js + Tailwind + harnais de tests

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/page.tsx`
- Create: `tailwind.config.ts`, `app/globals.css`
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/smoke.spec.ts`
- Create: `.gitignore` (déjà présent à la racine du repo — vérifier qu'il couvre `node_modules/`, `.next/`)

**Interfaces:**
- Produces: un projet Next.js démarrable (`npm run dev`), commandes `npm run test` (Vitest) et `npm run e2e` (Playwright).

- [ ] **Step 1: Créer l'app Next.js** (depuis la racine `C:/Projets/PAACIV`)

```bash
npx create-next-app@latest paaciv --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --no-turbopack
```
Répondre « No » à toute invite supplémentaire. Le code vit dans `paaciv/` (sous-dossier du repo).

- [ ] **Step 2: Installer les dépendances de test**

```bash
cd paaciv && npm i -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @playwright/test && npx playwright install chromium
```

- [ ] **Step 3: Configurer Vitest** — créer `paaciv/vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: [] },
})
```

Ajouter à `paaciv/package.json` (scripts) : `"test": "vitest run"`, `"e2e": "playwright test"`.

- [ ] **Step 4: Configurer Playwright** — créer `paaciv/playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120_000 },
  use: { baseURL: 'http://localhost:3000' },
})
```

- [ ] **Step 5: Écrire le test smoke (échoue d'abord)** — créer `paaciv/tests/smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('la page racine répond', async ({ page }) => {
  const res = await page.goto('/')
  expect(res?.status()).toBeLessThan(400)
})
```

- [ ] **Step 6: Lancer le test — vérifier l'état**

Run: `cd paaciv && npm run e2e`
Expected: PASS (create-next-app fournit une page racine par défaut). Si FAIL, corriger le scaffolding avant de continuer.

- [ ] **Step 7: Commit**

```bash
git add paaciv && git commit -m "chore: scaffolding Next.js + Tailwind + tests (Vitest/Playwright)"
```

---

### Task 2: Design system « Terre & Ocre » (thème + polices + primitives UI)

**Files:**
- Create: `paaciv/lib/theme.ts`, `paaciv/lib/__tests__/theme.test.ts`
- Modify: `paaciv/app/globals.css`, `paaciv/tailwind.config.ts`, `paaciv/app/layout.tsx`
- Create: `paaciv/components/ui/Button.tsx`, `Container.tsx`, `Badge.tsx`
- Create: `paaciv/components/ui/__tests__/Button.test.tsx`

**Interfaces:**
- Produces: `PALETTE` (objet de tokens couleur), classes Tailwind `bg-terracotta`/`text-encre`/… ; composants `<Button variant>`, `<Container>`, `<Badge>`.

- [ ] **Step 1: Écrire le test des tokens (échoue d'abord)** — `paaciv/lib/__tests__/theme.test.ts`

```ts
import { PALETTE } from '@/lib/theme'

test('la palette expose les couleurs exactes de la charte', () => {
  expect(PALETTE.terracotta).toBe('#B5581F')
  expect(PALETTE.brun).toBe('#8A3E1B')
  expect(PALETTE.or).toBe('#D9A441')
  expect(PALETTE.vert).toBe('#46603F')
  expect(PALETTE.sable).toBe('#F4EBDD')
  expect(PALETTE.encre).toBe('#2A2320')
})
```

- [ ] **Step 2: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run test -- theme`
Expected: FAIL (module `@/lib/theme` introuvable)

- [ ] **Step 3: Créer les tokens** — `paaciv/lib/theme.ts`

```ts
export const PALETTE = {
  terracotta: '#B5581F',
  brun: '#8A3E1B',
  or: '#D9A441',
  vert: '#46603F',
  sable: '#F4EBDD',
  creme2: '#EADFCB',
  encre: '#2A2320',
} as const

export type PaletteKey = keyof typeof PALETTE
```

- [ ] **Step 4: Lancer — vérifier le succès**

Run: `cd paaciv && npm run test -- theme`
Expected: PASS

- [ ] **Step 5: Câbler le thème Tailwind** — dans `paaciv/app/globals.css` (Tailwind v4 utilise `@theme`)

```css
@import "tailwindcss";

@theme {
  --color-terracotta: #B5581F;
  --color-brun: #8A3E1B;
  --color-or: #D9A441;
  --color-vert: #46603F;
  --color-sable: #F4EBDD;
  --color-creme2: #EADFCB;
  --color-encre: #2A2320;
  --font-serif: var(--font-fraunces);
  --font-sans: var(--font-inter);
}

body { background: var(--color-sable); color: var(--color-encre); }
```

- [ ] **Step 6: Charger les polices auto-hébergées** — dans `paaciv/app/layout.tsx`

```tsx
import { Fraunces, Inter } from 'next/font/google'
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', display: 'swap' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className={`${fraunces.variable} ${inter.variable} font-sans`}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 7: Écrire le test du Button (échoue d'abord)** — `paaciv/components/ui/__tests__/Button.test.tsx`

```tsx
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

test('le bouton "gold" affiche son libellé et la classe d\'accent', () => {
  render(<Button variant="gold">Explorer</Button>)
  const btn = screen.getByRole('button', { name: 'Explorer' })
  expect(btn.className).toContain('bg-or')
})
```

- [ ] **Step 8: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run test -- Button`
Expected: FAIL (composant introuvable)

- [ ] **Step 9: Créer les primitives** — `paaciv/components/ui/Button.tsx`

```tsx
import { clsx } from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'gold' | 'ghost' }

export function Button({ variant = 'gold', className, ...props }: Props) {
  return (
    <button
      className={clsx(
        'rounded-full px-5 py-3 text-sm font-semibold transition',
        variant === 'gold' && 'bg-or text-encre hover:brightness-95',
        variant === 'ghost' && 'border border-terracotta text-brun hover:bg-creme2',
        className,
      )}
      {...props}
    />
  )
}
```

Créer aussi `Container.tsx` (`<div className="mx-auto w-full max-w-6xl px-4 sm:px-6">`) et `Badge.tsx` (pastille de type : `<span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold">`). Installer `clsx` : `npm i clsx`.

- [ ] **Step 10: Lancer — vérifier le succès**

Run: `cd paaciv && npm run test -- Button`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add paaciv && git commit -m "feat: design system Terre & Ocre (thème Tailwind, polices, primitives UI)"
```

---

### Task 3: Internationalisation FR/EN (next-intl)

**Files:**
- Create: `paaciv/i18n/routing.ts`, `paaciv/i18n/request.ts`, `paaciv/i18n/messages/fr.json`, `paaciv/i18n/messages/en.json`
- Create: `paaciv/middleware.ts`
- Modify: `paaciv/next.config.ts`
- Restructure: déplacer `app/page.tsx` → `app/[locale]/page.tsx`, créer `app/[locale]/layout.tsx`
- Create: `paaciv/components/LanguageSwitcher.tsx`
- Create/Modify: `paaciv/tests/i18n.spec.ts`

**Interfaces:**
- Consumes: rien.
- Produces: routing localisé (`/fr`, `/en`), hook `useTranslations`, `<LanguageSwitcher/>`, redirection `/` → `/fr`.

- [ ] **Step 1: Installer next-intl**

```bash
cd paaciv && npm i next-intl
```

- [ ] **Step 2: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/i18n.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('la racine redirige vers /fr', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/fr$/)
})

test('bascule FR -> EN', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByTestId('accroche')).toContainText('patrimoine')
  await page.goto('/en')
  await expect(page.getByTestId('accroche')).toContainText('heritage')
})
```

- [ ] **Step 3: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- i18n`
Expected: FAIL (pas de route localisée)

- [ ] **Step 4: Config du routing** — `paaciv/i18n/routing.ts`

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
})
```

- [ ] **Step 5: Chargement des messages** — `paaciv/i18n/request.ts`

```ts
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'fr' | 'en')) locale = routing.defaultLocale
  return { locale, messages: (await import(`./messages/${locale}.json`)).default }
})
```

- [ ] **Step 6: Messages** — `paaciv/i18n/messages/fr.json` et `en.json`

```json
// fr.json
{ "accueil": { "accroche": "Découvrir le patrimoine de la Côte d'Ivoire" },
  "nav": { "carte": "Carte", "archives": "Nos archives", "architectes": "Architectes", "apropos": "À propos", "contact": "Contact" } }
```
```json
// en.json
{ "accueil": { "accroche": "Discover the heritage of Côte d'Ivoire" },
  "nav": { "carte": "Map", "archives": "Archive", "architectes": "Architects", "apropos": "About", "contact": "Contact" } }
```

- [ ] **Step 7: Plugin + middleware** — `paaciv/next.config.ts` enveloppé par `createNextIntlPlugin('./i18n/request.ts')` ; `paaciv/middleware.ts` :

```ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

export default createMiddleware(routing)
export const config = { matcher: ['/', '/(fr|en)/:path*'] }
```

- [ ] **Step 8: Structurer les routes** — créer `app/[locale]/layout.tsx` (avec `NextIntlClientProvider` + `setRequestLocale`) et déplacer la page d'accueil vers `app/[locale]/page.tsx` :

```tsx
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl'
export default function Home() {
  const t = useTranslations('accueil')
  return <h1 data-testid="accroche" className="font-serif text-4xl">{t('accroche')}</h1>
}
```

- [ ] **Step 9: LanguageSwitcher** — `paaciv/components/LanguageSwitcher.tsx` (lien vers la même page dans l'autre locale via `usePathname` + `Link` de `next-intl`).

- [ ] **Step 10: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- i18n`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add paaciv && git commit -m "feat: i18n FR/EN par sous-chemin (next-intl) + bascule de langue"
```

---

### Task 4: Clients Supabase (navigateur + serveur)

**Files:**
- Create: `paaciv/lib/supabase/client.ts`, `paaciv/lib/supabase/server.ts`
- Create: `paaciv/.env.local.example`
- Create: `paaciv/lib/supabase/__tests__/factory.test.ts`

**Interfaces:**
- Produces: `createBrowserClient()` (composants client) et `createServerClient()` (composants serveur, avec gestion des cookies) — types Supabase.

- [ ] **Step 1: Installer**

```bash
cd paaciv && npm i @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 2: Variables d'env** — `paaciv/.env.local.example`

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
Copier en `.env.local` et renseigner (valeurs fournies par le projet Supabase — via le dashboard ou `get_project_url` / `get_publishable_keys`).

- [ ] **Step 3: Test de la fabrique (échoue d'abord)** — `paaciv/lib/supabase/__tests__/factory.test.ts`

```ts
import { createBrowserClient } from '@/lib/supabase/client'

test('le client navigateur expose une API "from"', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
  const c = createBrowserClient()
  expect(typeof c.from).toBe('function')
})
```

- [ ] **Step 4: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run test -- factory`
Expected: FAIL

- [ ] **Step 5: Client navigateur** — `paaciv/lib/supabase/client.ts`

```ts
import { createBrowserClient as create } from '@supabase/ssr'
export function createBrowserClient() {
  return create(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}
```

- [ ] **Step 6: Client serveur** — `paaciv/lib/supabase/server.ts` (utilise `createServerClient` de `@supabase/ssr` + `cookies()` de `next/headers`, get/set/remove).

- [ ] **Step 7: Lancer — vérifier le succès**

Run: `cd paaciv && npm run test -- factory`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add paaciv && git commit -m "feat: clients Supabase navigateur/serveur (@supabase/ssr)"
```

---

### Task 5: Schéma BDD — PostGIS + tables de référence + seed

**Files:**
- Create: `paaciv/supabase/migrations/0001_extensions.sql`
- Create: `paaciv/supabase/migrations/0002_reference_tables.sql`
- Create: `paaciv/supabase/migrations/0003_reference_seed.sql`
- Create: `paaciv/tests/db/reference.test.ts` (intégration)

**Interfaces:**
- Produces: tables `types` (7), `programmes` (10), `districts` (14), `epoques` (3), toutes en lecture publique (RLS).

- [ ] **Step 1: Migration extensions** — `0001_extensions.sql`

```sql
create extension if not exists postgis;
```

- [ ] **Step 2: Migration tables de référence** — `0002_reference_tables.sql`

```sql
create table types (
  id text primary key, nom_fr text not null, nom_en text,
  icone text, couleur text not null, ordre int not null default 0
);
create table programmes ( id text primary key, nom_fr text not null, nom_en text, ordre int not null default 0 );
create table districts  ( id text primary key, nom_fr text not null, nom_en text, ordre int not null default 0 );
create table epoques    ( id text primary key, nom_fr text not null, nom_en text, borne text, couleur text, ordre int not null default 0 );

alter table types      enable row level security;
alter table programmes enable row level security;
alter table districts  enable row level security;
alter table epoques    enable row level security;

create policy "lecture publique types"      on types      for select using (true);
create policy "lecture publique programmes" on programmes for select using (true);
create policy "lecture publique districts"  on districts  for select using (true);
create policy "lecture publique epoques"    on epoques    for select using (true);
```

- [ ] **Step 3: Migration seed** — `0003_reference_seed.sql` (données exactes de la spec §11)

```sql
insert into types (id,nom_fr,nom_en,icone,couleur,ordre) values
 ('batiment','Bâtiment','Building','batiment','#B5581F',1),
 ('religieux','Édifice religieux','Religious building','religieux','#8A3E1B',2),
 ('monument','Monument / mémorial','Monument / memorial','monument','#D9A441',3),
 ('site','Site','Site','site','#46603F',4),
 ('lieu_culturel','Lieu culturel','Cultural venue','lieu_culturel','#7A5B8A',5),
 ('ensemble','Ensemble / quartier','Ensemble / district','ensemble','#3F6B63',6),
 ('ouvrage','Ouvrage d''art','Engineering structure','ouvrage','#5E6B8A',7);

insert into programmes (id,nom_fr,nom_en,ordre) values
 ('residentiel','Résidentiel','Residential',1),('administratif','Administratif','Administrative',2),
 ('hotelier','Hôtelier','Hospitality',3),('religieux','Religieux','Religious',4),
 ('sanitaire','Sanitaire','Healthcare',5),('culturel','Culturel','Cultural',6),
 ('sportif','Sportif','Sports',7),('industriel','Industriel / logistique / agricole','Industrial / logistics / agricultural',8),
 ('aeroportuaire','Infrastructure aéroportuaire','Airport infrastructure',9),('ouvrage_art','Ouvrage d''art','Engineering structure',10);

insert into districts (id,nom_fr,nom_en,ordre) values
 ('abidjan','Abidjan','Abidjan',1),('yamoussoukro','Yamoussoukro','Yamoussoukro',2),
 ('bas_sassandra','Bas-Sassandra','Bas-Sassandra',3),('comoe','Comoé','Comoé',4),
 ('denguele','Denguélé','Denguélé',5),('goh_djiboua','Gôh-Djiboua','Gôh-Djiboua',6),
 ('lacs','Lacs','Lacs',7),('lagunes','Lagunes','Lagunes',8),('montagnes','Montagnes','Montagnes',9),
 ('sassandra_marahoue','Sassandra-Marahoué','Sassandra-Marahoué',10),('savanes','Savanes','Savanes',11),
 ('vallee_bandama','Vallée du Bandama','Bandama Valley',12),('woroba','Woroba','Woroba',13),('zanzan','Zanzan','Zanzan',14);

insert into epoques (id,nom_fr,nom_en,borne,couleur,ordre) values
 ('precolonial','Précolonial','Pre-colonial','avant 1893','#46603F',1),
 ('colonial','Colonial','Colonial','1893–1960','#B5581F',2),
 ('post_independance','Post-indépendance','Post-independence','depuis 1960','#D9A441',3);
```

- [ ] **Step 4: Appliquer les migrations** sur le projet Supabase (via CLI `supabase db push`, ou l'outil MCP `apply_migration` en passant le contenu de chaque fichier dans l'ordre 0001→0003).

- [ ] **Step 5: Écrire le test d'intégration (échoue d'abord si non appliqué)** — `paaciv/tests/db/reference.test.ts`

```ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

test('les tables de référence sont peuplées et lisibles publiquement', async () => {
  const [types, programmes, districts, epoques] = await Promise.all([
    db.from('types').select('id'), db.from('programmes').select('id'),
    db.from('districts').select('id'), db.from('epoques').select('id'),
  ])
  expect(types.data?.length).toBe(7)
  expect(programmes.data?.length).toBe(10)
  expect(districts.data?.length).toBe(14)
  expect(epoques.data?.length).toBe(3)
})
```

- [ ] **Step 6: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- reference`
Expected: PASS (7 / 10 / 14 / 3)

- [ ] **Step 7: Commit**

```bash
git add paaciv && git commit -m "feat(db): PostGIS + tables de référence (types, programmes, districts, époques) + seed"
```

---

### Task 6: Authentification admin + route protégée

**Files:**
- Create: `paaciv/app/[locale]/login/page.tsx`
- Create: `paaciv/app/[locale]/admin/layout.tsx`, `paaciv/app/[locale]/admin/page.tsx`
- Modify: `paaciv/middleware.ts` (garde de session sur `/admin`)
- Create: `paaciv/tests/admin-auth.spec.ts`

**Interfaces:**
- Consumes: `createServerClient()` (Task 4).
- Produces: `/{locale}/admin` protégé (redirige les non-connectés vers `/{locale}/login`).

- [ ] **Step 1: Test e2e (échoue d'abord)** — `paaciv/tests/admin-auth.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('un visiteur non connecté est redirigé de /admin vers /login', async ({ page }) => {
  await page.goto('/fr/admin')
  await expect(page).toHaveURL(/\/fr\/login/)
})
```

- [ ] **Step 2: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- admin-auth`
Expected: FAIL (pas de garde)

- [ ] **Step 3: Layout admin protégé** — `app/[locale]/admin/layout.tsx`

```tsx
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  return <section className="mx-auto max-w-6xl px-4 py-8">{children}</section>
}
```

- [ ] **Step 4: Page login** — `app/[locale]/login/page.tsx` : formulaire email/mot de passe appelant `supabase.auth.signInWithPassword`, puis redirection vers `/{locale}/admin`. Page dashboard placeholder `app/[locale]/admin/page.tsx` avec titre + bouton de déconnexion (`supabase.auth.signOut`).

- [ ] **Step 5: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- admin-auth`
Expected: PASS

- [ ] **Step 6: Créer le compte de Dkr** (hors code) : dans le dashboard Supabase → Authentication → Add user (email + mot de passe). **Désactiver les inscriptions publiques** (Auth settings → « Allow new users to sign up » = OFF).

- [ ] **Step 7: Commit**

```bash
git add paaciv && git commit -m "feat: auth admin Supabase + garde de la route /admin"
```

---

### Task 7: Coque du site (header + footer) sur les pages publiques

**Files:**
- Create: `paaciv/components/SiteHeader.tsx`, `paaciv/components/SiteFooter.tsx`
- Modify: `paaciv/app/[locale]/layout.tsx` (insérer header/footer autour de `children`)
- Create: `paaciv/tests/shell.spec.ts`

**Interfaces:**
- Consumes: `useTranslations('nav')`, `<LanguageSwitcher/>`.
- Produces: header (logo PAACIV, nav, bascule FR·EN, lien recherche) et footer (réseaux Instagram + LinkedIn, e-mail `contact@paaciv.com`, conditions d'utilisation) présents sur toutes les pages publiques.

- [ ] **Step 1: Test e2e (échoue d'abord)** — `paaciv/tests/shell.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('le header et le footer sont présents sur l\'accueil', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('link', { name: 'PAACIV' })).toBeVisible()
  await expect(page.getByRole('navigation')).toContainText('Carte')
  await expect(page.getByRole('contentinfo')).toContainText('contact@paaciv.com')
  await expect(page.getByRole('contentinfo')).toContainText('LinkedIn')
})
```

- [ ] **Step 2: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- shell`
Expected: FAIL

- [ ] **Step 3: Créer `SiteHeader.tsx`** — logo `PAACIV` (lien vers `/{locale}`), nav (`nav.carte`, `nav.archives`, `nav.architectes`, groupe « Actualités », `nav.apropos`, `nav.contact`), `<LanguageSwitcher/>`, icône recherche. Utiliser `<Container>` et les couleurs du thème.

- [ ] **Step 4: Créer `SiteFooter.tsx`** — description PAACIV, colonnes de navigation, réseaux (Instagram `https://www.instagram.com/paaciv`, LinkedIn), e-mail `contact@paaciv.com`, lien « Conditions d'utilisation ». Balise `<footer>` (role `contentinfo`).

- [ ] **Step 5: Insérer dans le layout localisé** — `app/[locale]/layout.tsx` : `<SiteHeader/>{children}<SiteFooter/>` dans le provider intl. (Le layout `/admin` a sa propre enveloppe, sans header public.)

- [ ] **Step 6: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- shell`
Expected: PASS

- [ ] **Step 7: Lancer toute la suite**

Run: `cd paaciv && npm run test && npm run e2e`
Expected: tout PASS

- [ ] **Step 8: Commit**

```bash
git add paaciv && git commit -m "feat: coque du site (header + footer bilingues, réseaux, contact)"
```

---

## Auto-revue (Phase 1)

- **Couverture spec ↔ tâches :** stack Next.js (T1) · design system Terre & Ocre (T2) · i18n FR/EN §8 (T3) · clients Supabase §5 (T4) · PostGIS + réfs §10/§11 (T5) · auth admin §14/§16 (T6) · header/footer + réseaux §7 (T7). Les **tables de contenu** (`patrimoine`, `architectes`, éditorial…) et la **carte** relèvent des phases 2+ — hors périmètre de ce plan (volontaire).
- **Placeholders :** aucun « TODO » dans les étapes ; chaque étape porte code ou commande réels.
- **Cohérence des types :** `PALETTE` (T2) réutilisé partout ; `createServerClient`/`createBrowserClient` (T4) consommés en T6 ; clés i18n `nav.*` définies en T3 et utilisées en T7.

## Handoff — phases suivantes
À l'issue de la Phase 1 (socle vert : app bilingue, thème, réfs BDD, auth, coque), écrire le **Plan 2 — Cœur** (carte MapLibre + Nos archives + fiches patrimoine + admin patrimoine), qui consommera les tables de référence et les clients Supabase posés ici.
