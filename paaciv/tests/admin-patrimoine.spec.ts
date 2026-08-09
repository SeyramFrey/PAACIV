import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('la liste admin affiche les patrimoines dont les brouillons', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine')
  await expect(page.getByRole('heading', { name: 'Patrimoine' })).toBeVisible()
  // le brouillon (invisible côté public) est visible en admin
  await expect(page.getByText('Aéroport Félix Houphouët-Boigny')).toBeVisible()
})

test('créer puis publier un patrimoine le rend visible côté public', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Villa Moderne')
  await page.getByLabel('Ville').fill('Bouaké')
  await page.getByLabel('Année début').fill('1975')
  // choisir le point via champs lat/lng exposés par la carte (fallback saisie)
  await page.getByLabel('lat').fill('7.69')
  await page.getByLabel('lng').fill('-5.03')
  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // visible publiquement dans les archives
  await page.goto('/fr/archives?q=Villa%20Moderne')
  await expect(page.getByRole('link', { name: /Test Villa Moderne/ })).toBeVisible()
})

// Nettoyage : le test ci-dessus insère une vraie ligne en base. On la supprime
// après coup (par préfixe de slug) pour ne pas polluer la BDD et garder les
// relances idempotentes.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  await db.from('patrimoine').delete().like('slug', 'test-villa-moderne%')
})
