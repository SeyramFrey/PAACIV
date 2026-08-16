import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const SLUG_BORNES = 'test-db-coordonnees-bornes'
const SLUG_ETAT = 'test-db-etat-conservation'

// Client authentifié : l'insertion est bloquée par RLS pour un anonyme, ce qui
// masquerait le refus de la contrainte CHECK derrière une erreur de politique.
async function clientAdmin() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  const { error } = await db.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  })
  expect(error).toBeNull()
  return db
}

test('RLS : un anonyme ne peut pas insérer de patrimoine', async () => {
  const { error } = await anon.from('patrimoine').insert({ slug: 'x-test', titre_fr: 'X' })
  expect(error).not.toBeNull()
})

test('un anonyme lit la table patrimoine sans erreur (0 ligne sans politique)', async () => {
  const { data, error } = await anon.from('patrimoine').select('id')
  expect(error).toBeNull()
  expect(Array.isArray(data)).toBe(true)
})

// Dernier rempart derrière la validation serveur : c'est la contrainte qui
// aurait évité l'incident `lat = 5000` / `lat = 725` (carte publique en panne,
// maplibre-gl levant `Invalid LngLat latitude value` en boucle), quel que soit
// le chemin d'écriture emprunté — formulaire, script de migration ou SQL direct.
// 23514 = check_violation.
test('la base refuse une latitude hors de [-90, 90]', async () => {
  const db = await clientAdmin()
  const { error } = await db
    .from('patrimoine')
    .insert({ slug: `${SLUG_BORNES}-lat`, titre_fr: 'Bornes lat', lat: 5000, lng: -4.02 })
  expect(error?.code).toBe('23514')
})

test('la base refuse une longitude hors de [-180, 180]', async () => {
  const db = await clientAdmin()
  const { error } = await db
    .from('patrimoine')
    .insert({ slug: `${SLUG_BORNES}-lng`, titre_fr: 'Bornes lng', lat: 5.32, lng: 400 })
  expect(error?.code).toBe('23514')
})

test('la base accepte une coordonnée dans les bornes', async () => {
  const db = await clientAdmin()
  const { error } = await db
    .from('patrimoine')
    .insert({ slug: `${SLUG_BORNES}-ok`, titre_fr: 'Bornes ok', lat: 5.32, lng: -4.02 })
  expect(error).toBeNull()
})

// Contrainte 0023, dernier rempart derrière `etatOuNull` côté serveur. Elle est
// ce qui distingue une vraie catégorie d'un simple libellé : sans elle,
// « en danger », « En danger » et « menacé » coexisteraient et aucun filtre ne
// pourrait s'y fier. 23514 = check_violation.
test('la base refuse un état de conservation hors vocabulaire', async () => {
  const db = await clientAdmin()
  const { error } = await db
    .from('patrimoine')
    .insert({ slug: `${SLUG_ETAT}-ko`, titre_fr: 'État ko', etat_conservation: 'en danger' })
  expect(error?.code).toBe('23514')
})

test('la base accepte les quatre états du vocabulaire', async () => {
  const db = await clientAdmin()
  for (const etat of ['intact', 'en_restauration', 'en_danger', 'demoli']) {
    const { error } = await db
      .from('patrimoine')
      .insert({ slug: `${SLUG_ETAT}-${etat}`, titre_fr: `État ${etat}`, etat_conservation: etat })
    expect(error, etat).toBeNull()
  }
})

// `null` reste légitime : c'est « non renseigné », l'état des 8 fiches au jour
// de la migration. Une contrainte qui l'interdirait rendrait toute création de
// fiche impossible sans classer l'édifice d'emblée.
test('la base accepte un état de conservation absent', async () => {
  const db = await clientAdmin()
  const { error } = await db
    .from('patrimoine')
    .insert({ slug: `${SLUG_ETAT}-null`, titre_fr: 'État absent', etat_conservation: null })
  expect(error).toBeNull()
})

// Nettoyage : seule l'insertion valide crée réellement une ligne, mais on
// supprime par préfixe pour rester idempotent si un rempart venait à tomber.
test.afterAll(async () => {
  const db = await clientAdmin()
  const { error } = await db.from('patrimoine').delete().like('slug', `${SLUG_BORNES}%`)
  expect(error).toBeNull()
  const { error: erreurEtat } = await db.from('patrimoine').delete().like('slug', `${SLUG_ETAT}%`)
  expect(erreurEtat).toBeNull()
})

test('le public ne voit que les patrimoines publiés (brouillons cachés)', async () => {
  const { data, error } = await anon.from('patrimoine').select('slug, statut')
  expect(error).toBeNull()
  expect(data!.length).toBe(7)
  expect(data!.some((p) => p.statut !== 'publie')).toBe(false)
  expect(data!.some((p) => p.slug === 'aeroport-felix-houphouet-boigny')).toBe(false)
})
