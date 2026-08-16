import { cache } from 'react'
import { createReadClient } from '@/lib/supabase/reader'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import { renseigne } from '@/lib/data/contenu-site'

export type MediaSite = {
  emplacement: string
  chemin: string
  alt_fr: string | null
  alt_en: string | null
  credit: string | null
  licence: string | null
  licence_url: string | null
}

export type Medias = Record<string, MediaSite>

// Un seul aller-retour pour les douze visuels de la page, mémoïsé par requête —
// même raisonnement que `chargerTextes` : cinq blocs qui iraient chacun
// chercher leur image feraient cinq requêtes pour douze lignes.
export const chargerMedias = cache(async function chargerMedias(): Promise<Medias> {
  const sb = createReadClient()
  const { data, error } = await sb
    .from('medias_site')
    .select('emplacement, chemin, alt_fr, alt_en, credit, licence, licence_url')
  if (error) throw error
  const out: Medias = {}
  for (const m of (data ?? []) as MediaSite[]) out[m.emplacement] = m
  return out
})

export type Visuel = { src: string; alt: string }

/**
 * Visuel d'un emplacement : celui de la base s'il existe, sinon celui codé
 * dans le composant.
 *
 * Même principe que `libelleOuNull` pour les textes — la base RECOUVRE le
 * code, elle ne le remplace pas. Supprimer une ligne depuis l'admin ne doit
 * pas laisser un trou dans la composition : la page d'accueil est bâtie autour
 * de ces images, un bloc sans visuel s'effondre visuellement là où un
 * paragraphe manquant se contente de raccourcir.
 *
 * `alt` vaut `''` par défaut, c'est-à-dire DÉCORATIF, et c'est le bon défaut :
 * neuf des douze images illustrent un bloc dont le texte porte déjà
 * l'information, et un `alt` inventé serait du bruit pour un lecteur d'écran.
 */
export function visuel(
  medias: Medias,
  emplacement: string,
  locale: string,
  secours: string,
): Visuel {
  const m = medias[emplacement]
  if (!m) return { src: secours, alt: '' }
  return { src: imageUrl(m.chemin), alt: champ(m.alt_fr, m.alt_en, locale) }
}

/**
 * Variante sans secours : `null` si l'emplacement n'a pas de ligne.
 *
 * Pour les emplacements que le code n'illustre PAS de lui-même — la carte
 * « Patrimoine démoli », qui tombe volontairement sur un aplat faute d'une
 * photographie libre de droits à lui donner. L'emplacement existe donc côté
 * code sans exister côté base : le jour où l'association téléverse une image,
 * la carte l'affiche sans qu'une ligne de code ne bouge.
 */
export function visuelOuNull(
  medias: Medias,
  emplacement: string,
  locale: string,
): Visuel | null {
  const m = medias[emplacement]
  if (!m) return null
  return { src: imageUrl(m.chemin), alt: champ(m.alt_fr, m.alt_en, locale) }
}

export type Attribution = { credit: string; licence: string | null; licence_url: string | null }

/**
 * Attributions à afficher publiquement, dans l'ordre des emplacements.
 *
 * Filtrées par `renseigne()` : tant qu'un crédit porte le marqueur
 * « À COMPLÉTER », il ne franchit pas la frontière du public — on n'annonce pas
 * une attribution qu'on n'a pas. Dédoublonnées : plusieurs emplacements
 * partagent la même photographie (le puits de la mosquée Dieng sert deux fois,
 * la Maison du Résident aussi), et créditer deux fois le même auteur pour la
 * même image ferait du bruit.
 */
export function attributions(medias: Medias): Attribution[] {
  const vues = new Set<string>()
  const out: Attribution[] = []
  for (const emplacement of Object.keys(medias).sort()) {
    const m = medias[emplacement]
    if (!m.credit || !renseigne(m.credit)) continue
    const cle = `${m.credit}|${m.licence ?? ''}`
    if (vues.has(cle)) continue
    vues.add(cle)
    out.push({
      credit: m.credit,
      licence: m.licence && renseigne(m.licence) ? m.licence : null,
      licence_url: m.licence_url,
    })
  }
  return out
}
