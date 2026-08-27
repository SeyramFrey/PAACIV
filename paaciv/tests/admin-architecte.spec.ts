import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

test.use({ storageState: 'playwright/.auth/admin.json' })

test("le formulaire architecte monte l'éditeur riche", async ({ page }) => {
  await page.goto('/fr/admin/architectes/nouveau')
  // 3 champs riches sur l'onglet FR (bio, parcours, réalisations) : chacun
  // monte sa propre barre d'outils Tiptap, d'où `.first()`.
  await expect(page.getByRole('button', { name: 'Gras' }).first()).toBeVisible()
  // Scopé à <main> : depuis la Task 9, les modales de soutien sont montées
  // globalement (fermées mais présentes dans le DOM) en dehors de <main>, et
  // la modale « Adhérer » porte elle aussi un champ « Nom ».
  await expect(page.getByRole('main').getByLabel('Nom')).toBeVisible()
})

test("le formulaire d'édition charge les valeurs existantes d'un architecte publié", async ({ page }) => {
  await page.goto('/fr/admin/architectes')
  await page
    .getByRole('row', { name: /Pierre Fakhoury/ })
    .getByRole('link', { name: 'Éditer' })
    .click()

  await expect(page.getByRole('main').getByLabel('Nom')).toHaveValue('Pierre Fakhoury')
  // le champ riche « Biographie » restitue le contenu enregistré en base
  await expect(page.locator('.ProseMirror').first()).toContainText('Basilique de Yamoussoukro')
})

test('créer un architecte le persiste réellement (champ riche inclus) et reste éditable', async ({ page }) => {
  await page.goto('/fr/admin/architectes/nouveau')
  const main = page.getByRole('main')
  await main.getByLabel('Nom').fill('Test Architecte E2E')
  await main.getByLabel('Origine').selectOption('ivoirien')

  // Éditeur riche « Biographie » : premier `.ProseMirror` visible (onglet FR actif par défaut).
  const bio = page.locator('.ProseMirror').first()
  await bio.click()
  await bio.pressSequentially('Biographie de test E2E.')

  await main.getByLabel('Statut').selectOption('publie')
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
  await expect(page.getByRole('main').getByLabel('Nom')).toHaveValue('Test Architecte E2E')
  await expect(page.locator('.ProseMirror').first()).toContainText('Biographie de test E2E.')
})

// Les quatre listes du gabarit de fiche (migration 0032) sont réécrites en bloc
// à chaque enregistrement : on supprime celles de l'architecte puis on
// réinsère. C'est le chemin le plus risqué de l'action serveur — une erreur de
// rezippage des colonnes `getAll()` mélangerait silencieusement les titres et
// les textes entre types. Ce test le prouve de bout en bout : saisie, écriture,
// relecture.
//
// Le slug part du même préfixe que le test ci-dessus, donc le nettoyage final
// l'emporte aussi — et avec lui ses blocs, que la clé étrangère supprime en
// cascade.
test('les blocs de la fiche font l’aller-retour saisie → base → formulaire', async ({ page }) => {
  await page.goto('/fr/admin/architectes/nouveau')
  const main = page.getByRole('main')
  await main.getByLabel('Nom').fill('Test Architecte E2E Blocs')
  // `.first()` : « Profession » existe dans l'onglet FR ET dans l'onglet EN
  // (masqué mais présent dans le DOM, comme les autres champs bilingues).
  await main.getByLabel('Profession', { exact: true }).first().fill('Urbaniste de test')

  // Une mission : c'est le seul type qui expose les trois niveaux
  // (sur-titre, titre, texte), donc celui qui couvre le rezippage complet.
  await main.getByRole('button', { name: /Ajouter/ }).nth(2).click()
  const mission = page.getByTestId('bloc-mission')
  await expect(mission).toHaveCount(1)
  await mission.getByLabel('Sur-titre FR').fill('Mali · Bamako')
  await mission.getByLabel('Titre FR', { exact: true }).fill('Résidence de test')
  await mission.getByLabel('Texte FR', { exact: true }).fill('Texte de la mission de test.')

  // Un programme, saisi APRÈS la mission : si l'action serveur se fiait à
  // l'ordre du DOM plutôt qu'au champ `bloc_type`, les deux se retrouveraient
  // dans le mauvais groupe.
  await main.getByRole('button', { name: /Ajouter/ }).first().click()
  await page
    .getByTestId('bloc-programme')
    .getByLabel('Titre FR', { exact: true })
    .fill('Programme de test')

  await main.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer' }).click()
  await page.waitForURL(/\/fr\/admin\/architectes\/[0-9a-f-]{36}/)
  await page.reload()

  // Relu depuis la base, chaque bloc est revenu dans SON groupe, avec ses
  // trois champs distincts.
  const missionRelue = page.getByTestId('bloc-mission')
  await expect(missionRelue).toHaveCount(1)
  await expect(missionRelue.getByLabel('Sur-titre FR')).toHaveValue('Mali · Bamako')
  await expect(missionRelue.getByLabel('Titre FR', { exact: true })).toHaveValue(
    'Résidence de test',
  )
  await expect(missionRelue.getByLabel('Texte FR', { exact: true })).toHaveValue(
    'Texte de la mission de test.',
  )
  await expect(
    page.getByTestId('bloc-programme').getByLabel('Titre FR', { exact: true }),
  ).toHaveValue('Programme de test')

  // Et la fiche publique les rend.
  await page.goto('/fr/architectes/test-architecte-e2e-blocs')
  await expect(page.getByRole('heading', { name: "À l'étranger" })).toBeVisible()
  await expect(page.locator('#etranger').getByText('Résidence de test')).toBeVisible()
  await expect(page.locator('#programmes').getByText('Programme de test')).toBeVisible()
})

// Nettoyage : les tests ci-dessus insèrent de vraies lignes en base. On la supprime
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
