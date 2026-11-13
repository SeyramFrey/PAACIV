import { test, expect } from '@playwright/test'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { createClient } from '@supabase/supabase-js'
import { cheminsStockes } from '../lib/media'

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
  const avant = await page.getByTestId('images-galerie').getByTestId('vignette-image').count()

  const fichier = path.join(__dirname, 'fixtures', 'exemple.jpg')
  await page.getByTestId('images-galerie').getByLabel('Ajouter des images', { exact: true }).setInputFiles(fichier)
  // le champ de fichier expose aussi un rôle "button" natif : on cible
  // précisément le bouton de soumission du formulaire.
  await page.getByTestId('images-galerie').getByRole('button', { name: 'Ajouter des images' }).last().click()

  // une vignette de plus apparaît
  await expect(async () => {
    expect(await page.getByTestId('images-galerie').getByTestId('vignette-image').count()).toBe(avant + 1)
  }).toPass()
})

test('une photo de 4 Mo est acceptée, et seule sa version réduite est servie', async ({ page }) => {
  // Du bruit compresse mal : un vrai JPEG de plusieurs mégaoctets, comme une
  // photo de téléphone.
  const largeur = 2400
  const hauteur = 1800
  const photo = await sharp(randomBytes(largeur * hauteur * 3), { raw: { width: largeur, height: hauteur, channels: 3 } })
    .jpeg({ quality: 100 })
    .toBuffer()
  expect(photo.length).toBeGreaterThan(4 * 1024 * 1024)

  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Basilique Notre-Dame de la Paix/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  await page.waitForURL(/\/admin\/patrimoine\/[0-9a-f-]{36}/)
  const avant = await page.getByTestId('images-galerie').getByTestId('vignette-image').count()

  await page.getByTestId('images-galerie').getByLabel('Ajouter des images', { exact: true }).setInputFiles({ name: 'grande-photo.jpg', mimeType: 'image/jpeg', buffer: photo })
  await page.getByTestId('images-galerie').getByRole('button', { name: 'Ajouter des images' }).last().click()

  await expect(async () => {
    expect(await page.getByTestId('images-galerie').getByTestId('vignette-image').count()).toBe(avant + 1)
  }).toPass()

  // La vignette charge la version de 480 px, en WebP, bien plus légère.
  const vignette = page.getByTestId('images-galerie').getByTestId('vignette-image').last().locator('img')
  await expect(vignette).toHaveAttribute('src', /\.jpg\.480\.webp$/)
  const reponse = await page.request.get((await vignette.getAttribute('src'))!)
  expect(reponse.headers()['content-type']).toBe('image/webp')
  expect((await reponse.body()).length).toBeLessThan(photo.length / 10)
})

// Bug du 11 novembre 2026 : une photo HEIC (iPhone, Samsung « haute
// efficacité ») faisait tomber la page de l'admin.
test('une photo HEIC de téléphone est acceptée et servie en WebP', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Basilique Notre-Dame de la Paix/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  await page.waitForURL(/\/admin\/patrimoine\/[0-9a-f-]{36}/)
  const avant = await page.getByTestId('images-galerie').getByTestId('vignette-image').count()

  await page.getByTestId('images-galerie').getByLabel('Ajouter des images', { exact: true }).setInputFiles(path.join(__dirname, 'fixtures', 'exemple.heic'))
  await page.getByTestId('images-galerie').getByRole('button', { name: 'Ajouter des images' }).last().click()

  await expect(page.getByTestId('images-galerie').getByRole('status')).toHaveText('1 image ajoutée.')
  await expect(async () => {
    expect(await page.getByTestId('images-galerie').getByTestId('vignette-image').count()).toBe(avant + 1)
  }).toPass()
  const src = await page.getByTestId('images-galerie').getByTestId('vignette-image').last().locator('img').getAttribute('src')
  const reponse = await page.request.get(src!)
  expect(reponse.headers()['content-type']).toBe('image/webp')
})

test('un fichier illisible est signalé, sans faire tomber la page', async ({ page }) => {
  await page.goto('/fr/admin/patrimoine')
  await page
    .getByRole('row', { name: /Basilique Notre-Dame de la Paix/ })
    .getByRole('link', { name: 'Éditer' })
    .click()
  await page.waitForURL(/\/admin\/patrimoine\/[0-9a-f-]{36}/)

  await page.getByTestId('images-galerie').getByLabel('Ajouter des images', { exact: true }).setInputFiles({ name: 'pas-une-photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('ceci n’est pas une image') })
  await page.getByTestId('images-galerie').getByRole('button', { name: 'Ajouter des images' }).last().click()

  await expect(page.getByTestId('images-galerie').getByRole('status')).toContainText('« pas-une-photo.jpg » n\'a pas pu être lu')
  await expect(page.getByRole('heading', { name: 'Galerie (haut de la fiche)' })).toBeVisible()
})

// Nettoyage : les tests ci-dessus téléversent de vrais fichiers dans le bucket
// Storage et insèrent de vraies lignes `images`. On restaure l'état initial de
// la Basilique (son unique image seed, une URL http externe) en supprimant
// tout ce qui n'est pas cette URL — objets Storage + ligne — après coup.
test.afterAll(async () => {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  await db.auth.signInWithPassword({ email: process.env.TEST_ADMIN_EMAIL!, password: process.env.TEST_ADMIN_PASSWORD! })
  const { data: p } = await db.from('patrimoine').select('id').eq('slug', 'basilique-yamoussoukro').single()
  const { data: imgs } = await db.from('images').select('id,chemin').eq('patrimoine_id', p!.id).not('chemin', 'ilike', 'http%')
  for (const img of imgs ?? []) {
    await db.storage.from('patrimoine').remove(cheminsStockes(img.chemin))
    await db.from('images').delete().eq('id', img.id)
  }
})
