import { test, expect, type Page } from '@playwright/test'
import type { Map } from 'maplibre-gl'

// L'éventail des points confondus de /carte (lib/carte-eventail.ts).
//
// Plusieurs fiches peuvent porter EXACTEMENT les mêmes coordonnées : sans
// éventail, elles restaient un amas jusqu'au dernier zoom, puis une pile dont
// seul le point du dessus répondait. Les deux autres étaient inaccessibles.
//
// La carte reçoit ici un jeu de points FIXE (la réponse de l'API est
// remplacée) : le test ne dépend ni des fiches publiées ni de la base.

const CENTRE: [number, number] = [-4.006185, 5.312019]
const CONFONDUS = ['eventail-a', 'eventail-b', 'eventail-c']

function point(slug: string, coordonnees: [number, number], titre: string) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: coordonnees },
    properties: {
      id: slug,
      slug,
      type_id: null,
      etat_conservation: null,
      titre_fr: titre,
      titre_en: null,
      ville: 'Abidjan',
      image: null,
    },
  }
}

const JEU = {
  type: 'FeatureCollection',
  features: [
    ...CONFONDUS.map((slug, i) => point(slug, CENTRE, `Document confondu ${i + 1}`)),
    // Un point isolé, assez loin pour ne jamais rejoindre l'amas.
    point('eventail-seul', [-4.0179, 5.3268], 'Point isolé'),
  ],
}

async function ouvrirCarte(page: Page) {
  await page.route('**/api/carte/points**', (route) => route.fulfill({ json: JEU }))
  await page.goto('/fr/carte')
  await page.waitForFunction(() => (window as unknown as { __carteReady?: boolean }).__carteReady === true)
  await page.locator('.maplibregl-canvas').scrollIntoViewIfNeeded()
}

async function placer(page: Page, zoom: number) {
  await page.evaluate(
    async ([centre, z]) => {
      const m = (window as unknown as { __carteMap: Map }).__carteMap
      m.jumpTo({ center: centre as [number, number], zoom: z as number })
      await m.once('idle')
    },
    [CENTRE, zoom] as const,
  )
}

/** Position à l'écran d'un lieu, dans le repère de la page. */
function ecran(page: Page, lieu: [number, number]) {
  return page.evaluate((c) => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    const cadre = m.getCanvas().getBoundingClientRect()
    const p = m.project(c)
    return { x: cadre.left + p.x, y: cadre.top + p.y }
  }, lieu)
}

