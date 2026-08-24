// Pictogrammes des sept typologies de patrimoine.
//
// POURQUOI : les types n'étaient distingués que par une pastille de couleur.
// Une pastille dit « ce n'est pas la même catégorie » ; elle ne dit pas
// LAQUELLE, et elle ne dit rien du tout à qui distingue mal les couleurs — or
// la couleur est le seul canal que portaient la légende de la carte, le popup
// et le badge de fiche. Un dessin nomme la catégorie, et il la nomme dans le
// langage de l'architecture ivoirienne plutôt que dans celui d'un jeu d'icônes
// générique : la tour à torons des mosquées soudanaises du Nord, la façade à
// galerie de Grand-Bassam, le tablier haubané du pont d'Abidjan.
//
// La clé est l'`id` de la table `types` — la même que la colonne `icone`, qui
// stocke déjà ce slug depuis la migration 0003. Un type inconnu (ajouté en base
// sans passer ici) rend le repli neutre plutôt que rien : mieux vaut un carré
// muet qu'un trou dans une légende.
//
// Traits seuls, `currentColor`, aucun aplat : le pictogramme prend la couleur
// de son contexte — celle du type sur fond clair, `--onDeep` sur les blocs
// sombres — sans qu'on ait à en décliner deux versions.

export const TYPES_PICTOGRAMMES = [
  'batiment', 'religieux', 'monument', 'site', 'lieu_culturel', 'ensemble', 'ouvrage',
] as const

export type TypePictogramme = (typeof TYPES_PICTOGRAMMES)[number]

const TRACES: Record<TypePictogramme, React.ReactNode> = {
  // Immeuble moderne à couronnement en retrait : l'Hôtel Ivoire, la Pyramide,
  // la Cité administrative — la silhouette du bâti d'après 1960.
  batiment: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M6 20.5V9.5h12v11" />
      <path d="M8.75 9.5V5.5h6.5v4" />
      <path d="M6 13.25h12M6 16.75h12" />
    </>
  ),
  // Mosquée de style soudanais (Kong, Kaouara, Tengréla) : tour tronconique,
  // torons de bois saillants, pinacle. Ni croix ni croissant : le vocabulaire
  // est celui de la construction, pas celui d'un culte.
  religieux: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M9 20.5V8.5l3-4.5 3 4.5v12" />
      <path d="M12 4V2" />
      <path d="M9 11h-1.75M15 11h1.75M9 14.25h-1.75M15 14.25h1.75" />
      <path d="M4.5 20.5v-5.5H9M19.5 20.5v-5.5H15" />
    </>
  ),
  // Stèle sur emmarchement : la forme commune aux mémoriaux et aux monuments
  // commémoratifs, indépendante de leur sujet.
  monument: (
    <>
      <path d="M4 20.5h16" />
      <path d="M6.75 20.5v-2.25h10.5v2.25" />
      <path d="M9.5 18.25V7l2.5-4.5L14.5 7v11.25" />
      <path d="M9.75 10.5h4.5" />
    </>
  ),
  // Enceinte ouverte et arbre : un site se définit par son emprise, pas par un
  // bâtiment.
  site: (
    <>
      <path d="M3 20.5h18" />
      <path d="M4.5 20.5v-8.5h4M19.5 20.5v-8.5h-4" />
      <circle cx="12" cy="9" r="3.5" />
      <path d="M12 12.5v8" />
    </>
  ),
  // Masque sous un toit à deux pentes : le lieu où l'on montre et où l'on joue.
  lieu_culturel: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M3.5 10 12 3.5l8.5 6.5" />
      <path d="M12 11c2.2 0 3.6 1.7 3.6 4s-1.6 5.5-3.6 5.5S8.4 17.3 8.4 15s1.4-4 3.6-4Z" />
      <path d="M10.4 14.6h.9M12.7 14.6h.9" />
    </>
  ),
  // Trois façades mitoyennes sur une même rue : un ensemble, c'est la
  // répétition et l'alignement — le Quartier France de Grand-Bassam.
  ensemble: (
    <>
      <path d="M2.5 20.5h19" />
      <path d="M3.5 20.5v-6.5l3-2.5 3 2.5v6.5" />
      <path d="M9.5 20.5v-8l3-2.5 3 2.5v8" />
      <path d="M15.5 20.5v-6.5l3-2.5 3 2.5v6.5" />
      <path d="M5.75 20.5v-3h1.5v3" />
      <path d="M11.75 20.5v-3h1.5v3" />
      <path d="M17.75 20.5v-3h1.5v3" />
    </>
  ),
  // Tablier haubané sur piles, au-dessus de l'eau : le pont Houphouët-Boigny,
  // et plus largement l'ouvrage d'art.
  ouvrage: (
    <>
      <path d="M2.5 13h19" />
      <path d="M12 13V3.5" />
      <path d="M12 5 5 13M12 5l7 8" />
      <path d="M6.5 13v4.5M17.5 13v4.5" />
      <path d="M2.5 20c1.6-1.1 3.2-1.1 4.75 0s3.15 1.1 4.75 0 3.2-1.1 4.75 0 3.15 1.1 4.75 0" />
    </>
  ),
}

/** Repli : un type ajouté en base sans pictogramme ici reste identifiable. */
const REPLI = (
  <>
    <path d="M4.5 20.5h15" />
    <path d="M6.5 20.5V8.5h11v12" />
    <path d="M6.5 12.25h11" />
  </>
)

export function estTypePictogramme(v: unknown): v is TypePictogramme {
  return typeof v === 'string' && (TYPES_PICTOGRAMMES as readonly string[]).includes(v)
}

/**
 * Pictogramme d'un type de patrimoine.
 *
 * `titre` rend le dessin ANNONÇABLE (`role="img"` + `<title>`) : c'est le cas
 * de la légende de la carte, où le pictogramme porte seul l'information. Sans
 * `titre`, il est décoratif (`aria-hidden`) — le cas des vignettes d'archive,
 * où le nom du type est déjà écrit à côté en toutes lettres et où l'annoncer
 * une seconde fois ne ferait que bavarder.
 */
export function PictoType({
  type,
  taille = 20,
  titre,
  className,
}: {
  type: string | null | undefined
  taille?: number
  titre?: string
  className?: string
}) {
  const trace = estTypePictogramme(type) ? TRACES[type] : REPLI
  return (
    <svg
      viewBox="0 0 24 24"
      width={taille}
      height={taille}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={titre ? 'img' : undefined}
      aria-hidden={titre ? undefined : 'true'}
      focusable="false"
    >
      {titre ? <title>{titre}</title> : null}
      {trace}
    </svg>
  )
}
