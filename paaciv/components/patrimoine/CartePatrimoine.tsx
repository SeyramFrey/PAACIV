import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { imageUrl, srcsetImage } from '@/lib/media'
import { anneeEdifice } from '@/lib/frise'
import { PictoType } from '@/components/ui/PictoType'
import { PastilleEtat } from '@/components/patrimoine/PastilleEtat'
import { VisuelAbsent } from '@/components/ui/VisuelAbsent'
import type { PatrimoineListItem, Ref } from '@/lib/data/patrimoine'

// Vignette d'archive.
//
// Elle portait un titre, une ville et un résumé — rien de ce qui fait
// justement l'intérêt du corpus. Elle porte désormais les trois clés de lecture
// du site : la TYPOLOGIE (pictogramme + nom), la DATE, et l'ÉTAT DE
// CONSERVATION. Ces trois informations étaient déjà en base ; il fallait
// seulement les faire remonter jusqu'ici.
//
// PHOTOS EN COULEUR. Elles étaient en duotone au repos et ne retrouvaient leur
// couleur qu'au survol, donc jamais sur un téléphone, qui n'a pas de survol :
// le site paraissait éteint (décision du 7 novembre 2026). Le filtre `.duotone`
// reste défini dans globals.css pour un usage ponctuel.
export function CartePatrimoine({
  item,
  locale,
  types = [],
}: {
  item: PatrimoineListItem
  locale: string
  /** Sert à nommer la typologie à côté de son pictogramme. Facultatif : sans
   *  cette liste, la vignette montre le dessin sans son intitulé plutôt que de
   *  provoquer un second aller-retour en base. */
  types?: Ref[]
}) {
  const titre = champ(item.titre_fr, item.titre_en, locale)
  const resume = champ(item.resume_fr, item.resume_en, locale)
  const principale = item.images.find((i) => i.est_principale) ?? item.images[0]
  const type = types.find((t) => t.id === item.type_id)
  const nomType = type ? champ(type.nom_fr, type.nom_en, locale) : null
  const couleurType = type?.couleur ?? 'var(--terra)'
  const annee = anneeEdifice(item)

  return (
    <Link
      href={`/patrimoine/${item.slug}`}
      className="filet-double group block overflow-hidden rounded-2xl transition hover:-translate-y-0.5"
      style={{ background: 'var(--bg2)' }}
    >
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'var(--bg3)' }}>
        {principale ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(principale.chemin)}
            srcSet={srcsetImage(imageUrl(principale.chemin))}
            sizes="(min-width: 768px) 33vw, 100vw"
            alt={titre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <VisuelAbsent />
        )}
        {/* La pastille d'état est posée SUR la photographie, pas sous elle :
            c'est l'information qu'on veut lire en balayant la grille, sans
            avoir à parcourir chaque légende. Le fond opaque la détache d'une
            image claire comme d'une image sombre. */}
        {item.etat_conservation ? (
          <span
            className="absolute left-2 top-2 rounded-full px-2 py-1"
            style={{ background: 'color-mix(in oklab, var(--bg) 88%, transparent)' }}
          >
            <PastilleEtat etat={item.etat_conservation} taille="compact" />
          </span>
        ) : null}
      </div>

      <div className="space-y-1.5 p-4">
        <div className="flex items-center gap-2" style={{ color: couleurType }}>
          <PictoType type={item.type_id} taille={17} />
          {nomType ? (
            <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em]">
              {nomType}
            </span>
          ) : null}
        </div>
        <h3 className="font-serif text-lg text-ocre">{titre}</h3>
        <p className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-wide text-doux">
          {item.ville ? <span>{item.ville}</span> : null}
          {item.ville && annee ? <span aria-hidden="true">·</span> : null}
          {annee ? <span className="tabular-nums">{annee}</span> : null}
        </p>
        {resume ? <p className="line-clamp-2 text-sm text-doux">{resume}</p> : null}
      </div>
    </Link>
  )
}
