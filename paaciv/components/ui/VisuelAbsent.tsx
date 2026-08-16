// Repli visuel quand une fiche n'a pas d'image.
//
// CE N'EST PAS UN CAS THÉORIQUE : au 16/08/2026, `articles.image_couverture`
// est nul sur les 6 articles et `evenements.image` sur les 3 événements. Sans
// repli, l'Agenda rendait une carte de 480 px de haut entièrement vide sur le
// fond sombre de sa section (« rien n'apparaît »), et le Journal une moitié de
// cadre vide à côté de son panneau de texte.
//
// Le repli ne remplace pas les photographies manquantes : il donne une surface
// à la carte pour qu'elle se lise comme une carte, au lieu d'un trou. Aucune
// image n'est inventée, aucune source extérieure n'est chargée — c'est de la
// matière (dégradé et rayures) prise aux jetons du thème.
export function VisuelAbsent({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-testid="visuel-absent"
      className={`h-full w-full ${className}`}
      style={{
        background: `
          repeating-linear-gradient(
            135deg,
            transparent 0 14px,
            color-mix(in oklab, var(--onDeep) 4%, transparent) 14px 15px
          ),
          linear-gradient(150deg, color-mix(in oklab, var(--ocre) 30%, var(--deep)), var(--deep))
        `,
      }}
    />
  )
}
