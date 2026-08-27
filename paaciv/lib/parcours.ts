// Le nouveau gabarit de fiche architecte dessine le parcours en FRISE : une
// colonne d'années à gauche, l'étape à droite, une ligne de filet entre
// chacune. Or `parcours_fr` n'est pas structuré — c'est le champ riche de
// l'admin, une suite de <p> saisis à la main.
//
// Plutôt que d'ajouter une table (le client saisit déjà ses parcours ainsi,
// et une table l'obligerait à tout ressaisir), on relit ces <p>. La forme est
// stable dans le corpus : « ANNÉE : texte », parfois « ANNÉE-ANNÉE : texte »,
// et des paragraphes SANS année qui prolongent le précédent — c'est le cas de
// « grade : sergent dans l'armée française » sous 1957-1958, ou du numéro de
// registre du commerce sous 1969. La maquette les montre justement en
// sous-ligne estompée : la donnée avait déjà cette forme, on ne fait que la
// lire.
//
// Le repli est explicite et non négociable : si le champ ne dessine pas une
// chronologie franche (moins de deux étapes datées), on rend `null` et la page
// réaffiche le texte riche tel quel. Mieux vaut la mise en page d'avant qu'une
// frise à une seule ligne, ou qu'un texte mutilé par une lecture trop
// optimiste.

export type EtapeParcours = {
  /** Telle qu'écrite : « 1947 », « 1957-1958 », « 1964 - 1969 ». */
  annee: string
  texte: string
  /** Paragraphes sans année qui suivaient l'étape et la complètent. */
  precisions: string[]
}

export type Parcours = {
  /** Paragraphes situés AVANT la première étape datée. */
  intro: string[]
  etapes: EtapeParcours[]
}

// Une année, éventuellement un intervalle, puis un deux-points. Le `.*` final
// est volontairement gourmand : « 1960 : école des TP : certificat » ne doit se
// couper qu'au PREMIER deux-points, le second appartenant à la phrase.
const DEBUT_DATE = /^(\d{4}(?:\s*[-–—]\s*\d{4})?)\s*[:：]\s*(.*)$/

const ENTITES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

// Réduction en texte simple. La frise n'affiche pas de balisage : la ramener
// ici évite de faire transiter du HTML jusqu'au rendu, et donc de rouvrir la
// question de l'assainissement pour un contenu qui n'en a pas besoin.
function texteSimple(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g, (e) => ENTITES[e])
    .replace(/\s+/g, ' ')
    .trim()
}

export function decouperParcours(html: string | null | undefined): Parcours | null {
  if (!html) return null

  // Les paragraphes du champ riche ; à défaut de <p>, les sauts de ligne.
  const bruts = html.includes('</p>') ? html.split(/<\/p\s*>/i) : html.split(/<br\s*\/?>|\n/i)
  const lignes = bruts.map(texteSimple).filter(Boolean)

  const intro: string[] = []
  const etapes: EtapeParcours[] = []

  for (const ligne of lignes) {
    const m = DEBUT_DATE.exec(ligne)
    if (m) {
      etapes.push({ annee: m[1], texte: m[2].trim(), precisions: [] })
    } else if (etapes.length > 0) {
      etapes[etapes.length - 1].precisions.push(ligne)
    } else {
      intro.push(ligne)
    }
  }

  return etapes.length >= 2 ? { intro, etapes } : null
}
