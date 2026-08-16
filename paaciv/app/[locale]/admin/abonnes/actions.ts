'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { versCsv } from '@/lib/csv'

// Forme { ok, csv } plutôt qu'une simple chaîne : une erreur base (`error`
// non nul) et une liste vide produisaient toutes deux la même chaîne vide
// avant ce correctif — l'association ouvrait un fichier ne contenant que le
// BOM dans les deux cas, sans moyen de distinguer « aucun abonné » d'un
// export cassé.
export type ResultatExportAbonnes = { ok: true; csv: string } | { ok: false; erreur: 'echec' }

export type ResultatAbonneAdmin = { ok: true } | { ok: false; erreur: 'echec' }

export async function exporterAbonnesCsv(): Promise<ResultatExportAbonnes> {
  const sb = await createServerClient()
  // Garde explicite : la policy « newsletter_abonnes all admin » exige déjà
  // le rôle `authenticated`, mais s'appuyer uniquement sur RLS laisse cette
  // action fragile à une future modification de policy — elle est invocable
  // directement (POST hors UI), en dehors de la redirection posée par
  // `admin/layout.tsx`.
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return { ok: false, erreur: 'echec' }
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

// Même garde « zéro ligne affectée » que `admin/demandes/actions.ts` : un
// DELETE bloqué par RLS ne lève pas d'erreur (clause USING filtrée à zéro
// ligne, requête réussie), donc une session expirée laisserait croire à une
// suppression réussie sans ce contrôle.
export async function supprimerAbonne(id: string): Promise<ResultatAbonneAdmin> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('newsletter_abonnes').delete().eq('id', id).select('id')
  if (error) {
    console.error('newsletter_abonnes delete', id, error)
    return { ok: false, erreur: 'echec' }
  }
  if (!data || data.length === 0) {
    console.error('newsletter_abonnes delete : aucune ligne affectée (id introuvable ou session expirée)', id)
    return { ok: false, erreur: 'echec' }
  }
  revalidatePath('/[locale]/admin/abonnes', 'page')
  return { ok: true }
}
