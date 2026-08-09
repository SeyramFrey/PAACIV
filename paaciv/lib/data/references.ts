import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

export type ReferencesFiltres = {
  types: Ref[]
  programmes: Ref[]
  districts: Ref[]
  epoques: Ref[]
}

export async function chargerReferences(): Promise<ReferencesFiltres> {
  const sb = await createServerClient()
  const [types, programmes, districts, epoques] = await Promise.all([
    sb.from('types').select('*').order('ordre'),
    sb.from('programmes').select('*').order('ordre'),
    sb.from('districts').select('*').order('ordre'),
    sb.from('epoques').select('*').order('ordre'),
  ])
  return {
    types: (types.data ?? []) as Ref[],
    programmes: (programmes.data ?? []) as Ref[],
    districts: (districts.data ?? []) as Ref[],
    epoques: (epoques.data ?? []) as Ref[],
  }
}
