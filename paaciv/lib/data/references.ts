import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

/**
 * Une époque est une `Ref` DATÉE : elle porte en plus ses bornes numériques
 * (migration 0029), dont la frise chronologique a besoin pour dessiner ses
 * bandes. `borne` reste le libellé destiné à l'œil (« 1893–1960 ») ; il ne
 * doit jamais être parsé pour en tirer des nombres.
 *
 * Le type ÉTEND `Ref` plutôt que de la remplacer : les filtres de l'archive et
 * de la carte traitent les époques comme n'importe quelle table de référence et
 * continuent de fonctionner sans rien savoir de ces colonnes.
 */
export type RefEpoque = Ref & {
  borne: string | null
  annee_min: number | null
  annee_max: number | null
}

export type ReferencesFiltres = {
  types: Ref[]
  programmes: Ref[]
  districts: Ref[]
  epoques: RefEpoque[]
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
    epoques: (epoques.data ?? []) as RefEpoque[],
  }
}
