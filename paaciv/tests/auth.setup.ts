import { test as setup, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const fichier = path.join(__dirname, '..', 'playwright', '.auth', 'admin.json')

setup('authentifier l\'admin', async ({ page }) => {
  const email = process.env.TEST_ADMIN_EMAIL
  const motDePasse = process.env.TEST_ADMIN_PASSWORD
  expect(
    email && motDePasse,
    'Définir TEST_ADMIN_EMAIL et TEST_ADMIN_PASSWORD dans .env.local (utilisateur Supabase existant)',
  ).toBeTruthy()

  await page.goto('/fr/login')
  await page.getByLabel('Adresse e-mail').fill(email!)
  await page.getByLabel('Mot de passe').fill(motDePasse!)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/fr\/admin/)

  fs.mkdirSync(path.dirname(fichier), { recursive: true })
  await page.context().storageState({ path: fichier })
})
