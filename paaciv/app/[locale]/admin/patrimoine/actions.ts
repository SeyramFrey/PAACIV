'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { texteOuNull, intOuNull, richeOuNull } from '@/lib/admin/champs'

export async function supprimerPatrimoine(id: string) {
  const sb = await createServerClient()
  const { error } = await sb.from('patrimoine').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine', 'page')
}

export async function enregistrerPatrimoine(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) throw new Error('Titre FR requis')

  const slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)

  const valeurs = {
    slug,
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    resume_fr: texteOuNull(formData.get('resume_fr')),
    resume_en: texteOuNull(formData.get('resume_en')),
    description_fr: richeOuNull(formData.get('description_fr')),
    description_en: richeOuNull(formData.get('description_en')),
    type_id: texteOuNull(formData.get('type_id')),
    programme_id: texteOuNull(formData.get('programme_id')),
    district_id: texteOuNull(formData.get('district_id')),
    epoque_id: texteOuNull(formData.get('epoque_id')),
    style_fr: texteOuNull(formData.get('style_fr')),
    style_en: texteOuNull(formData.get('style_en')),
    date_texte: texteOuNull(formData.get('date_texte')),
    annee_debut: intOuNull(formData.get('annee_debut')),
    annee_fin: intOuNull(formData.get('annee_fin')),
    lat: formData.get('lat') ? Number(formData.get('lat')) : null,
    lng: formData.get('lng') ? Number(formData.get('lng')) : null,
    ville: texteOuNull(formData.get('ville')),
    adresse_fr: texteOuNull(formData.get('adresse_fr')),
    adresse_en: texteOuNull(formData.get('adresse_en')),
    statut_patrimonial: texteOuNull(formData.get('statut_patrimonial')),
    etat_conservation: texteOuNull(formData.get('etat_conservation')),
    video_url: texteOuNull(formData.get('video_url')),
    sources_fr: texteOuNull(formData.get('sources_fr')),
    sources_en: texteOuNull(formData.get('sources_en')),
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('patrimoine').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('patrimoine').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }
  revalidatePath('/[locale]/admin/patrimoine', 'page')
  return { id: resultId }
}

export async function ajouterImage(formData: FormData): Promise<void> {
  const sb = await createServerClient()
  const patrimoineId = formData.get('patrimoine_id')!.toString()
  const credit = texteOuNull(formData.get('credit'))
  const legende_fr = texteOuNull(formData.get('legende_fr'))
  const fichiers = formData.getAll('fichiers').filter((f): f is File => f instanceof File && f.size > 0)

  // ordre de départ = nb d'images existantes
  const { count } = await sb
    .from('images')
    .select('id', { count: 'exact', head: true })
    .eq('patrimoine_id', patrimoineId)
  let ordre = count ?? 0

  for (const fichier of fichiers) {
    const ext = fichier.name.split('.').pop() ?? 'jpg'
    const chemin = `${patrimoineId}/${ordre}-${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, fichier, {
      contentType: fichier.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) throw upErr
    const { error } = await sb.from('images').insert({
      patrimoine_id: patrimoineId,
      chemin,
      credit,
      legende_fr,
      ordre,
      est_principale: ordre === 0 && (count ?? 0) === 0,
    })
    if (error) throw error
    ordre += 1
  }
  revalidatePath('/[locale]/admin/patrimoine/[id]', 'page')
}

export async function supprimerImage(id: string): Promise<void> {
  const sb = await createServerClient()
  const { data: img } = await sb.from('images').select('chemin').eq('id', id).maybeSingle()
  if (img && !/^https?:\/\//i.test(img.chemin)) {
    await sb.storage.from('patrimoine').remove([img.chemin])
  }
  const { error } = await sb.from('images').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine/[id]', 'page')
}

export async function definirPrincipale(patrimoineId: string, imageId: string): Promise<void> {
  const sb = await createServerClient()
  await sb.from('images').update({ est_principale: false }).eq('patrimoine_id', patrimoineId)
  const { error } = await sb.from('images').update({ est_principale: true }).eq('id', imageId)
  if (error) throw error
  revalidatePath('/[locale]/admin/patrimoine/[id]', 'page')
}
