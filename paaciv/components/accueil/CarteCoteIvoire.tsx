import { CI_PATH, CI_VIEWBOX, projeter, dansLeCadre } from '@/lib/carte-ci'
import type { PointCarte } from '@/lib/data/accueil'

// Le territoire, dessiné à sa vraie forme.
//
// Ce composant remplace la mini-carte MapLibre : celle-ci enfermait la Côte
// d'Ivoire dans un CARRÉ dont les quatre bords ne voulaient rien dire, et
// coûtait 785 Ko de WebGL sur la page la plus visitée du site pour un bloc
// décoratif. Ici, le contour EST le pays, et il ne coûte aucun JavaScript :
// tout est rendu côté serveur, dans le HTML.
//
// Aucune dimension en dur : le SVG se conforme à son conteneur par son
// `viewBox`, donc il reste net à toute taille et sur tout écran.
export function CarteCoteIvoire({
  points,
  legende,
}: {
  points: PointCarte[]
  // Nom accessible du dessin. Un SVG porteur d'information a besoin d'un
  // `role="img"` et d'un nom : sans lui, un lecteur d'écran annonce un objet
  // graphique muet, ou l'ignore.
  legende: string
}) {
  // Rayon proportionnel au NOMBRE d'édifices, en racine carrée : c'est l'aire
  // du disque que l'œil compare, pas son rayon. Un rayon linéaire ferait
  // paraître une commune de cinq édifices vingt-cinq fois plus lourde qu'une
  // commune d'un seul.
  const rayon = (n: number) => 11 + Math.sqrt(n) * 7

  const traces = points
    .map((p) => ({ ...p, ...projeter(p.lng, p.lat) }))
    // Garde contre une coordonnée aberrante : une latitude hors bornes
    // dessinerait un point hors du cadre, flottant dans le vide à côté du
    // pays. La contrainte 0019 le rend improbable, pas impossible.
    .filter((p) => dansLeCadre(p.x, p.y))

  return (
    <svg
      viewBox={`0 0 ${CI_VIEWBOX.largeur} ${CI_VIEWBOX.hauteur}`}
      role="img"
      aria-label={legende}
      className="h-auto w-full overflow-visible"
    >
      <defs>
        {/* Halo des points : un flou gaussien plutôt qu'une ombre portée, pour
            que la lueur soit centrée sur le point et non décalée. */}
        <filter id="ci-lueur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" result="flou" />
          <feMerge>
            <feMergeNode in="flou" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="ci-fond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--onDeep)" stopOpacity="0.20" />
          <stop offset="100%" stopColor="var(--onDeep)" stopOpacity="0.07" />
        </linearGradient>
      </defs>

      <path
        d={CI_PATH}
        fill="url(#ci-fond)"
        stroke="var(--accent)"
        strokeWidth={5}
        strokeLinejoin="round"
      />

      {traces.map((p) => (
        <g key={`${p.ville}-${p.x.toFixed(1)}`} filter="url(#ci-lueur)">
          <circle cx={p.x} cy={p.y} r={rayon(p.nombre)} fill="var(--terra)" fillOpacity={0.9} />
          <circle
            cx={p.x}
            cy={p.y}
            r={rayon(p.nombre)}
            fill="none"
            stroke="var(--onDeep)"
            strokeWidth={4}
            strokeOpacity={0.85}
          />
          {/* Le nom de la commune est porté par le panneau de chiffres voisin,
              pas ici : à cette échelle, Abidjan et Grand-Bassam sont distantes
              de quarante unités et leurs étiquettes se chevaucheraient. Le
              `<title>` reste, pour l'infobulle et les lecteurs d'écran. */}
          <title>{p.ville}</title>
        </g>
      ))}
    </svg>
  )
}
