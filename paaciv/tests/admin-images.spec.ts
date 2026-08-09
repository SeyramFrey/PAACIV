import { test, expect } from '@playwright/test'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('téléverser une image sur un patrimoine existant', async ({ page }) => {
  // ouvre l'édition de la Basilique (récupère son id via la liste)
  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Basilique Notre-Dame de la Paix/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  await page.waitForURL(/\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // la Basilique a déjà une image seed : on compare le compte avant/après
  // pour vérifier que l'upload a bien ajouté une vignette (et pas juste
  // que l'image seed préexistante est visible).
  const avant = await page.getByTestId('vignette-image').count()

  const fichier = path.join(__dirname, 'fixtures', 'exemple.jpg')
  await page.getByLabel('Ajouter des images').setInputFiles(fichier)
  // le champ de fichier expose aussi un rôle "button" natif : on cible
  // précisément le bouton de soumission du formulaire.
  await page.getByRole('button', { name: 'Ajouter des images' }).last().click()

  // une vignette de plus apparaît
  await expect(async () => {
    expect(await page.getByTestId('vignette-image').count()).toBe(avant + 1)
  }).toPass()
})

// Nettoyage : le test ci-dessus téléverse un vrai fichier dans le bucket
// Storage et insère une vraie ligne `images`. On restaure l'état initial de
// la Basilique (son unique image seed, une URL http externe) en supprimant
// tout ce qui n'est pas cette URL — objet Storage + ligne — après coup.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  await db.auth.signInWithPassword({ email: process.env.TEST_ADMIN_EMAIL!, password: process.env.TEST_ADMIN_PASSWORD! })
  const { data: p } = await db.from('patrimoine').select('id').eq('slug', 'basilique-yamoussoukro').single()
  const { data: imgs } = await db.from('images').select('id,chemin').eq('patrimoine_id', p!.id).not('chemin', 'ilike', 'http%')
  for (const img of imgs ?? []) {
    await db.storage.from('patrimoine').remove([img.chemin])
    await db.from('images').delete().eq('id', img.id)
  }
})
