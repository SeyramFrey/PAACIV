import { Link } from '@/i18n/navigation'

export function CarteContenu({
  href,
  image,
  badge,
  date,
  titre,
  extrait,
  testId = 'carte-contenu',
}: {
  href: string
  image: string | null
  badge?: string | null
  date?: string | null
  titre: string
  extrait?: string | null
  testId?: string
}) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="group block overflow-hidden rounded-2xl border border-creme2 bg-white transition hover:border-or hover:shadow-md"
    >
      {image && (
        <div className="aspect-video overflow-hidden bg-creme2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={titre}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
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
