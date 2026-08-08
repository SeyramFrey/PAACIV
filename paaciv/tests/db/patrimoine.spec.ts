import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

test('RLS : un anonyme ne peut pas insérer de patrimoine', async () => {
  const { error } = await anon.from('patrimoine').insert({ slug: 'x-test', titre_fr: 'X' })
  expect(error).not.toBeNull()
})

test('un anonyme lit la table patrimoine sans erreur (0 ligne sans politique)', async () => {
  const { data, error } = await anon.from('patrimoine').select('id')
  expect(error).toBeNull()
  expect(Array.isArray(data)).toBe(true)
})
