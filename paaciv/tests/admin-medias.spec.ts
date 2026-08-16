import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

// Emplacement d'essai : celui du fond du bloc Journal, décoratif et sans
// incidence sur le reste de la page.
const EMPLACEMENT = 'journal_image'
const MARQUEUR_CREDIT = 'À COMPLÉTER — auteur de la photographie'
const MARQUEUR_LICENCE = 'À COMPLÉTER — licence'
const CREDIT_ESSAI = 'Test Attribution E2E'

async function clientAdmin() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(error).toBeNull()
  return db
}

// La suite tourne contre la base de PRODUCTION : on restaure les marqueurs
// d'origine, faute de quoi le pied de page afficherait une attribution
// inventée par un test.
test.afterAll(async () => {
  const db = await clientAdmin()
  const { data, error } = await db
    .from('medias_site')
    .update({ credit: MARQUEUR_CREDIT, licence: MARQUEUR_LICENCE, licence_url: null })
    .eq('emplacement', EMPLACEMENT)
    .select('emplacement')
  expect(error).toBeNull()
  // Un UPDATE bloqué par RLS ne lève pas d'erreur : sans ce contrôle, un
  // nettoyage silencieusement inopérant laisserait la valeur d'essai en ligne.
  expect(data ?? []).toHaveLength(1)
})

test('l’écran des photographies liste les douze emplacements avec leur aperçu', async ({ page }) => {
  await page.goto('/fr/admin/medias')
  await expect(page.getByRole('heading', { name: 'Photographies du site' })).toBeVisible()
  await expect(page.getByTestId('apercu-media')).toHaveCount(12)
})

// L'enjeu de tout ce chantier : le crédit saisi en admin doit atteindre le
// public. Tant qu'il porte le marqueur, il reste tu ; dès qu'il est renseigné,
// il s'affiche.
test('un crédit renseigné en admin apparaît dans le pied de page', async ({ page }) => {
  await page.goto('/fr')
  await expect(page.getByText(CREDIT_ESSAI)).toHaveCount(0)

  await page.goto('/fr/admin/medias')
  // `exact` : `getByLabel` correspond par SOUS-CHAÎNE, et « Licence — … » est
  // contenu dans « Lien vers la licence — … ».
  await page.getByLabel(`Crédit — ${EMPLACEMENT}`, { exact: true }).fill(CREDIT_ESSAI)
  await page.getByLabel(`Licence — ${EMPLACEMENT}`, { exact: true }).fill('CC BY-SA 4.0')
  await page
    .locator('form')
    .filter({ has: page.getByLabel(`Crédit — ${EMPLACEMENT}`, { exact: true }) })
    .getByRole('button', { name: 'Enregistrer' })
    .click()
  await expect(page.getByRole('status')).toHaveText('Enregistré.')

  await page.goto('/fr')
  await expect(page.getByText(CREDIT_ESSAI)).toBeVisible()
  await expect(page.getByText('CC BY-SA 4.0')).toBeVisible()
  // Les onze autres portent encore le marqueur : il ne doit jamais franchir la
  // frontière du public.
  await expect(page.getByText(/À COMPLÉTER/)).toHaveCount(0)
})
