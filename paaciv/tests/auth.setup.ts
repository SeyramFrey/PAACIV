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
  // Scopé à <main> : depuis la Task 9, les trois modales de soutien sont
  // montées globalement (fermées mais présentes dans le DOM) en dehors de
  // <main>, et portent elles aussi un champ « Adresse e-mail ».
  const main = page.getByRole('main')
  await main.getByLabel('Adresse e-mail').fill(email!)
  await main.getByLabel('Mot de passe').fill(motDePasse!)
  await main.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL(/\/fr\/admin/)

  fs.mkdirSync(path.dirname(fichier), { recursive: true })
  await page.context().storageState({ path: fichier })
})
