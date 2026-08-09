# PAACIV — Plan d'implémentation : Phase 2 · Cœur

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer le cœur du site PAACIV — la **carte interactive** (MapLibre), le catalogue **« Nos archives »**, les **fiches patrimoine**, et l'**administration du patrimoine** (CRUD + upload d'images) — le tout branché sur les fondations de la Phase 1 (Next.js bilingue, thème Terre & Ocre, Supabase, auth admin).

**Architecture :** Le modèle de données `patrimoine` + `images` (Postgres/PostGIS) est lu publiquement (uniquement `statut = 'publie'`) via RLS et écrit par l'admin authentifié. Une couche d'accès (`lib/data/patrimoine.ts`) sert à la fois les pages serveur (archives, fiche) et un endpoint GeoJSON (`/api/carte/points`) consommé par la carte MapLibre côté client. L'admin est un ensemble de pages sous `/[locale]/admin/patrimoine` protégées par la garde de session posée en Phase 1, avec Server Actions pour les écritures et l'upload vers Supabase Storage.

**Tech Stack :** Next.js 16 (App Router, React 19, TypeScript), `@supabase/ssr`, PostGIS, **MapLibre GL JS v5**, Supabase Storage, next-intl, Vitest + Playwright.

## Global Constraints

Les contraintes de la Phase 1 restent en vigueur (locales `fr`/`en` préfixées, palette Terre & Ocre, RLS activé partout, nommage `snake_case` FR, secrets client/serveur, commits FR fréquents). S'y ajoutent :

- **Périmètre Phase 2 :** carte + archives + fiche patrimoine + admin patrimoine **uniquement**. Les entités `architectes` / `patrimoine_architecte`, l'éditorial (`articles`, `reportages`, `evenements`), `newsletter_abonnes`, `missions`, `equipe`, `contenu_site` relèvent des phases 3–5 (hors périmètre — la fiche patrimoine prévoit un emplacement architectes rempli en Phase 3).
- **Statut de publication :** colonne `statut text` ∈ `{'brouillon','publie'}`. Le public (anon) ne voit que `publie` ; l'admin (authenticated) voit tout.
- **Bilingue :** paires `*_fr`/`*_en`, `*_fr` requis, `*_en` facultatif → **repli sur `_fr`** via le helper `champ()` (Task 1).
- **Géo :** `lat`/`lng` en WGS84 (EPSG:4326) ; colonne `geom geography(Point,4326)` **synchronisée par trigger** depuis `lat`/`lng` (jamais saisie à la main). PostGIS est installé dans le schéma `extensions` (Phase 1) et résolu via le `search_path` (`"$user", public, extensions`).
- **Fonds de carte (sans clé, offre gratuite) :** vectoriel **OpenFreeMap** style `liberty` (`https://tiles.openfreemap.org/styles/liberty`) ; satellite **Esri World Imagery** (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`). **Attributions obligatoires** : « © OpenStreetMap », « © Esri ». Données © OpenStreetMap.
- **Stockage médias :** bucket Supabase Storage `patrimoine`, **lecture publique**, écriture authentifiée. Une image peut aussi être une **URL externe** (placeholder libre de droit) — le helper `imageUrl()` (Task 1) renvoie l'URL telle quelle si elle commence par `http`, sinon construit l'URL publique du bucket.
- **Slugs :** uniques, ASCII minuscule, générés depuis `titre_fr` via `slugify()` (Task 1), éditables dans l'admin.
- **Migrations :** fichiers `paaciv/supabase/migrations/000N_*.sql`, appliqués sur le projet Supabase **PAACIV** (`ref yognzzhrrllomokvoooy`) via l'outil MCP `apply_migration` (serveur `supabase-paaciv`), dans l'ordre.
- **Tests DB/e2e :** Playwright charge `.env.local` via `@next/env` (déjà câblé Phase 1). Les specs admin nécessitent une session : voir la **Task 9** (auth de test Playwright).

---

## Structure des fichiers (Phase 2)

```
paaciv/
├─ supabase/migrations/
│  ├─ 0004_patrimoine.sql            # tables patrimoine + images, index, triggers
│  ├─ 0005_patrimoine_rls.sql        # RLS patrimoine + images
│  ├─ 0006_storage_patrimoine.sql    # bucket Storage + RLS storage.objects
│  └─ 0007_patrimoine_seed.sql       # données de démonstration
├─ lib/
│  ├─ i18n-champ.ts                  # champ(fr,en,locale) — repli bilingue
│  ├─ media.ts                       # imageUrl(chemin)
│  ├─ slug.ts                        # slugify(texte)
│  └─ data/patrimoine.ts             # couche d'accès (list, bySlug, points) + types
├─ app/
│  ├─ api/carte/points/route.ts      # endpoint GeoJSON (publiés)
│  └─ [locale]/
│     ├─ archives/page.tsx           # catalogue filtrable
│     ├─ patrimoine/[slug]/page.tsx  # fiche patrimoine
│     ├─ carte/page.tsx              # page carte (charge le client)
│     └─ admin/patrimoine/
│        ├─ page.tsx                 # liste admin + suppression
│        ├─ actions.ts               # Server Actions (create/update/delete/upload)
│        ├─ nouveau/page.tsx         # formulaire création
│        └─ [id]/page.tsx            # formulaire édition + images
├─ components/
│  ├─ carte/CarteClient.tsx          # carte MapLibre plein écran
│  ├─ carte/MiniCarte.tsx            # mini-carte (fiche) + point picker (admin)
│  ├─ patrimoine/CartePatrimoine.tsx # carte-vignette (archives)
│  ├─ patrimoine/Galerie.tsx         # galerie photos (fiche)
│  ├─ patrimoine/FiltresArchives.tsx # barre de filtres (archives)
│  └─ admin/FormulairePatrimoine.tsx # formulaire FR/EN + point + selects
│  └─ admin/GestionImages.tsx        # upload multi + ordre/principale/légende/crédit
└─ tests/
   ├─ db/patrimoine.spec.ts          # RLS + seed (intégration)
   ├─ carte-points.spec.ts           # endpoint GeoJSON
   ├─ archives.spec.ts               # e2e archives + filtres
   ├─ fiche.spec.ts                  # e2e fiche + OpenGraph
   ├─ carte.spec.ts                  # e2e carte (contrôles/légende)
   ├─ auth.setup.ts                  # connexion admin -> storageState
   ├─ admin-patrimoine.spec.ts       # e2e liste + création + publication
   └─ admin-images.spec.ts           # e2e upload image
```

---

### Task 1: Schéma `patrimoine` + `images` (migrations, RLS-ready, triggers) & helpers bilingues

**Files:**
- Create: `paaciv/supabase/migrations/0004_patrimoine.sql`
- Create: `paaciv/lib/i18n-champ.ts`, `paaciv/lib/media.ts`, `paaciv/lib/slug.ts`
- Create: `paaciv/lib/__tests__/helpers.test.ts`
- Create: `paaciv/tests/db/patrimoine.spec.ts`

**Interfaces:**
- Consumes: tables de référence `types`/`programmes`/`districts`/`epoques` (Phase 1).
- Produces (SQL) : tables `patrimoine`, `images`, trigger `patrimoine_sync_geom`, trigger `touch_updated_at`.
- Produces (TS) :
  - `champ(fr: string | null, en: string | null, locale: string): string`
  - `imageUrl(chemin: string): string`
  - `slugify(texte: string): string`

- [ ] **Step 1: Écrire les helpers en test (échoue d'abord)** — `paaciv/lib/__tests__/helpers.test.ts`

```ts
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import { slugify } from '@/lib/slug'

test('champ: repli sur le français si anglais manquant', () => {
  expect(champ('Cathédrale', 'Cathedral', 'en')).toBe('Cathedral')
  expect(champ('Cathédrale', null, 'en')).toBe('Cathédrale')
  expect(champ('Cathédrale', 'Cathedral', 'fr')).toBe('Cathédrale')
})

test('imageUrl: URL externe telle quelle, sinon URL publique du bucket', () => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
  expect(imageUrl('https://exemple.com/p.jpg')).toBe('https://exemple.com/p.jpg')
  expect(imageUrl('dossier/p.jpg')).toBe(
    'https://x.supabase.co/storage/v1/object/public/patrimoine/dossier/p.jpg',
  )
})

test('slugify: ASCII minuscule tireté', () => {
  expect(slugify('Cathédrale Saint-Paul (Abidjan)')).toBe('cathedrale-saint-paul-abidjan')
})
```

- [ ] **Step 2: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run test -- helpers`
Expected: FAIL (modules introuvables)

- [ ] **Step 3: Implémenter les helpers**

`paaciv/lib/i18n-champ.ts`
```ts
export function champ(fr: string | null, en: string | null, locale: string): string {
  if (locale === 'en') return en || fr || ''
  return fr || ''
}
```

`paaciv/lib/media.ts`
```ts
const BUCKET = 'patrimoine'

export function imageUrl(chemin: string): string {
  if (/^https?:\/\//i.test(chemin)) return chemin
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${base}/storage/v1/object/public/${BUCKET}/${chemin}`
}
```

`paaciv/lib/slug.ts`
```ts
export function slugify(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Lancer — vérifier le succès**

Run: `cd paaciv && npm run test -- helpers`
Expected: PASS

- [ ] **Step 5: Écrire la migration schéma** — `paaciv/supabase/migrations/0004_patrimoine.sql`

```sql
-- Phase 2 · Table patrimoine (édifices géolocalisés — cœur du site) + images.

create table patrimoine (
  id                 uuid primary key default gen_random_uuid(),
  slug               text unique not null,
  titre_fr           text not null,
  titre_en           text,
  resume_fr          text,
  resume_en          text,
  description_fr     text,
  description_en     text,
  type_id            text references types(id),
  programme_id       text references programmes(id),
  date_texte         text,
  annee_debut        int,
  annee_fin          int,
  epoque_id          text references epoques(id),
  style_fr           text,
  style_en           text,
  lat                double precision,
  lng                double precision,
  geom               geography(Point, 4326),
  district_id        text references districts(id),
  ville              text,
  adresse_fr         text,
  adresse_en         text,
  statut_patrimonial text,
  etat_conservation  text,
  video_url          text,
  sources_fr         text,
  sources_en         text,
  statut             text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table images (
  id            uuid primary key default gen_random_uuid(),
  patrimoine_id uuid not null references patrimoine(id) on delete cascade,
  chemin        text not null,
  legende_fr    text,
  legende_en    text,
  credit        text,
  ordre         int  not null default 0,
  est_principale boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Index : clés étrangères (jointures + RLS), filtres du catalogue, géo, statut.
create index idx_patrimoine_type      on patrimoine(type_id);
create index idx_patrimoine_programme on patrimoine(programme_id);
create index idx_patrimoine_district  on patrimoine(district_id);
create index idx_patrimoine_epoque    on patrimoine(epoque_id);
create index idx_patrimoine_statut    on patrimoine(statut);
create index idx_patrimoine_geom      on patrimoine using gist(geom);
create index idx_images_patrimoine    on images(patrimoine_id);

-- Synchronise geom depuis lat/lng. search_path épinglé pour résoudre PostGIS
-- quel que soit le rôle appelant.
create or replace function public.patrimoine_sync_geom()
returns trigger
language plpgsql
set search_path = extensions, public
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.geom := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  else
    new.geom := null;
  end if;
  return new;
end $$;

create trigger trg_patrimoine_geom
  before insert or update of lat, lng on patrimoine
  for each row execute function public.patrimoine_sync_geom();

-- Maintient updated_at à chaque modification.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger trg_patrimoine_touch
  before update on patrimoine
  for each row execute function public.touch_updated_at();

-- RLS activé dès la création (sécurité par défaut). Les politiques d'accès
-- sont posées en Task 2. Sans politique : anon lit 0 ligne et ne peut pas
-- écrire — c'est l'état sûr attendu à l'issue de cette tâche.
alter table patrimoine enable row level security;
alter table images     enable row level security;
```

- [ ] **Step 6: Appliquer la migration** via l'outil MCP `supabase-paaciv` → `apply_migration` (name `0004_patrimoine`, query = contenu du fichier). Vérifier avec `list_tables` que `patrimoine` et `images` existent.

- [ ] **Step 7: Écrire le test d'intégration RLS de base (échoue d'abord si RLS non posé)** — `paaciv/tests/db/patrimoine.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

test('RLS : un anonyme ne peut pas insérer de patrimoine', async () => {
  const { error } = await anon.from('patrimoine').insert({ slug: 'x-test', titre_fr: 'X' })
  expect(error).not.toBeNull()
})

test('un anonyme lit la table patrimoine sans erreur (0 ligne sans politique)', async () => {
  const { data, error } = await anon.from('patrimoine').select('id')
  expect(error).toBeNull()
  expect(Array.isArray(data)).toBe(true)
})
```

