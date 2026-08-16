'use server'

import { createServerClient } from '@/lib/supabase/server'
import { versCsv } from '@/lib/csv'

// Client authentifié (cookies de session) : la policy « newsletter_abonnes
// all admin » exige le rôle `authenticated`. Un appel anonyme de cette action
// (POST direct, hors UI) ne renvoie donc aucune ligne — RLS filtre en
// silence, sans qu'il soit nécessaire de dupliquer la garde ici.
//
// Forme { ok, csv } plutôt qu'une simple chaîne : une erreur base (`error`
// non nul) et une liste vide produisaient toutes deux la même chaîne vide
// avant ce correctif — l'association ouvrait un fichier ne contenant que le
// BOM dans les deux cas, sans moyen de distinguer « aucun abonné » d'un
// export cassé.
export type ResultatExportAbonnes = { ok: true; csv: string } | { ok: false; erreur: 'echec' }

export async function exporterAbonnesCsv(): Promise<ResultatExportAbonnes> {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('newsletter_abonnes')
    .select('email, langue, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('newsletter_abonnes export', error)
    return { ok: false, erreur: 'echec' }
  }
  const csv = versCsv(
    (data ?? []).map((a) => ({
      email: a.email as string,
      langue: a.langue as string,
      inscrit_le: a.created_at as string,
    })),
  )
  return { ok: true, csv }
}
