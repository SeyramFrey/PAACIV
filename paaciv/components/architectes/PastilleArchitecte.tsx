import { Link } from '@/i18n/navigation'
import type { ArchitecteListItem } from '@/lib/data/architectes'

export function PastilleArchitecte({ a }: { a: ArchitecteListItem }) {
  const badge = a.annee_naissance ? String(a.annee_naissance) : a.periode_texte
  const initiales = a.nom
    .split(' ')
    .map((m) => m[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Link
      href={`/architectes/${a.slug}`}
      data-testid="pastille-architecte"
      aria-label={a.nom}
      className="relative flex flex-col items-center gap-2 rounded-2xl border border-creme2 bg-white p-4 text-center transition hover:border-or"
    >
      {badge && (
        <span className="absolute right-2 top-2 rounded-md bg-creme2 px-1.5 py-0.5 text-[10px] text-encre/60">
          {badge}
        </span>
      )}
      <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-ocre text-sable">
        {a.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={a.photo}
            alt={a.nom}
            className="h-16 w-16 object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-sm font-bold">{initiales}</span>
        )}
      </span>
      <span className="text-sm text-encre">{a.nom}</span>
    </Link>
  )
}
