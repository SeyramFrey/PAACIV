'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { texteOuNull, richeOuNull } from '@/lib/admin/champs'
import { extraireIdYoutube } from '@/lib/youtube'

export async function enregistrerReportage(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) throw new Error('Titre FR requis')
  const slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)

  const video_url = (formData.get('video_url') ?? '').toString().trim()
  // Colonne NOT NULL et pivot de toute la façade vidéo publique (miniature
  // de carte + lecteur de fiche) : une URL illisible ne doit jamais atteindre
  // la base, sinon l'index affiche une carte sans vignette et la fiche un
  // lecteur vide. On valide donc avant toute écriture.
  if (!extraireIdYoutube(video_url)) throw new Error('URL YouTube invalide')

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
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('reportages').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  revalidatePath('/[locale]/admin/reportages', 'page')
  return { id: resultId }
}

export async function supprimerReportage(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('reportages').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/reportages', 'page')
}
