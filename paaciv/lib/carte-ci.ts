// Contour de la Côte d'Ivoire, projeté une fois pour toutes.
//
// Origine : Natural Earth via world.geo.json (domaine public), simplifié à 46
// points — assez pour que la silhouette soit reconnaissable, assez peu pour
// tenir dans un attribut `d` de 500 caractères sans coûter la moindre requête.
//
// C'est ce qui remplace la mini-carte MapLibre de la page d'accueil : celle-ci
// pesait 785 Ko de WebGL pour un bloc purement décoratif, et s'affichait dans
// un CARRÉ dont les bords n'avaient aucun sens géographique. Ce SVG ne coûte
// aucun JavaScript, se met aux couleurs du thème, et a la forme du pays. La
// vraie carte interactive, elle, reste sur /carte.
//
// Projection équirectangulaire corrigée en longitude par le cosinus de la
// latitude moyenne : à l'échelle d'un seul pays proche de l'équateur, l'écart
// avec une projection conforme est invisible à l'œil.

export const CI_VIEWBOX = { largeur: 968, hauteur: 1000 } as const

export const CI_PATH =
  'M921.2,893.9L848.3,895.6L736.4,864L633.7,865.8L443.8,894L332.5,940.7L173.8,1000L142.8,995.8L155.1,862.6L170.4,842.4L165.5,778.7L97.7,711L46.7,700.2L0,655.8L34.9,584L18.8,505.8L26.2,458.8L51.6,458.6L61.1,388.1L48.7,356.9L64,334.4L123.6,315L84,185.6L47,118.7L59.9,63.9L91.8,51.3L112.7,36.6L157.1,60.9L280.9,62.3L310.4,15.1L338.1,18.2L384.4,0L409.2,69.1L446.6,48.7L512.7,24.8L584.8,60L612.8,113.5L684.9,147.6L741,107L816.1,100.8L925.8,142.5L968.3,372.5L900.8,508.3L859,690.9L928.5,830.1L921.2,893.9Z'

// Bornes et facteurs de la projection, gardés pour placer des points dans le
// même repère que le contour. Modifier l'un sans l'autre décalerait les
// édifices par rapport au pays.
const LON_MIN = -8.60288
const LAT_MAX = 10.524061
const K_LON = 0.991600938
const ECHELLE = 161.661283

/** Longitude/latitude vers les coordonnées du viewBox de `CI_PATH`. */
export function projeter(lon: number, lat: number): { x: number; y: number } {
  return {
    x: (lon - LON_MIN) * K_LON * ECHELLE,
    y: (LAT_MAX - lat) * ECHELLE,
  }
}

/** Vrai si le point tombe dans le cadre du pays — garde contre une coordonnée aberrante. */
export function dansLeCadre(x: number, y: number): boolean {
  return x >= 0 && x <= CI_VIEWBOX.largeur && y >= 0 && y <= CI_VIEWBOX.hauteur
}
