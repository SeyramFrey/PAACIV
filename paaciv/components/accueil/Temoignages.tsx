'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { champ } from '@/lib/i18n-champ'
import type { Temoignage } from '@/lib/data/accueil'

// Quatre teintes de la maquette (lignes 491, 499, 507, 515), cycliques : la
// table n'a pas de nombre fixe de témoignages, contrairement aux quatre
// cartes figées de la référence. `--gold` devient `--accent` (contrainte
// globale « aucun jaune »).
const FOND = ['var(--terra)', 'var(--ocre)', 'var(--deep)', 'var(--accent)'] as const
const SUR_FOND = [
  'oklch(0.98 0.01 84)',
  'oklch(0.16 0.02 48)',
  'var(--onDeep)',
  'oklch(0.16 0.02 48)',
] as const

// Transposition des lignes 475-524 de la référence de design.
//
// La table `temoignages` est VOLONTAIREMENT VIDE au lancement (spec §4.4) :
// l'association fournira les vrais témoignages, aucun n'est inventé ici, pas
// même en exemple. Le bloc entier disparaît tant qu'elle l'est — un
// carrousel vide avec ses flèches serait un bug visible, pas un état
// dégradé acceptable.
export function Temoignages({
  temoignages,
  surtitre,
  titre,
}: {
  temoignages: Temoignage[]
  surtitre: string
  titre: string
}) {
  const locale = useLocale()
  const t = useTranslations('accueil')
  const piste = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [decalage, setDecalage] = useState(0)

  // Décalage mesuré sur le DOM réel (offsetLeft de la carte visée), pas
  // recalculé à la main à partir des `clamp()` de la maquette : la largeur
  // des cartes varie avec le viewport, offsetLeft la connaît déjà.
  useLayoutEffect(() => {
    const carte = piste.current?.children[index] as HTMLElement | undefined
    setDecalage(carte ? carte.offsetLeft : 0)
  }, [index, temoignages])

  if (temoignages.length === 0) return null

  const dernier = temoignages.length - 1

  return (
    <section className="px-[clamp(20px,5vw,80px)] py-[clamp(70px,8vw,120px)]" style={{ background: 'var(--bg2)' }}>
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p
              data-rv=""
              className="m-0 font-serif text-[clamp(24px,2.6vw,36px)] italic leading-none"
              style={{ color: 'var(--terra)' }}
            >
              {surtitre}
            </p>
            <h2
              data-rv=""
              data-d="60"
              className="mt-2 font-serif text-[clamp(30px,3.8vw,58px)] leading-[1.05]"
              style={{ color: 'var(--ink)' }}
            >
              {titre}
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
              aria-label={t('precedent')}
              className="grid h-[46px] w-[46px] place-items-center rounded-full border border-[var(--line)] bg-transparent text-[15px] text-[var(--ink)] transition-colors duration-[0.4s] hover:border-[var(--terra)] hover:text-[var(--terra)] disabled:opacity-40"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(dernier, i + 1))}
              disabled={index === dernier}
              aria-label={t('suivant')}
              className="grid h-[46px] w-[46px] place-items-center rounded-full border border-[var(--terra)] bg-[var(--terra)] text-[15px] text-[oklch(0.98_0.01_84)] transition-colors duration-[0.4s] hover:bg-[var(--accent)] hover:text-[oklch(0.16_0.02_48)] disabled:opacity-40"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-11 overflow-hidden">
          <div
            ref={piste}
            className="flex gap-6"
            style={{ transform: `translateX(-${decalage}px)`, transition: 'transform .8s cubic-bezier(.16,1,.3,1)', willChange: 'transform' }}
          >
            {temoignages.map((tm, i) => {
              const role = champ(tm.role_fr, tm.role_en, locale)
              const citation = champ(tm.citation_fr, tm.citation_en, locale)
              const etoiles = '★'.repeat(tm.note) + '☆'.repeat(Math.max(0, 5 - tm.note))
              return (
                <article
                  key={tm.id}
                  className="flex-none basis-[clamp(280px,30vw,400px)] rounded-md border p-7"
                  style={{ background: 'var(--bg)', borderColor: 'var(--line)' }}
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 place-items-center rounded-full font-serif text-lg leading-none"
                      style={{ background: FOND[i % FOND.length], color: SUR_FOND[i % SUR_FOND.length] }}
                    >
                      {tm.nom.charAt(0).toUpperCase()}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold leading-[1.2]" style={{ color: 'var(--ink)' }}>
                        {tm.nom}
                      </span>
                      {role && (
                        <span className="block text-xs font-light leading-[1.4]" style={{ color: 'var(--soft)' }}>
                          {role}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-light leading-[1.75]" style={{ color: 'var(--soft)' }}>
                    « {citation} »
                  </p>
                  <p aria-label={t('noteSur', { note: tm.note })} className="mt-4">
                    <span aria-hidden="true" className="tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
                      {etoiles}
                    </span>
                  </p>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
