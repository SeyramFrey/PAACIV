'use client'

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { useTranslations } from 'next-intl'
import { carteAuSommet, COMPTE_INSTAGRAM, ecartCarte, RANG_VISIBLE, URL_COMPTE_INSTAGRAM } from '@/lib/reels'

// La roue des réels Instagram (choix de Sey du 15/11/2026 : « roue + verre »,
// d'après sa référence de cartes portrait qui tournent sur un arc).
//
// - Les cartes sont posées sur un grand cercle dont le centre est sous la
//   scène : chacune pivote autour de ce centre (`transform-origin` à
//   `--rayon` sous son bord haut). La carte du sommet est la carte active.
// - La roue tourne au glisser, aux flèches, au clavier, au clic sur une carte
//   voisine, et dérive légèrement avec le défilement de la page.
// - Seule la carte active charge sa vidéo, et seulement quand la section est
//   à l'écran : sans le son, en boucle, avec un bouton pause (une animation
//   de plus de 5 s doit pouvoir s'arrêter). Les autres montrent leur affiche.
// - Son étiquette en verre porte la légende, le crédit et le lien vers le
//   post d'origine.
// - Mouvement réduit : ni transition, ni dérive, ni lecture automatique ; la
//   vidéo se lance au bouton.

export type CarteReel = {
  id: string
  video: string
  affiche: string | null
  srcset: string | null
  lien: string
  legende: string | null
  credit: string | null
}

// Pas d'angle entre deux cartes, en degrés.
const PAS = 18
// Écart de la dérive au défilement, en cartes, de part et d'autre. Sous 0,5 :
// le défilement fait tourner la roue sans jamais changer la carte active, que
// seul un geste du visiteur change.
const DERIVE = 0.35
// Au-delà de ce déplacement, un appui est un glisser, pas un clic.
const SEUIL_GLISSER = 6

