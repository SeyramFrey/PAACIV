import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

// Nécessaire pour atteindre /admin/* : sans storageState, le layout admin
// (app/[locale]/admin/layout.tsx) redirige vers /fr/login faute de session —
// même motif que tests/admin-evenement.spec.ts et les autres specs d'admin.
test.use({ storageState: 'playwright/.auth/admin.json' })

// Clé dédiée à ce test, jamais lue par aucun composant public : toutes les
// clés affichées sur l'accueil sont câblées en dur dans les composants
// (components/accueil/*.tsx lisent `texte(textes, 'carte_titre', locale)`,
// jamais une clé résolue dynamiquement). Une version précédente de ce test
// écrasait `carte_titre` — un intitulé réel affiché en production — puis le
// restaurait en `afterAll`. Deux défauts relevés en revue : (1) le
// `beforeAll` qui capturait la valeur d'origine n'assertait rien, donc une
// lecture ratée y laissait `null`, et l'`afterAll` (qui s'exécute même après
// un `beforeAll` en échec) écrivait alors `valeur_fr: null` — la RLS
// n'empêche rien ici puisque la connexion est bien admin ; (2) même corrigée,
// la fenêtre entre l'écrasement et la restauration reste un risque réel : un
// Ctrl-C, un worker tué, un `--max-failures` ou un timeout n'exécute jamais
// `afterAll`, et le texte de test resterait alors en place indéfiniment sur
// le site public. Une clé de test dédiée ferme ce risque au lieu de le
// réduire : même en cas de crash, la pire trace laissée est une ligne
// `contenu_site` inerte (jamais rendue nulle part), au même titre que les
// artefacts déjà accumulés dans `demandes`/`newsletter_abonnes`.
test('un texte modifié en admin est immédiatement lisible publiquement', async ({ page }) => {
  const cle = `test-e2e-admin-contenu-${Date.now()}`
  const valeurInitiale = 'valeur de départ posée par ce test'
  const nouveau = `Titre de test ${Date.now()}`

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion, 'connexion admin (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD)').toBeNull()

  try {
    // Pose la clé de test, même parcours que le vrai back-office (écriture
    // authentifiée) : `contenu_site` n'a pas d'écran de création, seulement
    // d'édition — une clé doit préexister pour que le formulaire admin la
    // propose.
    const { error: erreurSetup } = await admin
      .from('contenu_site')
      .upsert({ cle, valeur_fr: valeurInitiale, valeur_en: valeurInitiale })
    expect(erreurSetup, 'pose de la clé de test par l’admin').toBeNull()

    await page.goto('/fr/admin/contenu')
    // Plus d'attente `networkidle` ici : c'était un contournement côté test
    // d'un bug côté composant (`FormulaireContenuLigne` utilisait
    // `defaultValue`, un `<textarea>` non contrôlé — Chrome/Firefox
    // restaurent sa valeur au retour arrière AVANT l'hydratation React, d'où
    // la duplication observée). Le composant est désormais contrôlé
    // (`value`/`onChange`), donc React est la seule source de vérité dès le
    // premier rendu et Playwright n'a plus besoin d'attendre le réseau avant
    // d'interagir. Playwright déconseille explicitement `networkidle`.
    const bloc = page.locator('form', { has: page.locator(`input[name="cle"][value="${cle}"]`) })
    // `.clear()` avant `.fill()` : constaté empiriquement pendant cette revue
    // (instrumentation temporaire de `onChange`, retirée) que `.fill()` seul
    // sur ce champ contrôlé pouvait insérer le nouveau texte SANS remplacer
    // l'ancien plutôt que de le remplacer — l'événement `input` capturé par
    // React portait déjà la valeur concaténée, donc ce n'était pas un défaut
    // du composant (déjà hydraté et correctement contrôlé à ce moment) mais
    // une interaction `.fill()` propre à ce test. `.clear()` est l'API
    // Playwright dédiée à vider un champ de façon fiable avant saisie.
    await bloc.getByLabel(/valeur \(fr\)/i).clear()
    await bloc.getByLabel(/valeur \(fr\)/i).fill(nouveau)
    await bloc.getByRole('button', { name: /enregistrer/i }).click()
    // Attend le témoin d'écriture réussie avant toute autre assertion : un
    // `click()` ne fait que déclencher la Server Action (via `useTransition`),
    // encore en vol au moment où l'appel suivant s'exécuterait sans cette
    // attente — piège relevé en revue sur ce test précisément.
    await expect(bloc.getByRole('status')).toBeVisible()

    // Persistance : une navigation fraîche vers l'écran admin (nouveau rendu
    // serveur, pas de cache client) doit refléter la valeur enregistrée.
    await page.goto('/fr/admin/contenu')
    const blocRelu = page.locator('form', { has: page.locator(`input[name="cle"][value="${cle}"]`) })
    await expect(blocRelu.getByLabel(/valeur \(fr\)/i)).toHaveValue(nouveau)

    // Propagation : relecture par le rôle anonyme, exactement le chemin
    // d'accès qu'emprunte la page publique (`lib/supabase/reader.ts` via
    // `lib/data/contenu-site.ts`), jamais de clé de service. Aucune clé
    // affichée par l'accueil n'étant dynamique, une clé de test ne peut
    // jamais apparaître dans le HTML public — cette relecture anonyme est la
    // preuve équivalente de propagation, sans jamais toucher un contenu
    // réellement affiché.
    const anonyme = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data, error: erreurLecture } = await anonyme
      .from('contenu_site')
      .select('valeur_fr')
      .eq('cle', cle)
      .maybeSingle()
    expect(erreurLecture, 'lecture publique de contenu_site').toBeNull()
    expect(data?.valeur_fr, 'la valeur modifiée en admin doit être lisible publiquement').toBe(nouveau)
  } finally {
    await admin.from('contenu_site').delete().eq('cle', cle)
  }
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