/** Points de l'éventail rendus à l'écran, avec leur slug et leur position. */
function eventail(page: Page) {
  return page.evaluate(() => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    if (!m.getLayer('eventail-points')) return []
    const cadre = m.getCanvas().getBoundingClientRect()
    return m.queryRenderedFeatures({ layers: ['eventail-points'] }).map((f) => {
      const p = m.project((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
      return { slug: f.properties.slug as string, x: cadre.left + p.x, y: cadre.top + p.y }
    })
  })
}

test.use({ viewport: { width: 1440, height: 900 } })

test('un amas de points confondus s’ouvre en éventail, et chaque point mène à sa fiche', async ({ page }) => {
  await ouvrirCarte(page)
  await placer(page, 12)

  const centre = await ecran(page, CENTRE)
  await page.mouse.click(centre.x, centre.y)

  await expect.poll(async () => (await eventail(page)).map((p) => p.slug).sort()).toEqual(CONFONDUS)
  // Les points se sont bien écartés du centre, une fois le déploiement fini.
  const ecartMin = async () =>
    Math.min(...(await eventail(page)).map((p) => Math.hypot(p.x - centre.x, p.y - centre.y)))
  await expect.poll(ecartMin).toBeGreaterThan(30)
  const points = await eventail(page)

  // Chacun se survole comme un point ordinaire…
  const b = points.find((p) => p.slug === 'eventail-b')!
  await page.mouse.move(b.x - 30, b.y - 30)
  await page.mouse.move(b.x, b.y, { steps: 4 })
  await expect(page.locator('.maplibregl-popup-content')).toContainText('Document confondu 2')

  // … et se clique : il ouvre SA fiche, pas celle du dessus de la pile.
  await page.mouse.click(b.x, b.y)
  await page.waitForURL('**/fr/patrimoine/eventail-b')
})

test('au zoom maximal, la pile de points s’ouvre aussi en éventail au lieu d’ouvrir une fiche', async ({ page }) => {
  await ouvrirCarte(page)
  // Au-delà du dernier zoom de regroupement, les points ne forment plus un
  // amas : ils s'empilent au même pixel.
  await placer(page, 19)

  const centre = await ecran(page, CENTRE)
  await page.mouse.click(centre.x, centre.y)

  await expect.poll(async () => (await eventail(page)).length).toBe(3)
  expect(page.url()).toMatch(/\/fr\/carte$/)
})

test('l’éventail se referme avec Échap, au clic à côté et au zoom', async ({ page }) => {
  await ouvrirCarte(page)
  await placer(page, 12)
  const centre = await ecran(page, CENTRE)

  await page.mouse.click(centre.x, centre.y)
  await expect.poll(async () => (await eventail(page)).length).toBe(3)
  await page.keyboard.press('Escape')
  await expect.poll(async () => (await eventail(page)).length).toBe(0)

  await page.mouse.click(centre.x, centre.y)
  await expect.poll(async () => (await eventail(page)).length).toBe(3)
  await page.mouse.click(centre.x + 200, centre.y + 120)
  await expect.poll(async () => (await eventail(page)).length).toBe(0)

  await page.mouse.click(centre.x, centre.y)
  await expect.poll(async () => (await eventail(page)).length).toBe(3)
  await page.evaluate(async () => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    m.zoomTo(m.getZoom() + 1, { duration: 0 })
    await m.once('idle')
  })
  await expect.poll(async () => (await eventail(page)).length).toBe(0)
})

test('un amas qui se sépare en zoomant reste un zoom, pas un éventail', async ({ page }) => {
  await ouvrirCarte(page)
  // Au zoom 6, l'amas regroupe les points confondus ET le point isolé : un
  // zoom les sépare, l'éventail n'a rien à faire.
  await placer(page, 6)
  const zoomAvant = await page.evaluate(() => (window as unknown as { __carteMap: Map }).__carteMap.getZoom())
  const centre = await ecran(page, CENTRE)
  // L'amas est centré sur ses points, pas sur CENTRE : on clique son cercle.
  const amas = await page.evaluate(() => {
    const m = (window as unknown as { __carteMap: Map }).__carteMap
    const f = m.queryRenderedFeatures({ layers: ['clusters'] })[0]
    if (!f) return null
    const cadre = m.getCanvas().getBoundingClientRect()
    const p = m.project((f.geometry as unknown as { coordinates: [number, number] }).coordinates)
    return { x: cadre.left + p.x, y: cadre.top + p.y, n: f.properties.point_count as number }
  })
  expect(amas, `aucun amas près de ${centre.x},${centre.y}`).not.toBeNull()
  expect(amas!.n).toBe(4)

  await page.mouse.click(amas!.x, amas!.y)
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __carteMap: Map }).__carteMap.getZoom()))
    .toBeGreaterThan(zoomAvant + 1)
  expect(await eventail(page)).toHaveLength(0)
})

test.describe('mouvement réduit', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  test('l’éventail s’ouvre d’un coup, sans déploiement', async ({ page }) => {
    await ouvrirCarte(page)
    await placer(page, 12)
    const centre = await ecran(page, CENTRE)
    await page.mouse.click(centre.x, centre.y)
    // Dès la première image où il existe, chaque point est déjà à sa place.
    await expect.poll(async () => (await eventail(page)).length).toBe(3)
    for (const p of await eventail(page)) {
      expect(Math.hypot(p.x - centre.x, p.y - centre.y)).toBeGreaterThan(30)
    }
  })
})
