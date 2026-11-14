import { test, expect, type Page } from '@playwright/test'

// Vignette ou éclat → haut de fiche (moodboard du 13/11/2026, Southern Guild).
// On ne regarde pas l'animation à l'œil : on relève, au moment où la View
// Transition démarre, les animations qu'elle pose. Une paire formée se voit à
// son groupe `::view-transition-group(fiche-<slug>)`.

type Releve = { p: string | null; n: string }[]

async function espionner(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem('paaciv-intro-vue', 'oui')
    const w = window as unknown as { __vt: (Releve | 'sautee')[] }
    w.__vt = []
    const d = document as unknown as { startViewTransition?: (a: unknown) => { ready: Promise<void> } }
    const origine = d.startViewTransition?.bind(document)
    if (!origine) return
    d.startViewTransition = (a: unknown) => {
      const t = origine(a)
      t.ready
        .then(() =>
          w.__vt.push(
            document.getAnimations().map((x) => ({
              p: (x.effect as KeyframeEffect | null)?.pseudoElement ?? null,
              n: (x as CSSAnimation).animationName ?? '',
            })),
          ),
        )
        .catch(() => w.__vt.push('sautee'))
      return t
    }
  })
}

async function derniere(page: Page): Promise<Releve> {
  await expect.poll(() => page.evaluate(() => (window as unknown as { __vt: unknown[] }).__vt.length)).toBeGreaterThan(0)
  return page.evaluate(() => {
    const vt = (window as unknown as { __vt: unknown[] }).__vt
    return vt[vt.length - 1] as Releve
  })
}

test('une vignette de l’archive devient le haut de sa fiche', async ({ page }) => {
  await espionner(page)
  await page.goto('/fr/archives')
  const lien = page.locator('a[data-vers-fiche="pret"]').first()
  const href = await lien.getAttribute('href')
  const slug = href!.split('/patrimoine/')[1]
  await lien.click()
  await page.waitForURL(`**/patrimoine/${slug}`)
  const releve = await derniere(page)
  expect(releve.map((r) => r.p)).toContain(`::view-transition-group(fiche-${slug})`)
  // Le haut de fiche porte la photo ET son crédit.
  await expect(page.getByTestId('galerie-haut')).toBeVisible()
})

test('un lien texte ouvre la fiche en fondu, sans morphose', async ({ page }) => {
  await espionner(page)
  await page.goto('/fr')
  // Attendre l'hydratation : avant elle, le lien recharge la page entière.
  await expect(page.getByTestId('ligne-heure').first().locator('time')).toBeVisible()
  await page.getByTestId('embleme-pyramide').click()
  await page.waitForURL('**/patrimoine/la-pyramide-abidjan')
  const releve = await derniere(page)
  expect(releve.map((r) => r.n)).toContain('fiche-arrivee')
  expect(releve.map((r) => r.p)).not.toContain('::view-transition-group(fiche-la-pyramide-abidjan)')
})

test('mouvement réduit : la photo apparaît à sa place, sans voler', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await espionner(page)
  await page.goto('/fr/archives')
  const lien = page.locator('a[data-vers-fiche="pret"]').first()
  const slug = (await lien.getAttribute('href'))!.split('/patrimoine/')[1]
  await lien.click()
  await page.waitForURL(`**/patrimoine/${slug}`)
  const releve = await derniere(page)
  const pseudos = releve.map((r) => r.p)
  // Le fondu enchaîné reste, le déplacement du groupe disparaît.
  expect(pseudos).toContain(`::view-transition-new(fiche-${slug})`)
  expect(pseudos).not.toContain(`::view-transition-group(fiche-${slug})`)
})

test('un éclat de l’éléphant devient le haut de sa fiche', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await espionner(page)
  await page.goto('/fr')
  const scene = page.getByTestId('embleme-scene')
  await scene.scrollIntoViewIfNeeded()
  await expect(scene).toHaveAttribute('data-pret', '', { timeout: 30_000 })
  // On cherche l'éclat de la basilique (oreille gauche) en survolant la
  // scène : le curseur devient une main au-dessus d'un éclat cliquable.
  const toile = scene.locator('canvas')
  const b = (await toile.boundingBox())!
  let trouve: { x: number; y: number } | null = null
  for (let y = 0.3; y <= 0.6 && !trouve; y += 0.05) {
    for (let x = 0.1; x <= 0.4 && !trouve; x += 0.05) {
      await page.mouse.move(b.x + b.width * x, b.y + b.height * y)
      const curseur = await toile.evaluate((c) => (c as HTMLCanvasElement).style.cursor)
      if (curseur === 'pointer') trouve = { x: b.x + b.width * x, y: b.y + b.height * y }
    }
  }
  expect(trouve, 'éclat de la basilique introuvable sous la souris').not.toBeNull()
  await page.mouse.click(trouve!.x, trouve!.y)
  await page.waitForURL('**/patrimoine/basilique-yamoussoukro')
  const slug = 'basilique-yamoussoukro'
  const releve = await derniere(page)
  expect(releve.map((r) => r.p)).toContain(`::view-transition-group(fiche-${slug})`)
})