test('une demande peut être supprimée depuis l’admin, sans rechargement manuel', async ({ page }) => {
  const email = `e2e-suppr-demande-${Date.now()}@exemple.ci`
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion).toBeNull()
  const { error: erreurSetup } = await admin
    .from('demandes')
    .insert({ type: 'don', nom: 'Vérification suppression', email, statut: 'nouvelle' })
  expect(erreurSetup).toBeNull()

  // Accepte la boîte de confirmation native (`window.confirm` dans
  // `BoutonSupprimer`) : sans ce gestionnaire, Playwright la rejette par
  // défaut et le clic n'aurait aucun effet.
  page.on('dialog', (d) => d.accept())
  await page.goto('/fr/admin/demandes')
  const ligne = page.locator('tr', { hasText: email })
  await expect(ligne).toBeVisible()
  await ligne.getByRole('button', { name: /supprimer/i }).click()
  // Couvre le chemin complet de la suppression (A3) : confirmation native,
  // action serveur, disparition de la ligne sans rechargement manuel de la
  // page — sans jamais toucher directement la base depuis le test.
  await expect(page.getByText(email)).not.toBeVisible()
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

test('un abonné peut être supprimé depuis l’admin, sans rechargement manuel', async ({ page }) => {
  const email = `e2e-suppr-abonne-${Date.now()}@exemple.ci`
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error: erreurConnexion } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion).toBeNull()
  const { error: erreurSetup } = await admin.from('newsletter_abonnes').insert({ email, langue: 'fr' })
  expect(erreurSetup).toBeNull()

  page.on('dialog', (d) => d.accept())
  await page.goto('/fr/admin/abonnes')
  const ligne = page.locator('tr', { hasText: email })
  await expect(ligne).toBeVisible()
  await ligne.getByRole('button', { name: /supprimer/i }).click()
  await expect(page.getByText(email)).not.toBeVisible()
})
