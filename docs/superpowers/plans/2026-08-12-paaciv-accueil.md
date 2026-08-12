# Page d'accueil PAACIV — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transposer le design de landing page fourni en une page d'accueil Next.js bilingue, visuellement identique à la référence, dont chaque bouton mène à une vraie route ou ouvre un vrai formulaire branché sur Supabase.

**Architecture:** Un socle de tokens CSS en oklch pilotés par `data-theme` remplace le thème Tailwind statique, ce qui permet au mode sombre de basculer sans recompilation. Seize blocs deviennent autant de composants sous `components/accueil/`, majoritairement des Server Components qui lisent Supabase, animés par un unique client component (`Revelations`) qui pose un `IntersectionObserver` sur toute la page. Six nouvelles tables portent les contenus éditables et la collecte (newsletter, demandes de soutien).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, next-intl, Supabase (Postgres + RLS + Storage), MapLibre GL, Vitest, Playwright.

## Global Constraints

- **Spec de référence :** `docs/superpowers/specs/2026-08-12-paaciv-accueil-design.md`. En cas de contradiction avec ce plan, la spec fait foi.
- **Référence visuelle :** `docs/design-ref/Accueil PAACIV.dc.html`. C'est la source de vérité pour la composition, les espacements et les animations. Prévisualisation : `node "docs/design-ref/server.cjs"` puis `http://localhost:4599`.
- **Next.js 16 :** lire `node_modules/next/dist/docs/` avant d'écrire du code Next. Les API diffèrent des versions antérieures. `params` est une `Promise` et doit être `await`é.
- **Port de dev :** 3100 (`npm run dev`). Jamais 3000.
- **Répertoire de travail :** toutes les commandes s'exécutent depuis `C:\Projets\PAACIV\paaciv`.
- **Langue du code :** identifiants, noms de fichiers, commentaires et messages de commit en français, comme tout le projet existant.
- **Bilingue :** toute colonne de texte visible existe en paire `*_fr` / `*_en`. FR requis, EN facultatif avec repli sur FR via `champ()` de `lib/i18n-champ.ts`.
- **Aucun jaune.** Le token `--gold` du design est renommé `--accent` et vaut Ocre brûlé `#CE7A33`. Vérification : `grep -rn -- "--gold" app components lib` doit ne rien renvoyer, et aucun fichier créé par ce plan ne doit référencer la couleur `or` / `#D9A441`.

  > Le variant `variant="gold"` de `components/ui/Button.tsx` est **hors périmètre** : il date de la Phase 1, désigne la couleur Tailwind `or` et non le token du design, et il est utilisé dans dix fichiers d'admin livrés. Le renommer ici polluerait le diff de la Task 1 sans rien apporter. Son sort — comme celui de la couleur `--or` elle-même — est arbitré à l'étape 2.
- **Aucune couleur Tailwind existante n'est modifiée ni supprimée.** `terracotta`, `brun`, `or`, `vert`, `sable`, `creme2`, `encre` restent déclarées telles quelles : les pages livrées en phases 1 à 4 en dépendent et ne doivent pas bouger.
- **Erreurs attendues en valeur de retour**, jamais en exception — convention établie en Phase 4 (commit `033dec0`). Les erreurs inattendues restent des exceptions.
- **`export const dynamic = 'force-dynamic'`** sur toute page qui lit Supabase et n'a pas de segment dynamique. Sans ce flag, Next la prérend au build et le contenu publié ensuite n'apparaît jamais.
- **Commandes de vérification :** `npm run lint` · `npx tsc --noEmit` · `npm test` · `npm run e2e`. Le lint ne fait pas de vérification de types : les deux sont nécessaires.
- **Commits fréquents**, un par tâche minimum, message en français au format conventionnel.

---

## Structure des fichiers

**Socle visuel**
| Fichier | Responsabilité |
|---|---|
| `app/globals.css` | tokens oklch clair/sombre, keyframes, règles d'animation |
| `components/ScriptTheme.tsx` | script inline anti-flash, applique `data-theme` avant le premier rendu |
| `components/ui/BasculeTheme.tsx` | bouton de bascule clair/sombre |
| `components/ui/Revelations.tsx` | `IntersectionObserver` de page, barre de progression, parallaxe, compteurs |
| `components/ui/Grain.tsx` | voile de grain fixe |
| `components/ui/Modal.tsx` | `<dialog>` accessible réutilisable |

**Navigation**
| Fichier | Responsabilité |
|---|---|
| `components/SiteHeader.tsx` | *modifié* — header fixe translucide, 6 entrées, bouton Adhérer |
| `components/MenuMobile.tsx` | panneau plein écran sous 900 px |
| `components/SiteFooter.tsx` | *modifié* — 4 colonnes du design |

**Blocs de la page** — tous sous `components/accueil/`
| Fichier | Client ? |
|---|---|
| `Hero.tsx` | ✅ |
| `CarteFilm.tsx` | ❌ |
| `BandeauVilles.tsx` | ❌ |
| `Association.tsx` | ❌ |
| `Compteurs.tsx` | ❌ (animé par `Revelations`) |
| `NotreTravail.tsx` | ❌ |
| `PourquoiNousSuivre.tsx` | ❌ |
| `Activites.tsx` | ✅ |
| `ApercuCarte.tsx` | ✅ |
| `CinqRaisons.tsx` | ❌ |
| `Agenda.tsx` | ❌ |
| `AppelArchives.tsx` | ✅ |
| `GrilleArchive.tsx` | ✅ |
| `Temoignages.tsx` | ✅ |
| `Journal.tsx` | ✅ |
| `Newsletter.tsx` | ✅ |

**Soutien** — `components/soutenir/`
`FormulaireSoutien.tsx` (formulaire partagé aux trois types) · `ContexteSoutien.tsx` (fournisseur + les trois modales, montées une seule fois en haut de page)

**Données**
`lib/data/accueil.ts` · `lib/data/contenu-site.ts` · `app/[locale]/actions/newsletter.ts` · `app/[locale]/actions/soutien.ts`

**Base**
`supabase/migrations/0016_accueil.sql` · `supabase/migrations/0017_accueil_seed.sql`

**Admin** — `app/[locale]/admin/{contenu,points-cles,activites,temoignages,abonnes,demandes}/`

---

### Task 1 : Socle de tokens et mode sombre

**Files:**
- Modify: `app/globals.css` (fichier entier, 15 lignes)
- Create: `components/ScriptTheme.tsx`
- Create: `components/ui/BasculeTheme.tsx`
- Modify: `app/[locale]/layout.tsx:44-58`
- Test: `tests/theme.spec.ts`

**Interfaces:**
- Consumes: rien.
- Produces: les tokens CSS `--bg --bg2 --bg3 --ink --soft --line --terra --ocre --accent --vert --deep --onDeep --veil --imgf`, utilisables en Tailwind sous `bg-fond`, `text-encre-t`, `border-filet`, etc. (voir mapping ci-dessous). Composants `<ScriptTheme />` et `<BasculeTheme />`.

- [ ] **Step 1 : Écrire le test e2e qui échoue**

Créer `tests/theme.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

test('le site s’ouvre en mode sombre par défaut', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
})

test('la bascule passe en clair et la préférence survit au rechargement', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('button', { name: /thème|theme/i }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx playwright test tests/theme.spec.ts --project=e2e`
Expected: FAIL — `data-theme` absent, bouton introuvable.

- [ ] **Step 3 : Réécrire `app/globals.css`**

Remplacer intégralement le contenu par :

```css
@import "tailwindcss";

/* Le mode sombre du projet est piloté par un attribut sur <html>, pas par la
   media query système : le site s'ouvre en sombre quelle que soit la
   préférence de l'OS, et la bascule doit gagner dans les deux sens. */
@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

:root {
  --bg:     oklch(0.943 0.021 79);
  --bg2:    oklch(0.907 0.029 83);
  --bg3:    oklch(0.868 0.034 81);
  --ink:    oklch(0.263 0.012 45);
  --soft:   oklch(0.470 0.030 50);
  --line:   oklch(0.840 0.025 78);
  --terra:  oklch(0.566 0.138 48);
  --ocre:   oklch(0.458 0.114 43);
  --accent: oklch(0.642 0.129 53);
  --vert:   oklch(0.459 0.061 139);
  --deep:   oklch(0.190 0.012 45);
  --onDeep: oklch(0.943 0.021 79);
  --veil:   linear-gradient(180deg, oklch(0.19 0.012 45/.28), oklch(0.16 0.012 45/.72));
  --imgf:   saturate(1.02) contrast(1.02);
}

[data-theme="dark"] {
  --bg:     oklch(0.148 0.014 45);
  --bg2:    oklch(0.196 0.020 47);
  --bg3:    oklch(0.245 0.024 49);
  --ink:    oklch(0.945 0.020 82);
  --soft:   oklch(0.735 0.028 70);
  --line:   oklch(0.305 0.028 50);
  --terra:  oklch(0.680 0.150 48);
  --ocre:   oklch(0.600 0.130 45);
  --accent: oklch(0.730 0.140 53);
  --vert:   oklch(0.657 0.065 138);
  --deep:   oklch(0.115 0.012 45);
  --onDeep: oklch(0.943 0.021 79);
  --veil:   linear-gradient(180deg, oklch(0.12 0.012 45/.42), oklch(0.10 0.012 45/.86));
  --imgf:   saturate(.92) contrast(1.08) brightness(.86);
}

/* `@theme inline` fait pointer les utilitaires générés vers var(--x) au lieu
   d'y copier la valeur : c'est ce qui permet à [data-theme] de rebasculer les
   couleurs à l'exécution, sans recompiler le CSS. */
@theme inline {
  --color-fond:    var(--bg);
  --color-fond2:   var(--bg2);
  --color-fond3:   var(--bg3);
  --color-encre-t: var(--ink);
  --color-doux:    var(--soft);
  --color-filet:   var(--line);
  --color-terra:   var(--terra);
  --color-ocre:    var(--ocre);
  --color-accent:  var(--accent);
  --color-foret:   var(--vert);
  --color-profond: var(--deep);
  --color-surprofond: var(--onDeep);
}

/* Palette « Terre & Ocre » des phases 1 à 4. Conservée à l'identique : les
   pages livrées s'en servent plus de cent fois et ne bougent pas avant
   l'étape 2 (propagation de la nouvelle identité au reste du site). */
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

html { scroll-behavior: smooth; background-color: var(--bg); }
body {
  background-color: var(--bg);
  color: var(--ink);
  transition: background-color .7s ease, color .7s ease;
}
img { display: block; }
::selection { background: var(--accent); color: oklch(0.15 0.012 45); }

/* Révélations au scroll : l'état de départ est posé en CSS, la classe .rv-in
   est ajoutée par components/ui/Revelations.tsx à l'entrée dans le viewport. */
[data-rv] {
  opacity: 0;
  transform: translateY(34px);
  filter: blur(10px);
  transition: opacity 1s cubic-bezier(.16,1,.3,1),
              transform 1.15s cubic-bezier(.16,1,.3,1),
              filter 1s ease;
}
[data-rv].rv-in { opacity: 1; transform: none; filter: none; }
[data-clip] { clip-path: inset(0 0 100% 0); transition: clip-path 1.4s cubic-bezier(.16,1,.3,1); }
[data-clip].rv-in { clip-path: inset(0 0 0 0); }
[data-line] { transform: scaleX(0); transform-origin: left; transition: transform 1.2s cubic-bezier(.16,1,.3,1); }
[data-line].rv-in { transform: scaleX(1); }

@keyframes mq     { to { transform: translate3d(-50%,0,0) } }
@keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-14px) } }
@keyframes sweep  { 0% { transform: translateX(-120%) skewX(-12deg) } 100% { transform: translateX(320%) skewX(-12deg) } }
@keyframes pulse  { 0% { transform: scale(1); opacity:.55 } 70% { transform: scale(2.1); opacity:0 } 100% { opacity:0 } }
@keyframes drop   { 0% { opacity:0; transform: translateY(26px) } 100% { opacity:1; transform:none } }
@keyframes spin   { to { transform: rotate(360deg) } }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  [data-rv], [data-clip], [data-line] { opacity: 1; transform: none; filter: none; clip-path: none; transition: none; }
  [data-mq], [data-floaty] { animation: none !important; }
}
```

- [ ] **Step 4 : Créer `components/ScriptTheme.tsx`**

