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

    // Chiffres-clés du hero.
    await expect(page.getByText('2 500+')).toBeVisible()
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
