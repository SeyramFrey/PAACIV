import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

test('les tables de référence sont peuplées et lisibles publiquement', async () => {
  const [types, programmes, districts, epoques] = await Promise.all([
    db.from('types').select('id'),
    db.from('programmes').select('id'),
    db.from('districts').select('id'),
    db.from('epoques').select('id'),
  ])
  expect(types.data?.length).toBe(7)
  expect(programmes.data?.length).toBe(10)
  expect(districts.data?.length).toBe(14)
  expect(epoques.data?.length).toBe(3)
})
