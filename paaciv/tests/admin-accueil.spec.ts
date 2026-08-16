import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Nécessaire pour atteindre /admin/* : sans storageState, le layout admin
// (app/[locale]/admin/layout.tsx) redirige vers /fr/login faute de session —
// même motif que tests/admin-evenement.spec.ts et les autres specs d'admin.
test.use({ storageState: 'playwright/.auth/admin.json' })

let valeurOriginale: string | null = null

// `carte_titre` est un contenu réel affiché en production (bloc « Le
// territoire » de l'accueil) : le test ci-dessous l'écrase volontairement
// pour prouver la propagation admin → public, puis le restaure dans
// `afterAll` pour ne pas laisser un texte de test sur le site (cf. brief
// Task 15 : « tu n'affaiblis jamais » — ici on ne supprime ni n'invente rien,
// on remet exactement la valeur lue avant le test).
test.beforeAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { data } = await db.from('contenu_site').select('valeur_fr').eq('cle', 'carte_titre').maybeSingle()
  valeurOriginale = data?.valeur_fr ?? null
})

test('un texte modifié en admin change sur l’accueil', async ({ page }) => {
  const nouveau = `Titre de test ${Date.now()}`

  await page.goto('/fr/admin/contenu')
  const bloc = page.locator('form', { has: page.locator('input[name="cle"][value="carte_titre"]') })
  await bloc.getByLabel(/valeur \(fr\)/i).fill(nouveau)
  await bloc.getByRole('button', { name: /enregistrer/i }).click()

  await page.goto('/fr')
  await expect(page.getByText(nouveau)).toBeVisible()
})

test('une demande déposée apparaît dans l’admin', async ({ page }) => {
  const email = `e2e-admin-${Date.now()}@exemple.ci`

  await page.goto('/fr')
  await page.getByRole('button', { name: /soutenir l'association/i }).click()
  const modale = page.getByRole('dialog', { name: /faire un don/i })
  await modale.getByLabel(/^nom$/i).fill('Vérification admin')
  await modale.getByLabel(/adresse e-mail/i).fill(email)
  await modale.getByRole('button', { name: /envoyer/i }).click()
  await expect(modale.getByText(/merci/i)).toBeVisible()

  await page.goto('/fr/admin/demandes')
  await expect(page.getByText(email)).toBeVisible()
})

test('un abonné inscrit apparaît dans l’admin', async ({ page }) => {
  const email = `e2e-abonne-${Date.now()}@exemple.ci`

  await page.goto('/fr')
  const section = page.locator('#adherer')
  await section.scrollIntoViewIfNeeded()
  await section.getByLabel(/adresse e-mail/i).fill(email)
  await section.getByRole('button', { name: /s'inscrire/i }).click()
  await expect(section.getByRole('status')).toBeVisible()

  await page.goto('/fr/admin/abonnes')
  await expect(page.getByText(email)).toBeVisible()
})

test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  // Sans cette assertion, un échec de connexion rendrait la restauration
  // suivante un no-op silencieux (RLS) : `carte_titre` resterait polluée par
  // le texte de test.
  expect(erreurConnexion).toBeNull()
  const { error } = await db.from('contenu_site').update({ valeur_fr: valeurOriginale }).eq('cle', 'carte_titre')
  expect(error).toBeNull()
})