- [ ] **Step 8: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- db/patrimoine`
Expected: **PASS** (RLS activée sans politique : l'insertion anon est refusée, la lecture anon renvoie un tableau vide sans erreur). Les politiques de lecture publique arrivent à la Task 2, prouvées au seed (Task 4).

- [ ] **Step 9: Commit**

```bash
git add paaciv && git commit -m "feat(db): schéma patrimoine + images (PostGIS, triggers) + helpers bilingues"
```

---

### Task 2: RLS `patrimoine` + `images`

**Files:**
- Create: `paaciv/supabase/migrations/0005_patrimoine_rls.sql`
- Modify: (aucun — on refait tourner `tests/db/patrimoine.spec.ts` de la Task 1)

**Interfaces:**
- Produces : politiques RLS — anon lit `patrimoine` publié + images de patrimoines publiés ; authenticated a un accès complet.

- [ ] **Step 1: Écrire la migration RLS** — `paaciv/supabase/migrations/0005_patrimoine_rls.sql`

```sql
-- Phase 2 · Politiques RLS patrimoine + images.
-- (RLS déjà activé sur les deux tables en Task 1 → migration 0004.)

-- Durcissement : épingle le search_path de touch_updated_at() (oubli en 0004 ;
-- lève l'avertissement Supabase function_search_path_mutable, aligne sur
-- patrimoine_sync_geom qui l'épingle déjà). now() est en pg_catalog (toujours
-- résolu), donc search_path='' suffit.
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Patrimoine : lecture publique des publiés ; accès complet aux authentifiés (admin unique).
create policy "patrimoine select public"
  on patrimoine for select to anon using (statut = 'publie');
create policy "patrimoine all admin"
  on patrimoine for all to authenticated using (true) with check (true);

-- Images : lisibles par le public si le patrimoine parent est publié ; accès complet admin.
create policy "images select public"
  on images for select to anon
  using ((select exists (
    select 1 from patrimoine p
    where p.id = images.patrimoine_id and p.statut = 'publie'
  )));
create policy "images all admin"
  on images for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: Appliquer la migration** via MCP `apply_migration` (name `0005_patrimoine_rls`).

- [ ] **Step 3: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- db/patrimoine`
Expected: **les 2 tests PASSENT** (inchangés : insertion anon refusée, lecture anon sans erreur). La lecture reste vide tant qu'il n'y a pas de données ; les politiques de lecture publique sont prouvées au seed (Task 4, qui vérifie « 7 publiés visibles, brouillon caché »).

- [ ] **Step 4: Vérifier les advisors de sécurité** via MCP `get_advisors` (type `security`) — attendu : aucune alerte RLS sur `patrimoine`/`images`.

- [ ] **Step 5: Commit**

```bash
git add paaciv && git commit -m "feat(db): RLS patrimoine + images (lecture publique des publiés, écriture admin)"
```

---

### Task 3: Stockage médias (bucket `patrimoine` + RLS storage)

**Files:**
- Create: `paaciv/supabase/migrations/0006_storage_patrimoine.sql`
- Create: `paaciv/tests/db/storage.spec.ts`

**Interfaces:**
- Produces : bucket public `patrimoine` ; politiques `storage.objects` (lecture publique, écriture authentifiée).

- [ ] **Step 1: Écrire la migration** — `paaciv/supabase/migrations/0006_storage_patrimoine.sql`

```sql
-- Phase 2 · Bucket de médias patrimoine (lecture publique, écriture admin).
insert into storage.buckets (id, name, public)
values ('patrimoine', 'patrimoine', true)
on conflict (id) do nothing;

create policy "media patrimoine lecture publique"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'patrimoine');

create policy "media patrimoine insertion admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'patrimoine');

create policy "media patrimoine maj admin"
  on storage.objects for update to authenticated
  using (bucket_id = 'patrimoine') with check (bucket_id = 'patrimoine');

create policy "media patrimoine suppression admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'patrimoine');
```

- [ ] **Step 2: Appliquer la migration** via MCP `apply_migration` (name `0006_storage_patrimoine`).

- [ ] **Step 3: Écrire le test (échoue d'abord si bucket absent)** — `paaciv/tests/db/storage.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

test('le bucket patrimoine est listable publiquement (lecture publique)', async () => {
  const { error } = await anon.storage.from('patrimoine').list('', { limit: 1 })
  expect(error).toBeNull()
})

test('un anonyme ne peut pas écrire dans le bucket', async () => {
  const { error } = await anon.storage
    .from('patrimoine')
    .upload(`interdit-${Date.now()}.txt`, new Blob(['x']))
  expect(error).not.toBeNull()
})
```

- [ ] **Step 4: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- db/storage`
Expected: PASS (lecture OK, écriture anon refusée)

- [ ] **Step 5: Commit**

```bash
git add paaciv && git commit -m "feat(storage): bucket patrimoine (lecture publique, écriture admin)"
```

---

### Task 4: Données de démonstration (seed patrimoine + images placeholder)

**Files:**
- Create: `paaciv/supabase/migrations/0007_patrimoine_seed.sql`
- Modify: `paaciv/tests/db/patrimoine.spec.ts` (ajouter les assertions de visibilité)

**Interfaces:**
- Produces : ≥ 7 patrimoines `publie` + 1 `brouillon`, chacun avec ≥ 1 image (URL Wikimedia/Unsplash placeholder), coordonnées réelles approximatives, type/programme/district/époque renseignés.

- [ ] **Step 1: Écrire la migration seed** — `paaciv/supabase/migrations/0007_patrimoine_seed.sql`

```sql
-- Phase 2 · Seed de démonstration. Contenus génériques + images libres de droit
-- (placeholders remplaçables dans l'admin). Idempotent via slug unique.
insert into patrimoine
 (slug, titre_fr, titre_en, resume_fr, resume_en, type_id, programme_id,
  date_texte, annee_debut, epoque_id, style_fr, lat, lng, district_id, ville, statut)
values
 ('cathedrale-saint-paul-abidjan','Cathédrale Saint-Paul d''Abidjan','St Paul''s Cathedral, Abidjan',
  'Cathédrale moderne du Plateau, silhouette en voile de béton.','Modernist cathedral of the Plateau district.',
  'religieux','religieux','1985',1985,'post_independance','Moderne',5.3247,-4.0206,'abidjan','Abidjan','publie'),
 ('la-pyramide-abidjan','La Pyramide','La Pyramide',
  'Immeuble emblématique de Rinaldo Olivieri au Plateau.','Rinaldo Olivieri''s landmark building in the Plateau.',
  'batiment','administratif','1973',1973,'post_independance','Brutaliste',5.3268,-4.0179,'abidjan','Abidjan','publie'),
 ('hotel-ivoire-abidjan','Hôtel Ivoire','Hotel Ivoire',
  'Complexe hôtelier moderniste de Cocody.','Modernist hotel complex in Cocody.',
  'batiment','hotelier','1963',1963,'post_independance','Moderne',5.3226,-3.9975,'abidjan','Abidjan','publie'),
 ('basilique-yamoussoukro','Basilique Notre-Dame de la Paix','Our Lady of Peace Basilica',
  'Plus grande basilique du monde, à Yamoussoukro.','The world''s largest basilica, in Yamoussoukro.',
  'religieux','religieux','1990',1990,'post_independance','Néo-classique',6.8100,-5.2986,'yamoussoukro','Yamoussoukro','publie'),
 ('quartier-france-grand-bassam','Quartier France de Grand-Bassam','Grand-Bassam French Quarter',
  'Ensemble colonial classé au patrimoine mondial.','Colonial ensemble, UNESCO World Heritage.',
  'ensemble','administratif','fin XIXᵉ – début XXᵉ',1893,'colonial','Colonial',5.1996,-3.7386,'comoe','Grand-Bassam','publie'),
 ('stade-felix-houphouet-boigny','Stade Félix Houphouët-Boigny','Félix Houphouët-Boigny Stadium',
  'Stade historique du Plateau.','Historic stadium in the Plateau.',
  'batiment','sportif','1964',1964,'post_independance','Moderne',5.3186,-4.0206,'abidjan','Abidjan','publie'),
 ('pont-felix-houphouet-boigny','Pont Félix Houphouët-Boigny','Félix Houphouët-Boigny Bridge',
  'Ouvrage reliant le Plateau à Treichville.','Bridge linking the Plateau to Treichville.',
  'ouvrage','ouvrage_art','1957',1957,'colonial','Ouvrage d''art',5.3111,-4.0164,'abidjan','Abidjan','publie'),
 ('aeroport-felix-houphouet-boigny','Aéroport Félix Houphouët-Boigny','Félix Houphouët-Boigny Airport',
  'Principal aéroport international du pays.','The country''s main international airport.',
  'batiment','aeroportuaire','1970',1970,'post_independance','Moderne',5.2614,-3.9263,'abidjan','Abidjan','brouillon')
on conflict (slug) do nothing;

-- Une image principale par patrimoine (placeholder libre de droit).
insert into images (patrimoine_id, chemin, credit, ordre, est_principale)
select p.id,
       'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&q=60',
       'Placeholder — Unsplash', 0, true
from patrimoine p
where p.slug in (
  'cathedrale-saint-paul-abidjan','la-pyramide-abidjan','hotel-ivoire-abidjan',
  'basilique-yamoussoukro','quartier-france-grand-bassam',
  'stade-felix-houphouet-boigny','pont-felix-houphouet-boigny','aeroport-felix-houphouet-boigny'
)
and not exists (select 1 from images i where i.patrimoine_id = p.id);
```

- [ ] **Step 2: Appliquer la migration** via MCP `apply_migration` (name `0007_patrimoine_seed`).

- [ ] **Step 3: Vérifier que geom a été calculé** via MCP `execute_sql` :

