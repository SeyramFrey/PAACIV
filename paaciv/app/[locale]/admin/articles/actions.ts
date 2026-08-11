'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slug'
import { texteOuNull, richeOuNull } from '@/lib/admin/champs'

// Deux cas de validation *attendus* : modélisés en valeur de retour plutôt
// qu'en exception (même raisonnement et même pattern que
// evenements/actions.ts, à lire en premier — la doc Next officielle
// recommande justement de modéliser les erreurs attendues en valeurs de
// retour, un `throw` étant redacté en production). La collision de slug est
// l'erreur la plus probable pour un(e) éditeur/rice qui republie sur le même
// sujet (spec §7) : elle doit rester visible, pas silencieuse. Les erreurs
// *inattendues* (autres échecs Supabase, upload) restent des exceptions.
export type ResultatArticle =
  | { ok: true; id: string }
  | { ok: false; erreur: 'titreRequis' | 'slugDuplique' }

export async function enregistrerArticle(formData: FormData): Promise<ResultatArticle> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) return { ok: false, erreur: 'titreRequis' }
  const slug = texteOuNull(formData.get('slug')) ?? slugify(titre_fr)

  const valeurs = {
    slug,
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    // Le chapô est du texte simple (cartes + meta description) : jamais de HTML.
    chapo_fr: texteOuNull(formData.get('chapo_fr')),
    chapo_en: texteOuNull(formData.get('chapo_en')),
    corps_fr: richeOuNull(formData.get('corps_fr')),
    corps_en: richeOuNull(formData.get('corps_en')),
    categorie_id: texteOuNull(formData.get('categorie_id')),
    patrimoine_id: texteOuNull(formData.get('patrimoine_id')),
    // Colonne NOT NULL (défaut current_date à l'insertion seulement) : on ne
    // peut donc jamais lui passer explicitement null.
    date_publication: texteOuNull(formData.get('date_publication')) ?? new Date().toISOString().slice(0, 10),
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('articles').update(valeurs).eq('id', id)
    if (error) {
      if (error.code === '23505') return { ok: false, erreur: 'slugDuplique' }
      throw error
    }
    resultId = id
  } else {
    const { data, error } = await sb.from('articles').insert(valeurs).select('id').single()
    if (error) {
      if (error.code === '23505') return { ok: false, erreur: 'slugDuplique' }
      throw error
    }
    resultId = data.id
  }

  // Couverture (optionnelle) : upload dans le bucket patrimoine, préfixe
  // articles/<id>/ (mirror exact de l'upload photo de architectes/actions.ts).
  // Ne toucher à image_couverture que si un fichier non vide est fourni :
  // enregistrer sans nouveau fichier ne doit jamais effacer l'image existante.
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    try {
      const ext = image.name.split('.').pop() ?? 'jpg'
      const chemin = `articles/${resultId}/${Date.now()}.${ext}`
      const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, image, {
        contentType: image.type || 'image/jpeg',
        upsert: false,
      })
      if (upErr) throw upErr
      const { error } = await sb.from('articles').update({ image_couverture: chemin }).eq('id', resultId)
      if (error) throw error
    } catch (e) {
      // Chemin insertion uniquement : la ligne vient d'être créée par CE
      // formulaire et n'existait pas avant, donc rien à préserver. Sur le
      // chemin édition, la ligne préexistait déjà avant l'appel — la
      // supprimer effacerait un contenu potentiellement publié.
      if (!id) await sb.from('articles').delete().eq('id', resultId)
      throw e
    }
  }

  revalidatePath('/[locale]/admin/articles', 'page')
  return { ok: true, id: resultId }
}

export async function supprimerArticle(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('articles').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/articles', 'page')
}
