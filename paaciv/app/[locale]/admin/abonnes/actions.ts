'use server'

import { createServerClient } from '@/lib/supabase/server'
import { versCsv } from '@/lib/csv'

// Client authentifié (cookies de session) : la policy « newsletter_abonnes
// all admin » exige le rôle `authenticated`. Un appel anonyme de cette action
// (POST direct, hors UI) ne renvoie donc aucune ligne — RLS filtre en
// silence, sans qu'il soit nécessaire de dupliquer la garde ici.
export async function exporterAbonnesCsv(): Promise<string> {
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('newsletter_abonnes')
    .select('email, langue, created_at')
    .order('created_at', { ascending: false })
  if (error) {
    console.error('newsletter_abonnes export', error)
    return ''
  }
  return versCsv(
    (data ?? []).map((a) => ({
      email: a.email as string,
      langue: a.langue as string,
      inscrit_le: a.created_at as string,
    })),
  )
}
