'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull, intOuNull } from '@/lib/admin/champs'

// Erreur attendue (titre manquant) en valeur de retour, jamais en exception :
// même raisonnement que evenements/actions.ts — un `throw` serait redacté en
// production et ne laisserait aucune indication utilisable à l'admin.
export type ResultatPointCle = { ok: true; id: string } | { ok: false; erreur: 'titreRequis' }

export async function enregistrerPointCle(formData: FormData): Promise<ResultatPointCle> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) return { ok: false, erreur: 'titreRequis' }

  // Colonne contrainte à 'pourquoi' | 'raisons' (points_cles_bloc_check) : une
  // valeur imprévue retomberait sur un message Postgres brut. On borne donc
  // ici, la contrainte SQL restant le dernier rempart.
  const bloc = (formData.get('bloc') ?? '').toString() === 'raisons' ? 'raisons' : 'pourquoi'

  const valeurs = {
    bloc,
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    texte_fr: texteOuNull(formData.get('texte_fr')),
    texte_en: texteOuNull(formData.get('texte_en')),
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('points_cles').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('points_cles').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  revalidatePath('/[locale]/admin/points-cles', 'page')
  // Les blocs « Pourquoi nous suivre » et « Cinq raisons » de l'accueil lisent
  // points_cles : sans cette revalidation, une modification resterait
  // invisible en production jusqu'au prochain déploiement.
  revalidatePath('/[locale]', 'page')
  return { ok: true, id: resultId }
}

export async function supprimerPointCle(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('points_cles').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/points-cles', 'page')
  revalidatePath('/[locale]', 'page')
}
