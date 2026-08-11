'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { texteOuNull, richeOuNull } from '@/lib/admin/champs'
import { extraireIdYoutube } from '@/lib/youtube'

// Trois cas de validation *attendus* : modélisés en valeur de retour plutôt
// qu'en exception (même raisonnement et même pattern que
// evenements/actions.ts, à lire en premier — la doc Next officielle
// recommande justement de modéliser les erreurs attendues en valeurs de
// retour, un `throw` étant redacté en production). La collision de slug est
// l'erreur la plus probable pour un(e) éditeur/rice qui republie sur le même
// sujet (spec §7) : elle doit rester visible, pas silencieuse. Les erreurs
// *inattendues* (autres échecs Supabase) restent des exceptions.
export type ResultatReportage =
  | { ok: true; id: string }
  | { ok: false; erreur: 'titreRequis' | 'slugDuplique' | 'urlInvalide' }

export async function enregistrerReportage(formData: FormData): Promise<ResultatReportage> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) return { ok: false, erreur: 'titreRequis' }
  const slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)

  const video_url = (formData.get('video_url') ?? '').toString().trim()
  // Colonne NOT NULL et pivot de toute la façade vidéo publique (miniature
  // de carte + lecteur de fiche) : une URL illisible ne doit jamais atteindre
  // la base, sinon l'index affiche une carte sans vignette et la fiche un
  // lecteur vide. On valide donc avant toute écriture.
  if (!extraireIdYoutube(video_url)) return { ok: false, erreur: 'urlInvalide' }

  const valeurs = {
    slug,
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    video_url,
    description_fr: richeOuNull(formData.get('description_fr')),
    description_en: richeOuNull(formData.get('description_en')),
    patrimoine_id: texteOuNull(formData.get('patrimoine_id')),
    // Colonne NOT NULL (défaut current_date à l'insertion seulement) : on ne
    // peut donc jamais lui passer explicitement null.
    date: texteOuNull(formData.get('date')) ?? new Date().toISOString().slice(0, 10),
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('reportages').update(valeurs).eq('id', id)
    if (error) {
      if (error.code === '23505') return { ok: false, erreur: 'slugDuplique' }
      throw error
    }
    resultId = id
  } else {
    const { data, error } = await sb.from('reportages').insert(valeurs).select('id').single()
    if (error) {
      if (error.code === '23505') return { ok: false, erreur: 'slugDuplique' }
      throw error
    }
    resultId = data.id
  }

  revalidatePath('/[locale]/admin/reportages', 'page')
  return { ok: true, id: resultId }
}

export async function supprimerReportage(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('reportages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/reportages', 'page')
}
