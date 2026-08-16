'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull } from '@/lib/admin/champs'

export type ResultatContenu = { ok: true } | { ok: false; erreur: 'echec' }

export async function enregistrerContenu(formData: FormData): Promise<ResultatContenu> {
  const cle = (formData.get('cle') ?? '').toString()
  if (!cle) return { ok: false, erreur: 'echec' }

  const sb = await createServerClient()
  const { data, error } = await sb
    .from('contenu_site')
    .update({
      valeur_fr: texteOuNull(formData.get('valeur_fr')),
      valeur_en: texteOuNull(formData.get('valeur_en')),
    })
    .eq('cle', cle)
    .select('cle')
  if (error) {
    console.error('contenu_site update', cle, error)
    return { ok: false, erreur: 'echec' }
  }
  // Un UPDATE bloqué par RLS ne lève PAS d'erreur : la clause USING filtre à
  // zéro ligne et la requête répond succès (piège consigné depuis la
  // Task 4). Sans ce contrôle, une session admin expirée retomberait en
  // écriture anonyme, la ligne resterait intacte, et l'accusé « Enregistré »
  // s'afficherait quand même — l'exploitant croirait avoir sauvegardé alors
  // que rien n'a changé.
  if (!data || data.length === 0) {
    console.error('contenu_site update : aucune ligne affectée (clé introuvable ou session expirée)', cle)
    return { ok: false, erreur: 'echec' }
  }

  revalidatePath('/[locale]/admin/contenu', 'page')
  // L'accueil et le pied de page lisent contenu_site : sans cette
  // revalidation, une correction de texte resterait invisible en production
  // jusqu'au prochain déploiement.
  revalidatePath('/[locale]', 'page')
  return { ok: true }
}
