import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const sb = () => createClient(url, anon)

// Code Postgres 42501 = violation de row-level security policy. On vérifie
// précisément ce code (et pas juste « error non nul ») pour que le test
// échoue vraiment si la policy RLS est un jour trop permissive, plutôt que de
// réussir par accident sur une erreur de validation de schéma PostgREST
// (PGRST2xx) sans rapport avec les permissions.
//
// Trois `test()` explicites plutôt qu'une itération générique sur une map
// hétérogène : `Object.entries` sur une map `as const` fait dégénérer chaque
// valeur en union des trois formes de ligne, que l'overload `.insert()` de
// Supabase rejette (il attend la forme exacte de la table ciblée).

test('RLS : un anonyme ne peut pas insérer dans articles', async () => {
  const { error } = await sb()
    .from('articles')
    .insert({ slug: 'x-test-articles', titre_fr: 'X', date_publication: '2026-01-01' })
  expect(error?.code).toBe('42501')
})

test('RLS : un anonyme ne peut pas insérer dans reportages', async () => {
  const { error } = await sb()
    .from('reportages')
    .insert({ slug: 'x-test-reportages', titre_fr: 'X', video_url: 'https://youtu.be/dQw4w9WgXcQ' })
  expect(error?.code).toBe('42501')
})

test('RLS : un anonyme ne peut pas insérer dans evenements', async () => {
  const { error } = await sb()
    .from('evenements')
    .insert({ slug: 'x-test-evenements', titre_fr: 'X', date_debut: '2026-01-01' })
  expect(error?.code).toBe('42501')
})

test('les catégories d\'articles sont lisibles publiquement', async () => {
  const { data, error } = await sb().from('categories_article').select('id')
  expect(error).toBeNull()
  expect(data).not.toBeNull()
})

const BROUILLONS = { articles: 'article-brouillon', reportages: 'reportage-brouillon', evenements: 'evenement-brouillon' } as const

for (const [table, slugBrouillon] of Object.entries(BROUILLONS)) {
  test(`le public ne voit que les ${table} publiés`, async () => {
    const { data, error } = await sb().from(table).select('slug, statut')
    expect(error).toBeNull()
    const lignes = data ?? []
    expect(lignes.length).toBeGreaterThan(0)                                  // sinon l'assertion suivante est vide de sens
    expect(lignes.every((l) => l.statut === 'publie')).toBe(true)
    expect(lignes.some((l) => l.slug === slugBrouillon)).toBe(false)          // le brouillon existe en base et doit rester invisible
  })
}
