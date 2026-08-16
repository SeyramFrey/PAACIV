'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'

// Erreurs attendues en valeur de retour, jamais en exception (même patron que
// `admin/contenu/actions.ts:enregistrerContenu`) : Next redacte le message
// des erreurs `throw`ées depuis une Server Action en build de production,
// donc l'exploitant ne verrait qu'un écran d'erreur générique — jamais
// « session expirée », qui est pourtant le scénario ordinaire ici.
export type ResultatDemandeAdmin = { ok: true } | { ok: false; erreur: 'echec' }

export async function marquerDemandeTraitee(id: string): Promise<ResultatDemandeAdmin> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('demandes').update({ statut: 'traitee' }).eq('id', id).select('id')
  if (error) {
    console.error('demandes update', id, error)
    return { ok: false, erreur: 'echec' }
  }
  // Un UPDATE bloqué par RLS ne lève PAS d'erreur (clause USING filtrée à
  // zéro ligne, requête réussie) : sans ce contrôle, une session expirée
  // laisserait croire que la demande a été marquée traitée alors que rien
  // n'a changé en base.
  if (!data || data.length === 0) {
    console.error('demandes update : aucune ligne affectée (id introuvable ou session expirée)', id)
    return { ok: false, erreur: 'echec' }
  }
  revalidatePath('/[locale]/admin/demandes', 'page')
  return { ok: true }
}

// Même garde « zéro ligne affectée » que ci-dessus : une session expirée ou
// un id déjà supprimé ne doit ni lever, ni laisser croire à une suppression
// réussie.
export async function supprimerDemande(id: string): Promise<ResultatDemandeAdmin> {
  const sb = await createServerClient()
  // Même garde explicite que `exporterAbonnesCsv` — et à plus forte raison
  // ici : la policy `demandes` est `to authenticated using (true)`, la base
  // n'a aucune notion d'administrateur, et cette action est invocable
  // directement (POST hors UI) sans passer par la redirection de
  // `admin/layout.tsx`. Une suppression est irréversible, contrairement à un
  // export ou au passage en « traitée ».
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return { ok: false, erreur: 'echec' }
  const { data, error } = await sb.from('demandes').delete().eq('id', id).select('id')
  if (error) {
    console.error('demandes delete', id, error)
    return { ok: false, erreur: 'echec' }
  }
  if (!data || data.length === 0) {
    console.error('demandes delete : aucune ligne affectée (id introuvable ou session expirée)', id)
    return { ok: false, erreur: 'echec' }
  }
  revalidatePath('/[locale]/admin/demandes', 'page')
  return { ok: true }
}
