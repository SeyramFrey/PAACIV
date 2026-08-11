import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

const SLUG = 'test-reportage-e2e'

test('aperçu de la miniature pour une URL YouTube valide', async ({ page }) => {
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('URL de la vidéo').fill('https://www.youtube.com/watch?v=PAACIVdemo9')
  await expect(page.getByTestId('apercu-miniature')).toBeVisible()
  await expect(page.getByTestId('url-invalide')).toHaveCount(0)
})

test('URL invalide : message et aucun enregistrement', async ({ page }) => {
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('Titre (FR)').fill('Reportage URL Invalide')
  await page.getByLabel('URL de la vidéo').fill('https://exemple.test/x')
  await expect(page.getByTestId('url-invalide')).toBeVisible()
  await expect(page.getByTestId('apercu-miniature')).toHaveCount(0)

  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  // Toujours sur la page du formulaire : aucune redirection vers la liste.
  await expect(page).toHaveURL(/\/admin\/reportages\/nouveau$/)
})

test('création, persistance et relecture d’un reportage', async ({ page }) => {
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Reportage E2E')
  await page.getByLabel('Slug').fill(SLUG)
  await page.getByLabel('URL de la vidéo').fill('https://www.youtube.com/watch?v=PAACIVdemo9')
  await expect(page.getByTestId('apercu-miniature')).toBeVisible()
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/admin\/reportages(\?|$)/)
  await expect(page.getByText('Test Reportage E2E')).toBeVisible()

  // Rouvrir en fiche d'édition : même motif que tests/admin-article.spec.ts
  // (ligne du tableau + lien « Éditer »), pas un lien portant le titre.
  await page.getByRole('row', { name: /Test Reportage E2E/ }).getByRole('link', { name: 'Éditer' }).click()
  await expect(page.getByLabel('Titre (FR)')).toHaveValue('Test Reportage E2E')
  await expect(page.getByTestId('apercu-miniature')).toBeVisible()
})

// Nettoyage : le test ci-dessus insère une vraie ligne en base. On la
// supprime après coup (par préfixe de slug) pour ne pas polluer la BDD et
// garder les relances idempotentes. Le seed éditorial n'est jamais touché
// par ce préfixe.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!, // noms réels du dépôt — PAS E2E_ADMIN_*
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  // Sans cette assertion, un échec de connexion rend le delete suivant un no-op
  // silencieux (RLS) : les lignes de test persistent et la relance suivante
  // échoue sur le conflit de slug unique.
  expect(erreurConnexion).toBeNull()
  const { error: erreurSuppression } = await db.from('reportages').delete().like('slug', `${SLUG}%`)
  expect(erreurSuppression).toBeNull()
})
