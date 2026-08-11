import { Link } from '@/i18n/navigation'

export function CarteContenu({
  href,
  image,
  badge,
  date,
  titre,
  extrait,
  badgeLecture = false,
  testId = 'carte-contenu',
}: {
  href: string
  image: string | null
  badge?: string | null
  date?: string | null
  titre: string
  extrait?: string | null
  /** Pastille de lecture superposée à la vignette (grille reportages — spec §6). */
  badgeLecture?: boolean
  testId?: string
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="group block overflow-hidden rounded-2xl border border-creme2 bg-white transition hover:border-or hover:shadow-md"
    >
      {image && (
        <div className="relative aspect-video overflow-hidden bg-creme2">
          {/* alt="" : le titre est déjà porté par le <h3> ci-dessous, et toute
              la carte est un lien unique — un alt non vide ferait annoncer le
              titre deux fois par les lecteurs d'écran (cf. FacadeVideo). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
          {badgeLecture && (
            <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terre text-2xl text-sable shadow-lg">
                ▶
              </span>
            </span>
          )}
        </div>
      )}
      <div className="space-y-2 p-4">
        {(badge || date) && (
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-encre/50">
            {badge && <span data-testid="carte-badge">{badge}</span>}
            {date && <span data-testid="carte-date">{date}</span>}
          </div>
        )}
        <h3 className="font-serif text-lg text-brun">{titre}</h3>
        {extrait && <p className="line-clamp-3 text-sm text-encre/70">{extrait}</p>}
      </div>
    </Link>
  )
}
