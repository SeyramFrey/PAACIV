import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

test('RLS : un anonyme ne peut pas insérer d\'architecte', async () => {
  const sb = createClient(url, anon)
  const { error } = await sb.from('architectes').insert({ slug: 'x-test', nom: 'X', origine: 'ivoirien' })
  expect(error).not.toBeNull()
})

test('le public ne voit que les architectes publiés', async () => {
  const sb = createClient(url, anon)
  const { data, error } = await sb.from('architectes').select('id, statut')
  expect(error).toBeNull()
  expect((data ?? []).every((a) => a.statut === 'publie')).toBe(true)
})
