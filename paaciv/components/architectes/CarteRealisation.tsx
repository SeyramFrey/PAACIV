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
      // Largeur FIXE et `shrink-0` : la carte vit désormais dans un rail
      // défilant, où un `flex-1` la laisserait se comprimer jusqu'à
      // l'illisible dès la troisième réalisation.
      className="group block w-[210px] shrink-0 snap-start overflow-hidden rounded-xl transition hover:shadow-md"
      style={{ background: 'var(--bg)', boxShadow: '0 0 0 1px var(--line)' }}
    >
      <div className="aspect-[4/3] overflow-hidden" style={{ background: 'var(--bg2)' }}>
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
      <div className="space-y-1 p-3">
        <h3 className="font-serif text-[15px] leading-snug" style={{ color: 'var(--ink)' }}>
          {titre}
        </h3>
        {realisation.role && (
          <p
            className="text-[10px] uppercase tracking-[0.14em]"
            style={{ color: 'var(--soft)' }}
          >
            {realisation.role}
          </p>
        )}
      </div>
    </Link>
  )
}
