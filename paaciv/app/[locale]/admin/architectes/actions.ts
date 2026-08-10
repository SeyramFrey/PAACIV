'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { texteOuNull, intOuNull, richeOuNull } from '@/lib/admin/champs'

export async function enregistrerArchitecte(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const nom = (formData.get('nom') ?? '').toString().trim()
  if (!nom) throw new Error('Nom requis')
  const slug = texteOuNull(formData.get('slug')) ?? slugify(nom)

  const valeurs = {
    slug,
    nom,
    origine: (formData.get('origine') ?? 'ivoirien').toString(),
    annee_naissance: intOuNull(formData.get('annee_naissance')),
    annee_deces: intOuNull(formData.get('annee_deces')),
    periode_texte: texteOuNull(formData.get('periode_texte')),
    bio_fr: richeOuNull(formData.get('bio_fr')),
    bio_en: richeOuNull(formData.get('bio_en')),
    parcours_fr: richeOuNull(formData.get('parcours_fr')),
    parcours_en: richeOuNull(formData.get('parcours_en')),
    realisations_texte_fr: richeOuNull(formData.get('realisations_texte_fr')),
    realisations_texte_en: richeOuNull(formData.get('realisations_texte_en')),
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('architectes').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('architectes').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  // Photo (optionnelle) : upload dans le bucket patrimoine, préfixe architectes/<id>/.
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const chemin = `architectes/${resultId}/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, photo, {
      contentType: photo.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) throw upErr
    const { error } = await sb.from('architectes').update({ photo: chemin }).eq('id', resultId)
    if (error) throw error
  }

  revalidatePath('/[locale]/admin/architectes', 'page')
  return { id: resultId }
}

export async function supprimerArchitecte(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('architectes').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/architectes', 'page')
}
