'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { introDejaVue, marquerIntroVue } from '@/lib/intro'

// Couleur MESURÉE sur le fond du film encodé (H.264 la décale de #A9502A) :
// avec la valeur du jeton, les bandes de `object-contain` se verraient.
const FOND_FILM = '#A24D28'
// Deux films, joués d'eux-mêmes, jamais au scroll :
// l'intro se lance à l'arrivée et s'arrête sur un fond uni où se pose le
// bouton ; la galerie ne part qu'au clic sur « Commencer l'expérience ».
const SOURCE_INTRO = '/videos/paaciv-intro.mp4'
const SOURCE_GALERIE = '/videos/paaciv-galerie.mp4'

const sAbonner = () => () => {}

// Mêmes tests que ScriptIntro, refaits ici pour l'arrivée par navigation
// interne, où ce script n'a pas été rejoué. Le film ne joue qu'UNE FOIS PAR
// ONGLET (choix de Sey du 13/11/2026, lib/intro.ts) : « déjà vu » n'est pas
// lu ici, mais à l'effet de montage, pour qu'un film en cours ne disparaisse
// pas au rendu suivant le moment où il est marqué vu.
function sansFilm() {
  const racine = document.documentElement
  if (racine.getAttribute('data-intro') === 'sans' || racine.hasAttribute('data-leger')) return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

type Etape = 'intro' | 'attente' | 'galerie' | 'sortie'

export function IntroFilm() {
  const t = useTranslations('accueil')
  const intro = useRef<HTMLVideoElement>(null)
  const galerie = useRef<HTMLVideoElement>(null)
  // Le serveur rend toujours le film ; un visiteur sans film ne le voit pas
  // pour autant, globals.css le masque dès que ScriptIntro a posé l'état.
  const sans = useSyncExternalStore(sAbonner, sansFilm, () => false)
  const [etape, setEtape] = useState<Etape>('intro')
  const [monte, setMonte] = useState(true)

  // Fin du film, passé ou non : <html data-intro="fin"> rend le scroll et
  // lance les entrées du hero (globals.css) pendant que le film s'efface.
  function finir() {
    marquerIntroVue()
    setEtape('sortie')
  }

  // L'état "fin" n'est posé qu'APRÈS que `data-sortie` est dans le DOM :
  // globals.css masque un film resté monté sous "fin" sans `data-sortie`
  // (retour sur l'accueil), et le poser plus tôt couperait le fondu de sortie.
  useEffect(() => {
    if (etape === 'sortie') document.documentElement.setAttribute('data-intro', 'fin')
  }, [etape])

  function commencer() {
    marquerIntroVue()
    const g = galerie.current
    if (!g) return finir()
    setEtape('galerie')
    g.play()?.catch(finir)
  }

  useEffect(() => {
    const racine = document.documentElement
    // `sansFilm()` relu ici et pas seulement `sans` : à l'hydratation, `sans`
    // vaut encore l'instantané du serveur (false), et l'effet lancerait le
    // téléchargement des films avant le rendu qui les retire.
    // Déjà vu dans cet onglet : retour sur l'accueil par un lien, ou
    // actualisation. "sans" le masque (globals.css) et libère le hero.
    if (sans || sansFilm() || introDejaVue()) {
      racine.setAttribute('data-intro', 'sans')
      return
    }
    // Pas encore vu (lecture automatique refusée, puis départ avant le
    // bouton) : il repart de zéro, et les entrées du hero attendent sa fin.
    racine.removeAttribute('data-intro')
    const i = intro.current
    if (!i) return

    // Les sources ne sont posées qu'ici, jamais dans le HTML du serveur :
    // sinon le navigateur téléchargerait les films même pour les visiteurs
    // sans film.
    if (i.getAttribute('src') !== SOURCE_INTRO) i.src = SOURCE_INTRO
    let annule = false
    // Lecture automatique refusée (économie d'énergie d'iOS…) : on saute
    // l'intro et on montre tout de suite le bouton, dont le clic autorise
    // la lecture de la galerie. Une `AbortError` n'est pas un refus : c'est
    // une lecture interrompue par la suivante (double montage du mode strict).
    i.play()?.catch((e: unknown) => {
      if (annule || (e instanceof DOMException && e.name === 'AbortError')) return
      setEtape('attente')
    })
    return () => {
      annule = true
    }
  }, [sans])

  // La galerie pèse 2,9 Mo. Sa source n'est posée qu'à l'apparition du bouton
  // qui la lance, et seulement ses métadonnées sont lues alors (`preload`
  // plus bas) : mesuré le 12/11/2026, un `preload="auto"` la téléchargeait en
  // entier pour tout visiteur qui voyait le bouton, même sans cliquer. Le
  // fichier est « faststart » (atome `moov` en tête) : au clic, la lecture
  // démarre pendant le téléchargement.
  useEffect(() => {
    const g = galerie.current
    if (etape === 'attente' && g && g.getAttribute('src') !== SOURCE_GALERIE) g.src = SOURCE_GALERIE
  }, [etape])

  if (!monte || sans) return null

  const bouton = etape === 'attente'
  const surGalerie = etape === 'galerie' || etape === 'sortie'

  return (
    <div
      data-intro-film=""
      data-sortie={etape === 'sortie' ? '' : undefined}
      // z-40, SOUS l'en-tête (z-50) : le logo et le menu restent visibles et
      // cliquables pendant le film (choix de Sey, 13/11/2026).
      className="fixed inset-0 z-40"
      style={{ background: FOND_FILM, opacity: etape === 'sortie' ? 0 : 1, transition: 'opacity .9s ease' }}
      onTransitionEnd={(e) => {
        if (etape === 'sortie' && e.target === e.currentTarget) setMonte(false)
      }}
    >
      {/* `object-contain` : les films portent du texte jusqu'aux bords de
          leur zone titre ; rognés en `cover` sur un écran haut, ils en
          perdaient les extrémités. Les bandes restantes prennent la couleur
          du fond du film et ne se voient pas. */}
      <video
        ref={intro}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ opacity: surGalerie ? 0 : 1 }}
        // Vu dès que la lecture démarre vraiment : une actualisation en
        // plein film ne le relance pas.
        onPlaying={marquerIntroVue}
        onEnded={() => setEtape((e) => (e === 'intro' ? 'attente' : e))}
        onError={() => setEtape((e) => (e === 'intro' ? 'attente' : e))}
      />
      <video
        ref={galerie}
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-contain"
        style={{ opacity: surGalerie ? 1 : 0 }}
        onEnded={finir}
        onError={() => {
          if (etape === 'galerie') finir()
        }}
      />
      <button
        type="button"
        tabIndex={bouton ? 0 : -1}
        onClick={commencer}
        className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-4 whitespace-nowrap rounded-full px-[clamp(26px,3vw,44px)] py-[clamp(14px,1.6vw,22px)] font-serif text-[clamp(20px,2.4vw,34px)] leading-none"
        style={{
          background: '#F6F1E7',
          color: '#23262E',
          opacity: bouton ? 1 : 0,
          pointerEvents: bouton ? 'auto' : 'none',
          transition: 'opacity .5s ease',
        }}
      >
        <span>{t('commencerExperience')}</span>
        <span aria-hidden="true">→</span>
      </button>
      <button
        type="button"
        onClick={finir}
        className="absolute bottom-6 right-6 rounded-full border px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition"
        style={{ borderColor: 'color-mix(in oklab, #F6F1E7 55%, transparent)', color: '#F6F1E7' }}
      >
        {t('passerIntro')}
      </button>
    </div>
  )
}
