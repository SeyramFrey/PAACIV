import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

test('le public ne voit que les contenus publiés', async () => {
  const sb = createClient(url, anon)
  for (const table of ['points_cles', 'activites', 'temoignages']) {
    const { data, error } = await sb.from(table).select('statut')
    expect(error, `lecture publique de ${table}`).toBeNull()
    expect((data ?? []).every((r) => r.statut === 'publie'), table).toBe(true)
  }
})

// Un `update()` bloqué par RLS ne lève PAS d'erreur : faute de politique
// applicable, la clause `USING` équivaut à `false`, la requête ne trouve donc
// aucune ligne à modifier et répond avec succès (0 ligne, pas d'erreur). Seul
// `INSERT` échoue explicitement (échec du `WITH CHECK`, code 42501) — d'où le
// patron `error?.code === '42501'` utilisé ailleurs dans le projet (voir
// tests/db/editorial.spec.ts) pour les insertions, mais inadapté ici pour une
// mise à jour. On vérifie donc l'état réel de la donnée plutôt qu'une erreur.
//
// contenu_site n'a pas encore de contenu (le seed arrive en tâche 5) : on
// pose nous-mêmes, en admin authentifié — même parcours que le vrai
// back-office — une valeur de référence sur une clé dédiée au test, pour que
// la vérification anonyme porte sur une ligne qui existe réellement (sinon
// la mise à jour anonyme ne toucherait de toute façon aucune ligne, et le
// test « passerait » même si la policy d'écriture était grande ouverte).
test('contenu_site est lisible publiquement, mais une écriture anonyme ne modifie pas la valeur publiée', async () => {
  const cle = 'test-rls-contenu-site'
  const valeurReference = 'valeur posée par l’admin pour ce test'

  const admin = createClient(url, anon)
  const { error: erreurConnexion } = await admin.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(erreurConnexion, 'connexion admin (TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD)').toBeNull()

  try {
    const { error: erreurSetup } = await admin
      .from('contenu_site')
      .upsert({ cle, valeur_fr: valeurReference })
    expect(erreurSetup, 'pose de la valeur de référence par l’admin').toBeNull()

    const anonyme = createClient(url, anon)

    // Témoin : le client anonyme lit une valeur non vide sur cette clé avant
    // toute tentative d'écriture. Ça exclut l'explication « le WHERE de la
    // relecture plus bas ne correspond à aucune ligne » — la ligne existe
    // bel et bien et est atteignable en lecture par l'anonyme ; la relecture
    // inchangée après l'attaque prouve donc réellement que l'écriture a été
    // bloquée, pas juste qu'elle visait une ligne fantôme.
    const { data: avant, error: erreurLectureAvant } = await anonyme
      .from('contenu_site')
      .select('valeur_fr')
      .eq('cle', cle)
      .maybeSingle()
    expect(erreurLectureAvant, 'lecture publique initiale de contenu_site').toBeNull()
    expect(avant?.valeur_fr, 'témoin : une valeur non vide doit être lisible avant toute tentative d’écriture').toBeTruthy()

    const sentinelle = `piraté-${Date.now()}`
    await anonyme.from('contenu_site').update({ valeur_fr: sentinelle }).eq('cle', cle)

    const { data, error: erreurLecture } = await anonyme
      .from('contenu_site')
      .select('valeur_fr')
      .eq('cle', cle)
      .maybeSingle()
    expect(erreurLecture, 'lecture publique de contenu_site').toBeNull()
    expect(data?.valeur_fr, 'la valeur doit rester celle posée par l’admin').toBe(valeurReference)
    expect(data?.valeur_fr, 'la sentinelle anonyme ne doit jamais apparaître').not.toBe(sentinelle)
  } finally {
    await admin.from('contenu_site').delete().eq('cle', cle)
  }
})

// Le point de sécurité de la phase : ces deux tables portent des adresses
// e-mail et des coordonnées de donateurs. Une policy de lecture trop large
// les rendrait aspirables par n'importe qui via l'API publique Supabase.
test('un anonyme peut déposer mais jamais relire les abonnés', async () => {
  const sb = createClient(url, anon)
  const { error: insertion } = await sb
    .from('newsletter_abonnes')
    .insert({ email: `test-rls-${Date.now()}@exemple.ci`, langue: 'fr' })
  expect(insertion).toBeNull()

  const { data } = await sb.from('newsletter_abonnes').select('email')
  expect(data ?? []).toHaveLength(0)
})

test('un anonyme peut déposer mais jamais relire les demandes', async () => {
  const sb = createClient(url, anon)
  const { error: insertion } = await sb
    .from('demandes')
    .insert({ type: 'don', nom: 'Test RLS', email: 'test-rls@exemple.ci', montant: 5000 })
  expect(insertion).toBeNull()

  const { data } = await sb.from('demandes').select('email, montant')
  expect(data ?? []).toHaveLength(0)
})

// Même piège que pour contenu_site (cf. commentaire plus haut) : un `update`
// bloqué par RLS ne lève pas d'erreur, il filtre à zéro ligne. On le prouve
// donc par comptage exact plutôt que par la présence d'une erreur. La ligne
// ciblée est insérée par ce test lui-même (marqueur unique dans l'e-mail) :
// le test ne dépend ni de l'ordre d'exécution, ni de données préexistantes.
test('une tentative anonyme de marquer une demande comme traitée ne touche aucune ligne', async () => {
  const sb = createClient(url, anon)
  const marqueur = `test-rls-update-${Date.now()}@exemple.ci`
  // Témoin : l'insertion anonyme réussit, donc la ligne portant `marqueur`
  // existe bien en base au moment du update ci-dessous. Ça exclut
  // l'explication « le WHERE ne correspond à aucune ligne » pour le compte à
  // zéro qui suit — la ligne est là, l'anonyme peut simplement pas la
  // modifier.
  const { error: insertion } = await sb
    .from('demandes')
    .insert({ type: 'don', nom: 'Test RLS update', email: marqueur, montant: 5000 })
  expect(insertion).toBeNull()

  const { count, error } = await sb
    .from('demandes')
    .update({ statut: 'traitee' }, { count: 'exact' })
    .eq('email', marqueur)
  expect(error).toBeNull()
  expect(count, 'aucune ligne ne doit être affectée par une mise à jour anonyme').toBe(0)
})
