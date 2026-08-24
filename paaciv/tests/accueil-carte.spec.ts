import { test, expect } from '@playwright/test'

// Le bloc « territoire » de la page d'accueil.
//
// Il montait auparavant MapLibre (785 Ko de WebGL) dans un CARRÉ, derrière un
// observateur d'intersection et un `next/dynamic` — tout un échafaudage pour
// ne pas payer ce poids à chaque visite. Le bloc est désormais un SVG rendu
// côté serveur, à la forme du pays : le poids n'est plus différé, il n'existe
// plus. Les tests ci-dessous défendent cette garantie-là, plus forte que
// l'ancienne.

test('aucun MapLibre sur l’accueil, même après avoir tout parcouru', async ({ page }) => {
  const requetesMaplibre: string[] = []
  page.on('request', (r) => {
    if (/maplibre/i.test(r.url())) requetesMaplibre.push(r.url())
  })

  await page.goto('/fr')
  // On descend jusqu'en bas : c'est précisément ce qui déclenchait le
  // chargement du chunk dans l'ancienne version.
  await page.getByRole('link', { name: /ouvrir la carte/i }).scrollIntoViewIfNeeded()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(1500)

  await expect(page.locator('.maplibregl-map')).toHaveCount(0)
  expect(requetesMaplibre).toEqual([])
})

// Requête HTTP brute, sans navigateur : c'est bien le rendu serveur qui est
// mesuré, pas le résultat de l'hydratation. Le tracé du pays et les chiffres
// doivent être dans le HTML servi — c'est ce qui les rend visibles d'emblée et
// indexables.
test('le tracé du pays et les chiffres sont dans le HTML servi', async ({ request }) => {
  const html = await (await request.get('/fr')).text()
  expect(html).toContain('Ouvrir la carte')
  expect(html).toContain('href="/fr/carte"')
  // Le `viewBox` du contour, calé sur les bornes réelles du pays.
  // À REGÉNÉRER AVEC `lib/carte-ci.ts` : ces deux nombres viennent des données
  // de frontières, pas d'un choix de mise en page.
  expect(html).toContain('viewBox="0 0 949 1000"')
  expect(html).toContain('Édifices géolocalisés')
  expect(html).not.toContain('maplibregl-map')
})

// Le tracé doit être FIN, pas un polygone approximatif : un premier essai à 46
// points donnait une silhouette reconnaissable mais fausse dans le détail —
// pas de lagunes, pas de dentelures. Le seuil ci-dessous échouerait si
// quelqu'un resimplifiait trop agressivement.
test('le contour national est tracé finement, pas approximé', async ({ request }) => {
  const html = await (await request.get('/fr')).text()
  const contour = html.match(/d="(M[\d.,LZM]{2000,})"/)
  expect(contour, 'aucun chemin long trouvé — le contour a-t-il été simplifié ?').not.toBeNull()
  const sommets = (contour![1].match(/[ML]/g) ?? []).length
  expect(sommets).toBeGreaterThan(500)
})

test('les quatorze districts sont dessinés et nommés', async ({ page }) => {
  await page.goto('/fr')
  const svg = page.getByRole('img', { name: /Carte de la Côte/ })
  await svg.scrollIntoViewIfNeeded()
  // Chaque district porte un <title> : infobulle native et lecteurs d'écran.
  const noms = await svg.locator('g > path > title').allTextContents()
  expect(noms).toHaveLength(14)
  expect(noms).toContain('Abidjan')
  expect(noms).toContain('Vallée du Bandama')
})

// L'attribution des frontières. Sur un site qui reproche à ses propres
// photographies de n'être pas créditées, importer une frontière sans dire d'où
// elle vient serait incohérent.
test('la provenance des frontières est créditée sous la carte', async ({ page }) => {
  await page.goto('/fr')
  const svg = page.getByRole('img', { name: /Carte de la Côte/ })
  await svg.scrollIntoViewIfNeeded()
  await expect(page.getByRole('link', { name: 'geoBoundaries' })).toBeVisible()
  await expect(page.getByText(/CC BY 4\.0/)).toBeVisible()
})

// La destination a changé : les villes menaient vers `/archives?q=<nom>`,
// c'est-à-dire vers une recherche PLEIN TEXTE — « Abidjan » y ramenait aussi
// tout édifice dont le titre contient le mot, et la page obtenue n'avait ni
// titre propre, ni description, ni URL stable. Elles mènent maintenant vers la
// page de la commune, qui est indexable et dit ce qu'elle montre.
test('chaque ville mène à sa page de commune', async ({ page }) => {
  await page.goto('/fr')
  const svg = page.getByRole('img', { name: /Carte de la Côte/ })
  await svg.scrollIntoViewIfNeeded()
  const liens = await svg.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href')))
  expect(liens.length).toBeGreaterThanOrEqual(1)
  for (const h of liens) expect(h).toMatch(new RegExp("^\\/fr\\/villes\\/[a-z0-9-]+$"))
})

// L'exigence explicite : le bloc n'est plus un carré, il a la forme de la
// Côte d'Ivoire. Le pays est un peu plus haut que large (968 × 1000), donc un
// rapport de 1 signalerait un retour au carré.
test('la carte a la proportion du pays, pas celle d’un carré', async ({ page }) => {
  await page.goto('/fr')
  const svg = page.getByRole('img', { name: /Carte de la Côte d’Ivoire|Carte de la Côte d'Ivoire/ })
  await svg.scrollIntoViewIfNeeded()
  await expect(svg).toBeVisible()

  const b = await svg.boundingBox()
  expect(b).not.toBeNull()
  const rapport = b!.width / b!.height
  expect(rapport).toBeGreaterThan(0.9)
  expect(rapport).toBeLessThan(1.0)
})

test('les édifices sont situés sur le tracé, un point par commune', async ({ page }) => {
  await page.goto('/fr')
  const svg = page.getByRole('img', { name: /Carte de la Côte/ })
  await svg.scrollIntoViewIfNeeded()
  // Deux cercles par commune (disque plein + anneau). Au moins une commune est
  // documentée : on n'écrit pas de nombre en dur, la suite tourne sur la base
  // de production et un autre spec y publie une fiche.
  const cercles = svg.locator('circle')
  expect(await cercles.count()).toBeGreaterThanOrEqual(2)
  // Chaque groupe porte le nom de sa commune, pour l'infobulle et les
  // lecteurs d'écran.
  expect(await svg.locator('title').count()).toBeGreaterThanOrEqual(1)
})

test('« Ouvrir la carte » mène à la carte plein écran', async ({ page }) => {
  await page.goto('/fr')
  await page.getByRole('link', { name: /ouvrir la carte/i }).click()
  await expect(page).toHaveURL(/\/fr\/carte$/)
})