function abonnerMouvement(rappel: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  mq.addEventListener('change', rappel)
  return () => mq.removeEventListener('change', rappel)
}
const mouvementReduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function RoueReels({ cartes }: { cartes: CarteReel[] }) {
  const t = useTranslations('reels')
  const n = cartes.length
  const reduit = useSyncExternalStore(abonnerMouvement, mouvementReduit, () => false)

  // Rang visé (entier, sans borne : la roue boucle) ; glisser et dérive
  // s'y ajoutent.
  const [rang, setRang] = useState(0)
  const [glisse, setGlisse] = useState(0)
  const [derive, setDerive] = useState(0)
  const [enGlisser, setEnGlisser] = useState(false)
  const [aLEcran, setALEcran] = useState(false)
  // La lecture se met en pause au bouton ; en mouvement réduit, elle ne
  // démarre qu'au bouton.
  const [pause, setPause] = useState<boolean | null>(null)
  const enPause = pause ?? reduit

  const section = useRef<HTMLElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const lecteur = useRef<HTMLVideoElement>(null)
  const appui = useRef<{ x: number; largeur: number; bouge: boolean } | null>(null)

  const position = rang + glisse + (reduit ? 0 : derive)
  const actif = carteAuSommet(position, n)

  // La section à l'écran : la vidéo ne joue et la dérive n'est suivie
  // qu'alors.
  useEffect(() => {
    const s = section.current
    if (!s) return
    const obs = new IntersectionObserver(([e]) => setALEcran(e.isIntersecting), { threshold: 0.25 })
    obs.observe(s)
    return () => obs.disconnect()
  }, [])

  // Dérive au défilement : de -DERIVE (section qui entre par le bas) à
  // +DERIVE (section qui sort par le haut). Un seul calcul par image.
  useEffect(() => {
    if (reduit || !aLEcran) return
    let image = 0
    const calculer = () => {
      image = 0
      const s = section.current
      if (!s) return
      const r = s.getBoundingClientRect()
      const parcours = window.innerHeight + r.height
      const avance = Math.min(1, Math.max(0, (window.innerHeight - r.top) / parcours))
      setDerive((avance - 0.5) * 2 * DERIVE)
    }
    const surDefilement = () => {
      if (!image) image = requestAnimationFrame(calculer)
    }
    calculer()
    window.addEventListener('scroll', surDefilement, { passive: true })
    return () => {
      window.removeEventListener('scroll', surDefilement)
      if (image) cancelAnimationFrame(image)
    }
  }, [reduit, aLEcran])

  // Lecture de la carte active.
  useEffect(() => {
    const v = lecteur.current
    if (!v) return
    if (aLEcran && !enPause) void v.play().catch(() => {})
    else v.pause()
  }, [aLEcran, enPause, actif])

  const tourner = useCallback((pas: number) => setRang((r) => r + pas), [])

  // Amène une carte voisine au sommet, par le chemin le plus court.
  function amener(index: number) {
    const d = ecartCarte(index, position, n)
    setRang((r) => Math.round(r + d))
  }

  function surAppui(e: React.PointerEvent<HTMLDivElement>) {
    if (n < 2 || e.button !== 0) return
    // Les liens et boutons de l'étiquette gardent leur clic.
    if ((e.target as HTMLElement).closest('a, [data-garde-clic]')) return
    const carte = scene.current?.querySelector<HTMLElement>('[data-carte]')
    appui.current = { x: e.clientX, largeur: (carte?.offsetWidth ?? 200) * 1.05, bouge: false }
  }
  function surDeplacement(e: React.PointerEvent<HTMLDivElement>) {
    const a = appui.current
    if (!a) return
    const dx = e.clientX - a.x
    if (!a.bouge && Math.abs(dx) > SEUIL_GLISSER) {
      a.bouge = true
      setEnGlisser(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    if (a.bouge) setGlisse(-dx / a.largeur)
  }
  function surRelache() {
    const a = appui.current
    appui.current = null
    if (!a?.bouge) return
    setRang((r) => Math.round(r + glisse))
    setGlisse(0)
    setEnGlisser(false)
  }
  // Un glisser se termine sans déclencher le clic de la carte sous le doigt.
  function surClicCapture(e: React.MouseEvent) {
    if (enGlisser) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  function surTouche(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      tourner(1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      tourner(-1)
    }
  }

  const transition = reduit || enGlisser ? 'none' : 'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 500ms'

  return (
    <section
      ref={section}
      aria-labelledby="reels-titre"
      data-testid="reels"
      className="bande-tole overflow-hidden px-[clamp(20px,5vw,80px)] pt-[clamp(70px,8vw,120px)] pb-[clamp(50px,6vw,90px)]"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 text-[10px] uppercase tracking-[0.24em] opacity-75">{t('surtitre')}</p>
          <h2 id="reels-titre" className="m-0 font-serif text-[clamp(30px,3.6vw,52px)] leading-[1.05] tracking-[-0.01em]">
            {t('titre')}
          </h2>
          <p className="mt-4 max-w-[48ch] text-[17px] font-light leading-[1.7]" style={{ color: 'var(--soft)' }}>
            {t('texte')}
          </p>
        </div>
        <a
          href={URL_COMPTE_INSTAGRAM}
          target="_blank"
          rel="noreferrer"
          className="inline-block rounded-full border px-5 py-2.5 text-sm transition hover:bg-[var(--accent)] hover:text-[var(--surAccent)]"
          style={{ borderColor: 'color-mix(in oklab, currentColor 35%, transparent)' }}
        >
          {t('suivre', { compte: COMPTE_INSTAGRAM })} <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div
        ref={scene}
        role="group"
        aria-roledescription="carrousel"
        aria-label={t('roue')}
        tabIndex={0}
        onKeyDown={surTouche}
        onPointerDown={surAppui}
        onPointerMove={surDeplacement}
        onPointerUp={surRelache}
        onPointerCancel={surRelache}
        onClickCapture={surClicCapture}
        data-testid="roue-reels"
        data-actif={actif}
        className="relative mx-auto mt-[clamp(36px,5vw,64px)] select-none outline-offset-8 [touch-action:pan-y]"
        style={
          {
            // 190 px au moins : l'étiquette en verre doit garder de la place
            // pour la vidéo sur un téléphone.
            '--l': 'clamp(190px, 19vw, 250px)',
            '--h': 'calc(var(--l) * 16 / 9)',
            '--rayon': 'calc(var(--l) * 3.4)',
            height: 'calc(var(--h) + var(--l) * 0.55)',
            cursor: n > 1 ? (enGlisser ? 'grabbing' : 'grab') : 'auto',
          } as CSSProperties
        }
      >
        {/* Le disque de la roue, sur lequel les cartes sont posées. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 rounded-full"
          style={{
            top: 'calc(var(--h) * 0.62)',
            width: 'calc((var(--rayon) - var(--h) * 0.62) * 2)',
            aspectRatio: '1',
            transform: 'translateX(-50%)',
            background: 'color-mix(in oklab, var(--ink) 7%, transparent)',
          }}
        />

        {cartes.map((c, i) => {
          const d = ecartCarte(i, position, n)
          const visible = Math.abs(d) <= RANG_VISIBLE
          const estActive = i === actif
          return (
            <div
              key={c.id}
              data-carte=""
              data-active={estActive ? '' : undefined}
              aria-hidden={!visible || undefined}
              inert={!visible}
              className="absolute left-1/2 top-[18px] overflow-hidden rounded-[18px]"
              style={{
                width: 'var(--l)',
                height: 'var(--h)',
                transformOrigin: '50% var(--rayon)',
                transform: `translateX(-50%) rotate(${d * PAS}deg) translateY(${estActive ? -14 : 0}px)`,
                transition,
                opacity: visible ? 1 : 0,
                zIndex: 50 - Math.round(Math.abs(d) * 10),
                background: 'var(--bg3)',
                boxShadow: estActive
                  ? '0 40px 70px -30px oklch(0.08 0.02 252 / 0.85)'
                  : '0 24px 40px -28px oklch(0.08 0.02 252 / 0.7)',
              }}
            >
              {c.affiche && (
                // Décorative : la légende est portée en texte dans l'étiquette.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.affiche}
                  srcSet={c.srcset ?? undefined}
                  sizes="250px"
                  alt=""
                  loading="lazy"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}

              {estActive && aLEcran && (
                <video
                  key={c.id}
                  ref={lecteur}
                  src={c.video}
                  poster={c.affiche ?? undefined}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                  data-testid="reel-video"
                />
              )}

              {estActive ? (
                <EtiquetteVerre carte={c} enPause={enPause} basculer={() => setPause(!enPause)} />
              ) : (
                <button
                  type="button"
                  onClick={() => amener(i)}
                  aria-label={t('position', { n: i + 1, total: n })}
                  className="absolute inset-0 cursor-pointer"
                  style={{ background: 'color-mix(in oklab, var(--bg) 22%, transparent)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      {n > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <BoutonRond libelle={t('precedent')} onClick={() => tourner(-1)}>
            ←
          </BoutonRond>
          <p aria-live="polite" className="m-0 min-w-[7ch] text-center text-[11px] uppercase tabular-nums tracking-[0.18em]" data-testid="reels-position">
            <span className="sr-only">{t('position', { n: actif + 1, total: n })}</span>
            <span aria-hidden="true">
              {String(actif + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </span>
          </p>
          <BoutonRond libelle={t('suivant')} onClick={() => tourner(1)}>
            →
          </BoutonRond>
        </div>
      )}
    </section>
  )
}

function BoutonRond({ libelle, onClick, children }: { libelle: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={libelle}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-full border text-base transition hover:bg-[var(--accent)] hover:text-[var(--surAccent)]"
      style={{ borderColor: 'color-mix(in oklab, currentColor 35%, transparent)' }}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}

// L'étiquette en verre de la carte active, d'après la carte de profil
// flottante de la référence de Sey : un verre, bord lumineux, posé sur la
// vidéo. Le verre est fumé du bleu nuit de la section : un verre blanc
// laissait le texte blanc illisible sur les images claires (archives sur
// papier, ciel couvert), vu sur les vrais réels le 15/11/2026.
function EtiquetteVerre({ carte, enPause, basculer }: { carte: CarteReel; enPause: boolean; basculer: () => void }) {
  const t = useTranslations('reels')
  return (
    <div
      data-testid="reel-etiquette"
      className="absolute inset-x-2.5 bottom-2.5 rounded-[14px] border p-3 text-white backdrop-blur-[14px] backdrop-saturate-150"
      style={{
        background: 'linear-gradient(140deg, oklch(0.2 0.03 252 / 0.62), oklch(0.2 0.03 252 / 0.42))',
        borderColor: 'oklch(1 0 0 / 0.38)',
        boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.35), 0 18px 30px -18px oklch(0 0 0 / 0.6)',
        textShadow: '0 1px 2px oklch(0 0 0 / 0.35)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-semibold tracking-[0.02em]">@{COMPTE_INSTAGRAM}</span>
        <button
          type="button"
          data-garde-clic=""
          onClick={basculer}
          aria-label={enPause ? t('lire') : t('pause')}
          className="grid h-7 w-7 place-items-center rounded-full border text-[10px]"
          style={{ borderColor: 'oklch(1 0 0 / 0.5)', background: 'oklch(1 0 0 / 0.12)' }}
        >
          <span aria-hidden="true">{enPause ? '▶' : '❚❚'}</span>
        </button>
      </div>
      {carte.legende && <p className="m-0 mt-1.5 line-clamp-2 text-[13px] leading-snug sm:line-clamp-3">{carte.legende}</p>}
      <p className="m-0 mt-1.5 text-[10px] opacity-85">{t('credit', { credit: carte.credit ?? `@${COMPTE_INSTAGRAM}` })}</p>
      <a
        href={carte.lien}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-[11px] font-semibold uppercase tracking-[0.14em] underline decoration-1 underline-offset-4"
      >
        {t('voir')} <span aria-hidden="true">↗</span>
      </a>
    </div>
  )
}
