import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

// Les huit formulaires d'administration redirigeaient EN SILENCE après un
// enregistrement réussi : l'administrateur revenait sur la liste sans savoir si
// son travail avait été pris en compte. Le seul retour existant était le
// message d'erreur — autrement dit, on n'était informé QUE quand ça ratait.
test('un enregistrement réussi affiche un témoin, sur la page d’arrivée', async ({ page }) => {
  const nom = `Test Playwright ${Date.now()}`
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion).toBeNull()

  try {
    await page.goto('/fr/admin/architectes/nouveau')
    // Sélecteur borné à `main` : les trois modales de collecte de dons sont
    // montées sur TOUTES les pages, admin comprise, et portent elles aussi un
    // champ « Nom ». Convention déjà en place dans le reste de la suite.
    await page.getByRole('main').getByLabel(/^nom$/i).fill(nom)
    await page.getByRole('main').getByRole('button', { name: /enregistrer/i }).click()

    // Le témoin doit être là APRÈS la navigation : c'est tout l'enjeu, un état
    // React local serait démonté avec le formulaire.
    await expect(page.getByTestId('banniere-enregistre')).toBeVisible()
    await expect(page).toHaveURL(/\/admin\/architectes\/[0-9a-f-]{36}\?enregistre=1/)
  } finally {
    await admin.from('architectes').delete().eq('nom', nom)
  }
})

// Le témoin ne doit pas survivre à un rechargement : sans nettoyage du
// paramètre, recharger la page — ou la mettre en favori — rejouerait
// « Enregistré. » alors que rien n'a été enregistré.
test('le témoin disparaît de l’URL et n’est pas rejoué au rechargement', async ({ page }) => {
  await page.goto('/fr/admin/architectes?enregistre=1')
  await expect(page.getByTestId('banniere-enregistre')).toBeVisible()
  await expect(page).toHaveURL(/enregistre=1/)
  // Le paramètre est retiré au bout de quelques secondes.
  await expect(page).not.toHaveURL(/enregistre=1/, { timeout: 10000 })
  await expect(page.getByTestId('banniere-enregistre')).toBeHidden()
})