```sql
select count(*) filter (where geom is not null) as avec_geom, count(*) as total from patrimoine;
```
Expected : `avec_geom = total` (le trigger a rempli `geom` pour toutes les lignes).

- [ ] **Step 4: Étendre le test de visibilité** — ajouter à `paaciv/tests/db/patrimoine.spec.ts`

```ts
test('le public ne voit que les patrimoines publiés (brouillons cachés)', async () => {
  const { data, error } = await anon.from('patrimoine').select('slug, statut')
  expect(error).toBeNull()
  expect(data!.length).toBe(7)
  expect(data!.some((p) => p.statut !== 'publie')).toBe(false)
  expect(data!.some((p) => p.slug === 'aeroport-felix-houphouet-boigny')).toBe(false)
})
```

- [ ] **Step 5: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- db/patrimoine`
Expected: PASS (7 publiés visibles, brouillon caché)

- [ ] **Step 6: Commit**

```bash
git add paaciv && git commit -m "feat(db): seed de démonstration patrimoine + images placeholder"
```

---

### Task 5: Couche d'accès données (`lib/data/patrimoine.ts`)

**Files:**
- Create: `paaciv/lib/supabase/reader.ts` (client anon SANS cookies, pour les lectures publiques)
- Create: `paaciv/lib/data/patrimoine.ts`
- Create: `paaciv/tests/db/data-patrimoine.spec.ts`

**Interfaces:**
- Consumes: `createReadClient()` (nouveau, ci-dessous), `imageUrl()` (Task 1).
- Produces (client de lecture) : `createReadClient(): SupabaseClient` — client anon sans gestion de cookies.

> **Pourquoi un client dédié :** la couche d'accès ne lit que du contenu **public publié** (`statut='publie'`), sans session. Elle est importée directement dans les tests Node (Playwright) ET dans les Server Components / route handlers. Le client cookie de la Phase 1 (`createServerClient`) appelle `cookies()` de `next/headers`, qui **lève une erreur hors contexte de requête** (donc dans un test Node). Un client anon sans cookies fonctionne partout de façon identique et convient exactement aux lectures publiques.
- Produces (types & fonctions) :
  - `type FiltresPatrimoine = { type?: string; programme?: string; district?: string; epoque?: string; q?: string }`
  - `type Ref = { id: string; nom_fr: string; nom_en: string | null; couleur: string | null; ordre: number | null }`
  - `type ImageRow = { id: string; chemin: string; legende_fr: string | null; legende_en: string | null; credit: string | null; ordre: number; est_principale: boolean }`
  - `type PatrimoineListItem = { id; slug; titre_fr; titre_en; resume_fr; resume_en; type_id; programme_id; district_id; epoque_id; ville; images: { chemin; est_principale; ordre }[] }`
  - `type PatrimoineDetail = { …tous les champs… ; type: Ref | null; programme: Ref | null; district: Ref | null; epoque: Ref | null; images: ImageRow[] }`
  - `type PointPublie = { id; slug; titre_fr; titre_en; type_id; lat; lng; ville; image: string | null }`
  - `listePatrimoine(f?: FiltresPatrimoine): Promise<PatrimoineListItem[]>`
  - `getPatrimoineParSlug(slug: string): Promise<PatrimoineDetail | null>`
  - `pointsPublies(f?: FiltresPatrimoine): Promise<PointPublie[]>`

- [ ] **Step 1: Écrire le test d'intégration (échoue d'abord)** — `paaciv/tests/db/data-patrimoine.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { listePatrimoine, getPatrimoineParSlug, pointsPublies } from '@/lib/data/patrimoine'

test('listePatrimoine renvoie les publiés et filtre par type', async () => {
  const tous = await listePatrimoine()
  expect(tous.length).toBe(7)
  const religieux = await listePatrimoine({ type: 'religieux' })
  expect(religieux.length).toBeGreaterThanOrEqual(2)
  expect(religieux.every((p) => p.type_id === 'religieux')).toBe(true)
})

test('listePatrimoine cherche par texte', async () => {
  const r = await listePatrimoine({ q: 'pyramide' })
  expect(r.map((p) => p.slug)).toContain('la-pyramide-abidjan')
})

test('getPatrimoineParSlug renvoie le détail joint', async () => {
  const p = await getPatrimoineParSlug('basilique-yamoussoukro')
  expect(p).not.toBeNull()
  expect(p!.type?.id).toBe('religieux')
  expect(p!.images.length).toBeGreaterThanOrEqual(1)
})

test('getPatrimoineParSlug renvoie null pour un brouillon (public)', async () => {
  const p = await getPatrimoineParSlug('aeroport-felix-houphouet-boigny')
  expect(p).toBeNull()
})

test('pointsPublies renvoie des points avec coordonnées', async () => {
  const pts = await pointsPublies()
  expect(pts.length).toBe(7)
  expect(pts.every((p) => typeof p.lat === 'number' && typeof p.lng === 'number')).toBe(true)
})
```

> Le test importe `@/lib/...` ; Playwright résout l'alias via `tsconfig`. Si l'alias n'est pas résolu sous Playwright, ajouter à `playwright.config.ts` la résolution TS (déjà en place via `@next/env` + transpile Playwright natif ; sinon, le test échouera à l'import — le corriger fait partie de cette étape).

- [ ] **Step 2: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- data-patrimoine`
Expected: FAIL (module `@/lib/data/patrimoine` introuvable)

- [ ] **Step 3a: Créer le client de lecture** — `paaciv/lib/supabase/reader.ts`

```ts
import { createClient } from '@supabase/supabase-js'

// Client anon SANS cookies, pour les lectures publiques (contenu publié).
// Fonctionne aussi bien dans un Server Component / route handler que dans un
// test Node — contrairement à createServerClient() qui dépend de cookies().
export function createReadClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
```

- [ ] **Step 3b: Implémenter la couche d'accès** — `paaciv/lib/data/patrimoine.ts`

```ts
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl } from '@/lib/media'

export type FiltresPatrimoine = {
  type?: string
  programme?: string
  district?: string
  epoque?: string
  q?: string
}

export type Ref = {
  id: string
  nom_fr: string
  nom_en: string | null
  couleur: string | null
  ordre: number | null
}

export type ImageRow = {
  id: string
  chemin: string
  legende_fr: string | null
  legende_en: string | null
  credit: string | null
  ordre: number
  est_principale: boolean
}

type ImageMini = { chemin: string; est_principale: boolean; ordre: number }

export type PatrimoineListItem = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  resume_fr: string | null
  resume_en: string | null
  type_id: string | null
  programme_id: string | null
  district_id: string | null
  epoque_id: string | null
  ville: string | null
  images: ImageMini[]
}

export type PatrimoineDetail = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  resume_fr: string | null
  resume_en: string | null
  description_fr: string | null
  description_en: string | null
  type_id: string | null
  programme_id: string | null
  date_texte: string | null
  annee_debut: number | null
  annee_fin: number | null
  epoque_id: string | null
  style_fr: string | null
  style_en: string | null
  lat: number | null
  lng: number | null
  district_id: string | null
  ville: string | null
  adresse_fr: string | null
  adresse_en: string | null
  statut_patrimonial: string | null
  etat_conservation: string | null
  video_url: string | null
  sources_fr: string | null
  sources_en: string | null
  type: Ref | null
  programme: Ref | null
  district: Ref | null
  epoque: Ref | null
  images: ImageRow[]
}

export type PointPublie = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  type_id: string | null
  lat: number
  lng: number
  ville: string | null
  image: string | null
}

function imagePrincipale(images: ImageMini[] | null): string | null {
  if (!images || images.length === 0) return null
  const principale =
    images.find((i) => i.est_principale) ??
    [...images].sort((a, b) => a.ordre - b.ordre)[0]
  return principale ? imageUrl(principale.chemin) : null
}

function appliquerFiltres<T extends { eq: (c: string, v: string) => T; or: (s: string) => T }>(
  q: T,
  f: FiltresPatrimoine,
): T {
  if (f.type) q = q.eq('type_id', f.type)
  if (f.programme) q = q.eq('programme_id', f.programme)
  if (f.district) q = q.eq('district_id', f.district)
  if (f.epoque) q = q.eq('epoque_id', f.epoque)
  if (f.q) {
    const motif = f.q.replace(/[%,]/g, ' ')
    q = q.or(`titre_fr.ilike.%${motif}%,titre_en.ilike.%${motif}%,ville.ilike.%${motif}%`)
  }
  return q
}

export async function listePatrimoine(
  f: FiltresPatrimoine = {},
): Promise<PatrimoineListItem[]> {
  const sb = createReadClient()
  let q = sb
    .from('patrimoine')
    .select(
      'id, slug, titre_fr, titre_en, resume_fr, resume_en, type_id, programme_id, district_id, epoque_id, ville, images(chemin, est_principale, ordre)',
    )
    .eq('statut', 'publie')
    .order('titre_fr', { ascending: true })
  q = appliquerFiltres(q as never, f)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []) as PatrimoineListItem[]
}

export async function getPatrimoineParSlug(slug: string): Promise<PatrimoineDetail | null> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('patrimoine')
    .select(
      '*, type:types(*), programme:programmes(*), district:districts(*), epoque:epoques(*), images(*)',
    )
    .eq('slug', slug)
    .eq('statut', 'publie')
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const detail = data as unknown as PatrimoineDetail
  detail.images = [...(detail.images ?? [])].sort((a, b) => a.ordre - b.ordre)
  return detail
}

export async function pointsPublies(f: FiltresPatrimoine = {}): Promise<PointPublie[]> {
  const sb = createReadClient()
  let q = sb
    .from('patrimoine')
    .select(
      'id, slug, titre_fr, titre_en, type_id, lat, lng, ville, images(chemin, est_principale, ordre)',
    )
    .eq('statut', 'publie')
    .not('lat', 'is', null)
    .not('lng', 'is', null)
  q = appliquerFiltres(q as never, f)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map((row: {
    id: string; slug: string; titre_fr: string; titre_en: string | null
    type_id: string | null; lat: number; lng: number; ville: string | null; images: ImageMini[]
  }) => ({
    id: row.id,
    slug: row.slug,
    titre_fr: row.titre_fr,
    titre_en: row.titre_en,
    type_id: row.type_id,
    lat: row.lat,
    lng: row.lng,
    ville: row.ville,
    image: imagePrincipale(row.images),
  }))
}
```

- [ ] **Step 4: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- data-patrimoine`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add paaciv && git commit -m "feat(data): couche d'accès patrimoine (liste, fiche, points)"
```

---

### Task 6: Endpoint GeoJSON `/api/carte/points`

**Files:**
- Create: `paaciv/app/api/carte/points/route.ts`
- Create: `paaciv/tests/carte-points.spec.ts`

**Interfaces:**
- Consumes: `pointsPublies()` (Task 5).
- Produces: `GET /api/carte/points[?type&programme&district&epoque&q]` → `FeatureCollection` GeoJSON (`geometry.coordinates = [lng, lat]`, `properties = { id, slug, type_id, titre_fr, titre_en, ville, image }`).

