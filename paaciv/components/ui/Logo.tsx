/* eslint-disable @next/next/no-img-element */

// Le logo de l'association, en deux variantes.
//
// Pourquoi deux fichiers plutôt qu'un : le logo fourni est une image matricielle
// dont le mot « PAACIV » et la baseline sont quasi noirs. Sur un fond sombre ils
// disparaissent purement et simplement, et une image matricielle ne se recolore
// pas en CSS. `public/logo-inverse.png` est donc le même dessin dont les seuls
// pixels désaturés et sombres ont été remplacés par le crème `--onDeep` ; le
// vert et l'orange de l'emblème sont identiques dans les deux fichiers.
//
// LE CHOIX DE LA VARIANTE SUIT LA SURFACE, PAS LE THÈME. C'est la distinction
// qui compte ici :
//   * le pied de page est sur `--deep`, sombre dans LES DEUX thèmes ;
//   * l'en-tête est transparent au-dessus du hero (sombre), puis devient opaque
//     sur `--bg` au défilement — et `--bg` suit le thème, lui.
// D'où deux modes : `surSombre` force la variante claire, `auto` la fait suivre
// le thème en CSS via `[data-theme]`, posé sur `<html>` par `ScriptTheme` avant
// le premier rendu (donc sans clignotement, et sans JavaScript ici).
export function Logo({
  variante = 'auto',
  compact = false,
  className = '',
  hauteur = 40,
  priorite = false,
}: {
  /** `surSombre` : fond sombre garanti. `auto` : la surface suit le thème. */
  variante?: 'auto' | 'surSombre'
  /**
   * Verrouillage compact : le même dessin SANS la baseline « Patrimoine
   * Architectural et des Arts de Côte d'Ivoire ». En dessous d'environ 60 px de
   * haut, cette ligne n'est plus lisible — elle devient une bavure grise qui
   * salit le logo au lieu de l'expliquer. On la retire plutôt que de faire
   * semblant : c'est l'usage normal d'un lockup compact en en-tête.
   */
  compact?: boolean
  className?: string
  /** Hauteur d'affichage en pixels. La largeur suit le rapport du dessin. */
  hauteur?: number
  /** Vrai pour le logo de l'en-tête, visible d'emblée : pas de chargement paresseux. */
  priorite?: boolean
}) {
  // Rapports des fichiers sources : 560 × 289 complet, 560 × 265 compact.
  const suffixe = compact ? '-compact' : ''
  const largeur = Math.round((hauteur * 560) / (compact ? 265 : 289))
  const commun = {
    width: largeur,
    height: hauteur,
    loading: priorite ? ('eager' as const) : ('lazy' as const),
    decoding: 'async' as const,
    style: { height: hauteur, width: 'auto' as const },
  }

  // Une seule image à télécharger quand la surface est connue.
  if (variante === 'surSombre') {
    return (
      <span className={`inline-flex shrink-0 ${className}`}>
        <img {...commun} src={`/logo${suffixe}-inverse.png`} alt="PAACIV" />
      </span>
    )
  }

  // Surface dépendante du thème : UN seul élément, dont l'image de fond est
  // permutée en CSS. Deux `<img>` dont on masquait l'une coûtaient deux
  // téléchargements (un `display:none` n'empêche pas la requête), et
  // laissaient dans chaque page une image fantôme que les tests ramassaient
  // au hasard — `page.locator('img').first()` sur une fiche patrimoine
  // désignait le logo masqué, pas la galerie.
  //
  // `role="img"` + `aria-label` rendent le nom accessible équivalent à celui
  // d'un `<img alt>` ; une image de FOND est décorative pour la technologie
  // d'assistance, le rôle explicite est donc indispensable ici.
  return (
    <span
      role="img"
      aria-label="PAACIV"
      className={`logo-paaciv${compact ? ' logo-paaciv--compact' : ''} inline-block shrink-0 ${className}`}
      style={{ height: hauteur, width: largeur }}
    />
  )
}
