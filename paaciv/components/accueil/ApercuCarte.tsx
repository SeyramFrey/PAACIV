'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { Ref } from '@/lib/data/patrimoine'

// `'use client'` ne retire RIEN du HTML servi : ce composant est rendu par le
// serveur comme les autres, seul son code est aussi envoyé au navigateur.
// C'est `ssr: false` qui retire du HTML, et il ne porte donc que sur
// `CarteApercu` — le surtitre, le `<h2>`, le paragraphe et surtout le lien
// interne vers `/carte` restent dans le HTML de la page la plus visitée du
// site. (Auparavant `ssr: false` portait sur toute la section : elle en avait
// entièrement disparu.)
const CarteApercu = dynamic(
  () => import('@/components/accueil/CarteApercu').then((mod) => mod.CarteApercu),
  { ssr: false },
)

export function ApercuCarte({
  types,
  nombre,
  surtitre,
  titre,
  texte,
}: {
  types: Ref[]
  nombre: number
  surtitre: string
  titre: string
  texte: string
}) {
  const t = useTranslations('accueil')
  const conteneur = useRef<HTMLDivElement>(null)
  const [pret, setPret] = useState(false)
  const [visible, setVisible] = useState(false)

  // La carte est décorative sur la page la plus visitée du site. Le garde
  // vit ICI, et non dans `CarteApercu`, parce qu'un garde placé dans le
  // module à charger suppose ce module déjà chargé : `next/dynamic` est un
  // `React.lazy`, dont le chargeur part au PREMIER RENDU de l'élément. Rendre
  // `<CarteApercu />` sans condition faisait donc partir les 785 Ko à chaque
  // visite, simplement après l'hydratation au lieu d'être dans le bundle
  // initial. En le montant seulement quand `visible` passe à vrai, le chunk
  // n'est demandé qu'à l'approche de la section.
  // `rootMargin: '200px'` laisse une marge d'anticipation : la carte est
  // prête un peu avant que le conteneur n'entre réellement dans le viewport,
  // pas seulement au pixel exact.
  useEffect(() => {
    if (!conteneur.current) return
    const observateur = new IntersectionObserver(
      (entrees) => {
        if (entrees[0]?.isIntersecting) {
          setVisible(true)
          observateur.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    observateur.observe(conteneur.current)
    return () => observateur.disconnect()
  }, [])

  return (
    <section
      className="px-[clamp(20px,5vw,80px)] py-20 lg:py-32"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <p data-rv="" className="text-[10px] uppercase tracking-[0.24em] opacity-60">{surtitre}</p>
        <h2 data-rv="" data-d="60" className="mt-3 font-serif text-4xl lg:text-6xl">{titre}</h2>
        <p data-rv="" data-d="120" className="mt-5 opacity-75">{texte}</p>
      </div>

      <div
        data-rv=""
        data-d="180"
        className="mx-auto mt-12 w-[min(720px,100%)] overflow-hidden rounded border"
        style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 22%, transparent)' }}
      >
        {/* Carré strict, demandé explicitement. `aspect-square` + hauteur
            pilotée par la largeur : MapLibre a besoin d'un conteneur mesuré.
            Ce div est aussi la cible de l'observateur et il réserve la place
            avant le montage de la carte, donc la page ne saute pas.
            Pas d'`aria-label` ici : un `<div>` sans rôle explicite l'ignore
            selon la spécification ARIA, et il ferait de toute façon doublon
            avec le `aria-live` du paragraphe voisin ci-dessous. */}
        <div ref={conteneur} className="aspect-square w-full">
          {visible ? <CarteApercu types={types} onPret={() => setPret(true)} /> : null}
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <p className="text-sm opacity-70" aria-live="polite">
          {pret ? t('edifices', { n: nombre }) : null}
        </p>
        <Link
          href="/carte"
          className="rounded-full px-8 py-4 text-sm font-semibold transition hover:-translate-y-0.5"
          style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
        >
          {t('ouvrirCarte')}
        </Link>
      </div>
    </section>
  )
}
