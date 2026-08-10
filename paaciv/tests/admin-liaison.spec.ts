import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('le formulaire patrimoine propose la liaison architectes', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await expect(page.getByRole('group', { name: 'Architectes' })).toBeVisible()
  // au moins un architecte listé (issu du seed)
  await expect(page.getByTestId('liaison-architecte').first()).toBeVisible()
})

test('lier un architecte (avec rôle) à un patrimoine persiste réellement la liaison, et la décoche la supprime', async ({
  page,
}) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Liaison Architecte E2E')
  await page.getByLabel('Ville').fill('Abidjan')
  await page.getByLabel('lat').fill('5.32')
  await page.getByLabel('lng').fill('-4.02')

  // Coche un architecte du seed (publié) et choisit un rôle.
  const ligneNouveau = page.getByTestId('liaison-architecte').filter({ hasText: 'Pierre Fakhoury' })
  await ligneNouveau.getByRole('checkbox').check()
  await ligneNouveau.getByRole('combobox').selectOption('co-auteur')

  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}$/)

  // Persisté : réouverture de la fiche via la liste admin → case cochée, rôle restitué.
  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Test Liaison Architecte E2E/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  const ligneEdition = page.getByTestId('liaison-architecte').filter({ hasText: 'Pierre Fakhoury' })
  await expect(ligneEdition.getByRole('checkbox')).toBeChecked()
  await expect(ligneEdition.getByRole('combobox')).toHaveValue('co-auteur')

  // Visible côté public : la liaison apparaît sur la fiche patrimoine (publiée).
  await page.goto('/fr/patrimoine/test-liaison-architecte-e2e')
  await expect(page.getByRole('link', { name: 'Pierre Fakhoury' })).toBeVisible()
  await expect(page.getByText('(co-auteur)')).toBeVisible()

  // Décocher puis réenregistrer supprime réellement la liaison (pas de role_<id> résiduel).
  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Test Liaison Architecte E2E/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  const ligneDecoche = page.getByTestId('liaison-architecte').filter({ hasText: 'Pierre Fakhoury' })
  await ligneDecoche.getByRole('checkbox').uncheck()
  // Le rôle disparaît du DOM dès la décoche (pas de champ role_<id> soumis).
  await expect(ligneDecoche.getByRole('combobox')).toHaveCount(0)
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()

  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Test Liaison Architecte E2E/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  const ligneApresDecoche = page.getByTestId('liaison-architecte').filter({ hasText: 'Pierre Fakhoury' })
  await expect(ligneApresDecoche.getByRole('checkbox')).not.toBeChecked()

  await page.goto('/fr/patrimoine/test-liaison-architecte-e2e')
  await expect(page.getByRole('link', { name: 'Pierre Fakhoury' })).toHaveCount(0)
})

// Nettoyage : le test ci-dessus insère une vraie ligne en base (et sa liaison,
// supprimée en cascade par la FK patrimoine_id). On la supprime après coup par
// préfixe de slug pour ne pas polluer la BDD et garder les relances idempotentes.
// Le seed (`basilique-yamoussoukro` ↔ `pierre-fakhoury` notamment) n'est jamais touché.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  await db.from('patrimoine').delete().like('slug', 'test-liaison-architecte-e2e%')
})
