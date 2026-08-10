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
  const { data, error } = await sb.from('architectes').select('id, slug, statut')
  expect(error).toBeNull()
  const rows = data ?? []
  // Discriminant : le seed (0010) inclut un architecte en brouillon
  // (« architecte-brouillon »). S'il apparaissait ici, la policy RLS serait cassée.
  expect(rows.some((a) => a.slug === 'architecte-brouillon')).toBe(false)
  expect(rows.length).toBeGreaterThan(0)
  expect(rows.every((a) => a.statut === 'publie')).toBe(true)
})

test('le public ne voit que les liaisons architecte↔patrimoine publié↔publié', async () => {
  const sb = createClient(url, anon)
  const { data, error } = await sb
    .from('patrimoine_architecte')
    .select('patrimoine_id, architecte_id, architectes(slug), patrimoine(slug)')
  expect(error).toBeNull()
  const rows = (data ?? []) as unknown as {
    architectes: { slug: string } | null
    patrimoine: { slug: string } | null
  }[]

  // Liaison piège n°1 : architecte publié ↔ patrimoine en brouillon (« aeroport-...»).
  expect(rows.some((r) => r.patrimoine?.slug === 'aeroport-felix-houphouet-boigny')).toBe(false)
  // Liaison piège n°2 : architecte en brouillon ↔ patrimoine publié.
  expect(rows.some((r) => r.architectes?.slug === 'architecte-brouillon')).toBe(false)
  // Liaison légitime : publié ↔ publié, doit rester visible (sinon la policy serait trop stricte).
  expect(rows.some((r) => r.architectes?.slug === 'pierre-fakhoury' && r.patrimoine?.slug === 'basilique-yamoussoukro')).toBe(true)
})
