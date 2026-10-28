import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import type { RealisationLiee } from '@/lib/data/architectes'

// Carte dédiée aux réalisations liées à un architecte : `RealisationLiee`
// expose déjà une `image` résolue (URL complète) et un `role` optionnel, deux
// champs que `CartePatrimoine` (qui attend un `PatrimoineListItem` avec des
// `images` bruts et un `resume`) ne sait pas accueillir sans fabrication.
//
// Même écriture que la grille de portraits de /architectes (demande du
// client) : l'image d'abord, le titre dessous, le rôle en dessous encore, sans
// cadre ni carte. La largeur vient de la grille, plus d'un rail défilant.
export function CarteRealisation({
  realisation,
  locale,
}: {
  realisation: RealisationLiee
  locale: string
}) {
  const titre = champ(realisation.titre_fr, realisation.titre_en, locale)

  return (
    <Link href={`/patrimoine/${realisation.slug}`} className="group block">
      <div className="aspect-[4/3] overflow-hidden" style={{ background: 'var(--bg2)' }}>
        {realisation.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={realisation.image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.03]"
            loading="lazy"
          />
        )}
      </div>
      {/* `alt=""` : le titre suit en texte dans le même lien, le décrire
          deux fois le ferait annoncer deux fois. */}
      <h3
        className="mt-2.5 font-serif text-[15px] leading-snug transition-colors group-hover:text-terra"
        style={{ color: 'var(--ink)' }}
      >
        {titre}
      </h3>
      {realisation.role && (
        <p
          className="mt-0.5 text-[10px] uppercase tracking-[0.14em]"
          style={{ color: 'var(--soft)' }}
        >
          {realisation.role}
        </p>
      )}
    </Link>
  )
}
