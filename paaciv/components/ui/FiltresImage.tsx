// Filtres SVG partagés, montés une seule fois par le layout.
//
// POURQUOI ici et pas dans chaque vignette : un `<filter>` référencé par
// `filter: url(#…)` doit exister quelque part dans le document, et un seul
// suffit à tout le document. Le dupliquer à chaque image multiplierait le même
// nœud par le nombre de photographies de la page — et ferait autant
// d'identifiants en double, ce qui est invalide.
//
// TRAITEMENT DUOTONE. Les photographies du fonds sont hétérogènes : tirages
// anciens virés, captures récentes en plein soleil, scans de presse. Les poser
// côte à côte dans une même grille donne un patchwork. Le duotone les ramène
// toutes sur les mêmes deux bornes — une ombre bleu-nuit prise à la tôle, une
// lumière crème prise à la chaux — et la grille se lit alors comme une planche
// d'un même fonds, ce qu'elle est.
//
// Deux filtres et non un seul avec des variables : `tableValues` est un
// attribut SVG, il ne sait pas lire une variable CSS. La bascule clair/sombre
// se fait donc en CSS, sur `.duotone` (voir app/globals.css) — les deux moitiés
// bougent ensemble, comme le vocabulaire d'état et sa contrainte Postgres.
//
// Les valeurs sont les composantes sRGB (0–1) des bornes :
//   clair : ombre #121E2C, lumière #FCE3CD
//   nuit  : ombre #08101A, lumière #F3D0B4
// `colorInterpolationFilters="sRGB"` est indispensable : par défaut SVG filtre
// en linearRGB, et la même table y donne une image délavée dans les tons
// moyens.

function Duotone({ id, ombre, lumiere }: { id: string; ombre: [number, number, number]; lumiere: [number, number, number] }) {
  return (
    <filter id={id} colorInterpolationFilters="sRGB">
      {/* L'image est déjà désaturée par la chaîne CSS (`grayscale(1)`) : cette
          table remappe donc une valeur unique de gris vers la droite qui joint
          les deux bornes, canal par canal. */}
      <feComponentTransfer>
        <feFuncR type="table" tableValues={`${ombre[0]} ${lumiere[0]}`} />
        <feFuncG type="table" tableValues={`${ombre[1]} ${lumiere[1]}`} />
        <feFuncB type="table" tableValues={`${ombre[2]} ${lumiere[2]}`} />
      </feComponentTransfer>
    </filter>
  )
}

export function FiltresImage() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="0"
      height="0"
      // `absolute` + dimensions nulles : le nœud ne doit occuper aucune place
      // ni décaler la mise en page. `display:none` serait fatal — un filtre
      // dans un sous-arbre masqué n'est pas appliqué par certains moteurs.
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        <Duotone id="paaciv-duotone" ombre={[0.071, 0.118, 0.173]} lumiere={[0.988, 0.89, 0.804]} />
        <Duotone id="paaciv-duotone-nuit" ombre={[0.031, 0.063, 0.102]} lumiere={[0.953, 0.816, 0.706]} />
      </defs>
    </svg>
  )
}
