'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull, intOuNull } from '@/lib/admin/champs'

// `echec` couvre le cas d'un UPDATE bloqué par RLS (voir plus bas) en plus
// des échecs d'upload inattendus.
export type ResultatActivite = { ok: true; id: string } | { ok: false; erreur: 'titreRequis' | 'echec' }

export async function enregistrerActivite(formData: FormData): Promise<ResultatActivite> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const titre_fr = (formData.get('titre_fr') ?? '').toString().trim()
  if (!titre_fr) return { ok: false, erreur: 'titreRequis' }

  const valeurs = {
    titre_fr,
    titre_en: texteOuNull(formData.get('titre_en')),
    cadence_fr: texteOuNull(formData.get('cadence_fr')),
    cadence_en: texteOuNull(formData.get('cadence_en')),
    description_fr: texteOuNull(formData.get('description_fr')),
    description_en: texteOuNull(formData.get('description_en')),
    cta_libelle_fr: texteOuNull(formData.get('cta_libelle_fr')),
    cta_libelle_en: texteOuNull(formData.get('cta_libelle_en')),
    cta_href: texteOuNull(formData.get('cta_href')),
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { data, error } = await sb.from('activites').update(valeurs).eq('id', id).select('id')
    if (error) {
      console.error('activites update', id, error)
      throw error
    }
    // Un UPDATE bloqué par RLS ne lève PAS d'erreur (clause USING filtrée à
    // zéro ligne, requête réussie) : sans ce contrôle, une session expirée
    // afficherait « enregistré » alors que rien n'a changé.
    if (!data || data.length === 0) {
      console.error('activites update : aucune ligne affectée (id introuvable ou session expirée)', id)
      return { ok: false, erreur: 'echec' }
    }
    resultId = id
  } else {
    const { data, error } = await sb.from('activites').insert(valeurs).select('id').single()
    if (error) {
      console.error('activites insert', error)
      throw error
    }
    resultId = data.id
  }

  // Image (optionnelle) : upload dans le bucket patrimoine, préfixe
  // activites/<id>/ (mirror exact de l'upload couverture de
  // admin/articles/actions.ts:65-85). Ne toucher à `image` que si un fichier
  // non vide est fourni : enregistrer sans nouveau fichier ne doit jamais
  // effacer l'image existante.
  const image = formData.get('image')
  if (image instanceof File && image.size > 0) {
    try {
      const ext = image.name.split('.').pop() ?? 'jpg'
      const chemin = `activites/${resultId}/${Date.now()}.${ext}`
      const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, image, {
        contentType: image.type || 'image/jpeg',
        upsert: false,
      })
      if (upErr) {
        console.error('activites image upload', resultId, upErr)
        throw upErr
      }
      const { error } = await sb.from('activites').update({ image: chemin }).eq('id', resultId)
      if (error) {
        console.error('activites update image', resultId, error)
        throw error
      }
    } catch (e) {
      // Chemin insertion uniquement : la ligne vient d'être créée par CE
      // formulaire et n'existait pas avant, donc rien à préserver. Sur le
      // chemin édition, la ligne préexistait déjà avant l'appel — la
      // supprimer effacerait un contenu potentiellement publié.
      if (!id) await sb.from('activites').delete().eq('id', resultId)
      throw e
    }
  }

  revalidatePath('/[locale]/admin/activites', 'page')
  revalidatePath('/[locale]', 'page')
  return { ok: true, id: resultId }
}

export async function supprimerActivite(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('activites').delete().eq('id', id)
  if (error) {
    console.error('activites delete', id, error)
    throw error
  }
  revalidatePath('/[locale]/admin/activites', 'page')
  revalidatePath('/[locale]', 'page')
}
