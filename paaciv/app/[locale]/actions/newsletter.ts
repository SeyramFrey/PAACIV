'use server'

import { createReadClient } from '@/lib/supabase/reader'
import { emailValide } from '@/lib/validation'

// Erreurs attendues en valeur de retour, jamais en exception : convention
// établie en Phase 4 (033dec0). Un `throw` serait redacté en production et
// l'internaute verrait une page d'erreur au lieu d'un message utile.
export type ResultatNewsletter = { ok: true } | { ok: false; erreur: 'emailInvalide' | 'echec' }

export async function inscrireNewsletter(formData: FormData): Promise<ResultatNewsletter> {
  const brut = (formData.get('email') ?? '').toString()
  if (!emailValide(brut)) return { ok: false, erreur: 'emailInvalide' }

  const langue = (formData.get('langue') ?? 'fr').toString() === 'en' ? 'en' : 'fr'
  // Client anon : la policy « insert public » suffit, et cette action ne doit
  // surtout pas s'exécuter avec des droits élargis.
  const sb = createReadClient()
  const { error } = await sb
    .from('newsletter_abonnes')
    .insert({ email: brut.trim().toLowerCase(), langue })

  if (error) {
    // 23505 = violation d'unicité : l'adresse est déjà inscrite. On renvoie
    // le même succès qu'une inscription neuve — répondre « déjà inscrit »
    // transformerait le formulaire en oracle permettant de tester si une
    // adresse donnée figure dans la liste.
    if (error.code === '23505') return { ok: true }
    console.error('newsletter insert', error)
    return { ok: false, erreur: 'echec' }
  }
  return { ok: true }
}
