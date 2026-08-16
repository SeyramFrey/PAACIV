'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull } from '@/lib/admin/champs'

export type ResultatMedia = { ok: true } | { ok: false; erreur: 'echec' }

export async function enregistrerMedia(formData: FormData): Promise<ResultatMedia> {
  const emplacement = (formData.get('emplacement') ?? '').toString()
  if (!emplacement) return { ok: false, erreur: 'echec' }

  const sb = await createServerClient()

  // Métadonnées d'abord, fichier ensuite : corriger un crédit ne doit pas
  // exiger de re-téléverser la photographie, et c'est le cas d'usage le plus
  // fréquent (les douze lignes attendent précisément leur attribution).
  const valeurs: Record<string, string | null> = {
    alt_fr: texteOuNull(formData.get('alt_fr')),
    alt_en: texteOuNull(formData.get('alt_en')),
    credit: texteOuNull(formData.get('credit')),
    licence: texteOuNull(formData.get('licence')),
    licence_url: texteOuNull(formData.get('licence_url')),
  }

  // Fichier optionnel : enregistrer sans en fournir ne doit JAMAIS effacer
  // l'image en place (même garde que admin/activites/actions.ts).
  const fichier = formData.get('fichier')
  if (fichier instanceof File && fichier.size > 0) {
    const ext = fichier.name.split('.').pop() ?? 'jpg'
    const chemin = `medias/${emplacement}/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, fichier, {
      contentType: fichier.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) {
      console.error('medias_site upload', emplacement, upErr)
      return { ok: false, erreur: 'echec' }
    }
    valeurs.chemin = chemin
  }

  const { data, error } = await sb
    .from('medias_site')
    .update(valeurs)
    .eq('emplacement', emplacement)
    .select('emplacement')
  if (error) {
    console.error('medias_site update', emplacement, error)
    return { ok: false, erreur: 'echec' }
  }
  // Un UPDATE bloqué par RLS ne lève PAS d'erreur : la clause USING filtre à
  // zéro ligne et la requête répond succès. Sans ce contrôle, une session
  // expirée retomberait en écriture anonyme et l'accusé « Enregistré »
  // s'afficherait alors que rien n'a changé — y compris juste après un
  // téléversement réussi, ce qui est le pire des cas : le fichier est dans le
  // bucket, la ligne ne le référence pas.
  if (!data || data.length === 0) {
    console.error('medias_site update : aucune ligne affectée (emplacement introuvable ou session expirée)', emplacement)
    return { ok: false, erreur: 'echec' }
  }

  revalidatePath('/[locale]/admin/medias', 'page')
  // L'accueil et le pied de page lisent `medias_site` : sans cette
  // revalidation, une photographie remplacée resterait invisible jusqu'au
  // prochain déploiement.
  revalidatePath('/[locale]', 'page')
  return { ok: true }
}
