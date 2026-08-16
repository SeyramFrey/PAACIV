'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull } from '@/lib/admin/champs'

export type ResultatContenu = { ok: true } | { ok: false; erreur: 'echec' }

export async function enregistrerContenu(formData: FormData): Promise<ResultatContenu> {
  const cle = (formData.get('cle') ?? '').toString()
  if (!cle) return { ok: false, erreur: 'echec' }

  const sb = await createServerClient()
  const { error } = await sb
    .from('contenu_site')
    .update({
      valeur_fr: texteOuNull(formData.get('valeur_fr')),
      valeur_en: texteOuNull(formData.get('valeur_en')),
    })
    .eq('cle', cle)
  if (error) {
    console.error('contenu_site update', cle, error)
    return { ok: false, erreur: 'echec' }
  }

  revalidatePath('/[locale]/admin/contenu', 'page')
  // L'accueil et le pied de page lisent contenu_site : sans cette
  // revalidation, une correction de texte resterait invisible en production
  // jusqu'au prochain déploiement.
  revalidatePath('/[locale]', 'page')
  return { ok: true }
}
