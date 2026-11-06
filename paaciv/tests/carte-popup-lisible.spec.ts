import { test, expect, type Page } from '@playwright/test'
import type { Map } from 'maplibre-gl'

// Les popups de carte vivent à l'intérieur de la page, donc leur texte HÉRITE de
// `--ink`, mais leur fond et leur pointe sont des `#fff` écrits en dur dans le CSS
// de MapLibre. En thème sombre, c'était de la chaux sur du blanc : le titre d'un
// édifice au survol se lisait à peine. `tests/lisibilite.spec.ts` ne pouvait pas
// le voir : un popup n'existe dans le DOM qu'une fois la carte survolée.
//
// Chaque test passe par LES DEUX thèmes : corriger le sombre en cassant le clair
// serait un échange, pas un correctif.
const THEMES = ['dark', 'light'] as const
type Theme = (typeof THEMES)[number]

/** Pose le thème AVANT le premier rendu, par la même clé que `BasculeTheme`. */
async function ouvrirEnTheme(page: Page, chemin: string, theme: Theme) {
  await page.addInitScript((t) => localStorage.setItem('paaciv-theme', t), theme)
  await page.goto(chemin)
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
}

/**
 * Lit, dans la page, ce que l'œil reçoit : chaque couleur passe par un canevas,
 * parce que `getComputedStyle` rend ici du `lab()`, pas du sRGB, seul format que
 * le calcul WCAG sait lire. On garde le pire contraste entre le fond et tout ce
 * qui porte du texte dans le popup, et non celui d'un seul élément.
 */
function mesurerPopup() {
  const contexte = document.createElement('canvas').getContext('2d', {
    willReadFrequently: true,
  })!
  const rgba = (couleur: string) => {
    contexte.clearRect(0, 0, 1, 1)
    contexte.fillStyle = couleur
    contexte.fillRect(0, 0, 1, 1)
    return [...contexte.getImageData(0, 0, 1, 1).data]
  }
  const luminance = ([r, g, b]: number[]) => {
    const [lr, lg, lb] = [r, g, b].map((v) => {
      const c = v / 255
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
  }
  const contraste = (a: number[], b: number[]) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }

  const contenu = document.querySelector<HTMLElement>('.maplibregl-popup-content')!
  const fond = rgba(getComputedStyle(contenu).backgroundColor)

  let pireContraste = Infinity
  const textes = document.createTreeWalker(contenu, NodeFilter.SHOW_TEXT)
  while (textes.nextNode()) {
    const noeud = textes.currentNode
    if (!noeud.textContent?.trim()) continue
    const couleur = rgba(getComputedStyle(noeud.parentElement!).color)
    pireContraste = Math.min(pireContraste, contraste(couleur, fond))
  }

  return {
    fond,
    pireContraste,
    surfaceDuTheme: rgba(getComputedStyle(document.documentElement).getPropertyValue('--bg2')),
  }
}

/** Lit la couleur du côté PEINT de la pointe, pour chaque ancrage de MapLibre. */
function mesurerPointes() {
  const coteParAncrage: Record<string, string> = {
    top: 'borderBottomColor',
    'top-left': 'borderBottomColor',
    'top-right': 'borderBottomColor',
    bottom: 'borderTopColor',
    'bottom-left': 'borderTopColor',
    'bottom-right': 'borderTopColor',
    left: 'borderRightColor',
    right: 'borderLeftColor',
  }
  const carte = document.querySelector('.maplibregl-map')!
  return Object.entries(coteParAncrage).map(([ancrage, cote]) => {
    const popup = document.createElement('div')
    popup.className = `maplibregl-popup maplibregl-popup-anchor-${ancrage}`
    const pointe = document.createElement('div')
    pointe.className = 'maplibregl-popup-tip'
    const contenu = document.createElement('div')
    contenu.className = 'maplibregl-popup-content'
    popup.append(pointe, contenu)
    carte.append(popup)
    const lu = {
      ancrage,
      pointe: getComputedStyle(pointe)[cote as 'borderTopColor'],
      contenu: getComputedStyle(contenu).backgroundColor,
    }
    popup.remove()
    return lu
  })
}

/** Le popup est lisible, et sa surface est bien celle du thème. */
async function verifierPopup(page: Page) {
  await expect(page.locator('.maplibregl-popup-content')).toBeVisible()
  const { fond, pireContraste, surfaceDuTheme } = await page.evaluate(mesurerPopup)
  expect(pireContraste).toBeGreaterThanOrEqual(4.5)
  expect(fond).toEqual(surfaceDuTheme)
}

for (const theme of THEMES) {
  test(`/carte : le popup de survol reste lisible en thème ${theme}`, async ({ page, request }) => {
    const reponse = await request.get('/api/carte/points')
    const { features } = await reponse.json()
    const coordonnees: [number, number] = features[0].geometry.coordinates

    await ouvrirEnTheme(page, '/fr/carte', theme)
    await page.waitForFunction(
      () => (window as unknown as { __carteReady?: boolean }).__carteReady === true,
    )

    // Le zoom sort le point de tout groupe : un point groupé ne déclenche pas le
    // survol de la couche `points`.
    await page.evaluate(async (centre) => {
      const m = (window as unknown as { __carteMap: Map }).__carteMap
      m.jumpTo({ center: centre, zoom: 16 })
      await m.once('idle')
    }, coordonnees)

    await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded()
    const point = await page.evaluate((centre) => {
      const m = (window as unknown as { __carteMap: Map }).__carteMap
      const cadre = m.getCanvas().getBoundingClientRect()
      const p = m.project(centre)
      return { x: cadre.left + p.x, y: cadre.top + p.y }
    }, coordonnees)
    await page.mouse.move(point.x - 40, point.y - 40)
    await page.mouse.move(point.x, point.y, { steps: 5 })

    await verifierPopup(page)
  })

  test(`/carte : la pointe prend la surface du popup à chaque ancrage, en thème ${theme}`, async ({
    page,
  }) => {
    await ouvrirEnTheme(page, '/fr/carte', theme)
    await page.locator('.maplibregl-map').waitFor()

    const pointes = await page.evaluate(mesurerPointes)
    expect(pointes).toHaveLength(8)
    for (const { ancrage, pointe, contenu } of pointes) {
      expect(pointe, `ancrage ${ancrage}`).toBe(contenu)
    }
  })

  // `CarteVille` et `MiniCarte` posent leur popup avec `setText` : même popup,
  // même CSS, mais une entrée différente, avec un bouton de fermeture en plus.
  test(`/villes : le popup d'un marqueur reste lisible en thème ${theme}`, async ({ page }) => {
    await ouvrirEnTheme(page, '/fr/villes/grand-bassam', theme)
    await page.locator('.maplibregl-marker').first().click()
    await verifierPopup(page)
  })

  test(`fiche : le popup de la mini-carte reste lisible en thème ${theme}`, async ({
    page,
    request,
  }) => {
    const reponse = await request.get('/api/carte/points')
    const { features } = await reponse.json()

    await ouvrirEnTheme(page, `/fr/patrimoine/${features[0].properties.slug}`, theme)
    await page.locator('.maplibregl-marker').first().click()
    await verifierPopup(page)
  })
}
