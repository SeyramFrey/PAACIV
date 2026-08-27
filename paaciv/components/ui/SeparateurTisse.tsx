// Séparateur de sections : une bande tissée entre deux filets.
//
// Le motif lui-même est décrit dans app/globals.css (classe `.motif-tisse`),
// avec la note sur le choix d'une géométrie générique plutôt que d'un motif
// nommé — à lire avant d'y toucher.
//
// `aria-hidden` sans réserve : c'est un ornement de mise en page, il ne sépare
// aucun contenu au sens sémantique. Un `<hr>` annoncerait une rupture de sujet
// à un lecteur d'écran là où il n'y en a pas ; les sections voisines ont déjà
// leurs propres `<section>` et leurs titres.

export function SeparateurTisse({
  sur = 'clair',
  densite = 'normal',
  dessin = 'losanges',
}: {
  /** Fond sur lequel la bande est posée : elle emprunte l'encre correspondante. */
  sur?: 'clair' | 'sombre'
  densite?: 'fin' | 'normal' | 'large'
  /** Les deux figures du tissage aux bandes. Une page qui répète la même bande
      trois fois donne un gabarit ; en alterner deux donne un tissu. */
  dessin?: 'losanges' | 'chevrons'
}) {
  const classeDensite =
    densite === 'fin' ? ' motif-tisse--fin' : densite === 'large' ? ' motif-tisse--large' : ''
  const classeDessin = dessin === 'chevrons' ? ' motif-tisse--chevrons' : ''

  return (
    <div
      aria-hidden="true"
      className="relative w-full select-none"
      style={{
        background: sur === 'sombre' ? 'var(--deep)' : 'var(--bg)',
        color: sur === 'sombre' ? 'var(--onDeep)' : 'var(--ink)',
      }}
    >
      <div
        className={`h-[54px] w-full opacity-[0.13] motif-tisse motif-tisse--fondu${classeDensite}${classeDessin}`}
      />
      {/* Deux filets, façon planche d'inventaire : un fin, un épais. */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: 'currentColor', opacity: 0.16 }}
      />
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'currentColor', opacity: 0.16 }}
      />
    </div>
  )
}