```tsx
// Applique le thème mémorisé AVANT le premier rendu. Sans ce script inline,
// le document part en clair puis bascule en sombre à l'hydratation : un flash
// blanc plein écran très visible sur une page dont le hero est sombre.
export function ScriptTheme() {
  const code = `(function(){try{var t=localStorage.getItem('paaciv-theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark')}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
```

- [ ] **Step 5 : Créer `components/ui/BasculeTheme.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

export function BasculeTheme({ className }: { className?: string }) {
  const t = useTranslations('theme')
  const [sombre, setSombre] = useState(true)

  // L'attribut est déjà posé par ScriptTheme au chargement : on se contente
  // de lire l'état réel du document pour synchroniser le bouton, sans jamais
  // réécrire l'attribut au montage (ce qui écraserait la préférence).
  useEffect(() => {
    setSombre(document.documentElement.getAttribute('data-theme') !== 'light')
  }, [])

  function basculer() {
    const suivant = sombre ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', suivant)
    try {
      localStorage.setItem('paaciv-theme', suivant)
    } catch {
      // Navigation privée ou stockage plein : la bascule reste effective pour
      // la session, seule la mémorisation est perdue.
    }
    setSombre(!sombre)
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-label={t('basculer')}
      aria-pressed={sombre}
      className={className}
    >
      <span
        aria-hidden="true"
        className="block h-4 w-4 rounded-full border border-current"
        style={{ boxShadow: sombre ? 'inset -4px -3px 0 0 currentColor' : 'none' }}
      />
    </button>
  )
}
```

- [ ] **Step 6 : Brancher dans le layout**

Dans `app/[locale]/layout.tsx`, importer `ScriptTheme` et l'insérer dans un `<head>` ajouté au `<html>` :

```tsx
  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ScriptTheme />
      </head>
      <body className="min-h-full flex flex-col font-sans">
```

> `suppressHydrationWarning` est nécessaire : `ScriptTheme` modifie `data-theme` avant l'hydratation, donc le HTML rendu par le serveur et celui présent dans le DOM diffèrent volontairement sur cet attribut.

- [ ] **Step 7 : Ajouter les traductions**

Dans `i18n/messages/fr.json`, ajouter à la racine :

```json
"theme": { "basculer": "Changer de thème" },
```

Dans `i18n/messages/en.json`, à la racine :

```json
"theme": { "basculer": "Toggle theme" },
```

- [ ] **Step 8 : Poser temporairement la bascule dans le header**

Dans `components/SiteHeader.tsx`, importer `BasculeTheme` et l'ajouter dans le `<div className="flex items-center gap-3">`, avant `<LanguageSwitcher />` :

```tsx
<BasculeTheme className="rounded-full p-2 text-brun transition hover:bg-creme2" />
```

> Le header est entièrement refait en Task 7. Cette insertion sert uniquement à rendre la Task 1 testable de façon autonome.

- [ ] **Step 9 : Lancer le test**

Run: `npx playwright test tests/theme.spec.ts --project=e2e`
Expected: PASS (2 tests).

- [ ] **Step 10 : Vérifier l'absence de jaune et la santé du projet**

Run: `grep -ri "gold" app components ; npm run lint ; npx tsc --noEmit`
Expected: le `grep` ne renvoie rien, le lint et le type-check passent.

- [ ] **Step 11 : Commit**

```bash
git add app/globals.css components/ScriptTheme.tsx components/ui/BasculeTheme.tsx app/[locale]/layout.tsx components/SiteHeader.tsx i18n/messages tests/theme.spec.ts
git commit -m "feat(accueil): socle de tokens oklch et mode sombre par défaut"
```

---

### Task 2 : Moteur d'animations, grain et barre de progression

**Files:**
- Create: `components/ui/Revelations.tsx`
- Create: `components/ui/Grain.tsx`
- Modify: `app/[locale]/layout.tsx`
- Test: `components/ui/__tests__/compteur.test.ts`
- Create: `lib/compteur.ts`

**Interfaces:**
- Consumes: les règles `[data-rv]`, `[data-clip]`, `[data-line]` et les keyframes de la Task 1.
- Produces: `<Revelations />` et `<Grain />` à monter dans le layout. Attributs utilisables par tous les blocs : `data-rv`, `data-clip`, `data-line`, `data-d="<ms>"`, `data-count="<nombre>"`, `data-par="<facteur>"`. Fonction `paliersCompteur(cible: number, etapes: number): number[]`.

- [ ] **Step 1 : Écrire le test unitaire qui échoue**

Créer `components/ui/__tests__/compteur.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { paliersCompteur } from '@/lib/compteur'

describe('paliersCompteur', () => {
  it('part de 0 et finit exactement sur la cible', () => {
    const p = paliersCompteur(1240, 40)
    expect(p[0]).toBe(0)
    expect(p[p.length - 1]).toBe(1240)
    expect(p).toHaveLength(41)
  })

  it('ne renvoie que des entiers croissants', () => {
    const p = paliersCompteur(37, 20)
    expect(p.every(Number.isInteger)).toBe(true)
    expect(p.every((v, i) => i === 0 || v >= p[i - 1])).toBe(true)
  })

  it('gère une cible de 0 sans diviser par zéro', () => {
    expect(paliersCompteur(0, 10)).toEqual(Array(11).fill(0))
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/ui/__tests__/compteur.test.ts`
Expected: FAIL — module `@/lib/compteur` introuvable.

- [ ] **Step 3 : Créer `lib/compteur.ts`**

```ts
// Suite de valeurs affichées par un compteur animé. Extrait dans un module
// pur pour être testable sans DOM : la logique d'easing est la seule partie
// du moteur d'animation où une erreur passerait inaperçue à l'œil.
export function paliersCompteur(cible: number, etapes: number): number[] {
  const out: number[] = []
  for (let i = 0; i <= etapes; i++) {
    const t = i / etapes
    // Easing out cubique : démarrage rapide, arrivée douce sur la cible.
    const eased = 1 - Math.pow(1 - t, 3)
    out.push(Math.round(cible * eased))
  }
  // Le dernier palier doit valoir exactement la cible, quel qu'ait été
  // l'arrondi : un compteur qui s'arrête sur 1239 au lieu de 1240 est un bug
  // visible.
  out[out.length - 1] = cible
  return out
}
```

- [ ] **Step 4 : Lancer le test**

Run: `npx vitest run components/ui/__tests__/compteur.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Créer `components/ui/Revelations.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import { paliersCompteur } from '@/lib/compteur'

// Moteur d'animation unique pour toute la page. Monté une seule fois dans le
// layout : les blocs restent des Server Components et se contentent de poser
// des attributs `data-*`, sans jamais devenir clients pour s'animer.
export function Revelations() {
  useEffect(() => {
    const mouvement = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tous = Array.from(
      document.querySelectorAll<HTMLElement>('[data-rv],[data-clip],[data-line],[data-count]'),
    )

    function compter(el: HTMLElement) {
      const cible = Number(el.getAttribute('data-count') ?? '0')
      if (!mouvement) {
        el.textContent = String(cible)
        return
      }
      const paliers = paliersCompteur(cible, 40)
      let i = 0
      const timer = window.setInterval(() => {
        el.textContent = String(paliers[i])
        if (++i >= paliers.length) window.clearInterval(timer)
      }, 26)
    }

    if (!mouvement) {
      tous.forEach((el) => {
        el.classList.add('rv-in')
        if (el.hasAttribute('data-count')) compter(el)
      })
      return
    }

    const io = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const delai = Number(el.getAttribute('data-d') ?? '0')
          window.setTimeout(() => el.classList.add('rv-in'), delai)
          if (el.hasAttribute('data-count')) compter(el)
          io.unobserve(el)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    tous.forEach((el) => io.observe(el))

    // Filet de sécurité : si l'observateur n'a rien déclenché au bout de 4 s
    // (bloc jamais intersecté, page très courte, navigateur exotique), on
    // révèle tout. Une page dont le contenu reste invisible est pire qu'une
    // page sans animation.
    const secours = window.setTimeout(() => {
      tous.forEach((el) => el.classList.add('rv-in'))
    }, 4000)

    // Barre de progression + parallaxe, sur un seul écouteur de scroll
    // throttlé par requestAnimationFrame.
    const barre = document.querySelector<HTMLElement>('[data-prog]')
    const parallaxes = Array.from(document.querySelectorAll<HTMLElement>('[data-par]'))
    let enAttente = false

    function auScroll() {
      if (enAttente) return
      enAttente = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const h = document.body.scrollHeight - window.innerHeight
        if (barre) barre.style.width = `${Math.min(100, (y / Math.max(h, 1)) * 100)}%`
        parallaxes.forEach((el) => {
          const facteur = Number(el.getAttribute('data-par') ?? '0')
          const r = el.getBoundingClientRect()
          const centre = r.top + r.height / 2 - window.innerHeight / 2
          el.style.transform = `translate3d(0, ${(-centre * facteur).toFixed(1)}px, 0)`
        })
        enAttente = false
      })
    }

    window.addEventListener('scroll', auScroll, { passive: true })
    auScroll()

    return () => {
      io.disconnect()
      window.clearTimeout(secours)
      window.removeEventListener('scroll', auScroll)
    }
  }, [])

  return (
    <div
      data-prog=""
      aria-hidden="true"
      className="fixed left-0 top-0 z-[70] h-0.5 w-0"
      style={{ background: 'linear-gradient(90deg, var(--terra), var(--accent))' }}
    />
  )
}
```

- [ ] **Step 6 : Créer `components/ui/Grain.tsx`**

```tsx
// Voile de grain fixe repris de la référence (docs/design-ref, ligne 55).
// `mix-blend-mode: soft-light` casse l'aspect trop lisse des aplats et des
// photos ; sans lui la page perd sa matière.
const MOTIF =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.42'/></svg>\")"

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-50"
      style={{ mixBlendMode: 'soft-light', backgroundImage: MOTIF }}
    />
  )
}
```

- [ ] **Step 7 : Monter les deux dans le layout**

Dans `app/[locale]/layout.tsx`, à l'intérieur de `<NextIntlClientProvider>`, avant `<SiteHeader />` :

```tsx
<Grain />
<Revelations />
```

- [ ] **Step 8 : Vérifier**

Run: `npm run lint && npx tsc --noEmit && npx vitest run`
Expected: tout passe.

- [ ] **Step 9 : Commit**

```bash
git add lib/compteur.ts components/ui/Revelations.tsx components/ui/Grain.tsx components/ui/__tests__/compteur.test.ts app/[locale]/layout.tsx
git commit -m "feat(accueil): moteur de révélations au scroll, grain et barre de progression"
```

---

### Task 3 : Modal accessible

**Files:**
- Create: `components/ui/Modal.tsx`
- Test: `components/ui/__tests__/Modal.test.tsx`

**Interfaces:**
- Consumes: tokens de la Task 1.
- Produces: `<Modal ouvert={boolean} onFermer={() => void} titre={string}>{children}</Modal>`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `components/ui/__tests__/Modal.test.tsx` :

```tsx
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

// jsdom n'implémente pas l'API <dialog> : on la stubbe pour que le composant
// puisse être monté et que le contrat (titre, bouton, rappel) soit vérifié.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true }
  HTMLDialogElement.prototype.close = function () { this.open = false }
})

describe('Modal', () => {
  it('ne rend rien de visible quand il est fermé', () => {
    render(<Modal ouvert={false} onFermer={() => {}} titre="Adhérer">contenu</Modal>)
    expect(screen.queryByText('contenu')).not.toBeVisible()
  })

  it('affiche le titre et le contenu quand il est ouvert', () => {
    render(<Modal ouvert onFermer={() => {}} titre="Adhérer">contenu</Modal>)
    expect(screen.getByRole('heading', { name: 'Adhérer' })).toBeInTheDocument()
    expect(screen.getByText('contenu')).toBeInTheDocument()
  })

  it('appelle onFermer au clic sur le bouton de fermeture', async () => {
    const onFermer = vi.fn()
    render(<Modal ouvert onFermer={onFermer} titre="Adhérer">contenu</Modal>)
    await userEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(onFermer).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 2 : Installer la dépendance de test manquante**

Run: `npm install -D @testing-library/user-event`

- [ ] **Step 3 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/ui/__tests__/Modal.test.tsx`
Expected: FAIL — module `@/components/ui/Modal` introuvable.

- [ ] **Step 4 : Créer `components/ui/Modal.tsx`**

```tsx
'use client'

import { useEffect, useId, useRef } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  ouvert: boolean
  onFermer: () => void
  titre: string
  children: React.ReactNode
}

// `<dialog>` natif plutôt qu'un div sur-mesure : le navigateur fournit
// gratuitement le piégeage du focus, la restitution du focus au déclencheur,
// la fermeture par Échap et l'inertie du reste de la page.
export function Modal({ ouvert, onFermer, titre, children }: Props) {
  const t = useTranslations('modal')
  const ref = useRef<HTMLDialogElement>(null)
  const idTitre = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitre}
      onCancel={(e) => {
        // Échap : on laisse React piloter l'état plutôt que le DOM, sinon
        // `ouvert` resterait à true et la modale ne pourrait plus se rouvrir.
        e.preventDefault()
        onFermer()
      }}
      onClick={(e) => {
        // Le backdrop fait partie du <dialog> lui-même : un clic dont la
        // cible est le dialog (et non un enfant) est un clic hors contenu.
        if (e.target === ref.current) onFermer()
      }}
      className="m-auto w-[min(560px,92vw)] rounded-lg border p-0 backdrop:bg-black/70"
      style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
    >
      <div className="flex items-start justify-between gap-6 border-b p-6" style={{ borderColor: 'var(--line)' }}>
        <h2 id={idTitre} className="font-serif text-2xl" style={{ color: 'var(--ink)' }}>
          {titre}
        </h2>
        <button
          type="button"
          onClick={onFermer}
          aria-label={t('fermer')}
          className="rounded-full px-2 text-2xl leading-none transition hover:opacity-60"
        >
          ×
        </button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}
```

- [ ] **Step 5 : Ajouter les traductions**

`fr.json` : `"modal": { "fermer": "Fermer" },` — `en.json` : `"modal": { "fermer": "Close" },`

- [ ] **Step 6 : Lancer le test**

Run: `npx vitest run components/ui/__tests__/Modal.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7 : Commit**

```bash
git add components/ui/Modal.tsx components/ui/__tests__/Modal.test.tsx i18n/messages package.json package-lock.json
git commit -m "feat(accueil): modale accessible fondée sur <dialog>"
```

---

### Task 4 : Migrations — six tables et leurs politiques d'accès

**Files:**
- Create: `supabase/migrations/0016_accueil.sql`
- Test: `tests/db/accueil-rls.spec.ts`

**Interfaces:**
- Consumes: la fonction `public.touch_updated_at()` créée en migration `0001`.
- Produces: les tables `contenu_site`, `points_cles`, `activites`, `temoignages`, `newsletter_abonnes`, `demandes`.

- [ ] **Step 1 : Écrire le test RLS qui échoue**

Créer `tests/db/accueil-rls.spec.ts` :

```ts
import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

test('le public ne voit que les contenus publiés', async () => {
  const sb = createClient(url, anon)
  for (const table of ['points_cles', 'activites', 'temoignages']) {
    const { data, error } = await sb.from(table).select('statut')
    expect(error, `lecture publique de ${table}`).toBeNull()
    expect((data ?? []).every((r) => r.statut === 'publie'), table).toBe(true)
  }
})

test('contenu_site est lisible publiquement mais non modifiable', async () => {
  const sb = createClient(url, anon)
  const { error: lecture } = await sb.from('contenu_site').select('cle').limit(1)
  expect(lecture).toBeNull()
  const { error: ecriture } = await sb
    .from('contenu_site')
    .update({ valeur_fr: 'piraté' })
    .eq('cle', 'hero_titre')
  expect(ecriture).not.toBeNull()
})

// Le point de sécurité de la phase : ces deux tables portent des adresses
// e-mail et des coordonnées de donateurs. Une policy de lecture trop large
// les rendrait aspirables par n'importe qui via l'API publique Supabase.
test('un anonyme peut déposer mais jamais relire les abonnés', async () => {
  const sb = createClient(url, anon)
  const { error: insertion } = await sb
    .from('newsletter_abonnes')
    .insert({ email: `test-rls-${Date.now()}@exemple.ci`, langue: 'fr' })
  expect(insertion).toBeNull()

  const { data } = await sb.from('newsletter_abonnes').select('email')
  expect(data ?? []).toHaveLength(0)
})

test('un anonyme peut déposer mais jamais relire les demandes', async () => {
  const sb = createClient(url, anon)
  const { error: insertion } = await sb
    .from('demandes')
    .insert({ type: 'don', nom: 'Test RLS', email: 'test-rls@exemple.ci', montant: 5000 })
  expect(insertion).toBeNull()

  const { data } = await sb.from('demandes').select('email, montant')
  expect(data ?? []).toHaveLength(0)
})

test("un anonyme ne peut pas marquer une demande comme traitée", async () => {
  const sb = createClient(url, anon)
  const { error } = await sb.from('demandes').update({ statut: 'traitee' }).eq('type', 'don')
  expect(error).not.toBeNull()
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx playwright test tests/db/accueil-rls.spec.ts --project=e2e`
Expected: FAIL — les relations n'existent pas.

- [ ] **Step 3 : Écrire `supabase/migrations/0016_accueil.sql`**

```sql
-- Phase 5 · Page d'accueil : contenus éditables et collecte.

-- Textes de bloc, en clé/valeur. Pas de colonne `statut` : tout est visible,
-- l'édition passe uniquement par l'admin.
create table contenu_site (
  cle        text primary key,
  valeur_fr  text,
  valeur_en  text,
  type       text not null default 'texte' check (type in ('texte', 'html', 'image')),
  updated_at timestamptz not null default now()
);

-- Les 4 arguments de « Pourquoi nous suivre » et les 5 « raisons de regarder »
-- partagent la même forme et le même écran d'admin : une seule table, séparée
-- à la lecture par la colonne `bloc`.
create table points_cles (
  id        uuid primary key default gen_random_uuid(),
  bloc      text not null check (bloc in ('pourquoi', 'raisons')),
  titre_fr  text not null,
  titre_en  text,
  texte_fr  text,
  texte_en  text,
  ordre     int  not null default 0,
  statut    text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activites (
  id             uuid primary key default gen_random_uuid(),
  titre_fr       text not null,
  titre_en       text,
  cadence_fr     text,
  cadence_en     text,
  description_fr text,
  description_en text,
  cta_libelle_fr text,
  cta_libelle_en text,
  cta_href       text,
  image          text,
  ordre          int  not null default 0,
  statut         text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table temoignages (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  role_fr     text,
  role_en     text,
  citation_fr text not null,
  citation_en text,
  note        int  not null default 5 check (note between 1 and 5),
  ordre       int  not null default 0,
  statut      text not null default 'brouillon' check (statut in ('brouillon', 'publie')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table newsletter_abonnes (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  langue     text not null default 'fr' check (langue in ('fr', 'en')),
  created_at timestamptz not null default now()
);

create table demandes (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('adhesion', 'don', 'archive')),
  nom        text not null,
  email      text not null,
  telephone  text,
  montant    numeric(12, 2) check (montant is null or montant > 0),
  message    text,
  statut     text not null default 'nouvelle' check (statut in ('nouvelle', 'traitee')),
  created_at timestamptz not null default now()
);

create index idx_points_cles_bloc   on points_cles(bloc, ordre);
create index idx_activites_ordre    on activites(ordre);
create index idx_temoignages_ordre  on temoignages(ordre);
create index idx_demandes_type      on demandes(type, created_at desc);
create index idx_demandes_statut    on demandes(statut);

create trigger trg_contenu_site_touch before update on contenu_site
  for each row execute function public.touch_updated_at();
create trigger trg_points_cles_touch  before update on points_cles
  for each row execute function public.touch_updated_at();
create trigger trg_activites_touch    before update on activites
  for each row execute function public.touch_updated_at();
create trigger trg_temoignages_touch  before update on temoignages
  for each row execute function public.touch_updated_at();

alter table contenu_site        enable row level security;
alter table points_cles         enable row level security;
alter table activites           enable row level security;
alter table temoignages         enable row level security;
alter table newsletter_abonnes  enable row level security;
alter table demandes            enable row level security;

-- Contenus : lecture publique du publié, écriture admin. Même patron que le
-- volet éditorial (migration 0012).
create policy "contenu_site select public"
  on contenu_site for select to anon using (true);
create policy "contenu_site all admin"
  on contenu_site for all to authenticated using (true) with check (true);

create policy "points_cles select public"
  on points_cles for select to anon using (statut = 'publie');
create policy "points_cles all admin"
  on points_cles for all to authenticated using (true) with check (true);

create policy "activites select public"
  on activites for select to anon using (statut = 'publie');
create policy "activites all admin"
  on activites for all to authenticated using (true) with check (true);

create policy "temoignages select public"
  on temoignages for select to anon using (statut = 'publie');
create policy "temoignages all admin"
  on temoignages for all to authenticated using (true) with check (true);

-- Collecte : patron INVERSE. Insertion publique, lecture réservée à l'admin.
-- Sans cette asymétrie, la liste des abonnés et les coordonnées des donateurs
-- seraient lisibles par quiconque dispose de la clé anonyme — qui est, par
-- construction, publiée dans le bundle du navigateur.
create policy "newsletter_abonnes insert public"
  on newsletter_abonnes for insert to anon with check (true);
create policy "newsletter_abonnes all admin"
  on newsletter_abonnes for all to authenticated using (true) with check (true);

create policy "demandes insert public"
  on demandes for insert to anon with check (statut = 'nouvelle');
create policy "demandes all admin"
  on demandes for all to authenticated using (true) with check (true);
```

- [ ] **Step 4 : Appliquer la migration**

Appliquer le contenu de `0016_accueil.sql` sur le projet Supabase `yognzzhrrllomokvoooy` via l'outil MCP `apply_migration`, en la nommant `0016_accueil`.

- [ ] **Step 5 : Lancer le test RLS**

Run: `npx playwright test tests/db/accueil-rls.spec.ts --project=e2e`
Expected: PASS (5 tests).

> Si le test « le public ne voit que les contenus publiés » passe alors que les tables sont vides, c'est un faux positif tant que le seed de la Task 5 n'a pas tourné. Il devient discriminant à ce moment-là.

- [ ] **Step 6 : Commit**

```bash
git add supabase/migrations/0016_accueil.sql tests/db/accueil-rls.spec.ts
git commit -m "feat(accueil): six tables de contenus et de collecte, avec RLS asymétrique"
```

---

### Task 5 : Seed des contenus

**Files:**
- Create: `supabase/migrations/0017_accueil_seed.sql`
- Modify: `tests/db/accueil-rls.spec.ts` (ajout d'un discriminant)

**Interfaces:**
- Consumes: les tables de la Task 4.
- Produces: les clés de `contenu_site` listées ci-dessous, 4 lignes `pourquoi`, 5 lignes `raisons`, 4 `activites`. Un brouillon piège dans chaque table à statut, pour rendre le test RLS discriminant.

- [ ] **Step 1 : Écrire `supabase/migrations/0017_accueil_seed.sql`**

Les textes proviennent de `docs/design-ref/Accueil PAACIV.dc.html`. **Les chiffres, coordonnées et montants inventés par le design sont remplacés par le marqueur `À COMPLÉTER`** (spec §8) — ils doivent sauter aux yeux en préproduction plutôt que partir en ligne déguisés en vérité.

```sql
-- Phase 5 · Seed de la page d'accueil. Textes repris de la référence de
-- design ; toute valeur factuelle inventée par celle-ci (adresse, téléphone,
-- montant d'adhésion, moyens de paiement) est marquée « À COMPLÉTER » et
-- doit être renseignée par l'association avant mise en ligne (spec §8).

insert into contenu_site (cle, valeur_fr, valeur_en, type) values
  ('hero_titre',           'Ce qui tient debout raconte encore', 'What still stands still speaks', 'texte'),
  ('hero_intro',           'Nous documentons, photographions et inventorions le patrimoine bâti ivoirien — des maisons à galeries de Grand-Bassam aux mosquées de terre du Nord. Une archive ouverte, tenue par une association.', 'We document, photograph and inventory Ivorian built heritage — from the veranda houses of Grand-Bassam to the earthen mosques of the North. An open archive, kept by an association.', 'texte'),
  ('association_surtitre', 'L''association', 'The association', 'texte'),
  ('association_titre',    'Une archive tenue à la main, bâtiment par bâtiment', 'An archive kept by hand, building by building', 'texte'),
  ('association_texte',    'PAACIV réunit des architectes, des photographes, des historiens et des habitants autour d''un même travail : relever, dater et publier ce qui reste du patrimoine bâti national, du poste colonial à la case à impluvium, de la mosquée de terre à l''école des années 1960.', 'PAACIV brings together architects, photographers, historians and residents around a single task: surveying, dating and publishing what remains of the national built heritage.', 'texte'),
  ('travail_surtitre',     'Notre travail', 'Our work', 'texte'),
  ('travail_titre',        'Documenter avant que la pluie ne s''en charge', 'Documenting before the rain does it for us', 'texte'),
  ('travail_texte',        'Une maison à galerie perd sa toiture en une saison des pluies. Nos équipes relèvent les façades, photographient les décors, notent les matériaux et recueillent la parole des occupants. Chaque fiche entre dans une base publique, consultable par les mairies, les étudiants et les propriétaires.', 'A veranda house loses its roof in a single rainy season. Our teams survey façades, photograph ornament, record materials and gather the words of those who live there.', 'texte'),
  ('travail_releve_titre', 'Relevé', 'Survey', 'texte'),
  ('travail_releve_texte', 'Plans, coupes, matériaux.', 'Plans, sections, materials.', 'texte'),
  ('travail_recit_titre',  'Récit', 'Account', 'texte'),
  ('travail_recit_texte',  'Entretiens, archives familiales.', 'Interviews, family archives.', 'texte'),
  ('pourquoi_titre',       'Pourquoi nous suivre ?', 'Why follow us?', 'texte'),
  ('activites_surtitre',   'Nos activités', 'Our activities', 'texte'),
  ('activites_titre',      'Ce que nous faisons', 'What we do', 'texte'),
  ('activites_intro',      'Quatre chantiers permanents, ouverts aux adhérents comme aux curieux.', 'Four ongoing programmes, open to members and to the merely curious.', 'texte'),
  ('carte_surtitre',       'Le territoire', 'The territory', 'texte'),
  ('carte_titre',          'Chaque édifice à sa place', 'Every building in its place', 'texte'),
  ('carte_texte',          'Toutes les fiches publiées sont géolocalisées. La carte se parcourt par type, par programme, par district et par époque.', 'Every published record is geolocated. The map can be browsed by type, programme, district and period.', 'texte'),
  ('raisons_surtitre',     'Raisons', 'Reasons', 'texte'),
  ('raisons_titre',        'Cinq raisons de regarder ces bâtiments de près', 'Five reasons to look closely at these buildings', 'texte'),
  ('agenda_surtitre',      'Agenda', 'Calendar', 'texte'),
  ('agenda_titre',         'Prochaines visites', 'Upcoming visits', 'texte'),
  ('parallaxe_texte',      'Vous détenez des plans, des photographies, des archives de famille ?', 'Do you hold plans, photographs, family archives?', 'texte'),
  ('archive_surtitre',     'Collections', 'Collections', 'texte'),
  ('archive_titre',        'Archive photographique', 'Photographic archive', 'texte'),
  ('temoignages_surtitre', 'Paroles', 'Voices', 'texte'),
  ('temoignages_titre',    'Ils travaillent avec nous', 'They work with us', 'texte'),
  ('journal_surtitre',     'Journal', 'Journal', 'texte'),
  ('journal_titre',        'Ce que nous publions', 'What we publish', 'texte'),
  ('newsletter_titre',     'Recevoir nos relevés', 'Receive our surveys', 'texte'),
  ('newsletter_texte',     'Une lettre par mois : nouvelles fiches, chantiers en cours, dates de visites.', 'One letter a month: new records, work in progress, visit dates.', 'texte'),
  ('footer_description',   'Patrimoine Architectural et des Arts de Côte d''Ivoire. Association déclarée, Abidjan.', 'Architectural and Arts Heritage of Côte d''Ivoire. Registered association, Abidjan.', 'texte'),
  -- Valeurs factuelles : à renseigner par l'association (spec §8).
  ('footer_adresse',       'À COMPLÉTER — adresse postale', 'À COMPLÉTER — postal address', 'texte'),
  ('footer_telephone',     'À COMPLÉTER — téléphone', 'À COMPLÉTER — phone', 'texte'),
  ('footer_email',         'À COMPLÉTER — adresse de contact', 'À COMPLÉTER — contact address', 'texte'),
  ('soutien_adhesion_montant', 'À COMPLÉTER — montant de l''adhésion annuelle', 'À COMPLÉTER — annual membership fee', 'texte'),
  ('soutien_paiement',     'À COMPLÉTER — coordonnées bancaires, Wave, Orange Money', 'À COMPLÉTER — bank details, Wave, Orange Money', 'texte');

insert into points_cles (bloc, titre_fr, titre_en, texte_fr, texte_en, ordre, statut) values
  ('pourquoi', 'Un inventaire ouvert',      'An open inventory',      'Toutes les fiches sont publiques et téléchargeables, sans compte ni abonnement.', 'Every record is public and downloadable, with no account or subscription.', 1, 'publie'),
  ('pourquoi', 'Des relevés rigoureux',     'Rigorous surveys',       'Protocole commun, datation croisée avec les archives nationales et les familles.', 'A shared protocol, dating cross-checked against national archives and families.', 2, 'publie'),
  ('pourquoi', 'Un réseau de bénévoles',    'A volunteer network',    'Des correspondants dans plusieurs villes, formés au relevé et à la photographie.', 'Correspondents in several towns, trained in surveying and photography.', 3, 'publie'),
  ('pourquoi', 'Une mémoire partagée',      'A shared memory',        'Les habitants racontent leurs maisons ; leurs récits accompagnent les images.', 'Residents tell the story of their houses; their accounts accompany the images.', 4, 'publie'),
  ('raisons',  'Grand-Bassam',              'Grand-Bassam',           'Inscrite au patrimoine mondial depuis 2012. Sa ville coloniale et le village N''zima s''y répondent rue par rue.', 'A World Heritage Site since 2012. Its colonial town and the N''zima village answer each other street by street.', 1, 'publie'),
  ('raisons',  'Les mosquées soudanaises',  'The Sudanese mosques',   'Huit mosquées de style soudanais du Nord ivoirien ont rejoint la liste en 2021 : terre crue, contreforts, charpentes saillantes.', 'Eight Sudanese-style mosques of northern Côte d''Ivoire joined the list in 2021: raw earth, buttresses, projecting timbers.', 2, 'publie'),
  ('raisons',  'La maison à galerie',       'The veranda house',      'Ce n''est pas qu''un décor colonial : sa véranda, sa ventilation et son sol surélevé répondent au climat lagunaire.', 'Not merely colonial decor: its veranda, ventilation and raised floor answer the lagoon climate.', 3, 'publie'),
  ('raisons',  'Le moderne ivoirien',       'Ivorian modernism',      'L''architecture des années 1960-1980 appartient déjà à l''histoire et reste très peu documentée.', 'The architecture of the 1960s to 1980s already belongs to history and remains very poorly documented.', 4, 'publie'),
  ('raisons',  'La transmission des gestes','Passing on the craft',   'Un enduit de terre se refait chaque année. Sans transmission des gestes, le bâtiment disparaît avant le souvenir qu''on en a.', 'An earthen render is redone every year. Without the craft being passed on, the building vanishes before the memory of it.', 5, 'publie'),
  -- Brouillon piège : rend discriminant le test RLS de la Task 4. S'il
  -- apparaissait côté public, la policy serait cassée.
  ('raisons',  'Raison en brouillon',       'Draft reason',           'Ne doit jamais apparaître côté public.', 'Must never appear publicly.', 99, 'brouillon');

insert into activites (titre_fr, titre_en, cadence_fr, cadence_en, description_fr, description_en, cta_libelle_fr, cta_libelle_en, cta_href, ordre, statut) values
  ('Inventaire photographique', 'Photographic inventory', 'Toute l''année', 'All year round', 'Campagnes régulières à Grand-Bassam, Abidjan et Bondoukou. Chaque bâtiment reçoit une fiche : datation, matériaux, état, propriétaires successifs.', 'Regular campaigns in Grand-Bassam, Abidjan and Bondoukou. Each building receives a record: dating, materials, condition, successive owners.', 'Consulter', 'Browse', '/archives', 1, 'publie'),
  ('Visites guidées', 'Guided walks', 'Deux samedis par mois', 'Two Saturdays a month', 'Deux heures de marche commentée entre la lagune et l''océan, de la Maison du Résident au palais royal N''zima. Groupes de quinze personnes.', 'Two hours of guided walking between lagoon and ocean, from the Resident''s House to the N''zima royal palace. Groups of fifteen.', 'Voir l''agenda', 'See the calendar', '/evenements', 2, 'publie'),
  ('Publications', 'Publications', 'Deux titres par an', 'Two titles a year', 'Un cahier annuel de relevés, plus des monographies courtes consacrées à un édifice.', 'An annual book of surveys, plus short monographs devoted to a single building.', 'Lire', 'Read', '/articles', 3, 'publie'),
  ('Formations à la terre crue', 'Earth building workshops', 'Sessions à Kong et Tengréla', 'Sessions in Kong and Tengréla', 'Cinq jours avec les maçons des mosquées du Nord : préparation du banco, pose des torons, réfection des contreforts avant la saison des pluies.', 'Five days with the masons of the northern mosques: preparing banco, setting the timbers, repairing buttresses before the rains.', 'Nous écrire', 'Contact us', '#contact', 4, 'publie');

-- `temoignages` reste VOLONTAIREMENT vide. Les quatre paroles de la référence
-- de design sont des personnes nommées, avec rôle et citation attribuée :
-- les seeder reviendrait à fabriquer de faux témoignages, avec le risque
-- qu'ils partent en production tels quels. Le bloc ne s'affiche pas tant que
-- la table est vide (spec §4.4).
```

- [ ] **Step 2 : Appliquer la migration**

Appliquer via l'outil MCP `apply_migration`, sous le nom `0017_accueil_seed`.

- [ ] **Step 3 : Rendre le test RLS discriminant**

Dans `tests/db/accueil-rls.spec.ts`, ajouter :

```ts
test('le brouillon piège de points_cles ne fuit pas côté public', async () => {
  const sb = createClient(url, anon)
  const { data } = await sb.from('points_cles').select('titre_fr')
  const titres = (data ?? []).map((r) => r.titre_fr)
  expect(titres).not.toContain('Raison en brouillon')
  // Contre-épreuve : la policy ne doit pas non plus être trop stricte.
  expect(titres).toContain('Grand-Bassam')
})
```

- [ ] **Step 4 : Lancer les tests**

Run: `npx playwright test tests/db/accueil-rls.spec.ts --project=e2e`
Expected: PASS (6 tests).

- [ ] **Step 5 : Commit**

```bash
git add supabase/migrations/0017_accueil_seed.sql tests/db/accueil-rls.spec.ts
git commit -m "feat(accueil): seed des contenus, marqueurs À COMPLÉTER sur les valeurs factuelles"
```

---

### Task 6 : Couche de lecture

**Files:**
- Create: `lib/data/contenu-site.ts`
- Create: `lib/data/accueil.ts`
- Test: `lib/data/__tests__/contenu-site.test.ts`
- Test: `tests/db/data-accueil.spec.ts`

**Interfaces:**
- Consumes: `createReadClient()` de `lib/supabase/reader.ts`, `imagePrincipale()` et `imageUrl()` de `lib/media.ts`, les tables des Tasks 4 et 5.
- Produces:
  - `type Textes = Record<string, { fr: string | null; en: string | null }>`
  - `chargerTextes(): Promise<Textes>`
  - `texte(textes: Textes, cle: string, locale: string): string`
  - `type PointCle = { id, titre_fr, titre_en, texte_fr, texte_en }`
  - `type Activite = { id, titre_fr, titre_en, cadence_fr, cadence_en, description_fr, description_en, cta_libelle_fr, cta_libelle_en, cta_href, image }`
  - `type Temoignage = { id, nom, role_fr, role_en, citation_fr, citation_en, note }`
  - `type VedetteHero = { slug, titre_fr, titre_en, ville, date_texte, image }`
  - `type Chiffres = { fiches: number; villes: number; architectes: number; articles: number }`
  - `listePointsCles(bloc: 'pourquoi' | 'raisons'): Promise<PointCle[]>`
  - `listeActivites(): Promise<Activite[]>`
  - `listeTemoignages(): Promise<Temoignage[]>`
  - `vedettesHero(limite?: number): Promise<VedetteHero[]>`
  - `chiffresCles(): Promise<Chiffres>`
  - `villesArchive(): Promise<string[]>`
  - `vignettesArchive(limite?: number): Promise<VignetteArchive[]>` avec `type VignetteArchive = { slug, titre_fr, titre_en, ville, type_id, image }`

- [ ] **Step 1 : Écrire le test unitaire qui échoue**

Créer `lib/data/__tests__/contenu-site.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { texte, type Textes } from '@/lib/data/contenu-site'

const textes: Textes = {
  hero_titre: { fr: 'Ce qui tient debout', en: 'What still stands' },
  agenda_titre: { fr: 'Prochaines visites', en: null },
}

describe('texte', () => {
  it('renvoie la valeur dans la locale demandée', () => {
    expect(texte(textes, 'hero_titre', 'en')).toBe('What still stands')
    expect(texte(textes, 'hero_titre', 'fr')).toBe('Ce qui tient debout')
  })

  it('replie sur le français quand l’anglais manque', () => {
    expect(texte(textes, 'agenda_titre', 'en')).toBe('Prochaines visites')
  })

  it('renvoie une chaîne vide pour une clé absente, sans planter', () => {
    expect(texte(textes, 'cle_inexistante', 'fr')).toBe('')
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run lib/data/__tests__/contenu-site.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Créer `lib/data/contenu-site.ts`**

```ts
import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { champ } from '@/lib/i18n-champ'

export type Textes = Record<string, { fr: string | null; en: string | null }>

// Un seul aller-retour pour tous les textes de la page, mémoïsé par requête :
// seize blocs qui iraient chacun chercher leur clé feraient seize requêtes.
export const chargerTextes = cache(async function chargerTextes(): Promise<Textes> {
  const sb = createReadClient()
  const { data, error } = await sb.from('contenu_site').select('cle, valeur_fr, valeur_en')
  if (error) throw error
  const out: Textes = {}
  for (const r of data ?? []) out[r.cle] = { fr: r.valeur_fr, en: r.valeur_en }
  return out
})

// Une clé absente renvoie '' plutôt que de lever : un texte manquant doit
// laisser un trou dans la page, pas casser tout le rendu serveur.
export function texte(textes: Textes, cle: string, locale: string): string {
  const v = textes[cle]
  if (!v) return ''
  return champ(v.fr, v.en, locale)
}
```

- [ ] **Step 4 : Lancer le test**

Run: `npx vitest run lib/data/__tests__/contenu-site.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5 : Écrire le test d'intégration BDD qui échoue**

Créer `tests/db/data-accueil.spec.ts` :

```ts
import { test, expect } from '@playwright/test'
import {
  listePointsCles, listeActivites, listeTemoignages,
  vedettesHero, chiffresCles, villesArchive, vignettesArchive,
} from '@/lib/data/accueil'
import { chargerTextes, texte } from '@/lib/data/contenu-site'

test('chargerTextes ramène les clés seedées', async () => {
  const t = await chargerTextes()
  expect(texte(t, 'hero_titre', 'fr')).toContain('tient debout')
  expect(texte(t, 'newsletter_titre', 'fr')).toBeTruthy()
})

test('listePointsCles sépare les deux blocs et exclut les brouillons', async () => {
  const pourquoi = await listePointsCles('pourquoi')
  const raisons = await listePointsCles('raisons')
  expect(pourquoi).toHaveLength(4)
  expect(raisons).toHaveLength(5)
  expect(raisons.some((r) => r.titre_fr === 'Raison en brouillon')).toBe(false)
})

test('listeActivites renvoie les quatre activités dans l’ordre', async () => {
  const a = await listeActivites()
  expect(a).toHaveLength(4)
  expect(a[0].titre_fr).toBe('Inventaire photographique')
  expect(a.every((x) => x.cta_href)).toBe(true)
})

test('listeTemoignages renvoie un tableau vide tant que rien n’est saisi', async () => {
  // Volontaire : aucun témoignage n'est seedé (spec §4.4). Le bloc doit
  // savoir ne pas s'afficher plutôt que d'inventer des paroles.
  expect(await listeTemoignages()).toEqual([])
})

test('vedettesHero ne renvoie que du publié avec une image', async () => {
  const v = await vedettesHero(5)
  expect(v.length).toBeGreaterThan(0)
  expect(v.length).toBeLessThanOrEqual(5)
  expect(v.every((x) => x.image !== null)).toBe(true)
  expect(v.some((x) => x.slug === 'aeroport-felix-houphouet-boigny')).toBe(false)
})

test('chiffresCles ne renvoie que des entiers positifs ou nuls', async () => {
  const c = await chiffresCles()
  for (const [k, n] of Object.entries(c)) {
    expect(Number.isInteger(n), k).toBe(true)
    expect(n, k).toBeGreaterThanOrEqual(0)
  }
  expect(c.fiches).toBeGreaterThan(0)
})

test('villesArchive dédoublonne et ignore les valeurs vides', async () => {
  const v = await villesArchive()
  expect(new Set(v).size).toBe(v.length)
  expect(v.every((x) => x.trim().length > 0)).toBe(true)
})

test('vignettesArchive porte le type pour les filtres', async () => {
  const g = await vignettesArchive(12)
  expect(g.length).toBeGreaterThan(0)
  expect(g.every((x) => x.image !== null)).toBe(true)
})
```

- [ ] **Step 6 : Lancer le test pour vérifier qu'il échoue**

Run: `npx playwright test tests/db/data-accueil.spec.ts --project=e2e`
Expected: FAIL — module `@/lib/data/accueil` introuvable.

- [ ] **Step 7 : Créer `lib/data/accueil.ts`**

```ts
import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imagePrincipale, imageUrl, type ImageMini } from '@/lib/media'

export type PointCle = {
  id: string
  titre_fr: string
  titre_en: string | null
  texte_fr: string | null
  texte_en: string | null
}

export type Activite = {
  id: string
  titre_fr: string
  titre_en: string | null
  cadence_fr: string | null
  cadence_en: string | null
  description_fr: string | null
  description_en: string | null
  cta_libelle_fr: string | null
  cta_libelle_en: string | null
  cta_href: string | null
  image: string | null
}

export type Temoignage = {
  id: string
  nom: string
  role_fr: string | null
  role_en: string | null
  citation_fr: string
  citation_en: string | null
  note: number
}

export type VedetteHero = {
  slug: string
  titre_fr: string
  titre_en: string | null
  ville: string | null
  date_texte: string | null
  image: string
}

export type VignetteArchive = {
  slug: string
  titre_fr: string
  titre_en: string | null
  ville: string | null
  type_id: string | null
  image: string
}

export type Chiffres = {
  fiches: number
  villes: number
  architectes: number
  articles: number
}

export async function listePointsCles(bloc: 'pourquoi' | 'raisons'): Promise<PointCle[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('points_cles')
    .select('id, titre_fr, titre_en, texte_fr, texte_en')
    .eq('bloc', bloc)
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return (data ?? []) as PointCle[]
}

export async function listeActivites(): Promise<Activite[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('activites')
    .select(
      'id, titre_fr, titre_en, cadence_fr, cadence_en, description_fr, description_en, cta_libelle_fr, cta_libelle_en, cta_href, image',
    )
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return ((data ?? []) as Activite[]).map((a) => ({
    ...a,
    image: a.image ? imageUrl(a.image) : null,
  }))
}

export async function listeTemoignages(): Promise<Temoignage[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('temoignages')
    .select('id, nom, role_fr, role_en, citation_fr, citation_en, note')
    .eq('statut', 'publie')
    .order('ordre', { ascending: true })
  if (error) throw error
  return (data ?? []) as Temoignage[]
}

type LigneAvecImages = {
  slug: string
  titre_fr: string
  titre_en: string | null
  ville: string | null
  date_texte?: string | null
  type_id?: string | null
  images: ImageMini[]
}

export async function vedettesHero(limite = 5): Promise<VedetteHero[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('patrimoine')
    .select('slug, titre_fr, titre_en, ville, date_texte, images(chemin, est_principale, ordre)')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
  if (error) throw error

  // On filtre les fiches sans image APRÈS la requête plutôt que par un
  // `inner join` : la relation `images` est optionnelle et un join interne
  // exclurait aussi les fiches dont l'unique image est en cours d'upload.
  return ((data ?? []) as unknown as LigneAvecImages[])
    .map((r) => ({
      slug: r.slug,
      titre_fr: r.titre_fr,
      titre_en: r.titre_en,
      ville: r.ville,
      date_texte: r.date_texte ?? null,
      image: imagePrincipale(r.images),
    }))
    .filter((r): r is VedetteHero => r.image !== null)
    .slice(0, limite)
}

export async function vignettesArchive(limite = 12): Promise<VignetteArchive[]> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('patrimoine')
    .select('slug, titre_fr, titre_en, ville, type_id, images(chemin, est_principale, ordre)')
    .eq('statut', 'publie')
    .order('created_at', { ascending: false })
  if (error) throw error

  return ((data ?? []) as unknown as LigneAvecImages[])
    .map((r) => ({
      slug: r.slug,
      titre_fr: r.titre_fr,
      titre_en: r.titre_en,
      ville: r.ville,
      type_id: r.type_id ?? null,
      image: imagePrincipale(r.images),
    }))
    .filter((r): r is VignetteArchive => r.image !== null)
    .slice(0, limite)
}

export async function villesArchive(): Promise<string[]> {
  const sb = createReadClient()
  const { data, error } = await sb.from('patrimoine').select('ville').eq('statut', 'publie')
  if (error) throw error
  const villes = (data ?? [])
    .map((r) => (r.ville ?? '').trim())
    .filter((v) => v.length > 0)
  return Array.from(new Set(villes)).sort((a, b) => a.localeCompare(b, 'fr'))
}

// Compteurs du bloc « L'association ». Mémoïsé : le bloc les affiche et le
// bloc carte réutilise le nombre de fiches.
export const chiffresCles = cache(async function chiffresCles(): Promise<Chiffres> {
  const sb = createReadClient()
  const compte = async (table: string) => {
    const { count, error } = await sb
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'publie')
    if (error) throw error
    return count ?? 0
  }
  const [fiches, architectes, articles, villes] = await Promise.all([
    compte('patrimoine'),
    compte('architectes'),
    compte('articles'),
    villesArchive().then((v) => v.length),
  ])
  return { fiches, villes, architectes, articles }
})
```

- [ ] **Step 8 : Lancer les tests**

Run: `npx playwright test tests/db/data-accueil.spec.ts --project=e2e`
Expected: PASS (8 tests).

- [ ] **Step 9 : Vérifier**

Run: `npm run lint && npx tsc --noEmit && npx vitest run`
Expected: tout passe.

- [ ] **Step 10 : Commit**

```bash
git add lib/data/contenu-site.ts lib/data/accueil.ts lib/data/__tests__/contenu-site.test.ts tests/db/data-accueil.spec.ts
git commit -m "feat(accueil): couche de lecture des contenus, vedettes, vignettes et chiffres"
```

---

### Task 7 : Actions serveur — newsletter et demandes de soutien

**Files:**
- Create: `lib/validation.ts`
- Create: `app/[locale]/actions/newsletter.ts`
- Create: `app/[locale]/actions/soutien.ts`
- Test: `lib/__tests__/validation.test.ts`
- Test: `tests/db/soutien.spec.ts`

**Interfaces:**
- Consumes: tables `newsletter_abonnes` et `demandes` (Task 4), `createReadClient()`.
- Produces:
  - `emailValide(v: string): boolean`
  - `montantOuNull(v: FormDataEntryValue | null): number | null`
  - `type ResultatNewsletter = { ok: true } | { ok: false; erreur: 'emailInvalide' | 'echec' }`
  - `inscrireNewsletter(formData: FormData): Promise<ResultatNewsletter>`
  - `type TypeDemande = 'adhesion' | 'don' | 'archive'`
  - `type ResultatDemande = { ok: true } | { ok: false; erreur: 'nomRequis' | 'emailInvalide' | 'montantInvalide' | 'echec' }`
  - `deposerDemande(formData: FormData): Promise<ResultatDemande>`

- [ ] **Step 1 : Écrire le test unitaire qui échoue**

Créer `lib/__tests__/validation.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { emailValide, montantOuNull } from '@/lib/validation'

describe('emailValide', () => {
  it('accepte les adresses usuelles', () => {
    expect(emailValide('a@b.ci')).toBe(true)
    expect(emailValide('prenom.nom+tag@paaciv.org')).toBe(true)
  })

  it('refuse ce qui n’est pas une adresse', () => {
    for (const v of ['', '   ', 'a@b', 'a b@c.ci', '@b.ci', 'a@.ci', 'a@b.']) {
      expect(emailValide(v), v).toBe(false)
    }
  })
})

describe('montantOuNull', () => {
  it('accepte un nombre positif, virgule ou point', () => {
    expect(montantOuNull('15000')).toBe(15000)
    expect(montantOuNull('1500,50')).toBe(1500.5)
    expect(montantOuNull('1500.50')).toBe(1500.5)
  })

  it('renvoie null pour vide ou absent — un don sans montant reste valide', () => {
    expect(montantOuNull(null)).toBeNull()
    expect(montantOuNull('')).toBeNull()
    expect(montantOuNull('   ')).toBeNull()
  })

  it('renvoie NaN pour une saisie non numérique ou négative, pour que l’appelant refuse', () => {
    expect(montantOuNull('beaucoup')).toBeNaN()
    expect(montantOuNull('-10')).toBeNaN()
    expect(montantOuNull('0')).toBeNaN()
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run lib/__tests__/validation.test.ts`
Expected: FAIL — module `@/lib/validation` introuvable.

- [ ] **Step 3 : Créer `lib/validation.ts`**

```ts
// Validation volontairement permissive : l'objectif est d'écarter les saisies
// manifestement fautives, pas de reproduire la RFC 5322. Une adresse exotique
// mais réelle ne doit jamais être refusée à un donateur.
const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function emailValide(v: string): boolean {
  const s = v.trim()
  return s.length > 0 && s.length <= 254 && RE_EMAIL.test(s)
}

// Trois issues distinctes, que l'appelant doit distinguer :
//   null → aucun montant saisi, ce qui reste valide (don sans montant annoncé)
//   NaN  → saisie présente mais inutilisable, à refuser
//   n    → montant exploitable
export function montantOuNull(v: FormDataEntryValue | null): number | null {
  if (v === null) return null
  const s = v.toString().trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return Number.NaN
  return n
}
```

- [ ] **Step 4 : Lancer le test**

Run: `npx vitest run lib/__tests__/validation.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5 : Créer `app/[locale]/actions/newsletter.ts`**

```ts
'use server'

import { createReadClient } from '@/lib/supabase/reader'
import { emailValide } from '@/lib/validation'

// Erreurs attendues en valeur de retour, jamais en exception : convention
// établie en Phase 4 (033dec0). Un `throw` serait redacté en production et
// l'internaute verrait une page d'erreur au lieu d'un message utile.
export type ResultatNewsletter = { ok: true } | { ok: false; erreur: 'emailInvalide' | 'echec' }

export async function inscrireNewsletter(formData: FormData): Promise<ResultatNewsletter> {
  const brut = (formData.get('email') ?? '').toString()
  if (!emailValide(brut)) return { ok: false, erreur: 'emailInvalide' }

  const langue = (formData.get('langue') ?? 'fr').toString() === 'en' ? 'en' : 'fr'
  // Client anon : la policy « insert public » suffit, et cette action ne doit
  // surtout pas s'exécuter avec des droits élargis.
  const sb = createReadClient()
  const { error } = await sb
    .from('newsletter_abonnes')
    .insert({ email: brut.trim().toLowerCase(), langue })

  if (error) {
    // 23505 = violation d'unicité : l'adresse est déjà inscrite. On renvoie
    // le même succès qu'une inscription neuve — répondre « déjà inscrit »
    // transformerait le formulaire en oracle permettant de tester si une
    // adresse donnée figure dans la liste.
    if (error.code === '23505') return { ok: true }
    return { ok: false, erreur: 'echec' }
  }
  return { ok: true }
}
```

- [ ] **Step 6 : Créer `app/[locale]/actions/soutien.ts`**

```ts
'use server'

import { createReadClient } from '@/lib/supabase/reader'
import { emailValide, montantOuNull } from '@/lib/validation'

export type TypeDemande = 'adhesion' | 'don' | 'archive'

export type ResultatDemande =
  | { ok: true }
  | { ok: false; erreur: 'nomRequis' | 'emailInvalide' | 'montantInvalide' | 'typeInvalide' | 'echec' }

const TYPES: readonly TypeDemande[] = ['adhesion', 'don', 'archive']

export async function deposerDemande(formData: FormData): Promise<ResultatDemande> {
  const type = (formData.get('type') ?? '').toString() as TypeDemande
  if (!TYPES.includes(type)) return { ok: false, erreur: 'typeInvalide' }

  const nom = (formData.get('nom') ?? '').toString().trim()
  if (!nom) return { ok: false, erreur: 'nomRequis' }

  const email = (formData.get('email') ?? '').toString()
  if (!emailValide(email)) return { ok: false, erreur: 'emailInvalide' }

  const montant = montantOuNull(formData.get('montant'))
  if (Number.isNaN(montant)) return { ok: false, erreur: 'montantInvalide' }

  const sb = createReadClient()
  const { error } = await sb.from('demandes').insert({
    type,
    nom,
    email: email.trim().toLowerCase(),
    telephone: (formData.get('telephone') ?? '').toString().trim() || null,
    montant,
    message: (formData.get('message') ?? '').toString().trim() || null,
    // La policy « demandes insert public » exige statut = 'nouvelle' : un
    // dépôt public ne peut pas se marquer traité lui-même.
    statut: 'nouvelle',
  })
  if (error) return { ok: false, erreur: 'echec' }
  return { ok: true }
}
```

- [ ] **Step 7 : Écrire le test d'intégration**

Créer `tests/db/soutien.spec.ts` :

```ts
import { test, expect } from '@playwright/test'
import { inscrireNewsletter } from '@/app/[locale]/actions/newsletter'
import { deposerDemande } from '@/app/[locale]/actions/soutien'

function fd(o: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(o)) f.append(k, v)
  return f
}

test('inscrireNewsletter refuse une adresse invalide', async () => {
  expect(await inscrireNewsletter(fd({ email: 'pas-une-adresse' }))).toEqual({
    ok: false,
    erreur: 'emailInvalide',
  })
})

test('inscrireNewsletter accepte, puis répond succès sur doublon', async () => {
  const email = `abonne-${Date.now()}@exemple.ci`
  expect(await inscrireNewsletter(fd({ email, langue: 'fr' }))).toEqual({ ok: true })
  // Deuxième passage : même réponse, pour ne pas révéler que l'adresse est
  // déjà connue.
  expect(await inscrireNewsletter(fd({ email, langue: 'fr' }))).toEqual({ ok: true })
})

test('deposerDemande valide le nom, l’adresse, le montant et le type', async () => {
  expect(await deposerDemande(fd({ type: 'don', nom: '', email: 'a@b.ci' })))
    .toEqual({ ok: false, erreur: 'nomRequis' })
  expect(await deposerDemande(fd({ type: 'don', nom: 'A', email: 'nope' })))
    .toEqual({ ok: false, erreur: 'emailInvalide' })
  expect(await deposerDemande(fd({ type: 'don', nom: 'A', email: 'a@b.ci', montant: 'beaucoup' })))
    .toEqual({ ok: false, erreur: 'montantInvalide' })
  expect(await deposerDemande(fd({ type: 'inconnu', nom: 'A', email: 'a@b.ci' })))
    .toEqual({ ok: false, erreur: 'typeInvalide' })
})

test('deposerDemande enregistre les trois types', async () => {
  for (const type of ['adhesion', 'don', 'archive']) {
    const r = await deposerDemande(
      fd({ type, nom: 'Test', email: `demande-${type}-${Date.now()}@exemple.ci`, message: 'Test automatisé' }),
    )
    expect(r, type).toEqual({ ok: true })
  }
})

test('un don sans montant reste valide', async () => {
  const r = await deposerDemande(
    fd({ type: 'don', nom: 'Test', email: `sans-montant-${Date.now()}@exemple.ci`, montant: '' }),
  )
  expect(r).toEqual({ ok: true })
})
```

- [ ] **Step 8 : Lancer les tests**

Run: `npx playwright test tests/db/soutien.spec.ts --project=e2e`
Expected: PASS (5 tests).

- [ ] **Step 9 : Commit**

```bash
git add lib/validation.ts lib/__tests__/validation.test.ts "app/[locale]/actions" tests/db/soutien.spec.ts
git commit -m "feat(accueil): actions serveur newsletter et demandes de soutien"
```

---

### Task 8 : Formulaire de soutien et ses trois modales

**Files:**
- Create: `components/soutenir/FormulaireSoutien.tsx`
- Create: `components/soutenir/ContexteSoutien.tsx`
- Test: `components/soutenir/__tests__/FormulaireSoutien.test.tsx`

**Interfaces:**
- Consumes: `<Modal />` (Task 3), `deposerDemande` (Task 7).
- Produces:
  - `<FournisseurSoutien paiement={string}>{children}</FournisseurSoutien>` — contexte + les trois modales.
  - `useSoutien(): { ouvrir: (type: TypeDemande) => void }` — pour tout bouton déclencheur.
  - `<FormulaireSoutien type={TypeDemande} paiement={string} onSucces={() => void} />`

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `components/soutenir/__tests__/FormulaireSoutien.test.tsx` :

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { FormulaireSoutien } from '@/components/soutenir/FormulaireSoutien'

const deposer = vi.hoisted(() => vi.fn())
vi.mock('@/app/[locale]/actions/soutien', () => ({ deposerDemande: deposer }))

function monter(type: 'adhesion' | 'don' | 'archive' = 'don') {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <FormulaireSoutien type={type} paiement="Wave 07 00 00 00 00" onSucces={() => {}} />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => deposer.mockReset())

describe('FormulaireSoutien', () => {
  it('affiche un champ montant pour un don, pas pour une archive', () => {
    const { unmount } = monter('don')
    expect(screen.getByLabelText(/montant/i)).toBeInTheDocument()
    unmount()
    monter('archive')
    expect(screen.queryByLabelText(/montant/i)).not.toBeInTheDocument()
  })

  it('affiche le message d’erreur renvoyé par l’action', async () => {
    deposer.mockResolvedValue({ ok: false, erreur: 'emailInvalide' })
    monter('don')
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/adresse/i)
  })

  it('affiche la confirmation et les moyens de paiement après succès', async () => {
    deposer.mockResolvedValue({ ok: true })
    monter('don')
    await userEvent.type(screen.getByLabelText(/nom/i), 'Test')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /envoyer/i }))
    expect(await screen.findByText(/Wave 07 00 00 00 00/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/soutenir/__tests__/FormulaireSoutien.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Ajouter les traductions**

Dans `i18n/messages/fr.json`, à la racine :

```json
"soutien": {
  "adhesion": "Adhérer à l'association",
  "don": "Faire un don",
  "archive": "Confier une archive",
  "nom": "Nom",
  "email": "Adresse e-mail",
  "telephone": "Téléphone",
  "montant": "Montant (F CFA)",
  "message": "Message",
  "messageArchive": "Décrivez ce que vous détenez",
  "envoyer": "Envoyer",
  "envoi": "Envoi…",
  "merci": "Merci, votre demande est enregistrée.",
  "paiement": "Pour finaliser :",
  "erreurNomRequis": "Le nom est requis.",
  "erreurEmailInvalide": "Cette adresse e-mail n'est pas valide.",
  "erreurMontantInvalide": "Le montant doit être un nombre supérieur à zéro.",
  "erreurTypeInvalide": "Type de demande inconnu.",
  "erreurEchec": "L'enregistrement a échoué. Veuillez réessayer."
},
```

Dans `en.json`, à la racine :

```json
"soutien": {
  "adhesion": "Join the association",
  "don": "Make a donation",
  "archive": "Entrust an archive",
  "nom": "Name",
  "email": "Email address",
  "telephone": "Phone",
  "montant": "Amount (CFA francs)",
  "message": "Message",
  "messageArchive": "Describe what you hold",
  "envoyer": "Send",
  "envoi": "Sending…",
  "merci": "Thank you, your request has been recorded.",
  "paiement": "To complete:",
  "erreurNomRequis": "A name is required.",
  "erreurEmailInvalide": "This email address is not valid.",
  "erreurMontantInvalide": "The amount must be a number greater than zero.",
  "erreurTypeInvalide": "Unknown request type.",
  "erreurEchec": "Saving failed. Please try again."
},
```

- [ ] **Step 4 : Créer `components/soutenir/FormulaireSoutien.tsx`**

```tsx
'use client'

import { useState, useTransition } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { deposerDemande } from '@/app/[locale]/actions/soutien'
import type { TypeDemande } from '@/app/[locale]/actions/soutien'

const champ =
  'w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'
const styleChamp = { borderColor: 'var(--line)', color: 'var(--ink)' }

export function FormulaireSoutien({
  type,
  paiement,
  onSucces,
}: {
  type: TypeDemande
  paiement: string
  onSucces?: () => void
}) {
  const t = useTranslations('soutien')
  const locale = useLocale()
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)
  const [enCours, demarrer] = useTransition()

  if (envoye) {
    return (
      <div className="space-y-4">
        <p style={{ color: 'var(--ink)' }}>{t('merci')}</p>
        <p className="text-sm" style={{ color: 'var(--soft)' }}>
          {t('paiement')}
        </p>
        <p className="whitespace-pre-line text-sm" style={{ color: 'var(--ink)' }}>
          {paiement}
        </p>
      </div>
    )
  }

  function soumettre(formData: FormData) {
    setErreur(null)
    demarrer(async () => {
      formData.set('type', type)
      formData.set('langue', locale)
      const r = await deposerDemande(formData)
      if (r.ok) {
        setEnvoye(true)
        onSucces?.()
        return
      }
      // Les clés d'erreur de l'action correspondent aux clés de traduction
      // préfixées : erreur → erreurEmailInvalide, etc.
      const cle = `erreur${r.erreur.charAt(0).toUpperCase()}${r.erreur.slice(1)}`
      setErreur(t(cle))
    })
  }

  return (
    <form action={soumettre} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
          {t('nom')}
        </span>
        <input name="nom" required className={champ} style={styleChamp} />
      </label>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
          {t('email')}
        </span>
        <input name="email" type="email" required className={champ} style={styleChamp} />
      </label>

      {type !== 'don' && (
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
            {t('telephone')}
          </span>
          <input name="telephone" type="tel" className={champ} style={styleChamp} />
        </label>
      )}

      {type === 'don' && (
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
            {t('montant')}
          </span>
          <input name="montant" inputMode="decimal" className={champ} style={styleChamp} />
        </label>
      )}

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--soft)' }}>
          {type === 'archive' ? t('messageArchive') : t('message')}
        </span>
        <textarea name="message" rows={4} className={champ} style={styleChamp} />
      </label>

      {erreur && (
        <p role="alert" className="text-sm" style={{ color: 'var(--terra)' }}>
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="rounded-full px-6 py-3 text-sm font-semibold transition disabled:opacity-60"
        style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
      >
        {enCours ? t('envoi') : t('envoyer')}
      </button>
    </form>
  )
}
```

- [ ] **Step 5 : Créer `components/soutenir/ContexteSoutien.tsx`**

```tsx
'use client'

import { createContext, useContext, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/Modal'
import { FormulaireSoutien } from '@/components/soutenir/FormulaireSoutien'
import type { TypeDemande } from '@/app/[locale]/actions/soutien'

type Ctx = { ouvrir: (type: TypeDemande) => void }
const ContexteSoutien = createContext<Ctx | null>(null)

// Les trois modales sont montées une seule fois, en haut de la page. Sans ce
// contexte, chaque bouton déclencheur devrait porter sa propre copie de la
// modale — trois formulaires dupliqués, et des états de saisie qui se
// perdraient à chaque changement de bloc.
export function useSoutien(): Ctx {
  const c = useContext(ContexteSoutien)
  if (!c) throw new Error('useSoutien doit être utilisé dans <FournisseurSoutien>')
  return c
}

export function FournisseurSoutien({
  paiement,
  children,
}: {
  paiement: string
  children: React.ReactNode
}) {
  const t = useTranslations('soutien')
  const [type, setType] = useState<TypeDemande | null>(null)

  return (
    <ContexteSoutien.Provider value={{ ouvrir: setType }}>
      {children}
      {(['adhesion', 'don', 'archive'] as const).map((x) => (
        <Modal key={x} ouvert={type === x} onFermer={() => setType(null)} titre={t(x)}>
          {/* La clé force le remontage à chaque ouverture : sans elle, un
              formulaire déjà envoyé rouvrirait sur son écran de confirmation. */}
          <FormulaireSoutien key={`${x}-${type === x}`} type={x} paiement={paiement} />
        </Modal>
      ))}
    </ContexteSoutien.Provider>
  )
}
```

- [ ] **Step 6 : Lancer le test**

Run: `npx vitest run components/soutenir/__tests__/FormulaireSoutien.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7 : Commit**

```bash
git add components/soutenir i18n/messages
git commit -m "feat(accueil): formulaire de soutien et ses trois modales"
```

---

## Règle de transposition (Tasks 9 à 13)

Les blocs visuels sont transposés depuis `docs/design-ref/Accueil PAACIV.dc.html`. Pour chacun, ouvrir la plage de lignes indiquée et appliquer **exactement** ces substitutions, sans rien changer d'autre à la composition, aux espacements ni aux durées :

| Dans la référence | Dans le code |
|---|---|
| `var(--gold)` | `var(--accent)` |
| `'Instrument Serif',serif` | `var(--font-fraunces), serif` |
| `Karla,sans-serif` | `var(--font-inter), sans-serif` |
| `style="…"` (chaîne CSS) | `style={{ … }}` en camelCase, ou classes Tailwind quand l'équivalent est exact |
| `style-hover="…"` | classe Tailwind `hover:` équivalente |
| `onClick="{{ noop }}"` | vraie destination (voir table §5.4 de la spec) |
| `href="#ancre"` | route réelle ou `useSoutien().ouvrir(...)` |
| URLs Wikimedia en dur | données Supabase |
| textes en dur | `texte(textes, 'cle', locale)` ou données |

Les valeurs `clamp()`, les `cubic-bezier`, les durées et les délais `data-d` sont **repris tels quels**. Ne pas « arrondir » une valeur du design.

Les attributs `data-rv`, `data-clip`, `data-line`, `data-d`, `data-count`, `data-par` sont conservés : ils sont lus par `Revelations` (Task 2).

**Plages de lignes de la référence :**

| Bloc | Lignes |
|---|---|
| header | 58–82 |
| hero | 84–149 |
| carte Film | 150–169 |
| marquee villes | 170–179 |
| l'association | 180–220 |
| notre travail | 222–243 |
| pourquoi nous suivre | 245–267 |
| ce que nous faisons | 269–323 |
| cinq raisons | 325–352 |
| agenda | 354–387 |
| parallaxe | 389–398 |
| archive photographique | 400–473 |
| témoignages | 475–524 |
| journal | 526–570 |
| newsletter | 572–581 |
| footer | 583–626 |
| logique JS (référence pour les comportements) | 631–861 |

---

### Task 9 : Header, menu mobile et pied de page

**Files:**
- Modify: `components/SiteHeader.tsx` (réécriture complète)
- Create: `components/MenuMobile.tsx`
- Modify: `components/SiteFooter.tsx` (réécriture complète)
- Modify: `app/[locale]/layout.tsx`
- Modify: `i18n/messages/fr.json`, `i18n/messages/en.json`
- Test: `tests/navigation.spec.ts`

**Interfaces:**
- Consumes: `<BasculeTheme />` (Task 1), `useSoutien()` (Task 8), `chargerTextes()` / `texte()` (Task 6).
- Produces: `<SiteHeader />` (Server Component, lit les textes), `<MenuMobile entrees={...} />`, `<SiteFooter />`.

- [ ] **Step 1 : Écrire le test e2e qui échoue**

Créer `tests/navigation.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

const ENTREES = [
  { libelle: 'La carte', url: '/fr/carte' },
  { libelle: "L'archive", url: '/fr/archives' },
  { libelle: 'Architectes', url: '/fr/architectes' },
  { libelle: 'Journal', url: '/fr/articles' },
  { libelle: 'Reportages', url: '/fr/reportages' },
  { libelle: 'Agenda', url: '/fr/evenements' },
]

test.describe('navigation de bureau', () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  for (const e of ENTREES) {
    test(`« ${e.libelle} » mène à ${e.url}`, async ({ page }) => {
      await page.goto('/fr')
      await page.getByRole('navigation', { name: /principale/i }).getByRole('link', { name: e.libelle }).click()
      await expect(page).toHaveURL(new RegExp(`${e.url}$`))
    })
  }

  test('aucun lien mort ne subsiste dans l’en-tête et le pied de page', async ({ page }) => {
    await page.goto('/fr')
    const hrefs = await page.locator('header a, footer a').evaluateAll((as) =>
      as.map((a) => a.getAttribute('href') ?? ''),
    )
    for (const mort of ['/a-propos', '/contact', '/conditions-utilisation']) {
      expect(hrefs.some((h) => h.includes(mort)), mort).toBe(false)
    }
    expect(hrefs.some((h) => h === '#' || h === '')).toBe(false)
  })
})

test.describe('navigation mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('le menu s’ouvre, navigue et se ferme à Échap', async ({ page }) => {
    await page.goto('/fr')
    const panneau = page.getByRole('dialog', { name: /menu/i })
    await expect(panneau).toBeHidden()

    await page.getByRole('button', { name: /ouvrir le menu/i }).click()
    await expect(panneau).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(panneau).toBeHidden()

    await page.getByRole('button', { name: /ouvrir le menu/i }).click()
    await panneau.getByRole('link', { name: 'La carte' }).click()
    await expect(page).toHaveURL(/\/fr\/carte$/)
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx playwright test tests/navigation.spec.ts --project=e2e`
Expected: FAIL — libellés et bouton de menu absents.

- [ ] **Step 3 : Mettre à jour les traductions**

Dans `i18n/messages/fr.json`, remplacer le bloc `"nav"` par :

```json
"nav": {
  "carte": "La carte",
  "archives": "L'archive",
  "architectes": "Architectes",
  "articles": "Journal",
  "reportages": "Reportages",
  "evenements": "Agenda",
  "adherer": "Adhérer",
  "principale": "Navigation principale",
  "ouvrirMenu": "Ouvrir le menu",
  "fermerMenu": "Fermer le menu",
  "menu": "Menu"
},
```

et le bloc `"footer"` par :

```json
"footer": {
  "naviguer": "Naviguer",
  "joindre": "Nous joindre",
  "suivre": "Suivre",
  "langue": "Langue",
  "droits": "Tous droits réservés.",
  "credits": "Photographies : PAACIV et contributeurs."
},
```

Dans `en.json`, mêmes clés :

```json
"nav": {
  "carte": "The map",
  "archives": "The archive",
  "architectes": "Architects",
  "articles": "Journal",
  "reportages": "Films",
  "evenements": "Calendar",
  "adherer": "Join",
  "principale": "Main navigation",
  "ouvrirMenu": "Open menu",
  "fermerMenu": "Close menu",
  "menu": "Menu"
},
```

```json
"footer": {
  "naviguer": "Browse",
  "joindre": "Contact us",
  "suivre": "Follow",
  "langue": "Language",
  "droits": "All rights reserved.",
  "credits": "Photographs: PAACIV and contributors."
},
```

> Les clés `actualites`, `apropos`, `contact`, `recherche`, `explorer`, `infos`, `suivezNous`, `conditions` et `description` disparaissent : elles ne servaient qu'aux liens morts et au bouton loupe, tous retirés (spec §9).

- [ ] **Step 4 : Créer `components/MenuMobile.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BasculeTheme } from '@/components/ui/BasculeTheme'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

export type Entree = { href: string; cle: string }

export function MenuMobile({ entrees }: { entrees: readonly Entree[] }) {
  const t = useTranslations('nav')
  const { ouvrir } = useSoutien()
  const [ouvert, setOuvert] = useState(false)

  // Échap ferme, et le corps ne défile plus derrière le panneau : sans ce
  // verrou, le fond continue de scroller sous le doigt sur iOS.
  useEffect(() => {
    if (!ouvert) return
    function auClavier(e: KeyboardEvent) {
      if (e.key === 'Escape') setOuvert(false)
    }
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', auClavier)
    return () => {
      document.body.style.overflow = precedent
      document.removeEventListener('keydown', auClavier)
    }
  }, [ouvert])

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={t('ouvrirMenu')}
        aria-expanded={ouvert}
        className="flex flex-col gap-1.5 p-2 lg:hidden"
      >
        <span aria-hidden="true" className="block h-px w-6 bg-current" />
        <span aria-hidden="true" className="block h-px w-6 bg-current" />
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
        hidden={!ouvert}
        className="fixed inset-0 z-[80] flex flex-col justify-between p-8"
        style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOuvert(false)}
            aria-label={t('fermerMenu')}
            className="p-2 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <nav aria-label={t('principale')}>
          <ul className="space-y-4">
            {entrees.map((e, i) => (
              <li
                key={e.cle}
                style={{
                  animation: ouvert ? `drop .5s cubic-bezier(.16,1,.3,1) ${i * 60}ms both` : undefined,
                }}
              >
                <Link
                  href={e.href}
                  onClick={() => setOuvert(false)}
                  className="text-4xl transition hover:opacity-70"
                  style={{ fontFamily: 'var(--font-fraunces), serif' }}
                >
                  {t(e.cle)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setOuvert(false)
              ouvrir('adhesion')
            }}
            className="rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
          >
            {t('adherer')}
          </button>
          <div className="flex items-center gap-4">
            <BasculeTheme className="p-2" />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 5 : Réécrire `components/SiteHeader.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BasculeTheme } from '@/components/ui/BasculeTheme'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { MenuMobile, type Entree } from '@/components/MenuMobile'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

// Six entrées, une par rubrique du site. Les ancres du design (#archive,
// #journal…) sont remplacées par les vraies routes : le header est partagé
// par toutes les pages, où ces ancres ne mèneraient nulle part.
const ENTREES: readonly Entree[] = [
  { href: '/carte', cle: 'carte' },
  { href: '/archives', cle: 'archives' },
  { href: '/architectes', cle: 'architectes' },
  { href: '/articles', cle: 'articles' },
  { href: '/reportages', cle: 'reportages' },
  { href: '/evenements', cle: 'evenements' },
] as const

export function SiteHeader() {
  const t = useTranslations('nav')
  const { ouvrir } = useSoutien()
  const [opaque, setOpaque] = useState(false)

  // Le header devient opaque une fois le hero dépassé (85 % de la hauteur
  // d'écran, comme la référence ligne 700+). Sur les pages sans hero, la
  // valeur est franchie presque immédiatement, ce qui est le comportement
  // voulu : fond lisible dès le premier défilement.
  useEffect(() => {
    function auScroll() {
      setOpaque(window.scrollY > window.innerHeight * 0.85)
    }
    window.addEventListener('scroll', auScroll, { passive: true })
    auScroll()
    return () => window.removeEventListener('scroll', auScroll)
  }, [])

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-6 px-5 py-4 backdrop-blur-[14px] transition-[background-color] duration-500 sm:px-8 lg:px-14"
      style={{
        background: opaque ? 'color-mix(in oklab, var(--bg) 82%, transparent)' : 'transparent',
        color: opaque ? 'var(--ink)' : 'var(--onDeep)',
      }}
    >
      <Link href="/" className="flex items-center gap-3" style={{ color: 'inherit' }}>
        <span
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center border text-[15px]"
          style={{ borderColor: 'currentColor', fontFamily: 'var(--font-fraunces), serif' }}
        >
          P
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-wide">PAACIV</span>
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">
            Patrimoine · Côte d&apos;Ivoire
          </span>
        </span>
      </Link>

      <nav aria-label={t('principale')} className="hidden lg:block">
        <ul className="flex items-center gap-7 text-sm">
          {ENTREES.map((e) => (
            <li key={e.cle}>
              <Link href={e.href} className="transition hover:text-[var(--accent)]" style={{ color: 'inherit' }}>
                {t(e.cle)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex lg:items-center lg:gap-3">
          <LanguageSwitcher />
          <BasculeTheme className="rounded-full border p-2 transition hover:bg-[var(--accent)] hover:text-[oklch(0.15_0.012_45)]" />
          <button
            type="button"
            onClick={() => ouvrir('adhesion')}
            className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
            style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
          >
            {t('adherer')}
          </button>
        </div>
        <MenuMobile entrees={ENTREES} />
      </div>
    </header>
  )
}
```

- [ ] **Step 6 : Réécrire `components/SiteFooter.tsx`**

Transposer les lignes 583–626 de la référence. Quatre colonnes : identité (logo + description), *Naviguer* (les 6 entrées), *Nous joindre* (adresse, e-mail, téléphone), *Suivre* + *Langue*. Barre de copyright en bas.

Le composant devient un **Server Component asynchrone** qui lit `chargerTextes()` :

```tsx
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { chargerTextes, texte } from '@/lib/data/contenu-site'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const ENTREES = [
  { href: '/carte', cle: 'carte' },
  { href: '/archives', cle: 'archives' },
  { href: '/architectes', cle: 'architectes' },
  { href: '/articles', cle: 'articles' },
  { href: '/reportages', cle: 'reportages' },
  { href: '/evenements', cle: 'evenements' },
] as const

const RESEAUX = [
  { libelle: 'Instagram', href: 'https://www.instagram.com/paaciv' },
  { libelle: 'LinkedIn', href: 'https://www.linkedin.com/company/paaciv' },
] as const

export async function SiteFooter() {
  const t = await getTranslations('nav')
  const tf = await getTranslations('footer')
  const locale = await getLocale()
  const textes = await chargerTextes()

  const email = texte(textes, 'footer_email', locale)

  return (
    <footer
      id="contact"
      className="px-5 pb-10 pt-16 sm:px-8 lg:px-14 lg:pt-24"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto grid max-w-7xl gap-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-2xl">PAACIV</p>
          <p className="mt-4 text-sm opacity-70">{texte(textes, 'footer_description', locale)}</p>
        </div>

        <div>
          <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('naviguer')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {ENTREES.map((e) => (
              <li key={e.cle}>
                <Link href={e.href} className="transition hover:text-[var(--accent)]" style={{ color: 'inherit' }}>
                  {t(e.cle)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('joindre')}</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="opacity-80">{texte(textes, 'footer_adresse', locale)}</li>
            <li>
              {/* Un e-mail non renseigné ne doit pas produire un `mailto:` vide
                  et cliquable : on rend alors le texte brut. */}
              {email.startsWith('À COMPLÉTER') ? (
                <span className="opacity-80">{email}</span>
              ) : (
                <a href={`mailto:${email}`} className="transition hover:text-[var(--accent)]" style={{ color: 'inherit' }}>
                  {email}
                </a>
              )}
            </li>
            <li className="opacity-80">{texte(textes, 'footer_telephone', locale)}</li>
          </ul>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('suivre')}</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {RESEAUX.map((r) => (
                <li key={r.libelle}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="transition hover:text-[var(--accent)]"
                    style={{ color: 'inherit' }}
                  >
                    {r.libelle}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.24em] opacity-60">{tf('langue')}</h2>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      <div
        className="mx-auto mt-16 flex max-w-7xl flex-wrap justify-between gap-3 border-t pt-6 text-xs opacity-60"
        style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 20%, transparent)' }}
      >
        <span>© {new Date().getFullYear()} PAACIV — {tf('droits')}</span>
        <span>{tf('credits')}</span>
      </div>
    </footer>
  )
}
```

- [ ] **Step 7 : Adapter le layout**

Dans `app/[locale]/layout.tsx` : envelopper le contenu dans `<FournisseurSoutien>` (le header et le menu mobile appellent `useSoutien`), et compenser le header devenu fixe par un `padding-top` sur le `<body>`.

```tsx
const textes = await chargerTextes()
const paiement = texte(textes, 'soutien_paiement', locale)
// …
<NextIntlClientProvider>
  <FournisseurSoutien paiement={paiement}>
    <Grain />
    <Revelations />
    <SiteHeader />
    {children}
    <SiteFooter />
  </FournisseurSoutien>
</NextIntlClientProvider>
```

> **Report de la Task 1 (défaut mineur relevé en revue).** Ajouter `data-scroll-behavior="smooth"` sur le `<html>` de ce même fichier. Sans cet attribut, Next 16 avertit à chaque chargement (`Detected 'scroll-behavior: smooth' on the <html> element`) et désactive silencieusement le défilement doux pendant les transitions de route — le `scroll-behavior: smooth` posé par `globals.css` en Task 1 ne s'applique alors qu'aux ancres, pas à la navigation.

> **Le layout lit désormais Supabase.** `chargerTextes()` est un simple `fetch`, pas une API dynamique de Next : sans précaution, le layout serait prérendu au build et les textes du pied de page y seraient figés — exactement le bug déjà rencontré côté architectes, mais déplacé dans le layout où le flag de page ne l'atteint pas. Ajouter `export const dynamic = 'force-dynamic'` dans `app/[locale]/layout.tsx`, et vérifier après `npm run build` que la sortie ne marque aucune route en statique (`○`).

> Le hero de l'accueil passe **sous** le header (fond sombre plein écran, c'est voulu). Les autres pages doivent au contraire dégager la barre : ajouter `pt-20` sur leur `<main>` plutôt qu'un padding global, pour ne pas créer un bandeau vide en haut de l'accueil.

Appliquer `pt-20` au `<main>` de : `admin/layout.tsx`, `carte/page.tsx`, `archives/page.tsx`, `architectes/page.tsx`, `articles/page.tsx`, `reportages/page.tsx`, `evenements/page.tsx`, `patrimoine/[slug]/page.tsx`, `architectes/[slug]/page.tsx`, `articles/[slug]/page.tsx`, `reportages/[slug]/page.tsx`, `evenements/[slug]/page.tsx`, `login/page.tsx`.

- [ ] **Step 8 : Lancer les tests**

Run: `npx playwright test tests/navigation.spec.ts --project=e2e`
Expected: PASS (8 tests).

- [ ] **Step 9 : Vérifier l'absence de régression**

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npx playwright test --project=e2e`
Expected: tout passe. Le test `tests/shell.spec.ts` référence peut-être les anciens libellés de navigation — le mettre à jour si nécessaire, sans affaiblir son intention.

- [ ] **Step 10 : Commit**

```bash
git add components/SiteHeader.tsx components/SiteFooter.tsx components/MenuMobile.tsx "app/[locale]" i18n/messages tests/navigation.spec.ts
git commit -m "feat(accueil): en-tête fixe à six entrées, menu mobile plein écran, pied de page du design"
```

---

### Task 10 : Hero, carte Film et bandeau des villes

**Files:**
- Create: `components/accueil/Hero.tsx`
- Create: `components/accueil/CarteFilm.tsx`
- Create: `components/accueil/BandeauVilles.tsx`
- Test: `components/accueil/__tests__/Hero.test.tsx`

**Interfaces:**
- Consumes: `vedettesHero()`, `chargerTextes()` / `texte()` (Task 6), `listeReportages()` et `miniatureReportage()` de `lib/data/reportages.ts`, `useSoutien()` (Task 8).
- Produces: `<Hero vedettes={VedetteHero[]} titre={string} intro={string} />`, `<CarteFilm />` (async), `<BandeauVilles villes={string[]} />`.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `components/accueil/__tests__/Hero.test.tsx` :

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Hero } from '@/components/accueil/Hero'
import type { VedetteHero } from '@/lib/data/accueil'

vi.mock('@/components/soutenir/ContexteSoutien', () => ({
  useSoutien: () => ({ ouvrir: vi.fn() }),
}))

const VEDETTES: VedetteHero[] = [
  { slug: 'kong', titre_fr: 'Grande mosquée de Kong', titre_en: null, ville: 'Kong', date_texte: 'XVIIIᵉ siècle', image: 'https://x/1.jpg' },
  { slug: 'bassam', titre_fr: 'Mairie de Grand-Bassam', titre_en: null, ville: 'Grand-Bassam', date_texte: '1895', image: 'https://x/2.jpg' },
]

function monter(vedettes = VEDETTES) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Hero vedettes={vedettes} titre="Ce qui tient debout" intro="Nous documentons." />
    </NextIntlClientProvider>,
  )
}

describe('Hero', () => {
  it('affiche le titre en un seul h1', () => {
    monter()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ce qui tient debout')
  })

  it('affiche une vignette par vedette et la légende de la première', () => {
    monter()
    expect(screen.getAllByRole('button', { name: /voir/i })).toHaveLength(2)
    expect(screen.getByTestId('hero-legende')).toHaveTextContent('Grande mosquée de Kong')
  })

  it('change la légende au clic sur une vignette', async () => {
    monter()
    await userEvent.click(screen.getAllByRole('button', { name: /voir/i })[1])
    expect(screen.getByTestId('hero-legende')).toHaveTextContent('Mairie de Grand-Bassam')
  })

  it('reste affichable sans aucune vedette', () => {
    monter([])
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /voir/i })).toHaveLength(0)
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/accueil/__tests__/Hero.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Ajouter les traductions**

`fr.json`, à la racine :

```json
"accueil": {
  "accroche": "Découvrir le patrimoine de la Côte d'Ivoire",
  "explorer": "Explorer l'archive",
  "soutenir": "Soutenir l'association",
  "voirVedette": "Voir {titre}",
  "vues": "Vues",
  "defiler": "Défiler",
  "film": "Film",
  "toutArchive": "Toute l'archive — {n} fiches",
  "ouvrirCarte": "Ouvrir la carte",
  "edifices": "{n} édifices géolocalisés",
  "voirProgramme": "Voir le programme",
  "confierArchive": "Confier une archive",
  "precedent": "Précédent",
  "suivant": "Suivant",
  "lire": "Lire",
  "voir": "Voir",
  "tous": "Tout",
  "chantiers": "Chantiers",
  "adherer": "Adhérer",
  "don": "Faire un don",
  "rejoindre": "Rejoindre",
  "donner": "Donner",
  "chiffreFiches": "Fiches",
  "chiffreVilles": "Communes",
  "chiffreArchitectes": "Architectes",
  "chiffreArticles": "Publications",
  "sInscrire": "S'inscrire",
  "votreEmail": "Votre adresse e-mail",
  "merciNewsletter": "Merci, vous êtes inscrit."
},
```

`en.json`, mêmes clés, traduites : `"explorer": "Explore the archive"`, `"soutenir": "Support us"`, `"voirVedette": "View {titre}"`, `"vues": "Views"`, `"defiler": "Scroll"`, `"film": "Film"`, `"toutArchive": "The whole archive — {n} records"`, `"ouvrirCarte": "Open the map"`, `"edifices": "{n} geolocated buildings"`, `"voirProgramme": "See the programme"`, `"confierArchive": "Entrust an archive"`, `"precedent": "Previous"`, `"suivant": "Next"`, `"lire": "Read"`, `"voir": "View"`, `"tous": "All"`, `"chantiers": "Worksites"`, `"adherer": "Join"`, `"don": "Donate"`, `"rejoindre": "Join us"`, `"donner": "Give"`, `"chiffreFiches": "Records"`, `"chiffreVilles": "Towns"`, `"chiffreArchitectes": "Architects"`, `"chiffreArticles": "Publications"`, `"sInscrire": "Subscribe"`, `"votreEmail": "Your email address"`, `"merciNewsletter": "Thank you, you are subscribed."`

- [ ] **Step 4 : Créer `components/accueil/Hero.tsx`**

Client component. Transposer les lignes 84–149 de la référence. Comportement repris de la logique JS lignes ~660–700 : rotation toutes les 6 500 ms, redémarrage du minuteur au clic sur une vignette, légende en fondu (opacité 0 puis texte remplacé après 260 ms), halo `radial-gradient` de 520 px suivant le curseur.

Points à respecter :

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'
import type { VedetteHero } from '@/lib/data/accueil'

const INTERVALLE = 6500

export function Hero({
  vedettes,
  titre,
  intro,
}: {
  vedettes: VedetteHero[]
  titre: string
  intro: string
}) {
  const t = useTranslations('accueil')
  const locale = useLocale()
  const { ouvrir } = useSoutien()
  const [actif, setActif] = useState(0)
  const section = useRef<HTMLElement>(null)
  const lampe = useRef<HTMLDivElement>(null)

  // Rotation automatique. La dépendance sur `actif` remet le minuteur à zéro
  // après un clic manuel : sans cela, l'image choisie pourrait sauter au bout
  // de quelques centaines de millisecondes.
  useEffect(() => {
    if (vedettes.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setActif((i) => (i + 1) % vedettes.length), INTERVALLE)
    return () => window.clearInterval(id)
  }, [actif, vedettes.length])

  // Halo suivant le curseur. Écrit directement dans le style plutôt que via
  // un état React : à 60 images par seconde, un setState par mouvement de
  // souris ferait re-rendre tout le hero.
  useEffect(() => {
    const s = section.current
    const l = lampe.current
    if (!s || !l) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    function auMouvement(e: MouseEvent) {
      const r = s!.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      l!.style.background = `radial-gradient(520px circle at ${x}% ${y}%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 68%)`
    }
    s.addEventListener('mousemove', auMouvement)
    return () => s.removeEventListener('mousemove', auMouvement)
  }, [])

  const courante = vedettes[actif]

  return (
    <section
      id="top"
      ref={section}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
      style={{ background: 'var(--deep)' }}
    >
      {/* … images empilées (opacité 1 sur l'active, scale 1.04), voile
          var(--veil), lampe, titre h1 en Fraunces avec clamp(46px,8.4vw,142px),
          intro, les deux CTA, les pastilles de villes, le rail de vignettes,
          la légende, l'indicateur « Défiler » — cf. lignes 84–149. */}
      <p data-testid="hero-legende">
        {courante ? champ(courante.titre_fr, courante.titre_en, locale) : null}
      </p>
    </section>
  )
}
```

Exigences précises pour l'implémentation complète :

- Un seul `<h1>` sur toute la page, portant `titre`, avec `data-clip` pour la révélation.
- Les images : `<img>` empilées en `absolute inset-0 object-cover`, `filter: var(--imgf)`, transition d'opacité 1,2 s et de `transform` 8 s.
- Le CTA « Explorer l'archive » est un `<Link href="/archives">`.
- Le CTA « Soutenir l'association » est un `<button onClick={() => ouvrir('don')}>`.
- Chaque vignette est un `<button>` avec `aria-label={t('voirVedette', { titre })}` et `aria-pressed={i === actif}`.
- La bordure de la vignette active vaut `var(--accent)`, les autres `color-mix(in oklab, var(--onDeep) 30%, transparent)`.
- Les pastilles de villes reprennent les villes des vedettes (`vedettes.map(v => v.ville)` dédoublonnées), pas une liste en dur.
- L'indicateur « Défiler » est un lien d'ancre vers `#association`.
- `vedettes.length === 0` : afficher le titre, l'intro et les CTA sur le fond `var(--deep)`, sans rail ni légende.

- [ ] **Step 5 : Créer `components/accueil/CarteFilm.tsx`**

Server Component asynchrone. Transposer les lignes 150–169 : carte flottante en `margin-top: -88px`, `z-index: 8`, largeur `min(430px, 100%)`, fond `var(--bg2)`, vignette 132×88 avec bouton lecture et anneau pulsé.

```tsx
import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { listeReportages, miniatureReportage } from '@/lib/data/reportages'
import { champ } from '@/lib/i18n-champ'

export async function CarteFilm() {
  const t = await getTranslations('accueil')
  const locale = await getLocale()
  const [dernier] = await listeReportages()
  // Aucun reportage publié : la carte disparaît plutôt que d'afficher un
  // cadre vide qui déséquilibrerait le raccord hero / bandeau.
  if (!dernier) return null

  const vignette = miniatureReportage(dernier.video_url)
  return (
    <div className="relative z-[8] -mt-[88px] px-5 sm:px-8 lg:px-14">
      <Link
        href={`/reportages/${dernier.slug}`}
        data-rv=""
        className="flex w-[min(430px,100%)] items-center gap-4 rounded border p-4 transition hover:-translate-y-1"
        style={{ background: 'var(--bg2)', borderColor: 'var(--line)', color: 'var(--ink)' }}
      >
        {/* vignette + pastille ▶ + anneau `animation: pulse 2s infinite` */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--soft)' }}>
            {t('film')}
          </p>
          <p className="font-serif text-xl">{champ(dernier.titre_fr, dernier.titre_en, locale)}</p>
          <p className="mt-1.5 text-[13px]" style={{ color: 'var(--soft)' }}>
            {champ(dernier.description_fr, dernier.description_en, locale)}
          </p>
        </div>
      </Link>
    </div>
  )
}
```

> `miniatureReportage` renvoie `null` sur une URL non YouTube : prévoir un aplat `var(--bg3)` en repli plutôt qu'un `<img src={null}>`.

- [ ] **Step 6 : Créer `components/accueil/BandeauVilles.tsx`**

Server Component. Transposer les lignes 170–179 : deux copies de la liste dans un conteneur `w-max` animé par `mq 38s linear infinite`, la seconde en `aria-hidden` (elle n'existe que pour rendre la boucle continue). Séparateur `✦` en `var(--terra)`. Ajouter `data-mq` sur le conteneur animé pour que la règle `prefers-reduced-motion` de la Task 1 le neutralise.

Si moins de trois villes sont disponibles, ne pas rendre le bandeau : un marquee de deux mots tourne de façon absurde.

- [ ] **Step 7 : Lancer le test**

Run: `npx vitest run components/accueil/__tests__/Hero.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 8 : Commit**

```bash
git add components/accueil i18n/messages
git commit -m "feat(accueil): hero à rotation, carte film et bandeau des villes"
```

---

### Task 11 : L'association, compteurs, notre travail, pourquoi nous suivre

**Files:**
- Create: `components/accueil/Association.tsx`
- Create: `components/accueil/Compteurs.tsx`
- Create: `components/accueil/CartesSoutien.tsx`
- Create: `components/accueil/NotreTravail.tsx`
- Create: `components/accueil/PourquoiNousSuivre.tsx`
- Test: `components/accueil/__tests__/Compteurs.test.tsx`

**Interfaces:**
- Consumes: `chiffresCles()`, `listePointsCles('pourquoi')`, `chargerTextes()` / `texte()`, `useSoutien()`.
- Produces: `<Association textes={Textes} chiffres={Chiffres} montant={string} />`, `<Compteurs chiffres={Chiffres} />`, `<CartesSoutien montant={string} />`, `<NotreTravail textes={Textes} />`, `<PourquoiNousSuivre points={PointCle[]} titre={string} />`.

> `Association` reçoit `montant` et le transmet tel quel à `CartesSoutien` : la carte « Adhérer » l'affiche, mais `Association` reste un Server Component et ne peut donc pas appeler `useSoutien` elle-même.

- [ ] **Step 1 : Écrire le test qui échoue**

Créer `components/accueil/__tests__/Compteurs.test.tsx` :

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Compteurs } from '@/components/accueil/Compteurs'

function monter() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Compteurs chiffres={{ fiches: 8, villes: 5, architectes: 7, articles: 6 }} />
    </NextIntlClientProvider>,
  )
}

describe('Compteurs', () => {
  it('expose la cible en data-count pour le moteur d’animation', () => {
    monter()
    const cibles = screen.getAllByTestId('compteur').map((el) => el.getAttribute('data-count'))
    expect(cibles).toEqual(['8', '5', '7', '6'])
  })

  it('affiche 0 au rendu serveur, avant animation', () => {
    monter()
    expect(screen.getAllByTestId('compteur').every((el) => el.textContent === '0')).toBe(true)
  })

  it('affiche les quatre libellés', () => {
    monter()
    for (const l of ['Fiches', 'Communes', 'Architectes', 'Publications']) {
      expect(screen.getByText(l)).toBeInTheDocument()
    }
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/accueil/__tests__/Compteurs.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Créer `components/accueil/Compteurs.tsx`**

```tsx
import { useTranslations } from 'next-intl'
import type { Chiffres } from '@/lib/data/accueil'

// Server Component : la valeur part à 0 dans le HTML et c'est Revelations
// (Task 2) qui l'anime jusqu'à `data-count` à l'entrée dans le viewport.
// Aucun JavaScript n'est expédié pour ce bloc.
export function Compteurs({ chiffres }: { chiffres: Chiffres }) {
  const t = useTranslations('accueil')
  const lignes = [
    { valeur: chiffres.fiches, libelle: t('chiffreFiches') },
    { valeur: chiffres.villes, libelle: t('chiffreVilles') },
    { valeur: chiffres.architectes, libelle: t('chiffreArchitectes') },
    { valeur: chiffres.articles, libelle: t('chiffreArticles') },
  ]

  return (
    <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
      {lignes.map((l) => (
        <div key={l.libelle}>
          <dd
            data-count={l.valeur}
            data-testid="compteur"
            className="font-serif text-5xl"
            style={{ color: 'var(--terra)' }}
          >
            0
          </dd>
          <dt className="mt-2 text-[11px] uppercase tracking-[0.2em]" style={{ color: 'var(--soft)' }}>
            {l.libelle}
          </dt>
        </div>
      ))}
    </dl>
  )
}
```

- [ ] **Step 4 : Lancer le test**

Run: `npx vitest run components/accueil/__tests__/Compteurs.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5 : Créer `components/accueil/CartesSoutien.tsx`**

Client component (il appelle `useSoutien`). Transposer les trois cartes des lignes ~200–219 : *Chantiers*, *Adhérer*, *Faire un don*.

- Carte *Chantiers* → `<Link href="/articles">` libellé `t('voir')`.
- Carte *Adhérer* → `<button onClick={() => ouvrir('adhesion')}>` libellé `t('rejoindre')`. Le texte affiche `montant` (issu de `contenu_site.soutien_adhesion_montant`).
- Carte *Faire un don* → `<button onClick={() => ouvrir('don')}>` libellé `t('donner')`.

- [ ] **Step 6 : Créer `components/accueil/Association.tsx`**

Server Component. Transposer les lignes 180–220 : surtitre, `<h2>` en `clamp(38px,5.6vw,86px)` avec `data-rv data-d="80"`, paragraphe, `<Compteurs />`, `<CartesSoutien />`.

- [ ] **Step 7 : Créer `components/accueil/NotreTravail.tsx`**

Server Component. Transposer les lignes 222–243 : surtitre, titre, paragraphe, les deux sous-blocs *Relevé* et *Récit*, et le lien « En savoir plus ↗ » → `<Link href="/archives">`.

- [ ] **Step 8 : Créer `components/accueil/PourquoiNousSuivre.tsx`**

Server Component. Transposer les lignes 245–267 : titre en `clamp(26px,2.8vw,40px)`, grille de quatre entrées avec filet `data-line` et délais `data-d` échelonnés de 0, 60, 120, 180 ms.

Rendre `null` si `points` est vide.

- [ ] **Step 9 : Vérifier**

Run: `npm run lint && npx tsc --noEmit && npx vitest run`
Expected: tout passe.

- [ ] **Step 10 : Commit**

```bash
git add components/accueil
git commit -m "feat(accueil): bloc association, compteurs animés, notre travail et arguments"
```

---

### Task 12 : Activités, aperçu de carte carré, cinq raisons, agenda, appel à archives

**Files:**
- Create: `lib/carte-style.ts`
- Modify: `components/carte/CarteClient.tsx:15-22` (extraction des constantes)
- Create: `components/accueil/Activites.tsx`
- Create: `components/accueil/ApercuCarte.tsx`
- Create: `components/accueil/CinqRaisons.tsx`
- Create: `components/accueil/Agenda.tsx`
- Create: `components/accueil/AppelArchives.tsx`
- Test: `components/accueil/__tests__/Activites.test.tsx`
- Test: `tests/accueil-carte.spec.ts`

**Interfaces:**
- Consumes: `listeActivites()`, `listePointsCles('raisons')`, `listeEvenements()` + `partitionnerEvenements()`, `chiffresCles()`, `chargerReferences()`, `useSoutien()`.
- Produces: `<Activites activites={Activite[]} surtitre={string} titre={string} intro={string} />`, `<ApercuCarte types={Ref[]} nombre={number} surtitre={string} titre={string} texte={string} />`, `<CinqRaisons points={PointCle[]} textes={Textes} />`, `<Agenda evenements={EvenementListItem[]} textes={Textes} />`, `<AppelArchives texte={string} />`. Constantes `STYLE_CARTE` et `COULEUR_DEFAUT` exportées par `lib/carte-style.ts` — `SATELLITE_TILES` et `SATELLITE_ATTR` restent dans `CarteClient`, l'aperçu n'ayant pas de bascule satellite.

> `ApercuCarte` reçoit ses trois textes déjà résolus dans la locale, et non l'objet `Textes` : c'est un client component, lui passer la table entière expédierait au navigateur les quarante textes de la page, dont ceux des blocs rendus côté serveur.

- [ ] **Step 1 : Écrire le test des onglets**

Créer `components/accueil/__tests__/Activites.test.tsx` :

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Activites } from '@/components/accueil/Activites'
import type { Activite } from '@/lib/data/accueil'

const A: Activite[] = [
  { id: '1', titre_fr: 'Inventaire', titre_en: null, cadence_fr: 'Toute l’année', cadence_en: null, description_fr: 'Campagnes mensuelles.', description_en: null, cta_libelle_fr: 'Consulter', cta_libelle_en: null, cta_href: '/archives', image: null },
  { id: '2', titre_fr: 'Visites', titre_en: null, cadence_fr: 'Deux samedis', cadence_en: null, description_fr: 'Marche commentée.', description_en: null, cta_libelle_fr: 'Voir', cta_libelle_en: null, cta_href: '/evenements', image: null },
]

function monter(activites = A) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Activites activites={activites} surtitre="Nos activités" titre="Ce que nous faisons" intro="" />
    </NextIntlClientProvider>,
  )
}

describe('Activites', () => {
  it('expose un onglet par activité, le premier sélectionné', () => {
    monter()
    const onglets = screen.getAllByRole('tab')
    expect(onglets).toHaveLength(2)
    expect(onglets[0]).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Campagnes mensuelles.')).toBeVisible()
  })

  it('change de panneau au clic', async () => {
    monter()
    await userEvent.click(screen.getAllByRole('tab')[1])
    expect(screen.getByText('Marche commentée.')).toBeVisible()
    expect(screen.queryByText('Campagnes mensuelles.')).not.toBeInTheDocument()
  })

  it('le CTA du panneau pointe vers la route de l’activité', async () => {
    monter()
    expect(screen.getByRole('link', { name: /consulter/i })).toHaveAttribute('href', '/fr/archives')
  })

  it('ne rend rien sans activité', () => {
    const { container } = monter([])
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/accueil/__tests__/Activites.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Extraire les constantes de carte**

Créer `lib/carte-style.ts` en déplaçant les lignes 15–22 de `components/carte/CarteClient.tsx` :

```ts
// Style de fond partagé par la carte plein écran et l'aperçu de l'accueil.
// Extrait de CarteClient pour que les deux ne divergent jamais : un aperçu
// qui n'aurait pas le même fond que la carte réelle serait un mensonge visuel.
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY

export const STYLE_CARTE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : 'https://tiles.openfreemap.org/styles/liberty'

export const COULEUR_DEFAUT = '#8A3E1B'
```

Puis, dans `CarteClient.tsx`, importer `STYLE_CARTE` et `COULEUR_DEFAUT` et supprimer les déclarations locales `STYLE` et les `'#8A3E1B'` en dur. Laisser `SATELLITE_TILES` et `SATELLITE_ATTR` dans `CarteClient` : l'aperçu n'a pas de bascule satellite.

- [ ] **Step 4 : Créer `components/accueil/ApercuCarte.tsx`**

Client component. Bloc **ajouté** au design (spec §3.3) : le reprendre dans son esthétique — section sombre, surtitre, titre en Fraunces, texte, puis le carré.

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Map } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { STYLE_CARTE, COULEUR_DEFAUT } from '@/lib/carte-style'
import type { Ref } from '@/lib/data/patrimoine'

// Cadrage sur la Côte d'Ivoire. Fixe plutôt que calculé sur les points : un
// `fitBounds` sur trois fiches d'Abidjan zoomerait sur un quartier et le bloc
// perdrait sa lecture « territoire ».
const CENTRE: [number, number] = [-5.55, 7.54]
const ZOOM = 5.4

export function ApercuCarte({
  types,
  nombre,
  surtitre,
  titre,
  texte,
}: {
  types: Ref[]
  nombre: number
  surtitre: string
  titre: string
  texte: string
}) {
  const t = useTranslations('accueil')
  const conteneur = useRef<HTMLDivElement>(null)
  const [pret, setPret] = useState(false)

  useEffect(() => {
    if (!conteneur.current) return
    const map = new Map({
      container: conteneur.current,
      style: STYLE_CARTE,
      center: CENTRE,
      zoom: ZOOM,
      attributionControl: { compact: true },
      // La carte est décorative : sans ce réglage, un défilement de page qui
      // passe sur le carré zoomerait la carte au lieu de continuer la page.
      scrollZoom: false,
      dragRotate: false,
      keyboard: false,
    })

    const couleurParType = types.flatMap((ty) => [ty.id, ty.couleur ?? COULEUR_DEFAUT])

    map.on('load', async () => {
      const reponse = await fetch('/api/carte/points')
      const geojson = await reponse.json()
      map.addSource('points', { type: 'geojson', data: geojson })
      map.addLayer({
        id: 'points',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 5,
          'circle-color':
            couleurParType.length > 0
              ? (['match', ['get', 'type_id'], ...couleurParType, COULEUR_DEFAUT] as never)
              : COULEUR_DEFAUT,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': 'rgba(255,255,255,.8)',
        },
      })
      setPret(true)
    })

    return () => map.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialisation unique au montage ; `types` capturé par closure, il ne change pas après le rendu serveur.
  }, [])

  return (
    <section
      className="px-5 py-20 sm:px-8 lg:px-14 lg:py-32"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p data-rv="" className="text-[10px] uppercase tracking-[0.24em] opacity-60">{surtitre}</p>
        <h2 data-rv="" data-d="60" className="mt-3 font-serif text-4xl lg:text-6xl">{titre}</h2>
        <p data-rv="" data-d="120" className="mt-5 opacity-75">{texte}</p>
      </div>

      <div
        data-rv=""
        data-d="180"
        className="mx-auto mt-12 w-[min(720px,100%)] overflow-hidden rounded border"
        style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 22%, transparent)' }}
      >
        {/* Carré strict, demandé explicitement. `aspect-square` + hauteur
            pilotée par la largeur : MapLibre a besoin d'un conteneur mesuré. */}
        <div ref={conteneur} className="aspect-square w-full" aria-label={t('edifices', { n: nombre })} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm opacity-70" aria-live="polite">
          {pret ? t('edifices', { n: nombre }) : null}
        </p>
        <Link
          href="/carte"
          className="rounded-full px-8 py-4 text-sm font-semibold transition hover:-translate-y-0.5"
          style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
        >
          {t('ouvrirCarte')}
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 5 : Écrire le test e2e de la carte**

Créer `tests/accueil-carte.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

test('le conteneur de carte de l’accueil est carré', async ({ page }) => {
  await page.goto('/fr')
  const carte = page.locator('.maplibregl-map').first()
  await carte.scrollIntoViewIfNeeded()
  await expect(carte).toBeVisible()
  const b = await carte.boundingBox()
  expect(b).not.toBeNull()
  // Tolérance d'un pixel : les arrondis sous-pixel du navigateur.
  expect(Math.abs(b!.width - b!.height)).toBeLessThanOrEqual(1)
})

test('« Ouvrir la carte » mène à la carte plein écran', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('link', { name: /ouvrir la carte/i }).click()
  await expect(page).toHaveURL(/\/fr\/carte$/)
})
```

- [ ] **Step 6 : Créer `components/accueil/Activites.tsx`**

Client component. Transposer les lignes 269–323 en motif d'onglets accessible : `role="tablist"` / `role="tab"` avec `aria-selected` et `aria-controls`, `role="tabpanel"` avec `aria-labelledby`. Flèches gauche/droite pour naviguer entre onglets au clavier.

Le panneau affiche : cadence en surtitre, titre en Fraunces `clamp(24px,2.4vw,34px)`, description, image, et le CTA `<Link href={cta_href}>` portant `cta_libelle`.

Rendre `null` si `activites` est vide.

- [ ] **Step 7 : Créer `components/accueil/CinqRaisons.tsx`**

Server Component. Transposer les lignes 325–352 : section `var(--deep)`, titre, liste numérotée `01`…`05` (numéro dérivé de l'index, pas stocké en base), délais `data-d` échelonnés, et le bouton « Voir le programme » → `<Link href="/evenements">`.

Rendre `null` si `points` est vide.

- [ ] **Step 8 : Créer `components/accueil/Agenda.tsx`**

Server Component. Transposer les lignes 354–387 : section `var(--deep)`, titre, puis une ligne par événement à venir — titre, lieu, date au format `JJ.MM`, lien « Voir » → `/evenements/[slug]`.

- Prendre les événements **à venir** via `partitionnerEvenements(await listeEvenements())`, limités à quatre.
- Le design affiche des prix (« 7 000 F ») et des mentions « Complet » : la table `evenements` n'a ni l'un ni l'autre. **Ne pas les inventer** — la colonne correspondante affiche le lieu.
- Formater la date avec `Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', timeZone: 'UTC' })`. Le `timeZone: 'UTC'` est indispensable : `date_debut` est une colonne `date`, un fuseau local décalerait l'affichage d'un jour.
- Si aucun événement à venir, afficher le titre et un état vide, et non un bloc vide.

- [ ] **Step 9 : Créer `components/accueil/AppelArchives.tsx`**

Client component. Transposer les lignes 389–398 : bande de `clamp(360px,42vw,540px)` de haut, image de fond en parallaxe (`data-par="0.12"`), voile `var(--veil)`, texte centré, et le bouton « Confier une archive » → `ouvrir('archive')`.

- [ ] **Step 10 : Lancer les tests**

Run: `npx vitest run components/accueil/__tests__/Activites.test.tsx`
Expected: PASS (4 tests).

> Le test e2e `tests/accueil-carte.spec.ts` échouera tant que la page n'est pas assemblée (Task 14). C'est attendu.

- [ ] **Step 11 : Commit**

```bash
git add lib/carte-style.ts components/carte/CarteClient.tsx components/accueil tests/accueil-carte.spec.ts
git commit -m "feat(accueil): activités en onglets, aperçu de carte carré, raisons, agenda et appel à archives"
```

---

### Task 13 : Grille d'archive, témoignages, journal, newsletter

**Files:**
- Create: `components/accueil/GrilleArchive.tsx`
- Create: `components/accueil/Temoignages.tsx`
- Create: `components/accueil/Journal.tsx`
- Create: `components/accueil/Newsletter.tsx`
- Test: `components/accueil/__tests__/GrilleArchive.test.tsx`
- Test: `components/accueil/__tests__/Newsletter.test.tsx`

**Interfaces:**
- Consumes: `vignettesArchive()`, `listeTemoignages()`, `listeArticles()`, `chiffresCles()`, `chargerReferences()`, `inscrireNewsletter()`.
- Produces: `<GrilleArchive vignettes={VignetteArchive[]} types={Ref[]} total={number} surtitre={string} titre={string} />`, `<Temoignages temoignages={Temoignage[]} surtitre={string} titre={string} />`, `<Journal articles={ArticleListItem[]} surtitre={string} titre={string} />`, `<Newsletter titre={string} texte={string} />`.

> Ces quatre blocs sont des client components : ils reçoivent leurs libellés déjà résolus dans la locale, jamais l'objet `Textes` complet. Passer la table entière expédierait au navigateur les quarante textes de la page, dont ceux des blocs rendus côté serveur. Même règle que pour `ApercuCarte` (Task 12).

- [ ] **Step 1 : Écrire le test de la grille**

Créer `components/accueil/__tests__/GrilleArchive.test.tsx` :

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { GrilleArchive } from '@/components/accueil/GrilleArchive'
import type { VignetteArchive } from '@/lib/data/accueil'
import type { Ref } from '@/lib/data/patrimoine'

const TYPES: Ref[] = [
  { id: 'religieux', nom_fr: 'Religieux', nom_en: null, couleur: '#B5581F', ordre: 1 },
  { id: 'civil', nom_fr: 'Civil', nom_en: null, couleur: '#46603F', ordre: 2 },
]

const V: VignetteArchive[] = [
  { slug: 'kong', titre_fr: 'Mosquée de Kong', titre_en: null, ville: 'Kong', type_id: 'religieux', image: 'https://x/1.jpg' },
  { slug: 'mairie', titre_fr: 'Mairie de Bassam', titre_en: null, ville: 'Grand-Bassam', type_id: 'civil', image: 'https://x/2.jpg' },
]

function monter(vignettes = V) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <GrilleArchive vignettes={vignettes} types={TYPES} total={8} surtitre="Collections" titre="Archive photographique" />
    </NextIntlClientProvider>,
  )
}

describe('GrilleArchive', () => {
  it('affiche toutes les vignettes, chacune liée à sa fiche', () => {
    monter()
    expect(screen.getByRole('link', { name: /Mosquée de Kong/ })).toHaveAttribute('href', '/fr/patrimoine/kong')
    expect(screen.getByRole('link', { name: /Mairie de Bassam/ })).toHaveAttribute('href', '/fr/patrimoine/mairie')
  })

  it('filtre par type et revient à tout', async () => {
    monter()
    await userEvent.click(screen.getByRole('button', { name: 'Religieux' }))
    expect(screen.queryByText('Mairie de Bassam')).not.toBeInTheDocument()
    expect(screen.getByText('Mosquée de Kong')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tout' }))
    expect(screen.getByText('Mairie de Bassam')).toBeInTheDocument()
  })

  it('n’affiche que les filtres réellement représentés', () => {
    monter([V[0]])
    expect(screen.getByRole('button', { name: 'Religieux' })).toBeInTheDocument()
    // Un filtre qui ne renverrait jamais rien est un piège pour l'utilisateur.
    expect(screen.queryByRole('button', { name: 'Civil' })).not.toBeInTheDocument()
  })

  it('le bouton final porte le total réel et mène aux archives', () => {
    monter()
    const lien = screen.getByRole('link', { name: /8 fiches/ })
    expect(lien).toHaveAttribute('href', '/fr/archives')
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run components/accueil/__tests__/GrilleArchive.test.tsx`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Créer `components/accueil/GrilleArchive.tsx`**

Client component (les filtres sont interactifs). Transposer les lignes 400–473 **en remplaçant la mosaïque par une grille régulière** (spec §3.4) :

- Filtres en pastilles arrondies : `Tout` + un bouton par type **effectivement présent** dans `vignettes`. Bouton actif : fond `var(--ink)`, texte `var(--bg)`. Inactif : bordure `var(--line)`, fond transparent, survol `border-color: var(--terra)`.
- Grille : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `gap: clamp(10px,1.4vw,20px)`.
- Chaque vignette : `<Link href={/patrimoine/${slug}}>` contenant un cadre `aspect-[4/3] overflow-hidden rounded-[4px]` avec `<img className="h-full w-full object-cover" style={{ filter: 'var(--imgf)' }}>`, puis une `<figcaption>` de 11 px en `var(--soft)` — titre localisé et ville.
- Animation : chaque `<figure>` porte `data-rv` et `data-d={(i % 8) * 60}`. Le modulo évite qu'une grille de trente vignettes finisse avec deux secondes de délai sur les dernières.
- Survol : `hover:-translate-y-2` sur le cadre, transition 600 ms.
- Bouton final : `<Link href="/archives">` libellé `t('toutArchive', { n: total })`.
- Les trois pastilles décoratives flottantes des lignes 409–411 sont conservées, en `aria-hidden`.

- [ ] **Step 4 : Créer `components/accueil/Temoignages.tsx`**

Client component (carrousel). Transposer les lignes 475–524 : surtitre, titre, flèches précédent/suivant, carte avec initiale, nom, rôle, citation et note en étoiles.

- **Rendre `null` si `temoignages` est vide** — c'est le cas au départ (spec §4.4), et un carrousel vide avec ses flèches serait un bug visible.
- Flèches : `<button>` avec `aria-label={t('precedent')}` / `t('suivant')`, désactivées aux extrémités.
- La note est rendue en texte accessible (`aria-label="5 sur 5"`) doublé d'étoiles `aria-hidden`.

- [ ] **Step 5 : Créer `components/accueil/Journal.tsx`**

Client component (carrousel). Transposer les lignes 526–570 : surtitre, titre, flèches, trois cartes d'article.

Chaque carte : catégorie + date en surtitre, titre en Fraunces `clamp(24px,2.4vw,36px)`, chapô, lien « Lire » → `/articles/[slug]`. La date est formatée avec `timeZone: 'UTC'`, comme partout ailleurs dans le projet.

Rendre `null` si `articles` est vide.

- [ ] **Step 6 : Écrire le test de la newsletter**

Créer `components/accueil/__tests__/Newsletter.test.tsx` :

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Newsletter } from '@/components/accueil/Newsletter'

const inscrire = vi.hoisted(() => vi.fn())
vi.mock('@/app/[locale]/actions/newsletter', () => ({ inscrireNewsletter: inscrire }))

function monter() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Newsletter titre="Recevoir nos relevés" texte="Une lettre par mois." />
    </NextIntlClientProvider>,
  )
}

beforeEach(() => inscrire.mockReset())

describe('Newsletter', () => {
  it('affiche la confirmation après un succès', async () => {
    inscrire.mockResolvedValue({ ok: true })
    monter()
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'a@b.ci')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(await screen.findByRole('status')).toHaveTextContent(/merci/i)
  })

  it('affiche l’erreur renvoyée par l’action', async () => {
    inscrire.mockResolvedValue({ ok: false, erreur: 'emailInvalide' })
    monter()
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'x')
    await userEvent.click(screen.getByRole('button', { name: /s'inscrire/i }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
```

- [ ] **Step 7 : Créer `components/accueil/Newsletter.tsx`**

Client component. Transposer les lignes 572–581 : section `var(--bg3)`, centrée, titre, texte, puis un formulaire e-mail + bouton.

Structure attendue : `<form action={...}>` appelant `inscrireNewsletter`, champ `<input name="email" type="email" required>` étiqueté par `t('votreEmail')`, champ caché `langue` valant la locale, bouton `t('sInscrire')`. Succès → `<p role="status">{t('merciNewsletter')}</p>`. Échec → `<p role="alert">` avec le message de `soutien.erreurEmailInvalide` ou `soutien.erreurEchec`.

- [ ] **Step 8 : Lancer les tests**

Run: `npx vitest run components/accueil`
Expected: PASS (tous les tests des blocs).

- [ ] **Step 9 : Commit**

```bash
git add components/accueil
git commit -m "feat(accueil): grille d'archive régulière, témoignages, journal et newsletter"
```

---

### Task 14 : Assemblage de la page et parcours de bout en bout

**Files:**
- Modify: `app/[locale]/page.tsx` (réécriture complète)
- Delete: `app/[locale]/page.test.tsx`
- Test: `tests/accueil.spec.ts`

**Interfaces:**
- Consumes: tous les composants des Tasks 10 à 13 et toute la couche de lecture.
- Produces: la page `/[locale]` complète.

- [ ] **Step 1 : Écrire le test e2e qui échoue**

Créer `tests/accueil.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

test('la page affiche ses blocs dans l’ordre du design', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Un seul h1 sur la page : les quinze autres blocs sont des h2.
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  for (const id of ['top', 'association', 'archive', 'agenda', 'journal', 'contact']) {
    await expect(page.locator(`#${id}`)).toHaveCount(1)
  }
})

test('aucun lien mort ni bouton inerte sur toute la page', async ({ page }) => {
  await page.goto('/fr')
  const hrefs = await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  expect(hrefs.some((h) => h === '#' || h === '')).toBe(false)
})

test('les vignettes d’archive mènent aux fiches', async ({ page }) => {
  await page.goto('/fr')
  const vignette = page.locator('#archive a[href*="/patrimoine/"]').first()
  await vignette.scrollIntoViewIfNeeded()
  await vignette.click()
  await expect(page).toHaveURL(/\/fr\/patrimoine\/[^/]+$/)
})

test('la modale d’adhésion s’ouvre depuis l’en-tête et se ferme à Échap', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr')
  await page.getByRole('button', { name: 'Adhérer', exact: true }).click()
  const modale = page.getByRole('dialog', { name: /adhérer à l'association/i })
  await expect(modale).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(modale).toBeHidden()
})

test('un don déposé depuis le hero est enregistré', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('button', { name: /soutenir l'association/i }).click()
  const modale = page.getByRole('dialog', { name: /faire un don/i })
  await modale.getByLabel(/^nom$/i).fill('Test Playwright')
  await modale.getByLabel(/adresse e-mail/i).fill(`e2e-don-${Date.now()}@exemple.ci`)
  await modale.getByLabel(/montant/i).fill('10000')
  await modale.getByRole('button', { name: /envoyer/i }).click()
  await expect(modale.getByText(/merci/i)).toBeVisible()
})

test('l’inscription à la newsletter confirme', async ({ page }) => {
  await page.goto('/fr')
  const section = page.locator('#adherer')
  await section.scrollIntoViewIfNeeded()
  await section.getByLabel(/adresse e-mail/i).fill(`e2e-news-${Date.now()}@exemple.ci`)
  await section.getByRole('button', { name: /s'inscrire/i }).click()
  await expect(section.getByRole('status')).toBeVisible()
})

test('la version anglaise rend la page sans texte français résiduel', async ({ page }) => {
  await page.goto('/en')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explore the archive' })).toBeVisible()
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx playwright test tests/accueil.spec.ts --project=e2e`
Expected: FAIL — la page n'a qu'un titre.

- [ ] **Step 3 : Réécrire `app/[locale]/page.tsx`**

```tsx
import { setRequestLocale } from 'next-intl/server'
import { chargerTextes, texte } from '@/lib/data/contenu-site'
import {
  chiffresCles, listeActivites, listePointsCles, listeTemoignages,
  vedettesHero, vignettesArchive, villesArchive,
} from '@/lib/data/accueil'
import { listeArticles } from '@/lib/data/articles'
import { listeEvenements } from '@/lib/data/evenements'
import { partitionnerEvenements } from '@/lib/evenements-dates'
import { chargerReferences } from '@/lib/data/references'
import { Hero } from '@/components/accueil/Hero'
import { CarteFilm } from '@/components/accueil/CarteFilm'
import { BandeauVilles } from '@/components/accueil/BandeauVilles'
import { Association } from '@/components/accueil/Association'
import { NotreTravail } from '@/components/accueil/NotreTravail'
import { PourquoiNousSuivre } from '@/components/accueil/PourquoiNousSuivre'
import { Activites } from '@/components/accueil/Activites'
import { ApercuCarte } from '@/components/accueil/ApercuCarte'
import { CinqRaisons } from '@/components/accueil/CinqRaisons'
import { Agenda } from '@/components/accueil/Agenda'
import { AppelArchives } from '@/components/accueil/AppelArchives'
import { GrilleArchive } from '@/components/accueil/GrilleArchive'
import { Temoignages } from '@/components/accueil/Temoignages'
import { Journal } from '@/components/accueil/Journal'
import { Newsletter } from '@/components/accueil/Newsletter'

// La page lit Supabase et n'a pas de segment dynamique : sans ce flag, Next
// la prérend au build et aucun contenu publié ensuite n'y apparaît jamais
// (bug déjà rencontré côté architectes, puis articles).
export const dynamic = 'force-dynamic'

export default async function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  // Un seul palier d'attente : ces lectures sont indépendantes, les
  // enchaîner en série multiplierait le temps de rendu par dix.
  const [
    textes, vedettes, villes, chiffres, pourquoi, raisons,
    activites, references, evenements, vignettes, temoignages, articles,
  ] = await Promise.all([
    chargerTextes(),
    vedettesHero(5),
    villesArchive(),
    chiffresCles(),
    listePointsCles('pourquoi'),
    listePointsCles('raisons'),
    listeActivites(),
    chargerReferences(),
    listeEvenements(),
    vignettesArchive(12),
    listeTemoignages(),
    listeArticles(),
  ])

  const { aVenir } = partitionnerEvenements(evenements)
  const tx = (cle: string) => texte(textes, cle, locale)

  return (
    <main className="flex-1">
      <Hero vedettes={vedettes} titre={tx('hero_titre')} intro={tx('hero_intro')} />
      <CarteFilm />
      <BandeauVilles villes={villes} />
      <Association textes={textes} chiffres={chiffres} montant={tx('soutien_adhesion_montant')} />
      <NotreTravail textes={textes} />
      <PourquoiNousSuivre points={pourquoi} titre={tx('pourquoi_titre')} />
      <Activites
        activites={activites}
        surtitre={tx('activites_surtitre')}
        titre={tx('activites_titre')}
        intro={tx('activites_intro')}
      />
      <ApercuCarte
        types={references.types}
        nombre={chiffres.fiches}
        surtitre={tx('carte_surtitre')}
        titre={tx('carte_titre')}
        texte={tx('carte_texte')}
      />
      <CinqRaisons points={raisons} textes={textes} />
      <Agenda evenements={aVenir.slice(0, 4)} textes={textes} />
      <AppelArchives texte={tx('parallaxe_texte')} />
      <GrilleArchive
        vignettes={vignettes}
        types={references.types}
        total={chiffres.fiches}
        surtitre={tx('archive_surtitre')}
        titre={tx('archive_titre')}
      />
      <Temoignages
        temoignages={temoignages}
        surtitre={tx('temoignages_surtitre')}
        titre={tx('temoignages_titre')}
      />
      <Journal
        articles={articles.slice(0, 3)}
        surtitre={tx('journal_surtitre')}
        titre={tx('journal_titre')}
      />
      <Newsletter titre={tx('newsletter_titre')} texte={tx('newsletter_texte')} />
    </main>
  )
}
```

> `chargerReferences()` utilise `createServerClient()` (donc les cookies) alors que la page est publique. Vérifier qu'elle fonctionne hors session ; si ce n'est pas le cas, ajouter dans `lib/data/references.ts` une variante `chargerReferencesPubliques()` bâtie sur `createReadClient()`, et l'utiliser ici.

- [ ] **Step 4 : Supprimer l'ancien test de page**

```bash
git rm "app/[locale]/page.test.tsx"
```

> Ce test vérifiait que la page affichait `accueil.accroche` dans un `[data-testid="accroche"]`. La page n'a plus ni cet élément ni ce rôle : le conserver reviendrait à figer un comportement disparu. Sa couverture est reprise, en plus large, par `tests/accueil.spec.ts`.

- [ ] **Step 5 : Lancer les tests**

Run: `npx playwright test tests/accueil.spec.ts tests/accueil-carte.spec.ts --project=e2e`
Expected: PASS (9 tests).

- [ ] **Step 6 : Vérification complète**

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build && npx playwright test --project=e2e`
Expected: tout passe, y compris les suites des phases 1 à 4.

- [ ] **Step 7 : Comparaison visuelle**

Ouvrir côte à côte `http://localhost:4599` (référence, via `node "docs/design-ref/server.cjs"`) et `http://localhost:3100/fr`. Vérifier bloc par bloc : ordre, espacements verticaux, tailles de titres, épaisseur des filets, comportement des animations au défilement, rendu en mode clair **et** en mode sombre, et aux largeurs 390 px, 768 px et 1440 px.

Les écarts attendus et acceptables : les polices (Fraunces/Inter au lieu d'Instrument Serif/Karla), les teintes d'accent (ocre brûlé au lieu du jaune), la grille d'archive régulière au lieu de la mosaïque, et le bloc carte supplémentaire. Tout autre écart est un défaut de transposition à corriger.

- [ ] **Step 8 : Commit**

```bash
git add "app/[locale]/page.tsx" tests/accueil.spec.ts
git commit -m "feat(accueil): assemblage des seize blocs et parcours de bout en bout"
```

---

### Task 15 : Back-office des nouveaux contenus

**Files:**
- Create: `app/[locale]/admin/contenu/{page.tsx,actions.ts}`
- Create: `app/[locale]/admin/points-cles/{page.tsx,actions.ts}`
- Create: `app/[locale]/admin/activites/{page.tsx,actions.ts}`
- Create: `app/[locale]/admin/temoignages/{page.tsx,actions.ts}`
- Create: `app/[locale]/admin/abonnes/page.tsx`
- Create: `app/[locale]/admin/demandes/{page.tsx,actions.ts}`
- Create: `lib/csv.ts`
- Modify: `app/[locale]/admin/page.tsx`
- Test: `lib/__tests__/csv.test.ts`
- Test: `tests/admin-accueil.spec.ts`

**Interfaces:**
- Consumes: `createServerClient()`, `texteOuNull()` / `intOuNull()` de `lib/admin/champs.ts`, les tables de la Task 4.
- Produces: `enregistrerContenu`, `enregistrerPointCle`, `supprimerPointCle`, `enregistrerActivite`, `supprimerActivite`, `enregistrerTemoignage`, `supprimerTemoignage`, `marquerDemandeTraitee`. Fonction `versCsv(lignes: Record<string, string | number | null>[]): string`.

- [ ] **Step 1 : Écrire le test CSV qui échoue**

Créer `lib/__tests__/csv.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { versCsv } from '@/lib/csv'

describe('versCsv', () => {
  it('écrit l’en-tête puis les lignes', () => {
    expect(versCsv([{ email: 'a@b.ci', langue: 'fr' }])).toBe('email,langue\r\na@b.ci,fr')
  })

  it('échappe les guillemets, virgules et sauts de ligne', () => {
    const csv = versCsv([{ nom: 'Diaby, Souleymane', message: 'Il a dit "oui"\nhier' }])
    expect(csv).toContain('"Diaby, Souleymane"')
    expect(csv).toContain('"Il a dit ""oui""\nhier"')
  })

  it('rend une cellule vide pour null', () => {
    expect(versCsv([{ a: null, b: 1 }])).toBe('a,b\r\n,1')
  })

  it('renvoie une chaîne vide sans ligne', () => {
    expect(versCsv([])).toBe('')
  })
})
```

- [ ] **Step 2 : Lancer le test pour vérifier qu'il échoue**

Run: `npx vitest run lib/__tests__/csv.test.ts`
Expected: FAIL — module introuvable.

- [ ] **Step 3 : Créer `lib/csv.ts`**

```ts
// Export CSV minimal (RFC 4180). Écrit à la main plutôt qu'avec une
// dépendance : quatre lignes de code contre un paquet de plus à maintenir.
function cellule(v: string | number | null): string {
  if (v === null) return ''
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function versCsv(lignes: Record<string, string | number | null>[]): string {
  if (lignes.length === 0) return ''
  const colonnes = Object.keys(lignes[0])
  const entete = colonnes.join(',')
  const corps = lignes.map((l) => colonnes.map((c) => cellule(l[c] ?? null)).join(','))
  return [entete, ...corps].join('\r\n')
}
```

- [ ] **Step 4 : Lancer le test**

Run: `npx vitest run lib/__tests__/csv.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5 : Ajouter les traductions d'admin**

`fr.json`, à la racine :

```json
"adminContenu": {
  "titre": "Contenu du site",
  "cle": "Clé", "valeurFr": "Valeur (FR)", "valeurEn": "Valeur (EN)",
  "enregistrer": "Enregistrer", "enregistre": "Enregistré.",
  "erreurEnregistrement": "L'enregistrement a échoué. Veuillez réessayer.",
  "aCompleter": "Cette valeur est encore un marqueur À COMPLÉTER."
},
"adminPointsCles": {
  "titre": "Points clés", "nouveau": "Nouveau point clé", "editer": "Éditer",
  "supprimer": "Supprimer", "confirmer": "Supprimer définitivement ce point clé ?",
  "bloc": "Bloc", "pourquoi": "Pourquoi nous suivre", "raisons": "Cinq raisons",
  "colonneTitre": "Titre", "ordre": "Ordre", "statut": "Statut",
  "brouillon": "Brouillon", "publie": "Publié", "aucun": "Aucun point clé.",
  "texte": "Texte", "ongletFr": "Français", "ongletEn": "English",
  "enregistrer": "Enregistrer", "erreurTitreRequis": "Le titre (FR) est requis.",
  "erreurEnregistrement": "L'enregistrement a échoué. Veuillez réessayer."
},
"adminActivites": {
  "titre": "Activités", "nouveau": "Nouvelle activité", "editer": "Éditer",
  "supprimer": "Supprimer", "confirmer": "Supprimer définitivement cette activité ?",
  "colonneTitre": "Titre", "cadence": "Cadence", "description": "Description",
  "ctaLibelle": "Libellé du bouton", "ctaHref": "Destination du bouton",
  "image": "Image", "ordre": "Ordre", "statut": "Statut",
  "brouillon": "Brouillon", "publie": "Publié", "aucune": "Aucune activité.",
  "ongletFr": "Français", "ongletEn": "English", "enregistrer": "Enregistrer",
  "erreurTitreRequis": "Le titre (FR) est requis.",
  "erreurEnregistrement": "L'enregistrement a échoué. Veuillez réessayer."
},
"adminTemoignages": {
  "titre": "Témoignages", "nouveau": "Nouveau témoignage", "editer": "Éditer",
  "supprimer": "Supprimer", "confirmer": "Supprimer définitivement ce témoignage ?",
  "nom": "Nom", "role": "Rôle", "citation": "Citation", "note": "Note sur 5",
  "ordre": "Ordre", "statut": "Statut", "brouillon": "Brouillon", "publie": "Publié",
  "aucun": "Aucun témoignage. Le bloc reste masqué sur l'accueil tant qu'il n'y en a pas.",
  "ongletFr": "Français", "ongletEn": "English", "enregistrer": "Enregistrer",
  "erreurNomRequis": "Le nom est requis.", "erreurCitationRequise": "La citation (FR) est requise.",
  "erreurEnregistrement": "L'enregistrement a échoué. Veuillez réessayer."
},
"adminAbonnes": {
  "titre": "Abonnés", "email": "Adresse e-mail", "langue": "Langue",
  "date": "Inscrit le", "aucun": "Aucun abonné.", "exporter": "Exporter en CSV",
  "total": "{n} abonné(s)"
},
"adminDemandes": {
  "titre": "Demandes", "type": "Type", "adhesion": "Adhésion", "don": "Don",
  "archive": "Archive", "tous": "Toutes", "nom": "Nom", "email": "E-mail",
  "telephone": "Téléphone", "montant": "Montant", "message": "Message",
  "date": "Reçue le", "statut": "Statut", "nouvelle": "Nouvelle",
  "traitee": "Traitée", "marquerTraitee": "Marquer comme traitée",
  "aucune": "Aucune demande."
},
```

`en.json` : mêmes clés, traduites.

- [ ] **Step 6 : Créer l'écran `contenu`**

`app/[locale]/admin/contenu/page.tsx` — Server Component, `export const dynamic = 'force-dynamic'`. Lit toutes les lignes de `contenu_site` triées par `cle`, et rend un formulaire par clé (`<input name="valeur_fr">`, `<input name="valeur_en">`, champ caché `cle`).

Grouper visuellement par préfixe de clé (`hero_`, `association_`, `travail_`, `pourquoi_`, `activites_`, `carte_`, `raisons_`, `agenda_`, `parallaxe_`, `archive_`, `temoignages_`, `journal_`, `newsletter_`, `footer_`, `soutien_`) : quarante champs à plat sont inutilisables.

Signaler visuellement les valeurs commençant par `À COMPLÉTER` avec `adminContenu.aCompleter` — ce sont précisément celles listées en §8 de la spec.

`actions.ts` :

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull } from '@/lib/admin/champs'

export type ResultatContenu = { ok: true } | { ok: false; erreur: 'echec' }

export async function enregistrerContenu(formData: FormData): Promise<ResultatContenu> {
  const cle = (formData.get('cle') ?? '').toString()
  if (!cle) return { ok: false, erreur: 'echec' }

  const sb = await createServerClient()
  const { error } = await sb
    .from('contenu_site')
    .update({
      valeur_fr: texteOuNull(formData.get('valeur_fr')),
      valeur_en: texteOuNull(formData.get('valeur_en')),
    })
    .eq('cle', cle)
  if (error) return { ok: false, erreur: 'echec' }

  revalidatePath('/[locale]/admin/contenu', 'page')
  // L'accueil et le pied de page lisent contenu_site : sans cette
  // revalidation, une correction de texte resterait invisible en production
  // jusqu'au prochain déploiement.
  revalidatePath('/[locale]', 'page')
  return { ok: true }
}
```

- [ ] **Step 7 : Créer les écrans `points-cles`, `activites` et `temoignages`**

Trois CRUD calqués sur `app/[locale]/admin/evenements/` : page de liste avec bouton « Nouveau », sous-routes `nouveau/` et `[id]/`, formulaire à onglets FR/EN, `BoutonSupprimer` avec confirmation.

Points spécifiques :
- `points-cles` : la liste est filtrable par `bloc` ; le formulaire impose un `<select name="bloc">` à deux options.
- `activites` : upload d'image dans le bucket `patrimoine`, préfixe `activites/<id>/`, en reprenant **exactement** le motif de compensation d'orphelin de `admin/articles/actions.ts:65-85` (suppression de la ligne en cas d'échec d'upload **uniquement** sur le chemin insertion).
- `temoignages` : `note` via `intOuNull`, bornée à 1–5 côté serveur avant insertion, la contrainte SQL servant de dernier rempart.

Chaque action revalide `/[locale]/admin/<section>` **et** `/[locale]`.

- [ ] **Step 8 : Créer les écrans `abonnes` et `demandes`**

`abonnes/page.tsx` — lecture seule, tri par date décroissante, compteur, et un bouton d'export qui appelle une Server Action renvoyant le CSV produit par `versCsv`.

`demandes/page.tsx` — liste filtrable par `type` via un paramètre de recherche, colonnes nom, e-mail, téléphone, montant, message, date, statut. Bouton « Marquer comme traitée ».

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function marquerDemandeTraitee(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('demandes').update({ statut: 'traitee' }).eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/demandes', 'page')
}
```

- [ ] **Step 9 : Ajouter les six liens au tableau de bord**

Dans `app/[locale]/admin/page.tsx`, ajouter les entrées vers `/admin/contenu`, `/admin/points-cles`, `/admin/activites`, `/admin/temoignages`, `/admin/abonnes` et `/admin/demandes`, sur le motif exact des cinq liens existants.

- [ ] **Step 10 : Écrire le test e2e d'admin**

Créer `tests/admin-accueil.spec.ts` :

```ts
import { test, expect } from '@playwright/test'

test('un texte modifié en admin change sur l’accueil', async ({ page }) => {
  const nouveau = `Titre de test ${Date.now()}`

  await page.goto('/fr/admin/contenu')
  const bloc = page.locator('form', { has: page.locator('input[name="cle"][value="carte_titre"]') })
  await bloc.getByLabel(/valeur \(fr\)/i).fill(nouveau)
  await bloc.getByRole('button', { name: /enregistrer/i }).click()

  await page.goto('/fr')
  await expect(page.getByText(nouveau)).toBeVisible()
})

test('une demande déposée apparaît dans l’admin', async ({ page }) => {
  const email = `e2e-admin-${Date.now()}@exemple.ci`

  await page.goto('/fr')
  await page.getByRole('button', { name: /soutenir l'association/i }).click()
  const modale = page.getByRole('dialog', { name: /faire un don/i })
  await modale.getByLabel(/^nom$/i).fill('Vérification admin')
  await modale.getByLabel(/adresse e-mail/i).fill(email)
  await modale.getByRole('button', { name: /envoyer/i }).click()
  await expect(modale.getByText(/merci/i)).toBeVisible()

  await page.goto('/fr/admin/demandes')
  await expect(page.getByText(email)).toBeVisible()
})

test('un abonné inscrit apparaît dans l’admin', async ({ page }) => {
  const email = `e2e-abonne-${Date.now()}@exemple.ci`

  await page.goto('/fr')
  const section = page.locator('#adherer')
  await section.scrollIntoViewIfNeeded()
  await section.getByLabel(/adresse e-mail/i).fill(email)
  await section.getByRole('button', { name: /s'inscrire/i }).click()
  await expect(section.getByRole('status')).toBeVisible()

  await page.goto('/fr/admin/abonnes')
  await expect(page.getByText(email)).toBeVisible()
})
```

- [ ] **Step 11 : Vérification finale**

Run: `npm run lint && npx tsc --noEmit && npx vitest run && npm run build && npx playwright test --project=e2e`
Expected: tout passe.

- [ ] **Step 12 : Commit**

```bash
git add lib/csv.ts lib/__tests__/csv.test.ts "app/[locale]/admin" i18n/messages tests/admin-accueil.spec.ts
git commit -m "feat(accueil): six écrans d'administration pour les contenus, abonnés et demandes"
```

---

## Après la livraison

1. **Renseigner les valeurs `À COMPLÉTER`** listées en §8 de la spec, depuis `/fr/admin/contenu`. La page est livrable sans, mais ne doit pas partir en production avec.
2. **Saisir les témoignages réels** depuis `/fr/admin/temoignages` — le bloc reste masqué tant qu'il n'y en a aucun, ce qui est le comportement voulu.
3. **Étape 2** — propagation de la nouvelle identité aux pages des phases 1 à 4, et arbitrage du sort de la couleur `--or`. Fera l'objet d'une spec distincte.
