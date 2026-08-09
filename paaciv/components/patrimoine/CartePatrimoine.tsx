import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import type { PatrimoineListItem } from '@/lib/data/patrimoine'

export function CartePatrimoine({
  item,
  locale,
}: {
  item: PatrimoineListItem
  locale: string
}) {
  const titre = champ(item.titre_fr, item.titre_en, locale)
  const resume = champ(item.resume_fr, item.resume_en, locale)
  const principale = item.images.find((i) => i.est_principale) ?? item.images[0]

  return (
    <Link
      href={`/patrimoine/${item.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-encre/5 transition hover:shadow-md"
    >
      <div className="aspect-[4/3] overflow-hidden bg-creme2">
        {principale && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(principale.chemin)}
            alt={titre}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        )}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="font-serif text-lg text-brun">{titre}</h3>
        {item.ville && <p className="text-xs uppercase tracking-wide text-encre/50">{item.ville}</p>}
        {resume && <p className="line-clamp-2 text-sm text-encre/70">{resume}</p>}
      </div>
    </Link>
  )
}
