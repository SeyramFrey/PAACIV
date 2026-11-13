import { test, expect } from '@playwright/test'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { cheminsStockes } from '../lib/media'

// Révision demandée par l'association (Yacouba Doukoure, 13/11/2026) :
// quatre mentions de plus sur la fiche bâtiment, deux onglets
// (« Photographies et état actuel », « Documentation ») avec leurs photos
// légendées, datées et sourcées, et une notice du fonds sur la fiche
// architecte. Migration 0036.

test.use({ storageState: 'playwright/.auth/admin.json' })

// `slugify` retire les diacritiques : TITRE donne exactement SLUG.
const TITRE = 'Test Revision Doukoure E2E'
const SLUG = 'test-revision-doukoure-e2e'
const SLUG_ARCHI = 'test-notice-fonds-e2e'

async function clientAdmin() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(error).toBeNull()
  return db
}

// La suite tourne contre la base partagée : on nettoie derrière soi, fichiers
// du stockage compris (la suppression de la fiche n'efface que les lignes).
test.afterAll(async () => {
  const db = await clientAdmin()
  const { data: fiches } = await db.from('patrimoine').select('id, images(chemin)').like('slug', `${SLUG}%`)
  const chemins = (fiches ?? [])
    .flatMap((f) => (f.images as { chemin: string }[]) ?? [])
    .filter((i) => !/^https?:\/\//i.test(i.chemin))
    .flatMap((i) => cheminsStockes(i.chemin))
  if (chemins.length > 0) await db.storage.from('patrimoine').remove(chemins)
  const { error } = await db.from('patrimoine').delete().like('slug', `${SLUG}%`)
  expect(error).toBeNull()
  const { error: e2 } = await db.from('architectes').delete().like('slug', `${SLUG_ARCHI}%`)
  expect(e2).toBeNull()
})

test('la fiche bâtiment porte les nouvelles mentions et ses deux onglets', async ({ page }) => {
  test.setTimeout(120_000)

  // ── Saisie en admin, comme le fera l'association.
  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill(TITRE)
  await page.locator('[name=fonction_actuelle_fr]').fill('Bureaux')
  await page.locator('[name=transformations_fr]').fill('Façade reprise en 1998.')
  await page.locator('[name=photographies_fr]').fill('Campagne photographique de 2026.')
  await page.locator('[name=sources_fr]').fill("Collection du patrimoine architectural et des arts de Côte d'Ivoire (PAACIV)")
  await page.locator('[name=documentation_fr]').fill('Plans, et archives photographiques')
  await page.getByLabel("Maître d'ouvrage").fill('Ministère des Travaux publics')
  await page.getByLabel('Entreprise de construction').fill('Entreprise Exemple')
  await page.getByLabel('Photographe', { exact: true }).fill('Photographe Exemple')
  await page.getByLabel('État de conservation').selectOption('fortement_degrade')
  await page.getByLabel("État d'occupation").selectOption('partiellement_occupe')
  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // Les valeurs enregistrées reviennent dans le formulaire.
  await expect(page.getByLabel("État d'occupation")).toHaveValue('partiellement_occupe')
  await expect(page.locator('[name=transformations_fr]')).toHaveValue('Façade reprise en 1998.')

  // ── Une photo de document, dans la zone « Documentation ».
  const zone = page.getByTestId('images-documentation')
  const envoi = zone.locator('form').first()
  await envoi.getByLabel(/Ajouter des images/).setInputFiles(path.join(__dirname, 'fixtures', 'exemple.jpg'))
  await envoi.locator('[name=legende_fr]').fill("Ensemble de logements, Adjamé, district d'Abidjan")
  await envoi.locator('[name=date_texte]').fill('1959-1970')
  await envoi.locator('[name=source]').fill('Archives nationales de Côte d’Ivoire')
  await envoi.getByRole('button', { name: 'Ajouter des images', exact: true }).click()
  await expect(zone.getByRole('status')).toHaveText('1 image ajoutée.')
  await expect(zone.getByTestId('vignette-image')).toHaveCount(1)
  // La galerie du haut n'a rien reçu.
  await expect(page.getByTestId('images-galerie').getByTestId('vignette-image')).toHaveCount(0)

  // ── Fiche publique, onglet « Présentation ».
  await page.goto(`/fr/patrimoine/${SLUG}`)
  const presentation = page.getByTestId('panneau-presentation')
  for (const texte of ['Bureaux', 'Ministère des Travaux publics', 'Entreprise Exemple', 'Photographe Exemple']) {
    await expect(presentation.getByText(texte, { exact: true })).toBeVisible()
  }
  // La photo de document ne sert pas de galerie.
  await expect(page.getByTestId('galerie')).toHaveCount(0)

  // ── Onglet « Photographies et état actuel ».
  await page.getByRole('tab', { name: 'Photographies et état actuel' }).click()
  await expect(page).toHaveURL(/#etat-actuel$/)
  const etat = page.getByTestId('panneau-etat-actuel')
  await expect(etat).toBeVisible()
  await expect(presentation).toBeHidden()
  await expect(etat.getByTestId('pastille-etat')).toHaveAttribute('data-etat', 'fortement_degrade')
  await expect(etat.getByText('Partiellement occupé')).toBeVisible()
  await expect(etat.getByText('Façade reprise en 1998.')).toBeVisible()
  await expect(etat.getByText(/Collection du patrimoine architectural/)).toBeVisible()

  // ── Onglet « Documentation », ouvert par son adresse.
  await page.goto(`/fr/patrimoine/${SLUG}#documentation`)
  const doc = page.getByTestId('panneau-documentation')
  await expect(doc).toBeVisible()
  await expect(doc.getByText('Plans, et archives photographiques')).toBeVisible()
  const legende = doc.getByTestId('photos-dossier').locator('figcaption')
  await expect(legende).toContainText("1959-1970. Ensemble de logements, Adjamé, district d'Abidjan")
  await expect(legende).toContainText('Source : Archives nationales de Côte d’Ivoire')

  // Un clic ouvre la photo en plein écran, dans la page (13/11/2026) :
  // ni nouvel onglet, ni changement d'adresse, et Échap referme.
  const adresse = page.url()
  await doc.getByTestId('photos-dossier').getByRole('link').first().click()
  const visionneuse = page.getByTestId('visionneuse')
  await expect(visionneuse).toBeVisible()
  await expect(visionneuse.locator('figcaption')).toContainText('Ensemble de logements')
  expect(page.url()).toBe(adresse)
  expect(page.context().pages()).toHaveLength(1)
  await page.keyboard.press('Escape')
  await expect(visionneuse).toBeHidden()
  // Le bouton de fermeture marche aussi.
  await doc.getByTestId('photos-dossier').getByRole('link').first().click()
  await visionneuse.getByRole('button', { name: 'Fermer' }).click()
  await expect(visionneuse).toBeHidden()

  // Clavier : la flèche gauche ramène à l'onglet précédent.
  await page.getByRole('tab', { name: 'Documentation' }).focus()
  await page.keyboard.press('ArrowLeft')
  await expect(page.getByRole('tab', { name: 'Photographies et état actuel' })).toHaveAttribute('aria-selected', 'true')
})

// Tout passe par l'admin, comme pour l'association : chaque champ ajouté par
// 0036, en français ET en anglais, fait l'aller-retour saisie → base →
// formulaire → fiche publique. Les photos se reprennent une par une après
// l'envoi (légende, date, source, crédit).
test('chaque nouveau champ de la fiche bâtiment fait l’aller-retour depuis l’admin', async ({ page }) => {
  test.setTimeout(120_000)
  const titre = `${TITRE} Admin`
  const slug = `${SLUG}-admin`
  const main = page.getByRole('main')

  await page.goto('/fr/admin/patrimoine/nouveau')
  await page.getByLabel('Titre (FR)').fill(titre)
  const fr = {
    fonction_actuelle_fr: 'Musée',
    transformations_fr: 'Toiture refaite en 2004.',
    photographies_fr: 'Relevé photographique de novembre 2026.',
    sources_fr: 'Fonds PAACIV',
    documentation_fr: 'Plans de 1965',
  }
  for (const [nom, valeur] of Object.entries(fr)) await page.locator(`[name=${nom}]`).fill(valeur)
  await main.getByRole('button', { name: 'English', exact: true }).click()
  const en = {
    fonction_actuelle_en: 'Museum',
    transformations_en: 'Roof rebuilt in 2004.',
    photographies_en: 'Photographic survey, November 2026.',
    sources_en: 'PAACIV collection',
    documentation_en: '1965 drawings',
  }
  for (const [nom, valeur] of Object.entries(en)) await page.locator(`[name=${nom}]`).fill(valeur)
  await page.getByLabel("Maître d'ouvrage").fill('Ville d’Abidjan')
  await page.getByLabel('Entreprise de construction').fill('Bâtisseurs Réunis')
  await page.getByLabel('Photographe', { exact: true }).fill('Awa Exemple')
  await page.getByLabel('État de conservation').selectOption('etat_moyen')
  await page.getByLabel("État d'occupation").selectOption('vacant')
  await page.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await page.waitForURL(/\/fr\/admin\/patrimoine\/[0-9a-f-]{36}/)

  // Le formulaire rouvert restitue chaque valeur, dans les deux langues.
  for (const [nom, valeur] of Object.entries({ ...fr, ...en })) {
    await expect(page.locator(`[name=${nom}]`), nom).toHaveValue(valeur)
  }
  await expect(page.getByLabel("Maître d'ouvrage")).toHaveValue('Ville d’Abidjan')
  await expect(page.getByLabel('Entreprise de construction')).toHaveValue('Bâtisseurs Réunis')
  await expect(page.getByLabel('Photographe', { exact: true })).toHaveValue('Awa Exemple')
  await expect(page.getByLabel('État de conservation')).toHaveValue('etat_moyen')
  await expect(page.getByLabel("État d'occupation")).toHaveValue('vacant')

  // ── Photo envoyée dans « Photographies et état actuel », puis reprise.
  const zone = page.getByTestId('images-etat_actuel')
  const envoi = zone.locator('form').first()
  await envoi.getByLabel(/Ajouter des images/).setInputFiles(path.join(__dirname, 'fixtures', 'exemple.jpg'))
  await envoi.getByRole('button', { name: 'Ajouter des images', exact: true }).click()
  await expect(zone.getByRole('status')).toHaveText('1 image ajoutée.')
  const vignette = zone.getByTestId('vignette-image')
  await expect(vignette).toHaveCount(1)
  await vignette.locator('[name=legende_fr]').fill('Façade sud')
  await vignette.locator('[name=legende_en]').fill('South front')
  await vignette.locator('[name=date_texte]').fill('mars 2026')
  await vignette.locator('[name=credit]').fill('Awa Exemple')
  await vignette.locator('[name=source]').fill('Fonds PAACIV')
  await vignette.getByRole('button', { name: 'Mettre à jour' }).click()
  await page.waitForLoadState('networkidle')
  await page.reload()
  const reprise = page.getByTestId('images-etat_actuel').getByTestId('vignette-image')
  await expect(reprise.locator('[name=legende_fr]')).toHaveValue('Façade sud')
  await expect(reprise.locator('[name=legende_en]')).toHaveValue('South front')
  await expect(reprise.locator('[name=date_texte]')).toHaveValue('mars 2026')
  await expect(reprise.locator('[name=credit]')).toHaveValue('Awa Exemple')
  await expect(reprise.locator('[name=source]')).toHaveValue('Fonds PAACIV')
  // Rangée dans son onglet, pas dans la galerie du haut ni dans la documentation.
  await expect(page.getByTestId('images-galerie').getByTestId('vignette-image')).toHaveCount(0)
  await expect(page.getByTestId('images-documentation').getByTestId('vignette-image')).toHaveCount(0)

  // ── La fiche anglaise lit les champs anglais.
  await page.goto(`/en/patrimoine/${slug}`)
  await expect(page.getByTestId('panneau-presentation').getByText('Museum', { exact: true })).toBeVisible()
  await page.getByRole('tab', { name: 'Photographs and current condition' }).click()
  const etat = page.getByTestId('panneau-etat-actuel')
  await expect(etat.getByText('Fair condition')).toBeVisible()
  await expect(etat.getByText('Vacant', { exact: true })).toBeVisible()
  await expect(etat.getByText('Roof rebuilt in 2004.')).toBeVisible()
  await expect(etat.getByText('PAACIV collection')).toBeVisible()
  const legende = etat.getByTestId('photos-dossier').locator('figcaption')
  await expect(legende).toContainText('mars 2026. South front')
  await expect(legende).toContainText('Source: Fonds PAACIV')
  await page.getByRole('tab', { name: 'Documentation' }).click()
  await expect(page.getByTestId('panneau-documentation').getByText('1965 drawings')).toBeVisible()
})

test('la notice du fonds se saisit dans l’admin architecte et s’affiche sur la fiche', async ({ page }) => {
  test.setTimeout(120_000)
  const main = page.getByRole('main')
  const riche = (libelle: string) => page.locator(`[aria-label="${libelle}"] .ProseMirror:visible`)

  await page.goto('/fr/admin/architectes/nouveau')
  await main.getByLabel('Nom').fill('Test Notice Fonds E2E')
  await main.getByLabel('Origine').selectOption('ivoirien')
  await main.getByLabel("Auteur(s) de l'instrument de recherche").fill('Yacouba Doukoure')
  await riche('Présentation du contenu').click()
  await riche('Présentation du contenu').pressSequentially('Plans, correspondance et photographies.')
  await riche('Mentions obligatoires').click()
  await riche('Mentions obligatoires').pressSequentially('Fonds PAACIV, reproduction interdite.')
  await main.getByRole('button', { name: 'English', exact: true }).click()
  await riche('Présentation du contenu').click()
  await riche('Présentation du contenu').pressSequentially('Drawings, letters and photographs.')
  await riche('Mentions obligatoires').click()
  await riche('Mentions obligatoires').pressSequentially('PAACIV collection, no reproduction.')
  await main.getByLabel('Statut').selectOption('publie')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await page.waitForURL(/\/fr\/admin\/architectes\/[0-9a-f-]{36}/)

  // Le formulaire rouvert restitue les trois rubriques, dans les deux langues.
  await page.reload()
  await expect(main.getByLabel("Auteur(s) de l'instrument de recherche")).toHaveValue('Yacouba Doukoure')
  await expect(riche('Présentation du contenu')).toContainText('Plans, correspondance et photographies.')
  await expect(riche('Mentions obligatoires')).toContainText('Fonds PAACIV, reproduction interdite.')
  await main.getByRole('button', { name: 'English', exact: true }).click()
  await expect(riche('Présentation du contenu')).toContainText('Drawings, letters and photographs.')

  // Fiche publique, en français puis en anglais.
  await page.goto(`/fr/architectes/${SLUG_ARCHI}`)
  // Rangée dans les informations générales, en haut de la fiche (#top).
  const notice = page.locator('#top').getByTestId('notice-fonds')
  await expect(notice.getByRole('heading', { name: 'Notice du fonds' })).toBeVisible()
  await expect(notice.getByText('Plans, correspondance et photographies.')).toBeVisible()
  await expect(notice.getByText('Fonds PAACIV, reproduction interdite.')).toBeVisible()
  await expect(notice.getByText("Auteur(s) de l'instrument de recherche", { exact: true })).toBeVisible()
  await expect(notice.getByText('Yacouba Doukoure')).toBeVisible()

  await page.goto(`/en/architectes/${SLUG_ARCHI}`)
  const noticeEn = page.getByTestId('notice-fonds')
  await expect(noticeEn.getByRole('heading', { name: 'Collection notice' })).toBeVisible()
  await expect(noticeEn.getByText('PAACIV collection, no reproduction.')).toBeVisible()
})
