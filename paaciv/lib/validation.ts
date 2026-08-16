// Validation volontairement permissive : l'objectif est d'écarter les saisies
// manifestement fautives, pas de reproduire la RFC 5322. Une adresse exotique
// mais réelle ne doit jamais être refusée à un donateur.
const RE_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function emailValide(v: string): boolean {
  const s = v.trim()
  return s.length > 0 && s.length <= 254 && RE_EMAIL.test(s)
}

// Espace normal, espace insécable (U+00A0) et espace fine insécable
// (U+202F, utilisée par certains claviers/OS pour les milliers en français)
// : les trois formes que peut glisser une saisie numérique.
const RE_ESPACES = /[\s  ]/g

// Trois issues distinctes, que l'appelant doit distinguer :
//   null → aucun montant saisi, ce qui reste valide (don sans montant annoncé)
//   NaN  → saisie présente mais inutilisable, à refuser
//   n    → montant exploitable
export function montantOuNull(v: FormDataEntryValue | null): number | null {
  if (v === null) return null
  // « 15 000 » et « 1 500,50 » sont des formes naturelles en FCFA (séparateur
  // de milliers par espace, virgule décimale) : les espaces (RE_ESPACES,
  // ci-dessus) sont retirées avant conversion, et TOUTES les virgules sont
  // converties en point (indicateur global `g`, pas seulement la première
  // comme le faisait l'ancien `replace(',', '.')`) — sans ces deux
  // correctifs, ces deux formes sortaient en `montantInvalide` sur un
  // formulaire de don ivoirien.
  const s = v.toString().trim().replace(RE_ESPACES, '').replace(/,/g, '.')
  if (s === '') return null
  const n = Number(s)
  if (!Number.isFinite(n) || n <= 0) return Number.NaN
  return n
}
