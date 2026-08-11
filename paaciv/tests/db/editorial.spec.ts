import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const sb = () => createClient(url, anon)

for (const table of ['articles', 'reportages', 'evenements'] as const) {
  test(`RLS : un anonyme ne peut pas insérer dans ${table}`, async () => {
    const { error } = await sb().from(table).insert({ slug: `x-test-${table}`, titre_fr: 'X', video_url: 'x', date_debut: '2026-01-01' })
    expect(error).not.toBeNull()
  })
}

test('les catégories d\'articles sont lisibles publiquement', async () => {
  const { data, error } = await sb().from('categories_article').select('id')
  expect(error).toBeNull()
  expect(data).not.toBeNull()
})
