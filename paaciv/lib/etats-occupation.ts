// Vocabulaire fermé de l'état d'occupation d'un édifice (révision de Yacouba
// Doukoure, 13/11/2026). Pendant de la contrainte
// `patrimoine_etat_occupation_valide` de la migration 0036 : les deux moitiés
// bougent ensemble. Libellés dans `i18n/messages/{fr,en}.json`, namespace
// `occupations`.
export const ETATS_OCCUPATION = ['occupe', 'partiellement_occupe', 'vacant', 'abandonne'] as const

export type EtatOccupation = (typeof ETATS_OCCUPATION)[number]

export function estEtatOccupation(v: unknown): v is EtatOccupation {
  return typeof v === 'string' && (ETATS_OCCUPATION as readonly string[]).includes(v)
}

/** Valeur soumise par le formulaire d'admin, ou `null` si hors vocabulaire. */
export function occupationOuNull(v: unknown): EtatOccupation | null {
  const s = (v ?? '').toString().trim()
  return estEtatOccupation(s) ? s : null
}
