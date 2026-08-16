import { test, expect } from '@playwright/test'

test.use({ storageState: 'playwright/.auth/admin.json' })

// L'administration entière était écrite avec la palette FIGÉE des phases 1-4
// sur un fond qui, lui, suit le thème. En mode sombre — le défaut du site —
// l'écran « Contenu du site » affichait 123 champs sur 123 sous 4,5:1, le pire
// à 1,17:1 : l'exploitante ne pouvait tout simplement pas lire ce qu'elle
// tapait. Ce balayage tient les douze écrans dans les deux thèmes.
const ECRANS = [
  '/fr/admin', '/fr/admin/patrimoine', '/fr/admin/architectes', '/fr/admin/articles',
  '/fr/admin/evenements', '/fr/admin/reportages', '/fr/admin/points-cles',
  '/fr/admin/temoignages', '/fr/admin/activites', '/fr/admin/contenu',
  '/fr/admin/abonnes', '/fr/admin/demandes',
]

for (const chemin of ECRANS) {
  for (const theme of ['dark', 'light'] as const) {
    test(`${chemin} : texte et champs lisibles en thème ${theme}`, async ({ page }) => {
      await page.goto(chemin)
      await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
      // `body` porte `transition: background-color .7s ease` : mesurer avant la
      // fin de la transition lit une couleur intermédiaire.
      await page.waitForTimeout(900)

      const fautifs = await page.evaluate(() => {
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
        const main = document.querySelector('main')!
        const cibles = [...main.querySelectorAll('h1, h2, h3, p, td, th, label span, a, button, li, input, select, textarea')]
          .filter((e) => (e.textContent ?? '').trim().length > 1 || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName))
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
            quoi: el.tagName + ' ' + (el.textContent ?? '').trim().slice(0, 30),
            ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
          }
        }).filter((x) => x.ratio < 4.5).slice(0, 6)
      })

      expect(fautifs.map((f) => `${f.quoi} (${f.ratio.toFixed(2)}:1)`)).toEqual([])
    })
  }
}
