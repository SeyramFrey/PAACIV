import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

// `slugify` retire les diacritiques : « Test État Conservation E2E » donne
// exactement SLUG. Les deux doivent rester d'accord — le nettoyage final
// filtre là-dessus.
const TITRE = 'Test État Conservation E2E'
const SLUG = 'test-etat-conservation-e2e'

async function clientAdmin() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(error).toBeNull()
  return db
}

// La suite tourne contre la base de PRODUCTION : on nettoie derrière soi, comme
// tests/db/patrimoine.spec.ts et le global-teardown.
test.afterAll(async () => {
  const db = await clientAdmin()
  const { error } = await db.from('patrimoine').delete().like('slug', `${SLUG}%`)
  expect(error).toBeNull()
})

// Le champ était un `<input type="text">` : deux éditeurs pouvaient écrire
// « en danger » et « Menacé » pour le même fait. C'est cette bascule qui fait
// de l'état une catégorie plutôt qu'un libellé.
test('l’admin propose les quatre états en liste déroulante, pas en texte libre', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  const champ = page.getByLabel('État de conservation')
  await expect(champ).toHaveJSProperty('tagName', 'SELECT')

  const options = await champ.locator('option').evaluateAll((els) =>
    els.map((e) => [(e as HTMLOptionElement).value, e.textContent]),
  )
  expect(options).toEqual([
    ['', '— choisir —'],
    ['intact', 'Intact'],
    ['en_restauration', 'En restauration'],
    ['en_danger', 'En danger'],
    ['demoli', 'Démoli'],
  ])
})

test('un état choisi en admin se retrouve sur la fiche publique, en toutes lettres', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill(TITRE)
  await page.getByLabel('État de conservation').selectOption('en_danger')
  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // Le formulaire recharge la valeur enregistrée, pas une valeur par défaut.
  await expect(page.getByLabel('État de conservation')).toHaveValue('en_danger')

  // La colonne stocke le slug ; le visiteur doit lire le libellé traduit.
  await page.goto(`/fr/patrimoine/${SLUG}`)
  await expect(page.locator('dd').filter({ hasText: 'En danger' })).toBeVisible()
  await expect(page.getByText('en_danger')).toHaveCount(0)
})

test('le filtre d’état restreint l’archive via l’URL', async ({ page }) => {
  await page.goto('/fr/archives?etat=en_danger')
  await expect(page.getByRole('link', { name: new RegExp(TITRE) })).toBeVisible()

  // La même fiche ne doit pas apparaître dans une autre catégorie.
  await page.goto('/fr/archives?etat=intact')
  await expect(page.getByRole('link', { name: new RegExp(TITRE) })).toHaveCount(0)
})

// Un `?etat=` fantaisiste — lien tronqué, valeur recopiée à la main — doit être
// ignoré. Filtrer sur une catégorie inexistante rendrait une archive vide sans
// rien expliquer au visiteur. Ancré sur une fiche du corpus stable plutôt que
// sur un décompte : la suite tourne sur deux workers, et un autre spec publie
// une fiche le temps de son scénario.
test('un état inconnu dans l’URL est ignoré plutôt que de vider l’archive', async ({ page }) => {
  await page.goto('/fr/archives?etat=nimporte-quoi')
  await expect(page.getByRole('link', { name: /Basilique Notre-Dame/ })).toBeVisible()
})

// Sans cela, le visiteur arrivant depuis une carte de la page d'accueil verrait
// « Tous » dans la barre alors que la liste est filtrée.
test('la barre de filtres reflète l’état porté par l’URL', async ({ page }) => {
  await page.goto('/fr/archives?etat=demoli')
  await expect(page.getByLabel('État')).toHaveValue('demoli')
})

// Formulé sans dépendre du NOMBRE de cartes d'état visibles : leur présence
// suit le corpus, et le spec ci-dessus publie une fiche « en danger » le temps
// de son scénario, sur une suite à deux workers. L'invariant testé est la
// DESTINATION — les cartes menaient auparavant vers `/articles`, qui n'a jamais
// rien eu à voir avec l'état du bâti.
test('les cartes d’état de l’accueil mènent vers l’archive filtrée', async ({ page }) => {
  await page.goto('/fr')
  const liens = await page
    .locator('#association a[href*="/archives"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute('href')))
  for (const href of liens) expect(href).toMatch(/\/archives\?etat=(en_danger|demoli)$/)

  // Les deux cartes d'action, elles, ne dépendent d'aucun corpus. Restreint à
  // la section : l'en-tête porte son propre bouton « Adhérer ».
  const soutien = page.locator('#association')
  await expect(soutien.getByRole('button', { name: 'Adhérer Rejoindre' })).toBeVisible()
  await expect(soutien.getByRole('button', { name: 'Faire un don Donner' })).toBeVisible()
})