- [ ] **Step 1: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/carte-points.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('l\'endpoint GeoJSON renvoie une FeatureCollection des publiés', async ({ request }) => {
  const res = await request.get('/api/carte/points')
  expect(res.ok()).toBe(true)
  const fc = await res.json()
  expect(fc.type).toBe('FeatureCollection')
  expect(fc.features.length).toBe(7)
  const f = fc.features[0]
  expect(f.geometry.type).toBe('Point')
  expect(Array.isArray(f.geometry.coordinates)).toBe(true)
  expect(f.properties.slug).toBeTruthy()
})

test('l\'endpoint filtre par type', async ({ request }) => {
  const res = await request.get('/api/carte/points?type=religieux')
  const fc = await res.json()
  expect(fc.features.every((f: { properties: { type_id: string } }) => f.properties.type_id === 'religieux')).toBe(true)
})
```

- [ ] **Step 2: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- carte-points`
Expected: FAIL (404 sur la route)

- [ ] **Step 3: Implémenter le route handler** — `paaciv/app/api/carte/points/route.ts`

```ts
import type { NextRequest } from 'next/server'
import { pointsPublies } from '@/lib/data/patrimoine'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const points = await pointsPublies({
    type: sp.get('type') ?? undefined,
    programme: sp.get('programme') ?? undefined,
    district: sp.get('district') ?? undefined,
    epoque: sp.get('epoque') ?? undefined,
    q: sp.get('q') ?? undefined,
  })

  return Response.json({
    type: 'FeatureCollection',
    features: points.map((p) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: {
        id: p.id,
        slug: p.slug,
        type_id: p.type_id,
        titre_fr: p.titre_fr,
        titre_en: p.titre_en,
        ville: p.ville,
        image: p.image,
      },
    })),
  })
}
```

- [ ] **Step 4: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- carte-points`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add paaciv && git commit -m "feat(carte): endpoint GeoJSON des patrimoines publiés"
```

---

### Task 7: Page « Nos archives » (catalogue filtrable)

**Files:**
- Create: `paaciv/app/[locale]/archives/page.tsx`
- Create: `paaciv/components/patrimoine/CartePatrimoine.tsx`
- Create: `paaciv/components/patrimoine/FiltresArchives.tsx`
- Modify: `paaciv/i18n/messages/fr.json`, `paaciv/i18n/messages/en.json` (namespace `archives`)
- Create: `paaciv/tests/archives.spec.ts`

**Interfaces:**
- Consumes: `listePatrimoine()` (Task 5), `champ()`/`imageUrl()` (Task 1), tables de référence.
- Produces: `/[locale]/archives` (SSR) avec grille de `<CartePatrimoine>` + `<FiltresArchives>` pilotant les `searchParams`.

- [ ] **Step 1: Ajouter les libellés** — dans `fr.json` et `en.json`, namespace `archives`

```json
// fr.json (ajouter)
"archives": {
  "titre": "Nos archives",
  "intro": "Explorez le patrimoine architectural documenté par PAACIV.",
  "recherche": "Rechercher un édifice…",
  "type": "Type", "programme": "Programme", "district": "District", "epoque": "Époque",
  "tous": "Tous", "resultats": "{n} résultat(s)", "aucun": "Aucun résultat.",
  "reinitialiser": "Réinitialiser"
}
```
```json
// en.json (ajouter)
"archives": {
  "titre": "Archive",
  "intro": "Explore the architectural heritage documented by PAACIV.",
  "recherche": "Search a building…",
  "type": "Type", "programme": "Programme", "district": "District", "epoque": "Era",
  "tous": "All", "resultats": "{n} result(s)", "aucun": "No results.",
  "reinitialiser": "Reset"
}
```

- [ ] **Step 2: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/archives.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('la page archives liste les patrimoines publiés', async ({ page }) => {
  await page.goto('/fr/archives')
  await expect(page.getByRole('heading', { name: 'Nos archives' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Basilique Notre-Dame/ })).toBeVisible()
})

test('le filtre par type restreint les résultats via l\'URL', async ({ page }) => {
  await page.goto('/fr/archives?type=religieux')
  await expect(page.getByRole('link', { name: /Basilique Notre-Dame/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /La Pyramide/ })).toHaveCount(0)
})
```

- [ ] **Step 3: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- archives`
Expected: FAIL (404)

- [ ] **Step 4: Créer la carte-vignette** — `paaciv/components/patrimoine/CartePatrimoine.tsx`

```tsx
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import type { PatrimoineListItem } from '@/lib/data/patrimoine'

export function CartePatrimoine({
  item,
  locale,
}: {
  item: PatrimoineListItem
  locale: string
}) {
  const titre = champ(item.titre_fr, item.titre_en, locale)
  const resume = champ(item.resume_fr, item.resume_en, locale)
  const principale = item.images.find((i) => i.est_principale) ?? item.images[0]

  return (
    <Link
      href={`/patrimoine/${item.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-encre/5 transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-creme2">
        {principale && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(principale.chemin)}
            alt={titre}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-serif text-lg text-brun">{titre}</h3>
        {item.ville && <p className="text-xs uppercase tracking-wide text-encre/50">{item.ville}</p>}
        {resume && <p className="line-clamp-2 text-sm text-encre/70">{resume}</p>}
      </div>
    </Link>
  )
}
```

> Note : on utilise `<img>` (et non `next/image`) car les sources incluent des URLs externes de placeholders non déclarées dans `next.config`. Le passage à `next/image` avec `remotePatterns` est une optimisation de la Phase 6 (§17).

- [ ] **Step 5: Créer la barre de filtres** — `paaciv/components/patrimoine/FiltresArchives.tsx`

```tsx
'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import type { Ref } from '@/lib/data/patrimoine'

type Options = { types: Ref[]; programmes: Ref[]; districts: Ref[]; epoques: Ref[] }

