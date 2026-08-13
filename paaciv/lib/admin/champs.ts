// Helpers purs de normalisation des champs de formulaire admin.
// Extraits dans un module non-`'use server'` pour rester testables : un
// fichier `'use server'` ne peut exporter que des fonctions async (build
// Next en échec sinon), ce qui empêcherait d'unit-tester ces fonctions pures.
import { assainirHtml } from '@/lib/richtext'

export function texteOuNull(v: FormDataEntryValue | null): string | null {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

export function intOuNull(v: FormDataEntryValue | null): number | null {
  const s = (v ?? '').toString().trim()
  if (s === '') return null
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

/** Bornes de validité WGS 84 : latitude ±90, longitude ±180. */
export const BORNE_LAT = 90
export const BORNE_LNG = 180

/**
 * Valide et normalise une coordonnée géographique saisie au formulaire.
 *
 * Motif : deux lignes de `patrimoine` ont été enregistrées avec `lat = 5000`
 * et `lat = 725`. `maplibre-gl` lève alors `Invalid LngLat latitude value` en
 * boucle et la carte publique ne s'affiche plus du tout — une seule saisie
 * fautive suffit à faire tomber /carte pour tout le monde.
 *
 * Un champ vide reste une absence de point (`null`, cas légitime : tous les
 * édifices ne sont pas localisés) et non une erreur. En revanche une valeur
 * non numérique est refusée plutôt que convertie : `Number('abc')` vaut `NaN`,
 * que Supabase sérialise en `null` — le point saisi disparaîtrait sans que
 * personne ne le sache.
 */
export function validerCoordonnee(
  v: FormDataEntryValue | null,
  borne: number,
): { ok: true; valeur: number | null } | { ok: false } {
  const s = (v ?? '').toString().trim()
  if (s === '') return { ok: true, valeur: null }
  const n = Number(s)
  if (!Number.isFinite(n) || n < -borne || n > borne) return { ok: false }
  return { ok: true, valeur: n }
}

/** Assainit un champ HTML riche avant enregistrement (moitié « save » de la double barrière). */
export function richeOuNull(v: FormDataEntryValue | null): string | null {
  const propre = assainirHtml((v ?? '').toString())
  return propre.trim() === '' ? null : propre
}
