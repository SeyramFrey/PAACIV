import { test, expect } from '@playwright/test'

test('la page affiche ses blocs dans l’ordre du design', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  // Un seul h1 sur la page : les quinze autres blocs sont des h2.
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  // Ordre réel de la maquette (docs/design-ref, lignes 24 à 582) : l'agenda
  // (368) précède l'archive (400), qui précède le journal (526) — dans cet
  // ordre, et non celui, erroné, du brief d'origine (qui plaçait « archive »
  // avant « agenda »). Compare les positions verticales, pas seulement la
  // présence des ancres : la seule présence des six `id` sur la page ne
  // dirait rien de leur ordre, la propriété que seul l'assemblage révèle.
  const ordre = ['top', 'association', 'agenda', 'archive', 'journal', 'contact']
  const positions: number[] = []
  for (const id of ordre) {
    const ancre = page.locator(`#${id}`)
    await expect(ancre).toHaveCount(1)
    const boite = await ancre.boundingBox()
    expect(boite, `#${id} doit être mesurable (pas display:none)`).not.toBeNull()
    positions.push(boite!.y)
  }
  for (let i = 1; i < positions.length; i++) {
    expect(positions[i], `#${ordre[i]} doit suivre #${ordre[i - 1]}`).toBeGreaterThan(positions[i - 1])
  }
})

test('aucun lien mort ni bouton inerte sur toute la page', async ({ page }) => {
  await page.goto('/fr')
  const hrefs = await page.locator('a').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''))
  expect(hrefs.some((h) => h === '#' || h === '')).toBe(false)
  // Une ancre `#bloc-inexistant` passerait la vérification ci-dessus (elle
  // n'est ni vide ni `#` seul) tout en ne menant nulle part : on vérifie
  // donc que toute ancre interne cible un `id` réellement présent sur la
  // page.
  const ancresMortes = await page.evaluate(() => {
    const ids = new Set(Array.from(document.querySelectorAll('[id]')).map((el) => el.id))
    return Array.from(document.querySelectorAll('a[href^="#"]'))
      .map((a) => a.getAttribute('href')!.slice(1))
      .filter((id) => id.length > 0 && !ids.has(id))
  })
  expect(ancresMortes).toEqual([])
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
  // Repères de traduction STATIQUE (namespace `accueil`/`nav`, indépendants
  // du contenu Supabase, donc non tributaires des données de production) :
  // leur présence en français signalerait que la bascule de langue n'a pas
  // atteint tel ou tel bloc, ce que le seul lien « Explore the archive »
  // ci-dessus ne peut pas révéler à lui seul.
  const texte = await page.locator('body').innerText()
  for (const francais of ['Adhérer', "Explorer l'archive", "Soutenir l'association", "S'inscrire", 'Voir le programme']) {
    expect(texte, `« ${francais} » ne doit pas apparaître sur /en`).not.toContain(francais)
  }
})
