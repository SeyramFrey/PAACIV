'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { imageUrl, srcsetImage } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'

// Photos d'un onglet de la fiche bâtiment (« Photographies et état actuel »,
// « Documentation »). Chacune porte sous elle ce que l'association a demandé :
// la légende, la date, puis la source et le crédit.
//
// Un clic ouvre la photo EN PLEIN ÉCRAN, dans la page (demande de Sey,
// 13/11/2026) : un plan ou un document d'archive se lit en grand, et le
// visiteur ne perd pas sa fiche dans un autre onglet. `<dialog>` natif, comme
// `components/ui/Modal.tsx` : le navigateur fournit le piège du focus, Échap et
// le retour du focus sur la vignette. Sans JavaScript, le lien ouvre l'image
// dans le même onglet.
export function PhotosDossier({ images, locale }: { images: ImageRow[]; locale: string }) {
  const t = useTranslations('fiche')
  const tModal = useTranslations('modal')
  const [indice, setIndice] = useState<number | null>(null)
  const dialogue = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogue.current
    if (!d) return
    if (indice !== null && !d.open) d.showModal()
    if (indice === null && d.open) d.close()
  }, [indice])

  if (images.length === 0) return null

  const fermer = () => setIndice(null)
  const aller = (pas: number) =>
    setIndice((i) => (i === null ? i : (i + pas + images.length) % images.length))

  const legendeDe = (img: ImageRow) => champ(img.legende_fr, img.legende_en, locale)

  const courante = indice === null ? null : images[indice]

  return (
    <>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" data-testid="photos-dossier">
        {images.map((img, i) => {
          const src = imageUrl(img.chemin)
          const legende = legendeDe(img)
          return (
            <li key={img.id}>
              <figure className="space-y-2">
                <a
                  href={src}
                  onClick={(e) => {
                    e.preventDefault()
                    setIndice(i)
                  }}
                  aria-label={legende ? `${t('pleinEcran')} : ${legende}` : t('pleinEcran')}
                  className="block cursor-zoom-in overflow-hidden rounded-xl bg-creme2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageUrl(img.chemin, 960)}
                    srcSet={srcsetImage(src)}
                    sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                    alt={legende || ''}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                </a>
                <Legende img={img} locale={locale} />
              </figure>
            </li>
          )
        })}
      </ul>

      <dialog
        ref={dialogue}
        data-testid="visionneuse"
        aria-label={courante ? legendeDe(courante) || t('pleinEcran') : t('pleinEcran')}
        onCancel={(e) => {
          // Échap : l'état React pilote, sinon la visionneuse ne se rouvrirait plus.
          e.preventDefault()
          fermer()
        }}
        onClick={(e) => {
          // Un clic dans le noir autour de la photo ferme, comme sur le fond.
          if (e.target === e.currentTarget) fermer()
        }}
        onKeyDown={(e) => {
          if (images.length < 2) return
          if (e.key === 'ArrowRight') aller(1)
          if (e.key === 'ArrowLeft') aller(-1)
        }}
        className="m-0 h-[100dvh] max-h-none w-screen max-w-none border-0 bg-[#0b0d10] p-0 text-white backdrop:bg-black/90"
      >
        {courante && (
          <div className="flex h-full flex-col" onClick={(e) => e.target === e.currentTarget && fermer()}>
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <span className="text-xs tabular-nums text-white/70" aria-live="polite">
                {images.length > 1 ? t('position', { n: (indice ?? 0) + 1, total: images.length }) : ''}
              </span>
              <button
                type="button"
                onClick={fermer}
                aria-label={tModal('fermer')}
                autoFocus
                className="grid h-11 w-11 place-items-center rounded-full border border-white/40 text-2xl leading-none transition hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                ×
              </button>
            </div>

            <figure
              className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 pb-6 sm:px-20"
              onClick={(e) => e.target === e.currentTarget && fermer()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={courante.id}
                src={imageUrl(courante.chemin)}
                alt={legendeDe(courante) || ''}
                className="min-h-0 max-w-full flex-1 object-contain"
              />
              <div className="w-full max-w-3xl">
                <Legende img={courante} locale={locale} plein />
              </div>

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => aller(-1)}
                    aria-label={t('precedente')}
                    className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/40 text-xl transition hover:bg-white hover:text-black sm:left-5"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => aller(1)}
                    aria-label={t('suivante')}
                    className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/40 text-xl transition hover:bg-white hover:text-black sm:right-5"
                  >
                    →
                  </button>
                </>
              )}
            </figure>
          </div>
        )}
      </dialog>
    </>
  )
}

// La légende demandée par l'association : la date et la légende, puis la
// source et le crédit. En clair sur fond sombre dans la visionneuse.
function Legende({ img, locale, plein }: { img: ImageRow; locale: string; plein?: boolean }) {
  const t = useTranslations('fiche')
  const legende = champ(img.legende_fr, img.legende_en, locale)
  if (!legende && !img.date_texte && !img.source && !img.credit) return null
  return (
    <figcaption className={`space-y-0.5 text-xs ${plein ? 'text-white/75' : 'text-doux'}`}>
      {(img.date_texte || legende) && (
        <p className={plein ? 'text-sm text-white' : 'text-encre-t'}>
          {img.date_texte && <span className="font-semibold">{img.date_texte}</span>}
          {img.date_texte && legende ? '. ' : null}
          {legende}
        </p>
      )}
      {img.source && <p>{t('legendeSource', { source: img.source })}</p>}
      {img.credit && <p className="italic">{img.credit}</p>}
    </figcaption>
  )
}
