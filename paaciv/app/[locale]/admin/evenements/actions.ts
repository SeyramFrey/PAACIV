'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { texteOuNull, richeOuNull } from '@/lib/admin/champs'

export async function enregistrerEvenement(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) throw new Error('Titre FR requis')
  const slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)

  const date_debut = texteOuNull(formData.get('date_debut'))
  // Colonne NOT NULL et pivot du tri/de la partition « à venir / passés »
  // (cf. Task É8) : une absence ne doit jamais atteindre la base avec un
  // message Postgres illisible ("null value in column date_debut...").
  if (!date_debut) throw new Error('Date de début requise')
  const date_fin = texteOuNull(formData.get('date_fin'))
  // Défense en profondeur devant la contrainte SQL `evenements_dates_coherentes`
  // (0011_editorial.sql) : le message de violation de contrainte Postgres brut
  // est illisible pour un utilisateur final, on valide donc ici avec un
  // message clair avant toute écriture.
  if (date_fin && date_fin < date_debut) {
    throw new Error('La date de fin ne peut pas être antérieure à la date de début')
  }

  const valeurs = {
    slug,
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    description_fr: richeOuNull(formData.get('description_fr')),
    description_en: richeOuNull(formData.get('description_en')),
    lieu: texteOuNull(formData.get('lieu')),
    date_debut,
    date_fin,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('evenements').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('evenements').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  // Image (optionnelle) : upload dans le bucket patrimoine, préfixe
  // evenements/<id>/ (mirror exact de l'upload couverture de articles/actions.ts).
  // Ne toucher à `image` que si un fichier non vide est fourni : enregistrer
  // sans nouveau fichier ne doit jamais effacer l'image existante.
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    const ext = image.name.split('.').pop() ?? 'jpg'
    const chemin = `evenements/${resultId}/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, image, {
      contentType: image.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) throw upErr
    const { error } = await sb.from('evenements').update({ image: chemin }).eq('id', resultId)
    if (error) throw error
  }

  revalidatePath('/[locale]/admin/evenements', 'page')
  return { id: resultId }
}

export async function supprimerEvenement(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('evenements').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/evenements', 'page')
}
