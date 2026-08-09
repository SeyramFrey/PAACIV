import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

test('le bucket patrimoine est listable publiquement (lecture publique)', async () => {
  const { error } = await anon.storage.from('patrimoine').list('', { limit: 1 })
  expect(error).toBeNull()
})

test('un anonyme ne peut pas écrire dans le bucket', async () => {
  const { error } = await anon.storage
    .from('patrimoine')
    .upload(`interdit-${Date.now()}.txt`, new Blob(['x']))
  expect(error).not.toBeNull()
})