export function FiltresArchives({ options, locale }: { options: Options; locale: string }) {
  const t = useTranslations('archives')
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  function maj(cle: string, valeur: string) {
    const params = new URLSearchParams(sp.toString())
    if (valeur) params.set(cle, valeur)
    else params.delete(cle)
    router.push(`${pathname}?${params.toString()}`)
  }

  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  const selects: [string, Ref[]][] = [
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
          defaultValue={sp.get('q') ?? ''}
          onChange={(e) => maj('q', e.target.value)}
          placeholder={t('recherche')}
          className="rounded-xl border border-encre/20 bg-white px-3 py-2"
        />
      </label>
      {selects.map(([cle, refs]) => (
        <label key={cle} className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t(cle)}</span>
          <select
            value={sp.get(cle) ?? ''}
            onChange={(e) => maj(cle, e.target.value)}
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

- [ ] **Step 6: Créer la page archives** — `paaciv/app/[locale]/archives/page.tsx`

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { FiltresArchives } from '@/components/patrimoine/FiltresArchives'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

async function chargerReferences() {
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

export default async function ArchivesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const f = await searchParams
  const t = await getTranslations('archives')

  const [items, options] = await Promise.all([
    listePatrimoine({
      type: f.type,
      programme: f.programme,
      district: f.district,
      epoque: f.epoque,
      q: f.q,
    }),
    chargerReferences(),
  ])

  return (
    <main className="flex-1 py-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        <FiltresArchives options={options} locale={locale} />

        <p className="text-sm text-encre/60">{t('resultats', { n: items.length })}</p>

        {items.length === 0 ? (
          <p className="text-encre/70">{t('aucun')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CartePatrimoine key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
```

- [ ] **Step 7: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- archives`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add paaciv && git commit -m "feat: page Nos archives (catalogue filtrable type/programme/district/époque + recherche)"
```

---

### Task 8: Fiche patrimoine (`/[locale]/patrimoine/[slug]`)

**Files:**
- Create: `paaciv/app/[locale]/patrimoine/[slug]/page.tsx`
- Create: `paaciv/components/patrimoine/Galerie.tsx`
- Create: `paaciv/components/carte/MiniCarte.tsx`
- Modify: `paaciv/i18n/messages/fr.json`, `en.json` (namespace `fiche`)
- Create: `paaciv/tests/fiche.spec.ts`
- Install: `maplibre-gl`

**Interfaces:**
- Consumes: `getPatrimoineParSlug()` (Task 5), `champ()`/`imageUrl()`.
- Produces: page fiche SSR + `generateMetadata` (OpenGraph) ; `<MiniCarte lat lng titre />` (réutilisée par l'admin) ; `<Galerie images locale />`.

- [ ] **Step 1: Installer MapLibre**

```bash
cd paaciv && npm i maplibre-gl
```

- [ ] **Step 2: Ajouter les libellés** — `fr.json` / `en.json`, namespace `fiche`

```json
// fr.json
"fiche": {
  "programme": "Programme", "epoque": "Époque", "style": "Style",
  "datation": "Datation", "localisation": "Localisation", "etat": "État de conservation",
  "statutPatrimonial": "Statut patrimonial", "sources": "Sources",
  "video": "Reportage vidéo", "architectes": "Architectes", "partager": "Partager", "retour": "Retour aux archives"
}
```
```json
// en.json
"fiche": {
  "programme": "Programme", "epoque": "Era", "style": "Style",
  "datation": "Dating", "localisation": "Location", "etat": "State of conservation",
  "statutPatrimonial": "Heritage status", "sources": "Sources",
  "video": "Video report", "architectes": "Architects", "partager": "Share", "retour": "Back to archive"
}
```

- [ ] **Step 3: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/fiche.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('la fiche patrimoine affiche titre, type et galerie', async ({ page }) => {
  await page.goto('/fr/patrimoine/basilique-yamoussoukro')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Basilique')
  await expect(page.locator('img').first()).toBeVisible()
})

test('un brouillon renvoie 404 côté public', async ({ page }) => {
  const res = await page.goto('/fr/patrimoine/aeroport-felix-houphouet-boigny')
  expect(res?.status()).toBe(404)
})

test('métadonnées OpenGraph présentes', async ({ page }) => {
  await page.goto('/fr/patrimoine/hotel-ivoire-abidjan')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Hôtel Ivoire/)
})
```

- [ ] **Step 4: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- fiche`
Expected: FAIL (404 sur toutes)

- [ ] **Step 5: Créer la galerie** — `paaciv/components/patrimoine/Galerie.tsx`

```tsx
'use client'

import { useState } from 'react'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'

export function Galerie({ images, locale }: { images: ImageRow[]; locale: string }) {
  const [actif, setActif] = useState(0)
  if (images.length === 0) return null
  const courante = images[actif]

  return (
    <figure className="space-y-3">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-creme2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(courante.chemin)}
          alt={champ(courante.legende_fr, courante.legende_en, locale) || ''}
          className="h-full w-full object-cover"
        />
      </div>
      {(courante.legende_fr || courante.credit) && (
        <figcaption className="text-xs text-encre/60">
          {champ(courante.legende_fr, courante.legende_en, locale)}
          {courante.credit && <span className="italic"> — {courante.credit}</span>}
        </figcaption>
      )}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActif(i)}
              aria-current={i === actif}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ${
                i === actif ? 'ring-or' : 'ring-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(img.chemin)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}
```

- [ ] **Step 6: Créer la mini-carte** — `paaciv/components/carte/MiniCarte.tsx`

```tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'

export function MiniCarte({ lat, lng, titre }: { lat: number; lng: number; titre?: string }) {
  const conteneur = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conteneur.current) return
    const map = new maplibregl.Map({
      container: conteneur.current,
      style: STYLE,
      center: [lng, lat],
      zoom: 14,
      attributionControl: { compact: true },
    })
    const marqueur = new maplibregl.Marker({ color: '#B5581F' }).setLngLat([lng, lat]).addTo(map)
    if (titre) marqueur.setPopup(new maplibregl.Popup().setText(titre))
    return () => map.remove()
  }, [lat, lng, titre])

  return <div ref={conteneur} className="h-64 w-full overflow-hidden rounded-2xl" aria-label={titre} />
}
```

- [ ] **Step 7: Créer la page fiche** — `paaciv/app/[locale]/patrimoine/[slug]/page.tsx`

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Galerie } from '@/components/patrimoine/Galerie'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { getPatrimoineParSlug } from '@/lib/data/patrimoine'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getPatrimoineParSlug(slug)
  if (!p) return {}
  const titre = champ(p.titre_fr, p.titre_en, locale)
  const description = champ(p.resume_fr, p.resume_en, locale)
  const principale = p.images.find((i) => i.est_principale) ?? p.images[0]
  return {
    title: `${titre} — PAACIV`,
    description,
    openGraph: {
      title: titre,
      description,
      images: principale ? [imageUrl(principale.chemin)] : [],
      type: 'article',
    },
  }
}

export default async function FichePatrimoine({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('fiche')
  const p = await getPatrimoineParSlug(slug)
  if (!p) notFound()

  const titre = champ(p.titre_fr, p.titre_en, locale)
  const ligne = (label: string, valeur: string | null | undefined) =>
    valeur ? (
      <div>
        <dt className="text-xs uppercase tracking-wide text-encre/50">{label}</dt>
        <dd className="text-encre">{valeur}</dd>
      </div>
    ) : null

  const datation =
    p.date_texte ||
    [p.annee_debut, p.annee_fin].filter(Boolean).join(' – ') ||
    null

  const embedYoutube = (url: string | null) => {
    if (!url) return null
    const m = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/)
    return m ? `https://www.youtube.com/embed/${m[1]}` : null
  }
  const yt = embedYoutube(p.video_url)

  return (
    <main className="flex-1 py-10">
      <Container className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {p.type && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-sable"
                style={{ backgroundColor: p.type.couleur ?? '#8A3E1B' }}
              >
                {champ(p.type.nom_fr, p.type.nom_en, locale)}
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl text-brun">{titre}</h1>
          <Galerie images={p.images} locale={locale} />
          {champ(p.description_fr, p.description_en, locale) && (
            <div className="prose max-w-none whitespace-pre-line text-encre/90">
              {champ(p.description_fr, p.description_en, locale)}
            </div>
          )}
          {yt && (
            <div className="aspect-video overflow-hidden rounded-2xl">
              <iframe
                src={yt}
                title={t('video')}
                className="h-full w-full"
                allowFullScreen
              />
            </div>
          )}
          {champ(p.sources_fr, p.sources_en, locale) && (
            <section>
              <h2 className="font-serif text-lg text-brun">{t('sources')}</h2>
              <p className="whitespace-pre-line text-sm text-encre/70">
                {champ(p.sources_fr, p.sources_en, locale)}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <dl className="space-y-3">
            {ligne(t('programme'), p.programme && champ(p.programme.nom_fr, p.programme.nom_en, locale))}
            {ligne(t('datation'), datation)}
            {ligne(t('epoque'), p.epoque && champ(p.epoque.nom_fr, p.epoque.nom_en, locale))}
            {ligne(t('style'), champ(p.style_fr, p.style_en, locale) || null)}
            {ligne(t('statutPatrimonial'), p.statut_patrimonial)}
            {ligne(t('etat'), p.etat_conservation)}
            {ligne(
              t('localisation'),
              [champ(p.adresse_fr, p.adresse_en, locale), p.ville].filter(Boolean).join(', ') || null,
            )}
          </dl>
          {p.lat != null && p.lng != null && (
            <MiniCarte lat={p.lat} lng={p.lng} titre={titre} />
          )}
          {/* Emplacement architectes — rempli en Phase 3 (patrimoine_architecte). */}
        </aside>
      </Container>
    </main>
  )
}
```

- [ ] **Step 8: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- fiche`
Expected: PASS (les 3 tests)

- [ ] **Step 9: Commit**

```bash
git add paaciv && git commit -m "feat: fiche patrimoine (galerie, détails, mini-carte, vidéo, OpenGraph)"
```

---

### Task 9: Carte MapLibre plein écran (`/[locale]/carte`)

**Files:**
- Create: `paaciv/app/[locale]/carte/page.tsx`
- Create: `paaciv/components/carte/CarteClient.tsx`
- Modify: `paaciv/i18n/messages/fr.json`, `en.json` (namespace `carte`)
- Create: `paaciv/tests/carte.spec.ts`

**Interfaces:**
- Consumes: `/api/carte/points` (Task 6), tables `types` (couleurs + libellés) et références (filtres).
- Produces: page carte plein écran — source GeoJSON clusterisée, points colorés par type, bascule Plan/Satellite, légende, filtres, recherche, survol (aperçu), clic → fiche, inset « CI en Afrique ».

- [ ] **Step 1: Ajouter les libellés** — `fr.json` / `en.json`, namespace `carte`

```json
// fr.json
"carte": {
  "titre": "Carte du patrimoine", "plan": "Plan", "satellite": "Satellite",
  "legende": "Légende", "compteur": "{n} édifice(s)", "voirFiche": "Voir la fiche",
  "recherche": "Rechercher…", "filtres": "Filtres"
}
```
```json
// en.json
"carte": {
  "titre": "Heritage map", "plan": "Map", "satellite": "Satellite",
  "legende": "Legend", "compteur": "{n} building(s)", "voirFiche": "View details",
  "recherche": "Search…", "filtres": "Filters"
}
```

- [ ] **Step 2: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/carte.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('la page carte affiche la légende et la bascule Plan/Satellite', async ({ page }) => {
  await page.goto('/fr/carte')
  await expect(page.getByRole('heading', { name: 'Carte du patrimoine' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Satellite' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Légende' })).toBeVisible()
  // 7 types dans la légende
  await expect(page.getByTestId('legende-type')).toHaveCount(7)
})
```

- [ ] **Step 3: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- carte.spec`
Expected: FAIL (404)

- [ ] **Step 4: Créer le client carte** — `paaciv/components/carte/CarteClient.tsx`

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl, { type MapGeoJSONFeature } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import type { Ref } from '@/lib/data/patrimoine'

const STYLE = 'https://tiles.openfreemap.org/styles/liberty'
const ESRI =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export function CarteClient({ types, locale }: { types: Ref[]; locale: string }) {
  const t = useTranslations('carte')
  const router = useRouter()
  const conteneur = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [satellite, setSatellite] = useState(false)

  const couleurParType = types.map((ty) => [ty.id, ty.couleur ?? '#8A3E1B']).flat()
  const nomType = (ty: Ref) => (locale === 'en' ? ty.nom_en || ty.nom_fr : ty.nom_fr)

  useEffect(() => {
    if (!conteneur.current) return
    const map = new maplibregl.Map({
      container: conteneur.current,
      style: STYLE,
      center: [-5.5, 7.5], // Côte d'Ivoire
      zoom: 6,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      // Fond satellite (masqué par défaut)
      map.addSource('esri', { type: 'raster', tiles: [ESRI], tileSize: 256, attribution: '© Esri' })
      map.addLayer(
        { id: 'satellite', type: 'raster', source: 'esri', layout: { visibility: 'none' } },
        map.getStyle().layers?.[0]?.id,
      )

      // Points publiés (GeoJSON clusterisé)
      map.addSource('patrimoine', {
        type: 'geojson',
        data: '/api/carte/points',
        cluster: true,
        clusterRadius: 50,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'patrimoine',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#B5581F',
          'circle-opacity': 0.85,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 30, 30],
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'patrimoine',
        filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 12 },
        paint: { 'text-color': '#F4EBDD' },
      })
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'patrimoine',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#F4EBDD',
          'circle-color': ['match', ['get', 'type_id'], ...couleurParType, '#8A3E1B'],
        },
      })

      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false })
      map.on('mouseenter', 'points', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = e.features?.[0] as MapGeoJSONFeature | undefined
        if (!f) return
        const props = f.properties as { titre_fr: string; titre_en: string | null; ville: string | null }
        const titre = locale === 'en' ? props.titre_en || props.titre_fr : props.titre_fr
        popup
          .setLngLat((f.geometry as { coordinates: [number, number] }).coordinates)
          .setHTML(`<strong>${titre}</strong>${props.ville ? `<br/>${props.ville}` : ''}`)
          .addTo(map)
      })
      map.on('mouseleave', 'points', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('click', 'points', (e) => {
        const f = e.features?.[0]
        const slug = f?.properties?.slug as string | undefined
        if (slug) router.push(`/patrimoine/${slug}`)
      })
      map.on('click', 'clusters', async (e) => {
        const f = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })[0]
        const src = map.getSource('patrimoine') as maplibregl.GeoJSONSource
        const zoom = await src.getClusterExpansionZoom(f.properties.cluster_id as number)
        map.easeTo({ center: (f.geometry as { coordinates: [number, number] }).coordinates, zoom })
      })
    })

    return () => map.remove()
  }, [couleurParType, locale, router])

  function basculerSatellite() {
    const map = mapRef.current
    if (!map) return
    const visible = !satellite
    map.setLayoutProperty('satellite', 'visibility', visible ? 'visible' : 'none')
    setSatellite(visible)
  }

  return (
    <div className="relative h-[calc(100vh-8rem)] w-full">
      <div ref={conteneur} className="h-full w-full" />

      {/* Bascule Plan / Satellite */}
      <div className="absolute left-3 top-3 flex overflow-hidden rounded-full bg-white shadow">
        <button
          type="button"
          onClick={() => satellite && basculerSatellite()}
          className={`px-4 py-2 text-sm font-semibold ${!satellite ? 'bg-or text-encre' : 'text-brun'}`}
        >
          {t('plan')}
        </button>
        <button
          type="button"
          onClick={() => !satellite && basculerSatellite()}
          className={`px-4 py-2 text-sm font-semibold ${satellite ? 'bg-or text-encre' : 'text-brun'}`}
        >
          {t('satellite')}
        </button>
      </div>

      {/* Légende */}
      <section
        role="region"
        aria-label={t('legende')}
        className="absolute bottom-3 left-3 max-w-xs rounded-2xl bg-white/95 p-4 shadow"
      >
        <h2 className="mb-2 font-serif text-sm text-brun">{t('legende')}</h2>
        <ul className="grid grid-cols-1 gap-1 text-xs">
          {types.map((ty) => (
            <li key={ty.id} data-testid="legende-type" className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: ty.couleur ?? '#8A3E1B' }}
              />
              {nomType(ty)}
            </li>
          ))}
        </ul>
      </section>

      {/* Inset « CI en Afrique » */}
      <div className="absolute right-3 top-16 hidden h-24 w-24 items-center justify-center rounded-lg bg-vert/90 text-[10px] font-semibold text-sable shadow sm:flex">
        CI · Afrique
      </div>
    </div>
  )
}
```

> L'inset est volontairement minimal en v1 (pastille repère). Une mini-carte de localisation continentale et le style « Atlas Terre » finalisé (teintes chaudes personnalisées) sont des raffinements de la Phase 6 (§8/§16).

- [ ] **Step 5: Créer la page carte** — `paaciv/app/[locale]/carte/page.tsx`

```tsx
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteClient } from '@/components/carte/CarteClient'
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

