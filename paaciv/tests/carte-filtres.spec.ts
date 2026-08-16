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

// La barre de filtres flottait par-dessus la carte (`absolute … bg-white/95`).
// Deux conséquences : elle masquait le haut du territoire et interceptait les
// clics qui lui étaient destinés, et son fond blanc EN DUR recevait un texte
// dont la couleur venait du thème — en mode sombre (le défaut du site),
// `--ink` est presque blanc, donc libellés et champs étaient illisibles.
// Ce test tient les deux moitiés du correctif : la géométrie et le contraste.
test('la barre de filtres est hors de la carte et lisible dans les deux thèmes', async ({ page }) => {
  await page.goto('/fr/carte')
  await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)

  const barre = page.getByTestId('compteur-carte').locator('..')
  const carte = page.locator('.maplibregl-map')
  const rBarre = (await barre.boundingBox())!
  const rCarte = (await carte.boundingBox())!
  expect(rBarre).not.toBeNull()
  // Entièrement AU-DESSUS de la carte, pas simplement décalée : le bas de la
  // barre ne dépasse pas le haut de la carte.
  expect(Math.round(rBarre.y + rBarre.height)).toBeLessThanOrEqual(Math.round(rCarte.y) + 1)

  // Contraste mesuré sur les PIXELS rendus, pas sur les couleurs calculées :
  // les jetons du projet sont en `oklch` et une lecture naïve de
  // `getComputedStyle().color` donne des chiffres faux.
  for (const theme of ['dark', 'light'] as const) {
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme)
    const ratio = await page.locator('label:has(select)').first().evaluate((el) => {
      // Conversion PAR LE NAVIGATEUR, en peignant la couleur sur un canvas et
      // en relisant le pixel. Lire `getComputedStyle().color` et en extraire
      // trois nombres par expression régulière NE MARCHE PAS ici : Chrome
      // conserve l'espace `oklch` dans la valeur calculée, si bien que la
      // lecture naïve prenait « 0.945 0.02 82 » pour du RGB et annonçait un
      // contraste de 1,44 sur un texte parfaitement lisible.
      const c = document.createElement('canvas')
      c.width = c.height = 1
      const ctx = c.getContext('2d')!
      const enRgb = (couleur: string) => {
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
      let fond: HTMLElement | null = el as HTMLElement
      let bg = 'rgba(0, 0, 0, 0)'
      while (fond && (bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent')) {
        bg = getComputedStyle(fond).backgroundColor
        fond = fond.parentElement
      }
      const a = lum(enRgb(getComputedStyle(el).color))
      const b = lum(enRgb(bg))
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    })
    expect(ratio, `contraste du libellé de filtre en thème ${theme}`).toBeGreaterThanOrEqual(4.5)
  }
})
