import { test, expect, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import path from 'node:path'

// Les réels Instagram (décision de Sey du 15/11/2026) : l'admin dépose une
// vidéo et le lien du post, l'accueil les montre en roue de cartes dans
// l'épilogue. Les lignes et fichiers de test sont reconnus à leur lien
// (`…/reel/e2e-…`) et effacés à la fin, sous session administrateur.
//
// La roue est commune à tout l'accueil : deux copies de ce fichier ne peuvent
// pas tourner en même temps (`--repeat-each` avec plusieurs workers), l'une
// verrait les réels de l'autre. Pour répéter : `--repeat-each N --workers=1`.

const VIDEO = path.join(__dirname, 'fixtures', 'reel-exemple.mp4')
const MARQUE = 'e2e-reel'

async function connexionAdmin() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(error).toBeNull()
  return db
}

async function nettoyer() {
  const db = await connexionAdmin()
  const { data } = await db.from('reels').select('id, video, affiche').like('lien', `%/${MARQUE}%`)
  for (const r of data ?? []) {
    const fichiers = [r.video, ...(r.affiche ? [r.affiche, `${r.affiche}.480.webp`, `${r.affiche}.960.webp`, `${r.affiche}.1600.webp`] : [])]
    await db.storage.from('patrimoine').remove(fichiers)
  }
  const { error } = await db.from('reels').delete().like('lien', `%/${MARQUE}%`)
  expect(error).toBeNull()
}

test.afterAll(nettoyer)

test.describe('admin', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' })

  test('dépose un réel : la vidéo, son affiche tirée de la vidéo, le lien', async ({ page }) => {
    // Unique par exécution : une ligne d'une exécution précédente ne gêne pas.
    const id = Date.now()
    await page.goto('/fr/admin/reels/nouveau')
    await page.getByLabel('Lien du post Instagram').fill(`https://www.instagram.com/reel/${MARQUE}-admin-${id}/`)
    await page.getByLabel('Vidéo', { exact: true }).setInputFiles(VIDEO)
    // L'affiche est tirée de la vidéo, sans rien faire.
    await expect(page.getByText('Affiche retenue')).toBeVisible({ timeout: 10_000 })
    await page.getByLabel('Légende (FR)').fill(`Réel de test E2E ${id}`)
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await page.waitForURL(/\/admin\/reels(\?|$)/, { timeout: 30_000 })
    const ligne = page.getByRole('row', { name: new RegExp(`Réel de test E2E ${id}`) })
    await expect(ligne).toBeVisible()
    await expect(ligne.locator('img')).toHaveAttribute('src', /reels\/.+affiche\.jpg\.480\.webp$/)
  })

  test('refuse un lien qui n’est pas un post Instagram', async ({ page }) => {
    await page.goto('/fr/admin/reels/nouveau')
    await page.getByLabel('Lien du post Instagram').fill('https://www.youtube.com/watch?v=TcKdp_Pu988')
    await page.getByLabel('Vidéo', { exact: true }).setInputFiles(VIDEO)
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    // `p[role=alert]` : Next pose aussi un `role="alert"` vide (annonceur de
    // navigation).
    await expect(page.locator('form p[role="alert"]')).toContainText('post Instagram')
    await expect(page).toHaveURL(/\/admin\/reels\/nouveau$/)
  })
})

test.describe('accueil', () => {
  // Trois réels publiés, déposés directement (session admin, mêmes droits
  // que le back-office), avec un ordre très bas pour passer devant les vrais.
  test.beforeAll(async () => {
    await nettoyer()
    const db = await connexionAdmin()
    const chemin = `reels/${MARQUE}/${Date.now()}.mp4`
    const { readFile } = await import('node:fs/promises')
    const { error: e1 } = await db.storage
      .from('patrimoine')
      .upload(chemin, await readFile(VIDEO), { contentType: 'video/mp4', upsert: false })
    expect(e1).toBeNull()
    const lignes = [1, 2, 3].map((i) => ({
      video: chemin,
      lien: `https://www.instagram.com/reel/${MARQUE}-${i}/`,
      legende_fr: `Réel E2E ${i}`,
      ordre: -1000 + i,
      statut: 'publie',
    }))
    const { error: e2 } = await db.from('reels').insert(lignes)
    expect(e2).toBeNull()
  })

  async function allerALaRoue(page: Page) {
    await page.addInitScript(() => sessionStorage.setItem('paaciv-intro-vue', 'oui'))
    await page.goto('/fr')
    const section = page.getByTestId('reels')
    await section.scrollIntoViewIfNeeded()
    return section
  }

  test('la roue montre les réels dans l’épilogue, la carte du sommet joue', async ({ page }) => {
    const section = await allerALaRoue(page)
    // Dans l'épilogue, entre le journal et les activités.
    expect(await page.locator('#epilogue').getByTestId('reels').count()).toBe(1)
    const roue = page.getByTestId('roue-reels')
    await expect(roue).toHaveAttribute('data-actif', '0')
    const etiquette = section.getByTestId('reel-etiquette')
    await expect(etiquette).toContainText('Réel E2E 1')
    await expect(etiquette).toContainText('Images : @paaciv')
    await expect(etiquette.getByRole('link', { name: /Voir sur Instagram/ })).toHaveAttribute(
      'href',
      `https://www.instagram.com/reel/${MARQUE}-1/`,
    )
    const video = section.getByTestId('reel-video')
    await expect(video).toHaveCount(1)
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)

    // Le bouton pause arrête la vidéo.
    await etiquette.getByRole('button', { name: 'Mettre en pause' }).click()
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)

    // La flèche fait tourner la roue.
    await section.getByRole('button', { name: 'Vidéo suivante' }).click()
    await expect(roue).toHaveAttribute('data-actif', '1')
    await expect(etiquette).toContainText('Réel E2E 2')
    // Une carte voisine, cliquée, vient au sommet. Les vrais réels publiés
    // suivent ceux du test : le total dépend de la base.
    const total = await section.locator('[data-carte]').count()
    await section.getByRole('button', { name: `Vidéo 3 sur ${total}` }).click()
    await expect(roue).toHaveAttribute('data-actif', '2')
    // Le clavier aussi, et la roue boucle : de la première, on passe à la
    // dernière.
    await roue.focus()
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowLeft')
    await expect(roue).toHaveAttribute('data-actif', String(total - 1))
  })

  test.describe('mouvement réduit', () => {
    test.use({ contextOptions: { reducedMotion: 'reduce' } })

    test('rien ne se lance seul, la vidéo démarre au bouton', async ({ page }) => {
      const section = await allerALaRoue(page)
      const video = section.getByTestId('reel-video')
      await expect(video).toHaveCount(1)
      await page.waitForTimeout(800)
      expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true)
      const carte = section.locator('[data-carte][data-active]')
      expect(await carte.evaluate((n) => getComputedStyle(n).transitionDuration)).toBe('0s')
      await section.getByRole('button', { name: 'Lire la vidéo' }).click()
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused)).toBe(true)
    })
  })
})