export default async function CartePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('carte')
  const sb = await createServerClient()
  const { data } = await sb.from('types').select('*').order('ordre')
  const types = (data ?? []) as Ref[]

  return (
    <main className="flex-1">
      <Container className="py-6">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
      </Container>
      <CarteClient types={types} locale={locale} />
    </main>
  )
}
```

- [ ] **Step 6: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- carte.spec`
Expected: PASS (titre, bascule, légende avec 7 types)

- [ ] **Step 7: Commit**

```bash
git add paaciv && git commit -m "feat: carte MapLibre (clustering, points par type, plan/satellite, légende, filtres)"
```

---

### Task 10: Auth de test Playwright (session admin réutilisable)

**Files:**
- Modify: `paaciv/playwright.config.ts` (projects `setup` + `e2e`)
- Create: `paaciv/tests/auth.setup.ts`
- Modify: `paaciv/.env.local.example` (ajouter `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD`)

**Interfaces:**
- Produces: fichier d'état de session `paaciv/playwright/.auth/admin.json` (via connexion réelle) réutilisé par les specs admin (`test.use({ storageState })`).

> **Prérequis manuel (une fois) :** créer dans le dashboard Supabase (Authentication → Add user) un utilisateur de test **et** renseigner `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` dans `paaciv/.env.local`. Ce peut être le compte de Dkr. Sans ces variables, le projet `setup` échoue explicitement (message clair).

- [ ] **Step 1: Déclarer les variables d'exemple** — ajouter à `paaciv/.env.local.example`

```
TEST_ADMIN_EMAIL=
TEST_ADMIN_PASSWORD=
```

- [ ] **Step 2: Écrire le setup d'auth** — `paaciv/tests/auth.setup.ts`

```ts
import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const fichier = path.join(__dirname, '..', 'playwright', '.auth', 'admin.json')

setup('authentifier l\'admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const motDePasse = process.env.TEST_ADMIN_PASSWORD
  expect(
    email && motDePasse,
    'Définir TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.local (utilisateur Supabase existant)',
  ).toBeTruthy()

  await page.goto('/fr/login')
  await page.getByLabel('Adresse e-mail').fill(email!)
  await page.getByLabel('Mot de passe').fill(motDePasse!)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/fr\/admin/)

  fs.mkdirSync(path.dirname(fichier), { recursive: true })
  await page.context().storageState({ path: fichier })
})
```

- [ ] **Step 3: Restructurer la config Playwright en projets** — `paaciv/playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'e2e',
      dependencies: ['setup'],
      use: { baseURL: 'http://localhost:3000' },
      testIgnore: /auth\.setup\.ts/,
    },
  ],
})
```

- [ ] **Step 4: Ignorer l'état d'auth dans Git** — ajouter à `paaciv/.gitignore`

```
/playwright/.auth
```

- [ ] **Step 5: Lancer — vérifier que le setup s'authentifie**

Run: `cd paaciv && npm run e2e -- auth.setup`
Expected: PASS (avec `TEST_ADMIN_*` renseignés) — le fichier `playwright/.auth/admin.json` est créé. Sans les variables : échec avec message explicite (attendu).

- [ ] **Step 6: Vérifier la non-régression de la suite publique**

Run: `cd paaciv && npm run e2e`
Expected: PASS (tous les tests publics + setup ; les specs admin arrivent aux Tasks 11–12).

- [ ] **Step 7: Commit**

```bash
git add paaciv && git commit -m "test: session admin réutilisable pour les e2e (storageState Playwright)"
```

---

### Task 11: Admin patrimoine — liste + suppression

**Files:**
- Create: `paaciv/app/[locale]/admin/patrimoine/page.tsx`
- Create: `paaciv/app/[locale]/admin/patrimoine/actions.ts`
- Modify: `paaciv/app/[locale]/admin/page.tsx` (lien vers la gestion patrimoine)
- Modify: `paaciv/i18n/messages/fr.json`, `en.json` (namespace `adminPatrimoine`)
- Create: `paaciv/tests/admin-patrimoine.spec.ts`

**Interfaces:**
- Consumes: `createServerClient()` (session admin), garde `/admin` (Phase 1), session de test (Task 10).
- Produces: `/[locale]/admin/patrimoine` (liste incluant brouillons + badges statut, liens éditer, bouton supprimer) ; Server Action `supprimerPatrimoine(id)`.

- [ ] **Step 1: Ajouter les libellés** — `fr.json` / `en.json`, namespace `adminPatrimoine`

```json
// fr.json
"adminPatrimoine": {
  "titre": "Patrimoine", "nouveau": "Nouveau patrimoine", "editer": "Éditer",
  "supprimer": "Supprimer", "confirmer": "Supprimer définitivement ce patrimoine ?",
  "statut": "Statut", "brouillon": "Brouillon", "publie": "Publié", "aucun": "Aucun patrimoine."
}
```
```json
// en.json
"adminPatrimoine": {
  "titre": "Heritage", "nouveau": "New building", "editer": "Edit",
  "supprimer": "Delete", "confirmer": "Permanently delete this building?",
  "statut": "Status", "brouillon": "Draft", "publie": "Published", "aucun": "No buildings yet."
}
```

- [ ] **Step 2: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/admin-patrimoine.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('la liste admin affiche les patrimoines dont les brouillons', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine')
  await expect(page.getByRole('heading', { name: 'Patrimoine' })).toBeVisible()
  // le brouillon (invisible côté public) est visible en admin
  await expect(page.getByText('Aéroport Félix Houphouët-Boigny')).toBeVisible()
})
```

- [ ] **Step 3: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- admin-patrimoine`
Expected: FAIL (404)

- [ ] **Step 4: Créer les Server Actions** — `paaciv/app/[locale]/admin/patrimoine/actions.ts`

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function supprimerPatrimoine(id: string) {
  const sb = await createServerClient()
  const { error } = await sb.from('patrimoine').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine', 'page')
}
```

- [ ] **Step 5: Créer la page liste** — `paaciv/app/[locale]/admin/patrimoine/page.tsx`

```tsx
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerPatrimoine } from './actions'

export default async function AdminPatrimoineListe() {
  const t = await getTranslations('adminPatrimoine')
  const sb = await createServerClient()
  const { data } = await sb
    .from('patrimoine')
    .select('id, slug, titre_fr, statut, updated_at')
    .order('updated_at', { ascending: false })
  const items = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <Link href="/admin/patrimoine/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-encre/70">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('titre')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-creme2">
                <td className="py-2">{p.titre_fr}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.statut === 'publie' ? 'bg-vert text-sable' : 'bg-creme2 text-encre'
                    }`}
                  >
                    {p.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/patrimoine/${p.id}`} className="text-brun underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerPatrimoine.bind(null, p.id)}>
                    <button className="text-terracotta underline" type="submit">
                      {t('supprimer')}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Lier depuis le tableau de bord** — dans `paaciv/app/[locale]/admin/page.tsx`, ajouter sous le titre :

```tsx
import { Link } from '@/i18n/navigation'
// … dans le JSX, après le paragraphe de bienvenue :
<Link href="/admin/patrimoine" className="text-brun underline">
  {/* réutilise le libellé existant ou ajoute-en un */}
  Gérer le patrimoine
</Link>
```

- [ ] **Step 7: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- admin-patrimoine`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add paaciv && git commit -m "feat(admin): liste patrimoine (brouillons inclus) + suppression"
```

---

### Task 12: Admin patrimoine — formulaire créer/éditer (FR/EN, sélecteurs, point sur carte, brouillon/publier)

**Files:**
- Create: `paaciv/app/[locale]/admin/patrimoine/nouveau/page.tsx`
- Create: `paaciv/app/[locale]/admin/patrimoine/[id]/page.tsx`
- Create: `paaciv/components/admin/FormulairePatrimoine.tsx`
- Modify: `paaciv/app/[locale]/admin/patrimoine/actions.ts` (ajouter `enregistrerPatrimoine`)
- Modify: `paaciv/components/carte/MiniCarte.tsx` (mode « point picker » optionnel)
- Modify: `paaciv/i18n/messages/fr.json`, `en.json` (namespace `formPatrimoine`)
- Modify: `paaciv/tests/admin-patrimoine.spec.ts` (ajouter création + publication)

**Interfaces:**
- Consumes: références (selects), `createServerClient()`, `slugify()`.
- Produces: Server Action `enregistrerPatrimoine(formData): Promise<{ id: string }>` (upsert) ; `<FormulairePatrimoine>` (onglets FR/EN, selects type/programme/district/époque, choix du point via carte cliquable, bascule statut) ; `<MiniCarte … onChoisir?>` (clic pose lat/lng).

- [ ] **Step 1: Ajouter les libellés** — `fr.json` / `en.json`, namespace `formPatrimoine`

```json
// fr.json
"formPatrimoine": {
  "titre_fr": "Titre (FR)", "titre_en": "Titre (EN)", "resume": "Résumé", "description": "Description",
  "type": "Type", "programme": "Programme", "district": "District", "epoque": "Époque",
  "style": "Style", "dateTexte": "Datation (texte)", "anneeDebut": "Année début", "anneeFin": "Année fin",
  "ville": "Ville", "adresse": "Adresse", "statutPatrimonial": "Statut patrimonial",
  "etat": "État de conservation", "video": "Lien vidéo YouTube", "sources": "Sources",
  "point": "Cliquez sur la carte pour situer l'édifice", "coordonnees": "Lat {lat}, Lng {lng}",
  "statut": "Statut", "brouillon": "Brouillon", "publie": "Publié",
  "enregistrer": "Enregistrer", "choisir": "— choisir —", "ongletFr": "Français", "ongletEn": "English"
}
```
```json
// en.json
"formPatrimoine": {
  "titre_fr": "Title (FR)", "titre_en": "Title (EN)", "resume": "Summary", "description": "Description",
  "type": "Type", "programme": "Programme", "district": "District", "epoque": "Era",
  "style": "Style", "dateTexte": "Dating (text)", "anneeDebut": "Start year", "anneeFin": "End year",
  "ville": "City", "adresse": "Address", "statutPatrimonial": "Heritage status",
  "etat": "State of conservation", "video": "YouTube video link", "sources": "Sources",
  "point": "Click the map to locate the building", "coordonnees": "Lat {lat}, Lng {lng}",
  "statut": "Status", "brouillon": "Draft", "publie": "Published",
  "enregistrer": "Save", "choisir": "— choose —", "ongletFr": "French", "ongletEn": "English"
}
```

