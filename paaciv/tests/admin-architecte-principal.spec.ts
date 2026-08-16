import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

// La colonne `role` (architecte / co-auteur / bureau) dit la NATURE de
// l'intervention, pas la primauté : rien n'empêchait deux lignes « architecte »
// sur la même fiche, et l'ordre d'affichage devenait alors arbitraire. Le
// principal est désormais explicite, unique par fiche (index unique partiel),
// et remonté en tête côté public.
test('désigner un architecte principal le met en avant sur la fiche publique', async ({ page }) => {
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion).toBeNull()

  // Première fiche publiée venue, choisie PAR REQUÊTE et non par un slug écrit
  // en dur : les slugs de ce jeu de données ont déjà dérivé une fois
  // (`la-pyramide-abidjan` -> `la-pyramide`), et un test qui les fige échoue
  // pour une raison sans rapport avec ce qu'il vérifie.
  const { data: fiches } = await admin
    .from('patrimoine')
    .select('id, slug')
    .eq('statut', 'publie')
    .order('slug')
    .limit(1)
  const fiche = fiches?.[0] ?? null
  expect(fiche, 'au moins une fiche patrimoine publiée').not.toBeNull()

  const { data: liaisonsOrigine } = await admin
    .from('patrimoine_architecte')
    .select('patrimoine_id, architecte_id, role, principal')
    .eq('patrimoine_id', fiche!.id)

  const { data: archis } = await admin.from('architectes').select('id, nom, statut').eq('statut', 'publie').order('nom')
  expect(archis!.length).toBeGreaterThan(1)
  // On prend le DERNIER par ordre alphabétique : s'il apparaît en tête côté
  // public, c'est bien le tri sur `principal` qui opère, pas l'alphabet.
  const choisi = archis![archis!.length - 1]

  try {
    await page.goto(`/fr/admin/patrimoine/${fiche!.id}`)
    const ligne = page.getByTestId('liaison-architecte').filter({ hasText: choisi.nom })
    await ligne.getByRole('checkbox').check()
    await ligne.getByRole('radio', { name: /principal/i }).check()
    await page.getByRole('main').getByRole('button', { name: /enregistrer/i }).click()
    await expect(page.getByTestId('banniere-enregistre')).toBeVisible()

    // En base : un seul principal, et c'est le bon.
    const { data: apres } = await admin
      .from('patrimoine_architecte')
      .select('architecte_id, principal')
      .eq('patrimoine_id', fiche!.id)
    expect(apres!.filter((l) => l.principal).map((l) => l.architecte_id)).toEqual([choisi.id])

    // Côté public : en tête de liste ET explicitement marqué.
    await page.goto(`/fr/patrimoine/${fiche!.slug}`)
    const items = page.getByTestId('architectes-fiche').locator('li')
    await expect(items.first()).toContainText(choisi.nom)
    await expect(items.first()).toContainText(/architecte principal/i)
  } finally {
    await admin.from('patrimoine_architecte').delete().eq('patrimoine_id', fiche!.id)
    if (liaisonsOrigine && liaisonsOrigine.length > 0) {
      await admin.from('patrimoine_architecte').insert(liaisonsOrigine)
    }
  }
})
