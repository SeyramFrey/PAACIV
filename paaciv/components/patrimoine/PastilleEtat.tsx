import { getTranslations } from 'next-intl/server'
import { couleurEtat, estEtatConservation } from '@/lib/etats-conservation'

// Pastille d'état de conservation.
//
// Le vocabulaire existe depuis la migration 0023 et ne se voyait NULLE PART
// côté public : la valeur n'apparaissait que dans une ligne de définition au
// bas de la colonne latérale d'une fiche, et dans un `<select>` de filtre. Un
// visiteur ne pouvait donc pas savoir, en parcourant l'archive, lesquels de ces
// édifices sont menacés — alors que c'est le propos de l'association.
//
// Deux canaux, jamais la couleur seule : une teinte ET un mot. La couleur seule
// exclurait qui la distingue mal, et « rouge » ne veut rien dire sans légende.
// L'état « démoli » ajoute un troisième signe, la RATURE du libellé : c'est le
// seul des quatre qui parle d'un bâtiment qui n'existe plus, et le seul dont
// l'information ne se déduit d'aucune photographie de la fiche.
//
// Composant SERVEUR (`getTranslations`) : il n'a aucune interaction, et il est
// rendu par dizaines dans une grille d'archive — l'envoyer au navigateur
// coûterait du JavaScript pour afficher un point et un mot.
export async function PastilleEtat({
  etat,
  taille = 'normal',
  className = '',
}: {
  etat: string | null | undefined
  taille?: 'normal' | 'compact'
  className?: string
}) {
  // Une valeur hors vocabulaire — ligne écrite avant la contrainte 0023, ou par
  // un chemin qui la contournerait — n'affiche RIEN plutôt que d'exposer un
  // slug brut au visiteur. Même règle que la fiche patrimoine.
  if (!estEtatConservation(etat)) return null

  const t = await getTranslations('etats')
  const couleur = couleurEtat(etat)!
  const compact = taille === 'compact'

  return (
    <span
      data-testid="pastille-etat"
      data-etat={etat}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${
        compact ? 'text-[10px]' : 'text-[11px]'
      } uppercase tracking-[0.1em] ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block shrink-0 rounded-full ${compact ? 'h-2 w-2' : 'h-2.5 w-2.5'}`}
        style={{
          background: couleur,
          // Un liseré pris au fond détache la pastille d'une photographie
          // sombre aussi bien que d'un aplat clair.
          boxShadow: '0 0 0 1.5px color-mix(in oklab, var(--bg) 70%, transparent)',
        }}
      />
      <span className={etat === 'demoli' ? 'line-through decoration-[1.5px]' : undefined}>
        {t(etat)}
      </span>
    </span>
  )
}
