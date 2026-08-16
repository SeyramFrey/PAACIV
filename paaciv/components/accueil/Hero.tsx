'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'
import type { VedetteHero } from '@/lib/data/accueil'

const INTERVALLE = 6500

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
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

  // Fondu de la légende, comme la maquette : fondu sortant, texte remplacé
  // au creux du fondu (260 ms — le texte affiché est donc `legendeAffichee`,
  // qui traîne délibérément derrière `actif`/`legende`, pas la même chose),
  // puis fondu entrant — le tout sous une seule `transition: opacity`. Le
  // texte n'est jamais visible en train de changer : contrairement à une
  // dérivation synchrone de `actif`, l'échange a lieu pendant que
  // `legendeVisible` vaut déjà `false`.
  const [legendeAffichee, setLegendeAffichee] = useState(legende)
  const [legendeVisible, setLegendeVisible] = useState(true)
  // Distingue « la vedette a changé » (creux de fondu à respecter) de
  // « le texte a changé sans elle » (bascule FR/EN sur la même vedette) :
  // ce second cas n'est pas la rotation que la maquette anime, il se
  // resynchronise donc immédiatement plutôt que d'attendre 260 ms.
  const actifPrecedent = useRef(actif)
  useEffect(() => {
    if (actifPrecedent.current === actif) {
      setLegendeAffichee(legende)
      return
    }
    actifPrecedent.current = actif
    setLegendeVisible(false)
    const id = window.setTimeout(() => {
      setLegendeAffichee(legende)
      setLegendeVisible(true)
    }, 260)
    // Nettoyage symétrique à celui du minuteur de rotation ci-dessus : sans
    // lui, un clic sur une autre vignette pendant le creux du fondu (ou un
    // démontage à ce moment précis) laisserait ce minuteur en vol et
    // écrirait, 260 ms plus tard, une légende déjà périmée — ou une mise à
    // jour d'état sur un composant démonté.
    return () => window.clearTimeout(id)
  }, [actif, legende])

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
            alt=""
            // Seule la première (contenu du premier écran) charge
            // immédiatement ; les autres, empilées derrière elle en attente
            // de leur tour de rotation, n'ont pas à concurrencer le premier
            // rendu pour la bande passante.
            loading={i === 0 ? undefined : 'lazy'}
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              filter: 'var(--imgf)',
              opacity: i === actif ? 1 : 0,
              transform: i === actif ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 1.2s ease, transform 1.6s ease',
            }}
          />
        ))}
      </div>

      <div aria-hidden="true" className="absolute inset-0 z-[1]" style={{ background: 'var(--veil)' }} />
      <div ref={lampe} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]" />

      {/* Retrait haut ramené de `clamp(120px,16vh,180px)` à
          `clamp(104px,14vh,180px)` : au-delà de 1285 px de hauteur d'écran la
          borne haute de 180 px s'applique comme avant, donc la maquette est
          intacte là où elle tenait déjà. Le resserrement ne mord que sur les
          écrans courts, ceux où le hero débordait. */}
      <div className="relative z-[5] grid gap-10 pl-[clamp(56px,9vw,140px)] pr-[clamp(20px,4vw,54px)] pb-[clamp(28px,4vw,54px)] pt-[clamp(104px,14vh,180px)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        {/* Plus de `max-w-[900px]`. La maquette casse son `<h1>` en DEUX lignes
            explicites (« Ce qui tient debout » / « raconte encore ») ; le nôtre
            reçoit un titre unique venu du CMS, qu'un plafond de 900 px faisait
            retomber sur QUATRE lignes — 523 px au lieu de 261 px, mesurés. Le
            hero dépassait alors `100svh` et sa colonne de droite passait sous
            la ligne de flottaison. Sans plafond, la largeur disponible rend le
            titre sur deux lignes dès 1900 px, comme la maquette. */}
        <div>
          <p
            data-testid="accroche"
            data-drop=""
            className="mb-[22px] text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{ color: 'var(--accent)', animation: 'drop 1s .2s both cubic-bezier(.16,1,.3,1)' }}
          >
            {t('accroche')}
          </p>
          {/* `min(8.4vw, 10.5vh)` : la taille de la maquette est purement
              horizontale, or ce titre occupe un hero haut de `100svh`. Sur un
              écran large mais court (2000×1000, portable en paysage), 8.4vw
              seul donnait un titre plus haut que la place disponible. Le terme
              en `vh` ne mord que là — au-delà de 1353 px de hauteur, la valeur
              de la maquette reprend la main intacte.
              10,5 et non 11,5 : mesuré, c'est le palier qui fait tomber le
              titre à TROIS lignes en 1280×800 au lieu de quatre, et le hero
              tient alors dans l'écran sans qu'il faille aussi rogner le retrait
              bas. Moins de lignes rapproche en prime de la composition en deux
              lignes de la maquette. */}
          <h1
            data-drop=""
            className="m-0 font-serif text-[clamp(46px,min(8.4vw,10.5vh),142px)] leading-[0.92] tracking-[-0.02em] text-balance"
            style={{ color: 'var(--onDeep)', animation: 'drop 1.1s .35s both cubic-bezier(.16,1,.3,1)' }}
          >
            {titre}
          </h1>
          <p
            data-drop=""
            className="mt-6 max-w-[560px] text-[17px] font-light leading-[1.75]"
            style={{
              color: 'color-mix(in oklab, var(--onDeep) 82%, transparent)',
              animation: 'drop 1.1s .7s both cubic-bezier(.16,1,.3,1)',
            }}
          >
            {intro}
          </p>
          <div
            data-drop=""
            className="mt-9 flex flex-wrap gap-3.5"
            style={{ animation: 'drop 1.1s .85s both cubic-bezier(.16,1,.3,1)' }}
          >
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
            <div
              data-drop=""
              className="mt-11 flex flex-wrap gap-2.5"
              style={{ animation: 'drop 1.1s 1s both cubic-bezier(.16,1,.3,1)' }}
            >
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
          <div
            data-drop=""
            className="flex flex-col items-end gap-4"
            style={{ animation: 'drop 1.2s 1.1s both cubic-bezier(.16,1,.3,1)' }}
          >
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
                  <img src={v.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
            <p
              data-testid="hero-legende"
              className="mt-1 max-w-[300px] text-right text-xs"
              style={{ color: 'var(--onDeep)', opacity: legendeVisible ? 0.72 : 0, transition: 'opacity .4s ease' }}
            >
              {legendeAffichee}
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
          data-floaty=""
          className="h-[34px] w-px"
          style={{ background: 'linear-gradient(180deg, var(--accent), transparent)', animation: 'floaty 2.4s ease-in-out infinite' }}
        />
      </a>
    </section>
  )
}
