import { test, expect } from '@playwright/test'

test('la fiche architecte affiche le nom et la bio', async ({ page }) => {
  await page.goto('/fr/architectes/pierre-fakhoury')
  await expect(page.getByRole('heading', { name: 'Pierre Fakhoury' })).toBeVisible()
  await expect(page.getByText('Concepteur de la Basilique de Yamoussoukro.')).toBeVisible()
})

test('la fiche architecte affiche la réalisation liée publiée', async ({ page }) => {
  await page.goto('/fr/architectes/pierre-fakhoury')
  const lien = page.getByRole('link', { name: /Basilique Notre-Dame de la Paix/ })
  await expect(lien).toBeVisible()
  await expect(lien).toHaveAttribute('href', '/fr/patrimoine/basilique-yamoussoukro')
})

test('un architecte inexistant renvoie 404', async ({ page }) => {
  const res = await page.goto('/fr/architectes/nexiste-pas')
  expect(res?.status()).toBe(404)
})

test('un architecte au statut brouillon renvoie 404 en accès direct', async ({ page }) => {
  const res = await page.goto('/fr/architectes/architecte-brouillon')
  expect(res?.status()).toBe(404)
})

// Le gabarit issu de la maquette « Architecte Aka Adjo ». Ce qui est vérifié
// ici, c'est ce qui ne se voit PAS sur une capture : que chaque section se
// branche bien sur la base, et surtout qu'elle se RETIRE quand la fiche n'a
// rien à y mettre — c'est ce qui permet à la maquette, dessinée sur la fiche
// la mieux documentée du corpus, de valoir pour les six autres.
test.describe('gabarit de fiche', () => {
  test('la fiche documentée rend le hero, le sommaire et les quatre listes', async ({ page }) => {
    await page.goto('/fr/architectes/Aka%20Raymond')

    await expect(page.getByText('Fiche architecte', { exact: true })).toBeVisible()
    await expect(page.getByRole('term').filter({ hasText: 'Profession' })).toBeVisible()
    await expect(page.getByText('Architecte DESA · urbaniste')).toBeVisible()

    // Frise du parcours : l'année ET sa sous-ligne sans année, qui doit avoir
    // rejoint l'étape précédente au lieu de former une ligne à part.
    await expect(page.getByText('1957-1958', { exact: true })).toBeVisible()
    await expect(page.getByText("grade : sergent dans l'armée française")).toBeVisible()

    await expect(page.getByRole('heading', { name: 'Programmes à son actif' })).toBeVisible()
    await expect(page.getByText("Domaines d'intervention")).toBeVisible()
    await expect(page.getByRole('heading', { name: "À l'étranger" })).toBeVisible()
    // Assertion PORTÉE PAR LA SECTION, et non par la page : le relevé libre
    // des réalisations du client cite déjà les mêmes missions à l'étranger.
    // Chercher « Residence ATTA » dans toute la page trouve les deux et ne
    // prouve donc rien sur la carte.
    await expect(
      page.locator('#etranger').getByText('Residence ATTA', { exact: true }),
    ).toBeVisible()
  })

  test('le sommaire ne liste que les sections réellement rendues', async ({ page }) => {
    await page.goto('/fr/architectes/Aka%20Raymond')
    const sommaire = page.getByRole('navigation', { name: 'Sommaire' })
    await expect(sommaire.getByRole('link')).toHaveCount(5)
    // Chaque lien du sommaire doit atterrir sur une section qui existe.
    for (const href of await sommaire.getByRole('link').evaluateAll((as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute('href')!),
    )) {
      await expect(page.locator(href)).toHaveCount(1)
    }
  })

  test('une fiche sans blocs ne rend aucune section vide', async ({ page }) => {
    // Pierre Fakhoury n'a ni programmes, ni domaines, ni missions : les
    // sections correspondantes doivent avoir disparu, pas s'afficher vides.
    await page.goto('/fr/architectes/pierre-fakhoury')
    await expect(page.getByRole('heading', { name: 'Pierre Fakhoury' })).toBeVisible()
    await expect(page.locator('#programmes')).toHaveCount(0)
    await expect(page.locator('#etranger')).toHaveCount(0)
    await expect(page.locator('#biographie')).toHaveCount(1)
  })

  test("l'en-tête se fond sur le hero sombre puis redevient opaque", async ({ page }) => {
    await page.goto('/fr/architectes/Aka%20Raymond')
    const entete = page.locator('header').first()
    await expect(entete).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
    await expect(entete).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  })
})

// L'ordre de lecture de la fiche sur téléphone. Ce n'est pas une préférence
// d'apparence : une fiche de personne s'ouvre sur son visage, et la maquette —
// dessinée en deux colonnes — plaçait le portrait après huit lignes d'état
// civil dès que tout s'empile.
test.describe('ordre du hero de fiche sur téléphone', () => {
  test.use({ viewport: { width: 390, height: 664 } })

  test('le portrait précède le nom et le tableau', async ({ page }) => {
    await page.goto('/fr/architectes/Aka%20Raymond')
    const y = async (s: string) => (await page.locator(s).first().boundingBox())!.y
    expect(await y('#top img')).toBeLessThan(await y('#top h1'))
    expect(await y('#top h1')).toBeLessThan(await y('#top dl'))
  })

  test('aucun chiffre-clé ne s’intercale dans le hero', async ({ page }) => {
    // Le bloc « 7 schémas directeurs / 2 500+ logements » a été retiré pour que
    // la biographie remonte. Les lignes correspondantes restent en base : ce
    // test garde le hero débarrassé si quelqu'un les réaffiche par mégarde.
    await page.goto('/fr/architectes/Aka%20Raymond')
    await expect(page.locator('#top').getByText('2 500+')).toHaveCount(0)
  })
})

test('sur grand écran, le portrait reste à droite du nom (composition de la maquette)', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/fr/architectes/Aka%20Raymond')
  const photo = (await page.locator('#top img').first().boundingBox())!
  const nom = (await page.locator('#top h1').boundingBox())!
  expect(photo.x).toBeGreaterThan(nom.x)
})

test.describe('réalisations : rail défilant et relevé replié', () => {
  test('les cartes gardent leur largeur dans un conteneur défilant', async ({ page }) => {
    await page.goto('/fr/architectes/Aka%20Raymond')
    const rail = page.locator('#realisations [role="group"]')
    await expect(rail).toHaveCSS('overflow-x', 'auto')

    // La largeur fixe ET le `shrink-0` sont le cœur du réglage : sans eux, les
    // cartes se comprimeraient jusqu'à l'illisible au lieu de sortir du cadre,
    // et le rail ne défilerait jamais.
    const carte = rail.locator('a').first()
    await expect(carte).toHaveCSS('flex-shrink', '0')
    expect((await carte.boundingBox())!.width).toBe(210)
  })

  test('le relevé écrit est replié et s’ouvre au clic', async ({ page }) => {
    await page.goto('/fr/architectes/Aka%20Raymond')
    const details = page.locator('#realisations details')
    // Replié par défaut : celui d'Aka Adjo fait plusieurs centaines de lignes
    // et enterrerait les sections suivantes.
    await expect(details).not.toHaveAttribute('open', /.*/)
    const corps = details.locator('div').first()
    await expect(corps).toBeHidden()

    await details.getByText('Relevé détaillé').click()
    await expect(details).toHaveAttribute('open', /.*/)
    await expect(corps).toBeVisible()
  })
})