- [ ] **Step 2: Écrire le test e2e (échoue d'abord)** — ajouter à `paaciv/tests/admin-patrimoine.spec.ts`

```ts
test('créer puis publier un patrimoine le rend visible côté public', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Villa Moderne')
  await page.getByLabel('Ville').fill('Bouaké')
  await page.getByLabel('Année début').fill('1975')
  // choisir le point via champs lat/lng exposés par la carte (fallback saisie)
  await page.getByLabel('lat').fill('7.69')
  await page.getByLabel('lng').fill('-5.03')
  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // visible publiquement dans les archives
  await page.goto('/fr/archives?q=Villa%20Moderne')
  await expect(page.getByRole('link', { name: /Test Villa Moderne/ })).toBeVisible()
})
```

> Nettoyage : ce test crée une ligne réelle. Ajouter en fin de fichier un `test.afterAll` qui supprime via l'API Supabase authentifiée (ou documenter la suppression manuelle). Implémentation du cleanup dans cette étape (voir Step 6).

- [ ] **Step 3: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- admin-patrimoine`
Expected: FAIL (formulaire absent)

- [ ] **Step 4: Étendre `MiniCarte` en sélecteur de point** — `paaciv/components/carte/MiniCarte.tsx` (ajouter prop optionnelle)

```tsx
// Ajouter à la signature :
//   onChoisir?: (lat: number, lng: number) => void
// et dans le useEffect, après la création de la carte :
if (onChoisir) {
  map.on('click', (e) => {
    onChoisir(e.lngLat.lat, e.lngLat.lng)
    marqueur.setLngLat(e.lngLat)
  })
}
// Ajouter onChoisir aux dépendances du useEffect.
```

- [ ] **Step 5: Créer la Server Action d'enregistrement** — ajouter à `paaciv/app/[locale]/admin/patrimoine/actions.ts`

```ts
import { slugify } from '@/lib/slug'

function texteOuNull(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}
function intOuNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : Number.parseInt(s, 10)
}

export async function enregistrerPatrimoine(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) throw new Error('Titre FR requis')

  const slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)

  const valeurs = {
    slug,
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    resume_fr: texteOuNull(formData.get('resume_fr')),
    resume_en: texteOuNull(formData.get('resume_en')),
    description_fr: texteOuNull(formData.get('description_fr')),
    description_en: texteOuNull(formData.get('description_en')),
    type_id: texteOuNull(formData.get('type_id')),
    programme_id: texteOuNull(formData.get('programme_id')),
    district_id: texteOuNull(formData.get('district_id')),
    epoque_id: texteOuNull(formData.get('epoque_id')),
    style_fr: texteOuNull(formData.get('style_fr')),
    style_en: texteOuNull(formData.get('style_en')),
    date_texte: texteOuNull(formData.get('date_texte')),
    annee_debut: intOuNull(formData.get('annee_debut')),
    annee_fin: intOuNull(formData.get('annee_fin')),
    lat: formData.get('lat') ? Number(formData.get('lat')) : null,
    lng: formData.get('lng') ? Number(formData.get('lng')) : null,
    ville: texteOuNull(formData.get('ville')),
    adresse_fr: texteOuNull(formData.get('adresse_fr')),
    adresse_en: texteOuNull(formData.get('adresse_en')),
    statut_patrimonial: texteOuNull(formData.get('statut_patrimonial')),
    etat_conservation: texteOuNull(formData.get('etat_conservation')),
    video_url: texteOuNull(formData.get('video_url')),
    sources_fr: texteOuNull(formData.get('sources_fr')),
    sources_en: texteOuNull(formData.get('sources_en')),
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('patrimoine').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('patrimoine').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }
  revalidatePath('/[locale]/admin/patrimoine', 'page')
  return { id: resultId }
}
```

- [ ] **Step 6: Créer le composant formulaire** — `paaciv/components/admin/FormulairePatrimoine.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { enregistrerPatrimoine } from '@/app/[locale]/admin/patrimoine/actions'
import type { PatrimoineDetail, Ref } from '@/lib/data/patrimoine'

type Options = { types: Ref[]; programmes: Ref[]; districts: Ref[]; epoques: Ref[] }

export function FormulairePatrimoine({
  options,
  initial,
  locale,
}: {
  options: Options
  initial?: Partial<PatrimoineDetail> | null
  locale: string
}) {
  const t = useTranslations('formPatrimoine')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [lat, setLat] = useState<number | ''>(initial?.lat ?? '')
  const [lng, setLng] = useState<number | ''>(initial?.lng ?? '')
  const [enCours, setEnCours] = useState(false)

  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    const fd = new FormData(e.currentTarget)
    try {
      const { id } = await enregistrerPatrimoine(fd)
      router.push(`/admin/patrimoine/${id}`)
      router.refresh()
    } finally {
      setEnCours(false)
    }
  }

  const champ = (name: string, label: string, type = 'text') => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={(initial as Record<string, unknown> | undefined)?.[name] as string | undefined ?? ''}
        className="rounded-xl border border-encre/20 bg-white px-3 py-2"
      />
    </label>
  )

  const selectRef = (name: string, label: string, refs: Ref[], val?: string | null) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <select name={name} defaultValue={val ?? ''} className="rounded-xl border border-encre/20 bg-white px-3 py-2">
        <option value="">{t('choisir')}</option>
        {refs.map((r) => (
          <option key={r.id} value={r.id}>
            {nom(r)}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      {/* Onglets FR / EN */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setOnglet('fr')} className={onglet === 'fr' ? 'font-bold text-brun' : 'text-encre/60'}>
          {t('ongletFr')}
        </button>
        <button type="button" onClick={() => setOnglet('en')} className={onglet === 'en' ? 'font-bold text-brun' : 'text-encre/60'}>
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4 sm:grid-cols-2' : 'hidden'}>
        {champ('titre_fr', t('titre_fr'))}
        {champ('resume_fr', t('resume'))}
        {champ('description_fr', t('description'))}
        {champ('style_fr', t('style'))}
        {champ('adresse_fr', t('adresse'))}
        {champ('sources_fr', t('sources'))}
      </div>
      <div className={onglet === 'en' ? 'grid gap-4 sm:grid-cols-2' : 'hidden'}>
        {champ('titre_en', t('titre_en'))}
        {champ('resume_en', t('resume'))}
        {champ('description_en', t('description'))}
        {champ('style_en', t('style'))}
        {champ('adresse_en', t('adresse'))}
        {champ('sources_en', t('sources'))}
      </div>

      {/* Classement */}
      <div className="grid gap-4 sm:grid-cols-4">
        {selectRef('type_id', t('type'), options.types, initial?.type_id)}
        {selectRef('programme_id', t('programme'), options.programmes, initial?.programme_id)}
        {selectRef('district_id', t('district'), options.districts, initial?.district_id)}
        {selectRef('epoque_id', t('epoque'), options.epoques, initial?.epoque_id)}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {champ('date_texte', t('dateTexte'))}
        {champ('annee_debut', t('anneeDebut'), 'number')}
        {champ('annee_fin', t('anneeFin'), 'number')}
        {champ('ville', t('ville'))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {champ('statut_patrimonial', t('statutPatrimonial'))}
        {champ('etat_conservation', t('etat'))}
        {champ('video_url', t('video'))}
      </div>

      {/* Localisation : carte cliquable + champs lat/lng liés */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">{t('point')}</p>
        <MiniCarte
          lat={typeof lat === 'number' ? lat : 7.5}
          lng={typeof lng === 'number' ? lng : -5.5}
          onChoisir={(la, ln) => {
            setLat(Number(la.toFixed(6)))
            setLng(Number(ln.toFixed(6)))
          }}
        />
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            lat
            <input name="lat" aria-label="lat" value={lat} onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 rounded border border-encre/20 px-2 py-1" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            lng
            <input name="lng" aria-label="lng" value={lng} onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))} className="w-32 rounded border border-encre/20 px-2 py-1" />
          </label>
        </div>
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('statut')}</span>
        <select name="statut" defaultValue={initial?.statut_patrimonial ? undefined : 'brouillon'} aria-label={t('statut')} className="w-48 rounded-xl border border-encre/20 bg-white px-3 py-2">
          <option value="brouillon">{t('brouillon')}</option>
          <option value="publie">{t('publie')}</option>
        </select>
      </label>

      <Button type="submit" variant="gold" disabled={enCours}>
        {t('enregistrer')}
      </Button>
    </form>
  )
}
```

> Le `select` de statut doit refléter la valeur existante en édition. Corriger `defaultValue` en `initial?.statut ?? 'brouillon'` (la propriété `statut` existe sur la ligne complète chargée en édition — voir Step 8). Le champ lat/lng « aria-label » sert de saisie de secours testable quand WebGL n'est pas cliquable en headless.

- [ ] **Step 7: Créer la page « nouveau »** — `paaciv/app/[locale]/admin/patrimoine/nouveau/page.tsx`

```tsx
import { FormulairePatrimoine } from '@/components/admin/FormulairePatrimoine'
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

