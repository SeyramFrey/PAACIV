'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import type { Activite } from '@/lib/data/accueil'

// Transposition des lignes 269-323 de la référence de design en motif
// d'onglets accessible (role="tab"/"tabpanel") : la maquette empile ses
// quatre panneaux en position absolue et les fait se croiser en fondu — un
// choix purement visuel, piloté par son propre script. Un seul panneau à la
// fois dans le DOM est le pendant accessible correct (rien à annoncer
// deux fois à un lecteur d'écran, rien de masqué par CSS que le clavier
// pourrait quand même atteindre).
export function Activites({
  activites,
  surtitre,
  titre,
  intro,
}: {
  activites: Activite[]
  surtitre: string
  titre: string
  intro: string
}) {
  const locale = useLocale()
  const id = useId()
  const [actif, setActif] = useState(0)
  const boutons = useRef<(HTMLButtonElement | null)[]>([])

  // Aucune activité publiée : le bloc entier disparaît plutôt que d'afficher
  // un titre suivi d'onglets vides.
  if (activites.length === 0) return null

  function allerA(index: number) {
    const suivant = (index + activites.length) % activites.length
    setActif(suivant)
    boutons.current[suivant]?.focus()
  }

  function surTouche(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      allerA(index + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      allerA(index - 1)
    }
  }

  const courante = activites[actif]
  const cadence = champ(courante.cadence_fr, courante.cadence_en, locale)
  const description = champ(courante.description_fr, courante.description_en, locale)
  const ctaLibelle = champ(courante.cta_libelle_fr, courante.cta_libelle_en, locale)

  return (
    <section className="px-[clamp(20px,5vw,80px)] py-[clamp(60px,7vw,110px)]" style={{ background: 'var(--bg2)' }}>
      <div className="mx-auto max-w-[1440px]">
        <div className="mx-auto mb-14 max-w-[680px] text-center">
          <p
            data-rv=""
            className="m-0 mb-4 text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
            style={{ color: 'var(--ocre)' }}
          >
            {surtitre}
          </p>
          <h2
            data-rv=""
            data-d="60"
            className="m-0 font-serif text-[clamp(32px,4vw,62px)] leading-[1.04]"
            style={{ color: 'var(--ink)' }}
          >
            {titre}
          </h2>
          {intro && (
            <p
              data-rv=""
              data-d="120"
              className="mt-[18px] text-base font-light leading-[1.75]"
              style={{ color: 'var(--soft)' }}
            >
              {intro}
            </p>
          )}
        </div>

        <div className="grid items-start gap-[clamp(20px,3vw,44px)] lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)]">
          <div role="tablist" aria-label={titre} data-rv="" className="flex flex-col gap-2.5">
            {activites.map((a, i) => {
              const estActif = i === actif
              return (
                <button
                  key={a.id}
                  ref={(el) => {
                    boutons.current[i] = el
                  }}
                  id={`${id}-tab-${i}`}
                  role="tab"
                  type="button"
                  aria-selected={estActif}
                  aria-controls={`${id}-panel-${i}`}
                  tabIndex={estActif ? 0 : -1}
                  onClick={() => setActif(i)}
                  onKeyDown={(e) => surTouche(e, i)}
                  className="rounded text-left text-sm font-medium transition-colors duration-[0.4s] hover:[border-color:var(--ocre)]"
                  style={
                    estActif
                      ? { padding: '18px 22px', background: 'var(--deep)', color: 'var(--onDeep)', border: '1px solid transparent' }
                      : { padding: '18px 22px', background: 'var(--bg)', color: 'var(--ink)', border: '1px solid var(--line)' }
                  }
                >
                  {champ(a.titre_fr, a.titre_en, locale)}
                </button>
              )
            })}
          </div>

          <div className="relative min-h-[clamp(340px,32vw,440px)]">
            <div
              key={courante.id}
              id={`${id}-panel-${actif}`}
              role="tabpanel"
              aria-labelledby={`${id}-tab-${actif}`}
              className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[clamp(16px,2vw,28px)]"
            >
              {courante.image && (
                <div className="h-[clamp(240px,26vw,380px)] overflow-hidden rounded-[6px]">
                  {/* Décorative : le titre du panneau, juste à côté, porte
                      déjà l'information — un `alt` non vide la dupliquerait
                      (même raisonnement que CartesSoutien.tsx). */}
                  <img
                    src={courante.image}
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ filter: 'var(--imgf)' }}
                  />
                </div>
              )}
              <div className="py-2">
                {cadence && (
                  <p
                    className="m-0 mb-3 text-[10px] font-medium uppercase leading-none tracking-[0.24em]"
                    style={{ color: 'var(--ocre)' }}
                  >
                    {cadence}
                  </p>
                )}
                <h3
                  className="m-0 font-serif text-[clamp(24px,2.4vw,34px)] leading-[1.15]"
                  style={{ color: 'var(--ink)' }}
                >
                  {champ(courante.titre_fr, courante.titre_en, locale)}
                </h3>
                {description && (
                  <p className="mt-4 text-[15px] font-light leading-[1.75]" style={{ color: 'var(--soft)' }}>
                    {description}
                  </p>
                )}
                {courante.cta_href && ctaLibelle && (
                  <Link
                    href={courante.cta_href}
                    className="mt-[22px] inline-flex items-center gap-2.5 border-b pb-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.2em]"
                    style={{ borderColor: 'var(--terra)' }}
                  >
                    {ctaLibelle} <span aria-hidden="true">↗</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
