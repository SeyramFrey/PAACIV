import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { champ } from '@/lib/i18n-champ'

export type Textes = Record<string, { fr: string | null; en: string | null }>

// Un seul aller-retour pour tous les textes de la page, mémoïsé par requête :
// seize blocs qui iraient chacun chercher leur clé feraient seize requêtes.
export const chargerTextes = cache(async function chargerTextes(): Promise<Textes> {
  const sb = createReadClient()
  const { data, error } = await sb.from('contenu_site').select('cle, valeur_fr, valeur_en')
  if (error) throw error
  const out: Textes = {}
  for (const r of data ?? []) out[r.cle] = { fr: r.valeur_fr, en: r.valeur_en }
  return out
})

// Une clé absente renvoie '' plutôt que de lever : un texte manquant doit
// laisser un trou dans la page, pas casser tout le rendu serveur.
export function texte(textes: Textes, cle: string, locale: string): string {
  const v = textes[cle]
  if (!v) return ''
  return champ(v.fr, v.en, locale)
}

// Une valeur vide ou encore marquée « À COMPLÉTER » (chantier interne, en
// attente d'être renseigné par l'association) n'est pas une information
// prête pour un visiteur — elle ne doit jamais atteindre le public. Garde
// partagée par tout bloc qui affiche une valeur de `contenu_site` : la
// Task 9 avait dû la poser dans le pied de page après coup, faute d'y avoir
// pensé au premier passage ; elle vit ici pour ne plus jamais repartir sans
// filet dans un nouveau bloc.
export function renseigne(valeur: string): boolean {
  return valeur.length > 0 && !valeur.startsWith('À COMPLÉTER')
}
