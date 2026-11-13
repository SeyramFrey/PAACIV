import { imageUrl, srcsetImage } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'

// Photos d'un onglet de la fiche bâtiment (« Photographies et état actuel »,
// « Documentation »). Chacune porte sous elle ce que l'association a demandé :
// la légende, la date, puis la source et le crédit.
//
// Composant SERVEUR : une grille de figures, sans interaction. Chaque photo
// ouvre sa version pleine taille, pour lire un plan ou un document d'archive.
export function PhotosDossier({
  images,
  locale,
  libelleSource,
}: {
  images: ImageRow[]
  locale: string
  // « Source : {source} », déjà traduit côté appelant.
  libelleSource: (source: string) => string
}) {
  if (images.length === 0) return null
  return (
    <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="photos-dossier">
      {images.map((img) => {
        const legende = champ(img.legende_fr, img.legende_en, locale)
        const src = imageUrl(img.chemin)
        return (
          <li key={img.id}>
            <figure className="space-y-2">
              <a href={src} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl bg-creme2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(img.chemin, 960)}
                  srcSet={srcsetImage(src)}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                  alt={legende || ''}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              </a>
              {(legende || img.date_texte || img.source || img.credit) && (
                <figcaption className="space-y-0.5 text-xs text-doux">
                  {(img.date_texte || legende) && (
                    <p className="text-encre-t">
                      {img.date_texte && <span className="font-semibold">{img.date_texte}</span>}
                      {img.date_texte && legende ? '. ' : null}
                      {legende}
                    </p>
                  )}
                  {img.source && <p>{libelleSource(img.source)}</p>}
                  {img.credit && <p className="italic">{img.credit}</p>}
                </figcaption>
              )}
            </figure>
          </li>
        )
      })}
    </ul>
  )
}
