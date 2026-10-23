'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'

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
// interne, où ce script n'a pas été rejoué. Le film rejoue à CHAQUE arrivée
// sur l'accueil, même déjà vu : c'est « Passer l'intro » qui permet de
// l'éviter (choix de Sey). Seuls le mouvement réduit et une connexion faible
// le suppriment. "fin" (film fini ou passé lors d'une visite précédente de
// l'accueil) ne compte donc pas.
function sansFilm() {
  if (document.documentElement.getAttribute('data-intro') === 'sans') return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true
  const connexion = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection
  return Boolean(connexion && (connexion.saveData || /2g|3g/.test(connexion.effectiveType ?? '')))
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
    document.documentElement.setAttribute('data-intro', 'fin')
    setEtape('sortie')
  }

  function commencer() {
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
    if (sans || sansFilm()) {
      racine.setAttribute('data-intro', 'sans')
      return
    }
    // Retour sur l'accueil après un film fini ou passé : il repart de zéro,
    // et les entrées du hero attendent de nouveau sa fin.
    racine.removeAttribute('data-intro')
    const i = intro.current
    const g = galerie.current
    if (!i || !g) return

    // Les sources ne sont posées qu'ici, jamais dans le HTML du serveur :
    // sinon le navigateur téléchargerait les films même pour les visiteurs
    // sans film. La galerie se charge pendant l'intro, pour partir sans
    // attente au clic.
    if (i.getAttribute('src') !== SOURCE_INTRO) i.src = SOURCE_INTRO
    if (g.getAttribute('src') !== SOURCE_GALERIE) g.src = SOURCE_GALERIE
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

  if (!monte || sans) return null

  const bouton = etape === 'attente'
  const surGalerie = etape === 'galerie' || etape === 'sortie'

  return (
    <div
      data-intro-film=""
      data-sortie={etape === 'sortie' ? '' : undefined}
      className="fixed inset-0 z-[60]"
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
        onEnded={() => setEtape((e) => (e === 'intro' ? 'attente' : e))}
        onError={() => setEtape((e) => (e === 'intro' ? 'attente' : e))}
      />
      <video
        ref={galerie}
        muted
        playsInline
        preload="auto"
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
