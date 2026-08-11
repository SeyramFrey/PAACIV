import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

const SLUG = 'test-reportage-e2e'

test("le formulaire reportage monte l'éditeur riche", async ({ page }) => {
  await page.goto('/fr/admin/reportages/nouveau')
  // description_fr/description_en passent par richeOuNull → assainirHtml et
  // sont rendues en HTML côté public (TexteRiche) : un textarea brut viderait
  // silencieusement le HTML produit. On vérifie donc que l'éditeur Tiptap est
  // bien monté (même motif que tests/admin-architecte.spec.ts).
  await expect(page.getByRole('button', { name: 'Gras' }).first()).toBeVisible()
  await expect(page.getByLabel('Titre (FR)')).toBeVisible()
})

test('aperçu de la miniature pour une URL YouTube valide', async ({ page }) => {
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('URL de la vidéo').fill('https://www.youtube.com/watch?v=PAACIVdemo9')
  await expect(page.getByTestId('apercu-miniature')).toBeVisible()
  await expect(page.getByTestId('url-invalide')).toHaveCount(0)
})

test('URL invalide : message et aucun enregistrement', async ({ page }) => {
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('Titre (FR)').fill('Reportage URL Invalide')
  // Slug préfixé exprès : si une régression future laissait passer
  // l'enregistrement malgré l'URL invalide, la ligne resterait couverte par
  // le nettoyage `afterAll` (préfixe `test-reportage-e2e`) au lieu de
  // polluer la base sous un slug auto-généré non nettoyé.
  await page.getByLabel('Slug').fill(`${SLUG}-invalide`)
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

test('collision de slug : message spécifique, aucune redirection', async ({ page }) => {
  // Slug préfixé exprès (cf. tests/admin-evenement.spec.ts) : couvert par le
  // nettoyage `afterAll` (préfixe `test-reportage-e2e`).
  const slugCollision = `${SLUG}-collision`

  // Première création : doit réussir et libérer le slug.
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Reportage Collision 1')
  await page.getByLabel('Slug').fill(slugCollision)
  await page.getByLabel('URL de la vidéo').fill('https://www.youtube.com/watch?v=PAACIVdemo9')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/admin\/reportages(\?|$)/)

  // Deuxième création avec le même slug : c'est l'erreur la plus probable
  // pour un(e) éditeur/rice qui republie sur le même sujet (spec §7) — elle
  // doit être visible, pas noyée dans le message générique
  // « L'enregistrement a échoué » (constat de revue de branche finale).
  await page.goto('/fr/admin/reportages/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Reportage Collision 2')
  await page.getByLabel('Slug').fill(slugCollision)
  await page.getByLabel('URL de la vidéo').fill('https://www.youtube.com/watch?v=PAACIVdemo9')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.locator('p[role="alert"]')).toHaveText('Ce slug est déjà utilisé par un autre contenu.')
  // Toujours sur la page du formulaire : aucune redirection vers la liste.
  await expect(page).toHaveURL(/\/admin\/reportages\/nouveau$/)
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
