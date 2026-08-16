'use server'

import { createReadClient } from '@/lib/supabase/reader'
import { emailValide, montantOuNull } from '@/lib/validation'

export type TypeDemande = 'adhesion' | 'don' | 'archive'

export type ResultatDemande =
  | { ok: true }
  | { ok: false; erreur: 'nomRequis' | 'emailInvalide' | 'montantInvalide' | 'typeInvalide' | 'echec' }

const TYPES: readonly TypeDemande[] = ['adhesion', 'don', 'archive']

export async function deposerDemande(formData: FormData): Promise<ResultatDemande> {
  const type = (formData.get('type') ?? '').toString() as TypeDemande
  if (!TYPES.includes(type)) return { ok: false, erreur: 'typeInvalide' }

  const nom = (formData.get('nom') ?? '').toString().trim()
  if (!nom) return { ok: false, erreur: 'nomRequis' }

  const email = (formData.get('email') ?? '').toString()
  if (!emailValide(email)) return { ok: false, erreur: 'emailInvalide' }

  const montant = montantOuNull(formData.get('montant'))
  if (Number.isNaN(montant)) return { ok: false, erreur: 'montantInvalide' }

  const sb = createReadClient()
  const { error } = await sb.from('demandes').insert({
    type,
    nom,
    email: email.trim().toLowerCase(),
    telephone: (formData.get('telephone') ?? '').toString().trim() || null,
    montant,
    message: (formData.get('message') ?? '').toString().trim() || null,
    // La policy « demandes insert public » exige statut = 'nouvelle' : un
    // dépôt public ne peut pas se marquer traité lui-même.
    statut: 'nouvelle',
  })
  if (error) {
    // Code + message seulement, jamais l'objet `error` entier : sur une
    // violation de contrainte, PostgREST renseigne `details` avec les
    // valeurs de la ligne — nom, e-mail, téléphone et montant d'un donateur
    // réel se retrouveraient en clair dans les journaux serveur pour un
    // diagnostic qui n'a besoin que du code et du message.
    console.error('demandes insert', error.code, error.message)
    return { ok: false, erreur: 'echec' }
  }
  return { ok: true }
}