async function options() {
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

export default async function NouveauPatrimoine({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const opts = await options()
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">Nouveau patrimoine</h1>
      <FormulairePatrimoine options={opts} locale={locale} />
    </div>
  )
}
```

- [ ] **Step 8: Créer la page « éditer »** — `paaciv/app/[locale]/admin/patrimoine/[id]/page.tsx`

```tsx
import { notFound } from 'next/navigation'
import { FormulairePatrimoine } from '@/components/admin/FormulairePatrimoine'
import { GestionImages } from '@/components/admin/GestionImages'
import { createServerClient } from '@/lib/supabase/server'
import type { PatrimoineDetail, Ref } from '@/lib/data/patrimoine'

export default async function EditerPatrimoine({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const sb = await createServerClient()
  const [{ data: p }, types, programmes, districts, epoques] = await Promise.all([
    sb.from('patrimoine').select('*, images(*)').eq('id', id).maybeSingle(),
    sb.from('types').select('*').order('ordre'),
    sb.from('programmes').select('*').order('ordre'),
    sb.from('districts').select('*').order('ordre'),
    sb.from('epoques').select('*').order('ordre'),
  ])
  if (!p) notFound()

  const opts = {
    types: (types.data ?? []) as Ref[],
    programmes: (programmes.data ?? []) as Ref[],
    districts: (districts.data ?? []) as Ref[],
    epoques: (epoques.data ?? []) as Ref[],
  }

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl text-brun">{(p as PatrimoineDetail).titre_fr}</h1>
      <FormulairePatrimoine options={opts} initial={p as PatrimoineDetail} locale={locale} />
      <GestionImages patrimoineId={id} images={(p as PatrimoineDetail).images ?? []} locale={locale} />
    </div>
  )
}
```

> `GestionImages` est livré à la Task 13. Pour que cette page compile avant la Task 13, créer d'abord un composant `GestionImages` **stub** minimal (`export function GestionImages() { return null }`) et le remplacer à la Task 13 — OU réordonner en implémentant la Task 13 avant l'import. Choix retenu : créer le stub dans cette étape (il est remplacé intégralement à la Task 13).

- [ ] **Step 9: Corriger le `defaultValue` du statut** dans `FormulairePatrimoine.tsx` : remplacer la ligne du `<select name="statut">` par `defaultValue={(initial as { statut?: string } | undefined)?.statut ?? 'brouillon'}`.

- [ ] **Step 10: Créer le stub `GestionImages`** — `paaciv/components/admin/GestionImages.tsx`

```tsx
export function GestionImages(_: { patrimoineId: string; images: unknown[]; locale: string }) {
  return null
}
```

- [ ] **Step 11: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- admin-patrimoine`
Expected: PASS (liste + création + publication → visible dans les archives)

- [ ] **Step 12: Commit**

```bash
git add paaciv && git commit -m "feat(admin): formulaire patrimoine (FR/EN, sélecteurs, point carte, brouillon/publier)"
```

---

### Task 13: Admin patrimoine — gestion des images (upload multi, ordre, principale, légende, crédit)

**Files:**
- Replace: `paaciv/components/admin/GestionImages.tsx` (remplace le stub de la Task 12)
- Modify: `paaciv/app/[locale]/admin/patrimoine/actions.ts` (ajouter `ajouterImage`, `supprimerImage`, `definirPrincipale`)
- Modify: `paaciv/i18n/messages/fr.json`, `en.json` (namespace `adminImages`)
- Create: `paaciv/tests/admin-images.spec.ts`

**Interfaces:**
- Consumes: bucket `patrimoine` (Task 3), session admin (Task 10), un patrimoine existant.
- Produces: Server Actions `ajouterImage(formData)`, `supprimerImage(id)`, `definirPrincipale(patrimoineId, imageId)` ; composant `<GestionImages>` (upload multi-fichiers + métadonnées).

- [ ] **Step 1: Ajouter les libellés** — `fr.json` / `en.json`, namespace `adminImages`

```json
// fr.json
"adminImages": {
  "titre": "Images", "ajouter": "Ajouter des images", "credit": "Crédit / source",
  "legende": "Légende", "principale": "Image principale", "definirPrincipale": "Définir comme principale",
  "supprimer": "Supprimer", "aucune": "Aucune image."
}
```
```json
// en.json
"adminImages": {
  "titre": "Images", "ajouter": "Add images", "credit": "Credit / source",
  "legende": "Caption", "principale": "Main image", "definirPrincipale": "Set as main",
  "supprimer": "Delete", "aucune": "No images."
}
```

- [ ] **Step 2: Écrire le test e2e (échoue d'abord)** — `paaciv/tests/admin-images.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import path from 'node:path'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('téléverser une image sur un patrimoine existant', async ({ page }) => {
  // ouvre l'édition de la Basilique (récupère son id via la liste)
  await page.goto('/fr/admin/patrimoine')
  await page.getByText('Basilique Notre-Dame de la Paix').click()
  await page.waitForURL(/\/admin\/patrimoine\/[0-9a-f-]{36}/)

  const fichier = path.join(__dirname, 'fixtures', 'exemple.jpg')
  await page.getByLabel('Ajouter des images').setInputFiles(fichier)
  await page.getByRole('button', { name: 'Ajouter des images' }).click()

  // une vignette de plus apparaît
  await expect(page.getByTestId('vignette-image').first()).toBeVisible()
})
```

> Créer une petite image de test `paaciv/tests/fixtures/exemple.jpg` (quelques Ko) dans cette étape.

- [ ] **Step 3: Lancer — vérifier l'échec**

Run: `cd paaciv && npm run e2e -- admin-images`
Expected: FAIL (le stub `GestionImages` ne rend rien)

- [ ] **Step 4: Ajouter les Server Actions images** — dans `paaciv/app/[locale]/admin/patrimoine/actions.ts`

```ts
export async function ajouterImage(formData: FormData): Promise<void> {
  const sb = await createServerClient()
  const patrimoineId = formData.get('patrimoine_id')!.toString()
  const credit = texteOuNull(formData.get('credit'))
  const legende_fr = texteOuNull(formData.get('legende_fr'))
  const fichiers = formData.getAll('fichiers').filter((f): f is File => f instanceof File && f.size > 0)

  // ordre de départ = nb d'images existantes
  const { count } = await sb
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('patrimoine_id', patrimoineId)
  let ordre = count ?? 0

  for (const fichier of fichiers) {
    const ext = fichier.name.split('.').pop() ?? 'jpg'
    const chemin = `${patrimoineId}/${ordre}-${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, fichier, {
      contentType: fichier.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) throw upErr
    const { error } = await sb.from('images').insert({
      patrimoine_id: patrimoineId,
      chemin,
      credit,
      legende_fr,
      ordre,
      est_principale: ordre === 0 && (count ?? 0) === 0,
    })
    if (error) throw error
    ordre += 1
  }
  revalidatePath('/[locale]/admin/patrimoine/[id]', 'page')
}

export async function supprimerImage(id: string): Promise<void> {
  const sb = await createServerClient()
  const { data: img } = await sb.from('images').select('chemin').eq('id', id).maybeSingle()
  if (img && !/^https?:\/\//i.test(img.chemin)) {
    await sb.storage.from('patrimoine').remove([img.chemin])
  }
  const { error } = await sb.from('images').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine/[id]', 'page')
}

export async function definirPrincipale(patrimoineId: string, imageId: string): Promise<void> {
  const sb = await createServerClient()
  await sb.from('images').update({ est_principale: false }).eq('patrimoine_id', patrimoineId)
  const { error } = await sb.from('images').update({ est_principale: true }).eq('id', imageId)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine/[id]', 'page')
}
```

- [ ] **Step 5: Remplacer le stub par le vrai composant** — `paaciv/components/admin/GestionImages.tsx`

```tsx
import { getTranslations } from 'next-intl/server'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'
import { ajouterImage, supprimerImage, definirPrincipale } from '@/app/[locale]/admin/patrimoine/actions'

export async function GestionImages({
  patrimoineId,
  images,
  locale,
}: {
  patrimoineId: string
  images: ImageRow[]
  locale: string
}) {
  const t = await getTranslations('adminImages')
  const triees = [...images].sort((a, b) => a.ordre - b.ordre)

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-brun">{t('titre')}</h2>

      <form action={ajouterImage} className="flex flex-wrap items-end gap-3 rounded-2xl bg-creme2/50 p-4">
        <input type="hidden" name="patrimoine_id" value={patrimoineId} />
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('ajouter')}</span>
          <input name="fichiers" aria-label={t('ajouter')} type="file" accept="image/*" multiple />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('legende')}</span>
          <input name="legende_fr" className="rounded border border-encre/20 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('credit')}</span>
          <input name="credit" className="rounded border border-encre/20 px-2 py-1" />
        </label>
        <button type="submit" className="rounded-full bg-or px-4 py-2 text-sm font-semibold text-encre">
          {t('ajouter')}
        </button>
      </form>

      {triees.length === 0 ? (
        <p className="text-encre/70">{t('aucune')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {triees.map((img) => (
            <li key={img.id} data-testid="vignette-image" className="space-y-2 rounded-xl bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(img.chemin)} alt={champ(img.legende_fr, img.legende_en, locale)} className="aspect-square w-full rounded object-cover" />
              {img.est_principale && <span className="text-xs font-semibold text-vert">{t('principale')}</span>}
              <div className="flex justify-between text-xs">
                {!img.est_principale && (
                  <form action={definirPrincipale.bind(null, patrimoineId, img.id)}>
                    <button className="text-brun underline" type="submit">{t('definirPrincipale')}</button>
                  </form>
                )}
                <form action={supprimerImage.bind(null, img.id)}>
                  <button className="text-terracotta underline" type="submit">{t('supprimer')}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
```

- [ ] **Step 6: Lancer — vérifier le succès**

Run: `cd paaciv && npm run e2e -- admin-images`
Expected: PASS (upload → vignette visible)

- [ ] **Step 7: Lancer toute la suite**

Run: `cd paaciv && npm run test && npm run e2e`
Expected: tout PASS (unitaires + e2e publics + admin)

- [ ] **Step 8: Vérifier le build de production**

Run: `cd paaciv && npm run build`
Expected: compilation + TypeScript OK

- [ ] **Step 9: Commit**

```bash
git add paaciv && git commit -m "feat(admin): gestion des images patrimoine (upload multi, principale, légende, crédit)"
```

---

## Auto-revue (Phase 2)

- **Couverture spec ↔ tâches :**
  - §8 Carte MapLibre (style, clustering, marqueurs par type, satellite, légende, filtres, survol, clic→fiche, GeoJSON léger) → **T6 + T9** *(style « Atlas Terre » finalisé et inset continental détaillé = Phase 6, noté)*.
  - §9 Fiche patrimoine (galerie + crédits, badges, datation, style, localisation mini-carte, vidéo, sources, OpenGraph) → **T8**.
  - §10 Modèle de données `patrimoine` + `images` (+ trigger geom) → **T1** ; RLS §16 → **T2** ; Storage §15 → **T3** ; seed §15 → **T4**.
  - « Nos archives » (catalogue filtrable type/programme/district/époque + recherche) §6 → **T7**.
  - §14 Admin patrimoine (liste, formulaire FR/EN, sélecteurs, point sur carte, brouillon/publier, upload multi-images ordre/principale/légende/crédit) → **T11 + T12 + T13** ; auth §14 → **T10**.
- **Hors périmètre (volontaire, phases 3–5) :** architectes + `patrimoine_architecte`, articles/reportages/événements, newsletter, missions/équipe/`contenu_site`, blocs d'accueil, SEO avancé/sitemap/hreflang (§17, Phase 6). La fiche réserve l'emplacement « architectes » pour la Phase 3.
- **Placeholders :** aucun « TODO » d'implémentation ; les stubs explicites (`GestionImages` en T12) sont remplacés dans la même phase (T13) — signalé.
- **Cohérence des types :** `FiltresPatrimoine`, `Ref`, `ImageRow`, `PatrimoineListItem`, `PatrimoineDetail`, `PointPublie` définis en **T5** et réutilisés tels quels par T6/T7/T8/T11/T12/T13. Helpers `champ`/`imageUrl`/`slugify` (**T1**) consommés partout. Server Actions (`enregistrerPatrimoine`, `supprimerPatrimoine`, `ajouterImage`, `supprimerImage`, `definirPrincipale`) toutes dans `admin/patrimoine/actions.ts`.
- **Dépendances entre tâches :** T1→T2→T3→T4 (schéma → RLS → storage → seed) ; T5 dépend de T4 (données) ; T6/T7/T8/T9 dépendent de T5 ; T10 (auth de test) précède T11–T13 ; T12 crée un stub que T13 remplace.

## Points de vigilance (à valider en exécution)

1. **MapLibre en headless.** Les e2e carte (T9) et images (T13) n'exigent pas le rendu WebGL : ils s'appuient sur le DOM (légende, boutons) et sur les champs lat/lng de secours. Si Chromium headless échoue à créer un contexte WebGL, cela n'invalide pas ces tests. Le rendu réel se vérifie via `/run`.
2. **Session admin de test (T10).** Nécessite un utilisateur Supabase réel + `TEST_ADMIN_*` dans `.env.local`. À défaut, les specs admin ne peuvent pas tourner — créer l'utilisateur (dashboard) avant d'exécuter T11+.
3. **Tests qui écrivent en base (T12/T13).** Ils créent des lignes/objets réels sur le projet Supabase. Prévoir le cleanup (afterAll) ou une convention de préfixe « Test … » supprimable. Idéalement, exécuter sur une **branche Supabase** de préversion (MCP `create_branch`) plutôt que sur la prod.
4. **`next/image` vs `<img>`.** On sert des URLs externes de placeholders → `<img>` en Phase 2. Migrer vers `next/image` + `remotePatterns` (perf/§17) en Phase 6.

## Handoff — phases suivantes
À l'issue de la Phase 2 (carte + archives + fiches + admin patrimoine au vert), écrire le **Plan 3 — Architectes** (tables `architectes` + `patrimoine_architecte`, pages `/architectes` avec frise chronologique + fiches, liaison N–N dans l'admin patrimoine, remplissage de l'emplacement « architectes » de la fiche), qui consomme le socle patrimoine posé ici.
```
