import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

test("le formulaire architecte monte l'éditeur riche", async ({ page }) => {
  await page.goto('/fr/admin/architectes/nouveau')
  // 3 champs riches sur l'onglet FR (bio, parcours, réalisations) : chacun
  // monte sa propre barre d'outils Tiptap, d'où `.first()`.
  await expect(page.getByRole('button', { name: 'Gras' }).first()).toBeVisible()
  await expect(page.getByLabel('Nom')).toBeVisible()
})

test("le formulaire d'édition charge les valeurs existantes d'un architecte publié", async ({ page }) => {
  await page.goto('/fr/admin/architectes')
  await page
    .getByRole('row', { name: /Pierre Fakhoury/ })
    .getByRole('link', { name: 'Éditer' })
    .click()

  await expect(page.getByLabel('Nom')).toHaveValue('Pierre Fakhoury')
  // le champ riche « Biographie » restitue le contenu enregistré en base
  await expect(page.locator('.ProseMirror').first()).toContainText('Basilique de Yamoussoukro')
})

test('créer un architecte le persiste réellement (champ riche inclus) et reste éditable', async ({ page }) => {
  await page.goto('/fr/admin/architectes/nouveau')
  await page.getByLabel('Nom').fill('Test Architecte E2E')
  await page.getByLabel('Origine').selectOption('ivoirien')

  // Éditeur riche « Biographie » : premier `.ProseMirror` visible (onglet FR actif par défaut).
  const bio = page.locator('.ProseMirror').first()
  await bio.click()
  await bio.pressSequentially('Biographie de test E2E.')

  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  await page.waitForURL(/\/fr\/admin\/architectes\/[0-9a-f-]{36}/)

  // Persisté : réapparaît dans la liste admin.
  await page.goto('/fr/admin/architectes')
  await expect(page.getByText('Test Architecte E2E')).toBeVisible()

  // Réouverture de la fiche : les valeurs enregistrées (y compris le champ riche) sont restituées.
  await page
    .getByRole('row', { name: /Test Architecte E2E/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  await expect(page.getByLabel('Nom')).toHaveValue('Test Architecte E2E')
  await expect(page.locator('.ProseMirror').first()).toContainText('Biographie de test E2E.')
})

// Nettoyage : le test ci-dessus insère une vraie ligne en base. On la supprime
// après coup (par préfixe de slug) pour ne pas polluer la BDD et garder les
// relances idempotentes. Le seed (`pierre-fakhoury`, `architecte-brouillon`,
// etc.) n'est jamais touché par ce préfixe.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  // Sans cette assertion, un échec de connexion rend le delete suivant un
  // no-op silencieux (RLS) : les lignes de test persistent et la relance
  // suivante échoue sur le conflit de slug unique.
  expect(erreurConnexion).toBeNull()
  const { error: erreurSuppression } = await db
    .from('architectes')
    .delete()
    .like('slug', 'test-architecte-e2e%')
  expect(erreurSuppression).toBeNull()
})
