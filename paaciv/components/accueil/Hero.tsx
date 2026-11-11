'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

// Haut de page : un survol filmé en fond, en boucle et sans son.
//
// Il remplace le diaporama des vedettes (décision du 7 novembre 2026). Les
// fiches restent présentées plus bas ; ici, le film pose le lieu, et le petit
// emblème annonce l'éléphant, dont l'animation commence à la section suivante.
//
// Vidéo PROVISOIRE, à remplacer par une prise de vue réelle : seuls les
// fichiers de `public/videos/hero/` changeront, pas ce composant.
//
// Poids : l'affiche (WebP, 86 à 160 Ko) est l'image du premier écran ; la
// vidéo (1,1 Mo en 720p, 2 Mo en 1080p) n'est ajoutée qu'après hydratation,
// et jamais en mode léger ni en mouvement réduit. Ces visiteurs gardent
// l'affiche, qui est la première image du film : rien ne saute à l'arrivée.
const AFFICHE = '/videos/hero/survol-affiche.webp'
const AFFICHE_960 = '/videos/hero/survol-affiche-960.webp'
const VIDEO_1080 = '/videos/hero/survol-1080.mp4'
const VIDEO_720 = '/videos/hero/survol-720.mp4'

function filmPermis() {
  if (document.documentElement.hasAttribute('data-leger')) return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function Hero({
  titre,
  intro,
  accroche,
}: {
  titre: string
  intro: string
  // `null` : rien à substituer en base — on retombe sur le libellé du code.
  // Un paragraphe absent laisse un trou acceptable ; un libellé absent
  // laisserait un texte muet, d'où ce plancher garanti.
  accroche: string | null
}) {
  const t = useTranslations('accueil')
  const { ouvrir } = useSoutien()
  const section = useRef<HTMLElement>(null)
  const lampe = useRef<HTMLDivElement>(null)
  const film = useRef<HTMLVideoElement>(null)
  const [avecFilm, setAvecFilm] = useState(false)
  const [filmPret, setFilmPret] = useState(false)

  // Le film n'existe pas au rendu serveur : il est monté ici, une fois sûr
  // que le visiteur n'est ni en mode léger ni en mouvement réduit. Le monter
  // dès le HTML lancerait son téléchargement avant que l'on puisse vérifier.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- décision prise côté client seulement
    if (filmPermis()) setAvecFilm(true)
  }, [])

  // Lecture seulement quand le haut de page est visible : un film qui tourne
  // hors de l'écran use la batterie d'un téléphone pour rien.
  useEffect(() => {
    const s = section.current
    const v = film.current
    if (!avecFilm || !s || !v) return
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play()?.catch(() => {})
      else v.pause()
    })
    obs.observe(s)
    return () => obs.disconnect()
  }, [avecFilm])

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

  return (
    <section
      id="top"
      ref={section}
      data-hero-intro=""
      className="bande-tole relative flex min-h-[100svh] flex-col justify-end overflow-hidden"
      style={{ background: 'var(--deep)' }}
    >
      <div aria-hidden="true" className="absolute inset-0 z-0">
        {/* L'affiche est l'image du premier écran (LCP) : chargée tout de
            suite, en priorité haute, jamais en différé. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-testid="hero-affiche"
          src={AFFICHE}
          srcSet={`${AFFICHE_960} 960w, ${AFFICHE} 1600w`}
          sizes="100vw"
          alt=""
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'var(--imgf)' }}
        />
        {avecFilm && (
          // Les deux sources ont la même image de départ que l'affiche ; le
          // fondu d'entrée ne fait donc qu'animer ce qui était déjà là.
          // `media` sur <source> : le 720p suffit en dessous de 1280 px, et
          // c'est presque tout le trafic mobile.
          <video
            ref={film}
            data-testid="hero-film"
            muted
            loop
            playsInline
            autoPlay
            preload="auto"
            poster={AFFICHE}
            onPlaying={() => setFilmPret(true)}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: 'var(--imgf)', opacity: filmPret ? 1 : 0, transition: 'opacity .8s ease' }}
          >
            <source src={VIDEO_1080} type="video/mp4" media="(min-width: 1280px)" />
            <source src={VIDEO_720} type="video/mp4" />
          </video>
        )}
      </div>

      <div aria-hidden="true" className="absolute inset-0 z-[1]" style={{ background: 'var(--veil)' }} />
      <div ref={lampe} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[2]" />

      {/* Retrait bas de 112 px sous `lg` : la carte « Film » remonte de
          88 px sur le bas du hero et, sur téléphone, prend toute la largeur.
          Le rail de vignettes, empilé sous les boutons, absorbait ce
          recouvrement ; sans lui, c'est le bouton « Soutenir » qui passait
          dessous. Sur grand écran la carte est à droite, le texte à gauche. */}
      {/* Retrait haut ramené de `clamp(120px,16vh,180px)` à
          `clamp(104px,14vh,180px)` : au-delà de 1285 px de hauteur d'écran la
          borne haute de 180 px s'applique comme avant, donc la maquette est
          intacte là où elle tenait déjà. Le resserrement ne mord que sur les
          écrans courts, ceux où le hero débordait. */}
      {/* `grid-cols-[minmax(0,1fr)]` dès le mobile, et pas seulement à `lg`.
          Sans piste déclarée, la grille en crée une seule, dimensionnée `auto`
          — donc au MAX-CONTENT de ses deux enfants. Le rail de vignettes
          (cinq images de 92 px et quatre gouttières de 10 px, sans repli) en
          réclamait 500 : la piste passait à 500 px sur un écran de 390, la
          colonne de texte suivait, et l'`overflow` de la section rognait
          l'accroche, le titre, le paragraphe et les puces de villes AU MÊME
          BORD — sans barre de défilement pour le signaler, `scrollWidth`
          restant égal à `clientWidth`. C'est le débordement invisible qu'on
          voyait sur téléphone. */}
      <div className="relative z-[5] grid grid-cols-[minmax(0,1fr)] gap-10 pl-[clamp(56px,9vw,140px)] pr-[clamp(20px,4vw,54px)] pb-[112px] pt-[clamp(104px,14vh,180px)] lg:pb-[clamp(28px,4vw,54px)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        {/* Plus de `max-w-[900px]`. La maquette casse son `<h1>` en DEUX lignes
            explicites (« Ce qui tient debout » / « raconte encore ») ; le nôtre
            reçoit un titre unique venu du CMS, qu'un plafond de 900 px faisait
            retomber sur QUATRE lignes — 523 px au lieu de 261 px, mesurés. Le
            hero dépassait alors `100svh` et sa colonne de droite passait sous
            la ligne de flottaison. Sans plafond, la largeur disponible rend le
            titre sur deux lignes dès 1900 px, comme la maquette.
            `min-w-0` : `minmax(0,…)` borne la PISTE, pas l'élément — dont le
            `min-width: auto` par défaut le laisserait déborder quand même. */}
        <div className="min-w-0">
          {/* Emblème en petit, au-dessus de l'accroche : il annonce
              l'éléphant, qui ne s'anime qu'à la section suivante. Image plate
              en attendant le modèle 3D, qui prendra cette place à la même
              taille. Pas à droite : la carte « Film » remonte sur le bas du
              hero et l'y recouvrait. Décoratif, le nom de l'association est
              déjà dans l'en-tête. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            data-drop=""
            data-testid="hero-embleme"
            src="/embleme-fond.png"
            alt=""
            aria-hidden="true"
            width={880}
            height={898}
            className="mb-6 h-auto w-[clamp(52px,5vw,76px)]"
            style={{
              filter: 'drop-shadow(0 10px 24px oklch(0.1 0.018 252 / 0.55))',
              animation: 'drop 1s .05s both var(--courbe-plan)',
            }}
          />
          <p
            data-testid="accroche"
            data-drop=""
            className="mb-[22px] text-[11px] font-medium uppercase tracking-[0.3em]"
            style={{ color: 'var(--accent)', animation: 'drop 1s .2s both var(--courbe-plan)' }}
          >
            {accroche ?? t('accroche')}
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
            style={{ color: 'var(--onDeep)', animation: 'drop 1.1s .35s both var(--courbe-plan)' }}
          >
            {titre}
          </h1>
          <p
            data-drop=""
            className="mt-6 max-w-[560px] text-[17px] font-light leading-[1.75]"
            style={{
              color: 'color-mix(in oklab, var(--onDeep) 82%, transparent)',
              animation: 'drop 1.1s .7s both var(--courbe-plan)',
            }}
          >
            {intro}
          </p>
          <div
            data-drop=""
            className="mt-9 flex flex-wrap gap-3.5"
            style={{ animation: 'drop 1.1s .85s both var(--courbe-plan)' }}
          >
            <Link
              href="/archives"
              className="inline-flex items-center gap-3 rounded-full px-[30px] py-[17px] text-xs font-semibold uppercase tracking-[0.16em] transition"
              style={{ background: 'var(--accent)', color: 'var(--surAccent)' }}
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
        </div>

      </div>

      <a
        href="#embleme"
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
