'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull, intOuNull } from '@/lib/admin/champs'

export type ResultatTemoignage =
  | { ok: true; id: string }
  | { ok: false; erreur: 'nomRequis' | 'citationRequise' }

export async function enregistrerTemoignage(formData: FormData): Promise<ResultatTemoignage> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const nom = (formData.get('nom') ?? '').toString().trim()
  if (!nom) return { ok: false, erreur: 'nomRequis' }
  const citation_fr = (formData.get('citation_fr') ?? '').toString().trim()
  if (!citation_fr) return { ok: false, erreur: 'citationRequise' }

  // Colonne NOT NULL bornée 1-5 (contrainte SQL `temoignages_note_check`) :
  // on clampe ici pour ne jamais laisser Postgres renvoyer un message de
  // contrainte brut à l'admin, la contrainte SQL restant le dernier rempart.
  const noteBrute = intOuNull(formData.get('note'))
  const note = noteBrute === null ? 5 : Math.min(5, Math.max(1, noteBrute))

  const valeurs = {
    nom,
    role_fr: texteOuNull(formData.get('role_fr')),
    role_en: texteOuNull(formData.get('role_en')),
    citation_fr,
    citation_en: texteOuNull(formData.get('citation_en')),
    note,
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('temoignages').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('temoignages').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  revalidatePath('/[locale]/admin/temoignages', 'page')
  // Le bloc « Ils travaillent avec nous » de l'accueil ne s'affiche que si
  // temoignages contient au moins une ligne publiée (spec §4.4) : sans cette
  // revalidation, un premier témoignage saisi resterait invisible en
  // production jusqu'au prochain déploiement.
  revalidatePath('/[locale]', 'page')
  return { ok: true, id: resultId }
}

export async function supprimerTemoignage(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('temoignages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/temoignages', 'page')
  revalidatePath('/[locale]', 'page')
}
