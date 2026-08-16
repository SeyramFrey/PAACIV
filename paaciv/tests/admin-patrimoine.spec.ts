import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

test('la liste admin affiche les patrimoines dont les brouillons', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine')
  await expect(page.getByRole('heading', { name: 'Patrimoine' })).toBeVisible()
  // le brouillon (invisible côté public) est visible en admin
  await expect(page.getByText('Aéroport Félix Houphouët-Boigny')).toBeVisible()
})

test('créer puis publier un patrimoine le rend visible côté public', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Villa Moderne')
  await page.getByLabel('Ville').fill('Bouaké')
  await page.getByLabel('Année début').fill('1975')
  // choisir le point via champs lat/lng exposés par la carte (fallback saisie)
  await page.getByLabel('lat').fill('7.69')
  await page.getByLabel('lng').fill('-5.03')
  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()

  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // visible publiquement dans les archives
  await page.goto('/fr/archives?q=Villa%20Moderne')
  await expect(page.getByRole('link', { name: /Test Villa Moderne/ })).toBeVisible()
})

// Coordonnées hors bornes : deux lignes avaient été enregistrées avec
// `lat = 5000` et `lat = 725`, ce qui faisait lever `Invalid LngLat latitude
// value` à maplibre-gl en boucle et rendait /carte inutilisable. Les deux tests
// ci-dessous couvrent les deux barrières côté formulaire (la troisième, la
// contrainte CHECK, est couverte par tests/db/patrimoine.spec.ts).
test('latitude aberrante : le navigateur signale le dépassement de borne', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Latitude Aberrante')
  await page.getByLabel('lat').fill('5000')
  await page.getByLabel('lng').fill('-4.02')
  // `min`/`max` sur le champ : la validation native marque la saisie invalide
  // dès la frappe, sans aller-retour serveur.
  const etat = await page
    .getByLabel('lat')
    .evaluate((el) => ({ valide: (el as HTMLInputElement).checkValidity(), depassement: (el as HTMLInputElement).validity.rangeOverflow }))
  expect(etat).toEqual({ valide: false, depassement: true })
  // Un champ invalide empêche le navigateur d'émettre l'événement `submit` :
  // rien n'est envoyé, donc aucune redirection vers la fiche.
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page).toHaveURL(/\/admin\/patrimoine\/nouveau$/)
})

test('latitude aberrante : le serveur refuse même sans les bornes du navigateur', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill('Test Latitude Aberrante Serveur')
  await page.getByLabel('lat').fill('5000')
  // `min`/`max` ne sont qu'un confort de saisie, contournables par une
  // soumission scriptée ou un navigateur permissif. On les retire pour exercer
  // la barrière serveur, la seule réellement opposable.
  await page.getByLabel('lat').evaluate((el) => {
    el.removeAttribute('min')
    el.removeAttribute('max')
  })
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  // Message spécifique à la latitude, pas le générique « L'enregistrement a
  // échoué » : sinon l'utilisateur n'a aucune idée du champ à corriger.
  // `getByRole('alert')` seul matcherait aussi le `__next-route-announcer__`
  // de Next (role="alert" mais vide) : on cible le <p>.
  await expect(page.locator('p[role="alert"]')).toHaveText('La latitude doit être comprise entre -90 et 90.')
  await expect(page).toHaveURL(/\/admin\/patrimoine\/nouveau$/)
})

// Nettoyage : les tests ci-dessus insèrent de vraies lignes en base. On les
// supprime après coup (par préfixe de slug) pour ne pas polluer la BDD et
// garder les relances idempotentes. Le préfixe `test-latitude-aberrante`
// couvre les slugs auto-générés des deux tests de bornes : si une régression
// laissait passer l'enregistrement, la ligne serait quand même nettoyée.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  // Sans cette assertion, un échec de connexion rend les deletes suivants des
  // no-op silencieux (RLS) : les lignes de test persistent et la relance
  // suivante échoue sur le conflit de slug unique.
  expect(erreurConnexion).toBeNull()
  await db.from('patrimoine').delete().like('slug', 'test-villa-moderne%')
  await db.from('patrimoine').delete().like('slug', 'test-latitude-aberrante%')
})

// Le formulaire patrimoine n'expose AUCUN champ `slug` — contrairement à celui
// des architectes. `enregistrerPatrimoine` lisait donc toujours `null` et
// recalculait le slug depuis le titre à chaque enregistrement : ouvrir une
// fiche et cliquer sur « Enregistrer » suffisait à changer son URL publique,
// sans rien annoncer. C'est l'origine de la dérive de slugs déjà constatée sur
// cette base (`basilique-yamoussoukro` -> `basilique-notre-dame-de-la-paix`),
// et son coût réel n'est pas un test rouge mais un 404 sur tout lien externe.
test('enregistrer une fiche existante ne change pas son slug', async ({ page }) => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion).toBeNull()

  // Une fiche dont le slug NE DÉRIVE PAS du titre : c'est le seul cas où le
  // défaut se voit. Sur une fiche où `slugify(titre) === slug`, recalculer le
  // slug redonne la même valeur et le test passerait à tort.
  const { data: fiches } = await db
    .from('patrimoine')
    .select('id, slug, titre_fr')
    .eq('slug', 'basilique-yamoussoukro')
    .limit(1)
  const fiche = fiches?.[0]
  expect(fiche, 'la fiche témoin basilique-yamoussoukro').toBeTruthy()

  await page.goto(`/fr/admin/patrimoine/${fiche!.id}`)
  await page.getByRole('main').getByRole('button', { name: 'Enregistrer' }).click()
  await expect(page.getByTestId('banniere-enregistre')).toBeVisible()

  const { data: apres } = await db.from('patrimoine').select('slug').eq('id', fiche!.id).single()
  expect(apres!.slug, 'le slug doit survivre à un enregistrement').toBe(fiche!.slug)

  // Et la page publique répond toujours à l'ancienne adresse.
  const rep = await page.goto(`/fr/patrimoine/${fiche!.slug}`)
  expect(rep!.status()).toBe(200)
})
