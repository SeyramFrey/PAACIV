import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import type { RealisationLiee } from '@/lib/data/architectes'

// Carte dédiée aux réalisations liées à un architecte : `RealisationLiee`
// expose déjà une `image` résolue (URL complète) et un `role` optionnel, deux
// champs que `CartePatrimoine` (qui attend un `PatrimoineListItem` avec des
// `images` bruts et un `resume`) ne sait pas accueillir sans fabrication.
export function CarteRealisation({
  realisation,
  locale,
}: {
  realisation: RealisationLiee
  locale: string
}) {
  const titre = champ(realisation.titre_fr, realisation.titre_en, locale)

  return (
    <Link
      href={`/patrimoine/${realisation.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-encre/5 transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-creme2">
        {realisation.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={realisation.image}
            alt={titre}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-serif text-lg text-brun">{titre}</h3>
        {realisation.role && (
          <p className="text-xs uppercase tracking-wide text-encre/50">{realisation.role}</p>
        )}
      </div>
    </Link>
  )
}
