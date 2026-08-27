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

// Le tissage n'est plus seulement une bande entre deux sections : il devient
// surface (fond de bloc) et lisière (bord de lé). Ce test ne juge pas
// l'apparence — il tient les deux règles qui encadrent ces ornements :
// ils sont DÉCORATIFS (donc masqués aux lecteurs d'écran) et ils n'introduisent
// aucune couleur, puisqu'ils empruntent `currentColor`.
test('les motifs tissés de l’accueil sont décoratifs et sans couleur propre', async ({ page }) => {
  await page.goto('/fr')

  // L'assertion porte sur l'ASCENDANCE, pas sur l'élément lui-même : dans
  // `SeparateurTisse`, c'est l'emballage qui porte `aria-hidden` et le div à
  // motif qui est dedans. Ce qui compte pour un lecteur d'écran, c'est que la
  // trame soit dans un sous-arbre masqué — peu importe quel nœud le déclare.
  const horsSousArbreMasque = await page.evaluate(
    () =>
      [...document.querySelectorAll('.lisiere-tissee, .motif-tisse')].filter(
        (e) => !e.closest('[aria-hidden="true"]'),
      ).length,
  )
  expect(horsSousArbreMasque).toBe(0)
  await expect(page.locator('.lisiere-tissee, .motif-tisse').first()).toBeAttached()

  // La trame de fond est posée en `::before` : c'est l'élément porteur qui doit
  // exister, et il ne doit jamais capter le pointeur ni s'annoncer.
  await expect(page.locator('section.surface-tissee')).not.toHaveCount(0)

  // Aucune couleur en dur : la trame prend l'encre de son contexte. Une valeur
  // littérale ici rouvrirait la question du contraste et du jaune banni.
  const couleursEnDur = await page.evaluate(
    () =>
      [...document.querySelectorAll('.lisiere-tissee, .motif-tisse, .surface-tissee')].filter(
        (e) => (e as HTMLElement).style.backgroundImage.includes('#') ||
          (e as HTMLElement).style.backgroundImage.includes('rgb'),
      ).length,
  )
  expect(couleursEnDur).toBe(0)
})

// Le hero débordait en silence sur téléphone : la grille n'avait qu'une piste
// `auto`, dimensionnée au max-content de ses deux enfants, et le rail de
// vignettes (cinq images de 92 px, sans repli) en réclamait 500. La piste
// passait donc à 500 px sur un écran de 390, la colonne de texte suivait, et
// l'`overflow` de la section rognait accroche, titre, paragraphe et puces AU
// MÊME BORD — sans barre de défilement pour le signaler, `scrollWidth` restant
// égal à `clientWidth`. Un test qui ne regarderait que `scrollWidth` ne verrait
// donc rien : il faut mesurer les éléments eux-mêmes.
test.describe('hero de l’accueil sur téléphone', () => {
  test.use({ viewport: { width: 360, height: 780 } })

  test('aucun texte du hero n’est rogné hors de l’écran', async ({ page }) => {
    await page.goto('/fr')
    const debordent = await page.evaluate(() => {
      const vp = document.documentElement.clientWidth
      return [...document.querySelectorAll('#top h1, #top p, #top a')]
        .filter((e) => {
          const b = e.getBoundingClientRect()
          // Le rail de vignettes défile : ce qui en sort est atteignable, donc
          // légitime. Seul ce qui déborde d'un parent NON défilant est rogné.
          return b.width > 0 && b.right > vp + 1 &&
            !['auto', 'scroll'].includes(getComputedStyle(e.parentElement!).overflowX)
        })
        .map((e) => (e.textContent || '').trim().slice(0, 30))
    })
    expect(debordent).toEqual([])
  })

  test('les vedettes restent toutes atteignables, par défilement du rail', async ({ page }) => {
    await page.goto('/fr')
    const rail = page.locator('#top [class*="overflow-x-auto"]')
    await expect(rail).toHaveCount(1)
    const peutDefiler = await rail.evaluate((e) => e.scrollWidth > e.clientWidth)
    expect(peutDefiler).toBe(true)
  })
})
