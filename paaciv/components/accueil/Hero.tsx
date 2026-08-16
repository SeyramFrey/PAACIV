'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'
import type { VedetteHero } from '@/lib/data/accueil'

const INTERVALLE = 6500

// jsdom (nos tests) n'implémente pas `matchMedia` : sans cette garde, le
// premier rendu du composant planterait dans les tests plutôt que de
// simplement se comporter comme si le mouvement n'était pas réduit.
function prefereMouvementReduit(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

export function Hero({
  vedettes,
  titre,
  intro,
}: {
  vedettes: VedetteHero[]
  titre: string
  intro: string
}) {
  const t = useTranslations('accueil')
  const locale = useLocale()
  const { ouvrir } = useSoutien()
  const [actif, setActif] = useState(0)
  const section = useRef<HTMLElement>(null)
  const lampe = useRef<HTMLDivElement>(null)

  // Rotation automatique. La dépendance sur `actif` remet le minuteur à zéro
  // après un clic manuel : sans cela, l'image choisie pourrait sauter au bout
  // de quelques centaines de millisecondes.
  useEffect(() => {
    if (vedettes.length < 2) return
    if (prefereMouvementReduit()) return
    const id = window.setInterval(() => setActif((i) => (i + 1) % vedettes.length), INTERVALLE)
    return () => window.clearInterval(id)
  }, [actif, vedettes.length])

  // Halo suivant le curseur. Écrit directement dans le style plutôt que via
  // un état React : à 60 images par seconde, un setState par mouvement de
  // souris ferait re-rendre tout le hero.
  useEffect(() => {
    const s = section.current
    const l = lampe.current
    if (!s || !l) return
    if (prefereMouvementReduit()) return
    function auMouvement(e: MouseEvent) {
      const r = s!.getBoundingClientRect()
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      l!.style.background = `radial-gradient(520px circle at ${x}% ${y}%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 68%)`
    }
    s.addEventListener('mousemove', auMouvement)
    return () => s.removeEventListener('mousemove', auMouvement)
  }, [])

  const courante = vedettes[actif] ?? null

  const villes = Array.from(
    new Set(
      vedettes
        .map((v) => (v.ville ?? '').trim())
        .filter((v) => v.length > 0),
    ),
  )

  const legende = courante
    ? [champ(courante.titre_fr, courante.titre_en, locale), [courante.ville, courante.date_texte].filter(Boolean).join(', ')]
        .filter(Boolean)
        .join(' — ')
    : ''

  return (
    <section
      id="top"
      ref={section}
      className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
      style={{ background: 'var(--deep)' }}
    >
      <div aria-hidden="true" className="absolute -inset-x-[2%] -bottom-[2%] -top-[6%] z-0">
        {vedettes.map((v, i) => (
          <img
            key={v.slug}
            src={v.image}
            alt={champ(v.titre_fr, v.titre_en, locale)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: 'var(--imgf)',
              opacity: i === actif ? 1 : 0,
              transform: i === actif ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 1.2s ease, transform 8s ease',
            }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="absolute inset-0 z-[1]" style={{ background: 'var(--veil)' }} />
      <div ref={lampe} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]" />

      <div className="relative z-[5] grid gap-10 px-5 pb-7 pt-[clamp(120px,16vh,180px)] sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:px-14">
        <div className="max-w-[900px]">
          <h1
            data-clip=""
            className="m-0 font-serif text-[clamp(46px,8.4vw,142px)] leading-[0.92] tracking-[-0.02em] text-balance"
            style={{ color: 'var(--onDeep)' }}
          >
            {titre}
          </h1>
          <p
            className="mt-6 max-w-[560px] text-[17px] font-light leading-[1.75]"
            style={{ color: 'color-mix(in oklab, var(--onDeep) 82%, transparent)' }}
          >
            {intro}
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Link
              href="/archives"
              className="inline-flex items-center gap-3 rounded-full px-[30px] py-[17px] text-xs font-semibold uppercase tracking-[0.16em] transition"
              style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
            >
              <span>{t('explorer')}</span>
              <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              onClick={() => ouvrir('don')}
              className="inline-flex items-center gap-3 rounded-full border px-[30px] py-[17px] text-xs font-semibold uppercase tracking-[0.16em] transition"
              style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 45%, transparent)', color: 'var(--onDeep)' }}
            >
              {t('soutenir')}
            </button>
          </div>
          {villes.length > 0 && (
            <div className="mt-11 flex flex-wrap gap-2.5">
              {villes.map((ville) => (
                <span
                  key={ville}
                  className="rounded-full border px-4 py-2 text-[10px] font-medium uppercase tracking-[0.18em]"
                  style={{ borderColor: 'color-mix(in oklab, var(--onDeep) 28%, transparent)', color: 'var(--onDeep)' }}
                >
                  {ville}
                </span>
              ))}
            </div>
          )}
        </div>

        {vedettes.length > 0 && (
          <div className="flex flex-col items-end gap-4">
            <div className="flex items-center gap-3.5" style={{ color: 'var(--onDeep)' }}>
              <span className="text-[10px] uppercase tracking-[0.24em] opacity-80">{t('vues')}</span>
              <span className="h-px w-[52px]" style={{ background: 'color-mix(in oklab, var(--onDeep) 50%, transparent)' }} />
            </div>
            <div className="flex gap-2.5">
              {vedettes.map((v, i) => (
                <button
                  key={v.slug}
                  type="button"
                  aria-label={t('voirVedette', { titre: champ(v.titre_fr, v.titre_en, locale) })}
                  aria-pressed={i === actif}
                  onClick={() => setActif(i)}
                  className="h-[66px] w-[92px] overflow-hidden rounded border p-0 transition"
                  style={{
                    borderColor:
                      i === actif ? 'var(--accent)' : 'color-mix(in oklab, var(--onDeep) 30%, transparent)',
                  }}
                >
                  <img src={v.image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <p
              key={courante?.slug}
              data-testid="hero-legende"
              className="mt-1 max-w-[300px] text-right text-xs"
              style={{ color: 'var(--onDeep)', opacity: 0.72, animation: 'drop .4s cubic-bezier(.16,1,.3,1) both' }}
            >
              {legende}
            </p>
          </div>
        )}
      </div>

      <a
        href="#association"
        className="absolute bottom-6 left-1/2 z-[6] flex -translate-x-1/2 flex-col items-center gap-2"
        style={{ color: 'var(--onDeep)' }}
      >
        <span className="text-[9px] uppercase tracking-[0.26em] opacity-70">{t('defiler')}</span>
        <span
          aria-hidden="true"
          className="h-[34px] w-px"
          style={{ background: 'linear-gradient(180deg, var(--accent), transparent)', animation: 'floaty 2.4s ease-in-out infinite' }}
        />
      </a>
    </section>
  )
}
