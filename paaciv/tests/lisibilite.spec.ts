import { test, expect } from '@playwright/test'

// Les pages de contenu des phases 1 à 4 écrivaient leur texte avec la palette
// FIGÉE (`text-brun`, `text-encre/70`), posée sur un fond qui, lui, suit le
// thème. Le site s'ouvrant en sombre par défaut, les sous-titres de page
// étaient de l'encre sombre sur un fond sombre — illisibles (1,3:1). Elles
// passent désormais par les jetons (`text-ocre`, `text-doux`, `text-encre-t`).
//
// Ce test balaie les pages publiques dans LES DEUX thèmes : corriger le sombre
// en cassant le clair serait un échange, pas un correctif.
const PAGES = ['/fr/architectes', '/fr/archives', '/fr/articles', '/fr/evenements', '/fr/reportages', '/fr/login', '/fr/carte']

for (const chemin of PAGES) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${chemin} : aucun texte sous 4,5:1 en thème ${theme}`, async ({ page }) => {
      await page.goto(chemin)
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
      // PIÈGE DE MESURE, à ne pas réapprendre : `body` porte
      // `transition: background-color .7s ease`. Échantillonner avant la fin
      // de la transition lit une couleur INTERMÉDIAIRE et fait échouer le test
      // sur un défaut qui n'existe pas — c'est exactement ce qui m'a fait
      // croire à une régression du mode clair.
      await page.waitForTimeout(900)

      const pires = await page.evaluate(() => {
        // Conversion par le navigateur : les jetons sont en `oklch` et Chrome
        // conserve cet espace dans la valeur calculée, donc en extraire trois
        // nombres par expression régulière donne des chiffres faux.
        const c = document.createElement('canvas')
        c.width = c.height = 1
        const ctx = c.getContext('2d')!
        const rgb = (couleur: string) => {
          ctx.clearRect(0, 0, 1, 1)
          ctx.fillStyle = couleur
          ctx.fillRect(0, 0, 1, 1)
          const d = ctx.getImageData(0, 0, 1, 1).data
          return [d[0], d[1], d[2]]
        }
        const lum = ([r, g, b]: number[]) => {
          const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
        }
        // Les cartes à fond blanc portent volontairement la palette figée
        // (texte sombre sur surface claire, cohérent dans les deux thèmes) :
        // elles sont exclues, le test vise le texte posé sur le FOND DE PAGE.
        const cibles = [...document.querySelectorAll('main h1, main h2, main p, main dd, main dt, main label span')]
          .filter((e) => (e.textContent ?? '').trim().length > 2 && !e.closest('.bg-white, [data-testid="pastille-architecte"]'))
        return cibles.map((el) => {
          let n: HTMLElement | null = el as HTMLElement
          let bg = 'rgba(0, 0, 0, 0)'
          while (n && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
            bg = getComputedStyle(n).backgroundColor
            n = n.parentElement
          }
          const a = lum(rgb(getComputedStyle(el).color))
          const b = lum(rgb(bg))
          return {
            texte: (el.textContent ?? '').trim().slice(0, 40),
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          }
        }).sort((x, y) => x.ratio - y.ratio).slice(0, 5)
      })

      expect(pires.length, 'la page doit exposer du texte à mesurer').toBeGreaterThan(0)
      const fautifs = pires.filter((p) => p.ratio < 4.5)
      expect(fautifs.map((f) => `${f.texte} (${f.ratio.toFixed(2)}:1)`)).toEqual([])
    })
  }
}
