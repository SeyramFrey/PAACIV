import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

const SLUG = 'test-evenement-e2e'

test("le formulaire événement monte l'éditeur riche", async ({ page }) => {
  await page.goto('/fr/admin/evenements/nouveau')
  // description_fr/description_en passent par richeOuNull → assainirHtml et
  // sont rendues en HTML côté public (TexteRiche) : un textarea brut viderait
  // silencieusement le HTML produit. On vérifie donc que l'éditeur Tiptap est
  // bien monté (même motif que tests/admin-reportage.spec.ts).
  await expect(page.getByRole('button', { name: 'Gras' }).first()).toBeVisible()
  await expect(page.getByLabel('Titre (FR)')).toBeVisible()
})

test('date de fin antérieure à la date de début : erreur affichée, rien enregistré', async ({ page }) => {
  await page.goto('/fr/admin/evenements/nouveau')
  await page.getByLabel('Titre (FR)').fill('Événement Dates Invalides')
  // Slug préfixé exprès : si une régression future laissait passer
  // l'enregistrement malgré l'incohérence des dates, la ligne resterait
  // couverte par le nettoyage `afterAll` (préfixe test-evenement-e2e) au lieu
  // de polluer la base sous un slug auto-généré non nettoyé (cf. brief Task 13,
  // gap constaté sur Task 12).
  await page.getByLabel('Slug').fill(`${SLUG}-dates-invalides`)
  await page.getByLabel('Date de début').fill('2026-06-10')
  await page.getByLabel('Date de fin').fill('2026-06-01')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  // Toujours sur la page du formulaire : aucune redirection vers la liste.
  await expect(page).toHaveURL(/\/admin\/evenements\/nouveau$/)
})

test('création, persistance et relecture d’un événement', async ({ page }) => {
  await page.goto('/fr/admin/evenements/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Événement E2E')
  await page.getByLabel('Slug').fill(SLUG)
  await page.getByLabel('Lieu').fill('Abidjan, Le Plateau')
  await page.getByLabel('Date de début').fill('2026-09-01')
  await page.getByLabel('Date de fin').fill('2026-09-05')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/admin\/evenements(\?|$)/)
  await expect(page.getByText('Test Événement E2E')).toBeVisible()

  // Rouvrir en fiche d'édition : même motif que tests/admin-article.spec.ts
  // (ligne du tableau + lien « Éditer »), pas un lien portant le titre.
  await page.getByRole('row', { name: /Test Événement E2E/ }).getByRole('link', { name: 'Éditer' }).click()
  await expect(page.getByLabel('Titre (FR)')).toHaveValue('Test Événement E2E')
  await expect(page.getByLabel('Lieu')).toHaveValue('Abidjan, Le Plateau')
  await expect(page.getByLabel('Date de début')).toHaveValue('2026-09-01')
  await expect(page.getByLabel('Date de fin')).toHaveValue('2026-09-05')
})

// Nettoyage : les tests ci-dessus insèrent de vraies lignes en base. On les
// supprime après coup (par préfixe de slug) pour ne pas polluer la BDD et
// garder les relances idempotentes. Le seed éditorial (`exposition-a-venir`,
// `conference-passee`, etc.) n'est jamais touché par ce préfixe.
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
  const { error: erreurSuppression } = await db.from('evenements').delete().like('slug', `${SLUG}%`)
  expect(erreurSuppression).toBeNull()
})
