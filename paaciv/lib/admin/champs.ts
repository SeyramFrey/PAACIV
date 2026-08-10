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

/** Assainit un champ HTML riche avant enregistrement (moitié « save » de la double barrière). */
export function richeOuNull(v: FormDataEntryValue | null): string | null {
  const propre = assainirHtml((v ?? '').toString())
  return propre.trim() === '' ? null : propre
}
