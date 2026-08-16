'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

export async function marquerDemandeTraitee(id: string): Promise<void> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('demandes').update({ statut: 'traitee' }).eq('id', id).select('id')
  if (error) {
    console.error('demandes update', id, error)
    throw error
  }
  // Un UPDATE bloqué par RLS ne lève PAS d'erreur (clause USING filtrée à
  // zéro ligne, requête réussie) : sans ce contrôle, une session expirée
  // laisserait croire que la demande a été marquée traitée alors que rien
  // n'a changé en base.
  if (!data || data.length === 0) {
    const erreur = new Error('Mise à jour sans effet : demande introuvable ou session expirée.')
    console.error('demandes update : aucune ligne affectée (id introuvable ou session expirée)', id)
    throw erreur
  }
  revalidatePath('/[locale]/admin/demandes', 'page')
}
