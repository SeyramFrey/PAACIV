import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

const SLUG = 'test-article-e2e'

test("création, persistance et relecture d'un article", async ({ page }) => {
  await page.goto('/fr/admin/articles/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Article E2E')
  await page.getByRole('button', { name: 'Gras' }).first().waitFor() // l'éditeur riche est monté
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/admin\/articles(\?|$)/)
  await expect(page.getByText('Test Article E2E')).toBeVisible()

  // Rouvrir en fiche d'édition : même motif que tests/admin-architecte.spec.ts
  // (ligne du tableau + lien « Éditer »), pas un lien portant le titre.
  await page.getByRole('row', { name: /Test Article E2E/ }).getByRole('link', { name: 'Éditer' }).click()
  await expect(page.getByLabel('Titre (FR)')).toHaveValue('Test Article E2E')
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
  const { error: erreurSuppression } = await db.from('articles').delete().like('slug', `${SLUG}%`)
  expect(erreurSuppression).toBeNull()
})
