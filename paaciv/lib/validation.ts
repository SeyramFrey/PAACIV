// Validation volontairement permissive : l'objectif est d'écarter les saisies
// manifestement fautives, pas de reproduire la RFC 5322. Une adresse exotique
// mais réelle ne doit jamais être refusée à un donateur.
const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function emailValide(v: string): boolean {
  const s = v.trim()
  return s.length > 0 && s.length <= 254 && RE_EMAIL.test(s)
}

// Trois issues distinctes, que l'appelant doit distinguer :
//   null → aucun montant saisi, ce qui reste valide (don sans montant annoncé)
//   NaN  → saisie présente mais inutilisable, à refuser
//   n    → montant exploitable
export function montantOuNull(v: FormDataEntryValue | null): number | null {
  if (v === null) return null
  const s = v.toString().trim().replace(',', '.')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return Number.NaN
  return n
}
