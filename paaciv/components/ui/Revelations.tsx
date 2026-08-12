'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from '@/i18n/navigation'
import { paliersCompteur } from '@/lib/compteur'

// Moteur d'animation unique pour toute la page. Monté une seule fois dans le
// layout : les blocs restent des Server Components et se contentent de poser
// des attributs `data-*`, sans jamais devenir clients pour s'animer.
export function Revelations() {
  // Un layout App Router n'est pas remonté à la navigation entre pages du
  // même segment de locale : sans cette dépendance, l'effet ne scannerait le
  // DOM qu'au tout premier montage et ne verrait jamais les blocs `data-rv`
  // d'une page atteinte plus tard par un <Link>, qui resteraient invisibles
  // (opacity: 0) indéfiniment. Rescanner ne casse rien : réajouter `.rv-in`
  // à un élément qui l'a déjà est sans effet.
  const pathname = usePathname()

  // Dans des `useRef`, et non des variables locales à l'effet : un élément
  // persistant du layout (en-tête, pied de page) n'est jamais remonté par
  // la navigation, mais l'effet ci-dessous se relance à chaque changement
  // de route et rescanne tout le DOM. Si `animes` était recréé à chaque
  // exécution, un compteur d'en-tête déjà terminé serait vu comme neuf et
  // relancerait son animation depuis 0 à chaque clic sur un lien interne,
  // alors qu'il n'a jamais quitté l'écran. Le ref survit aux
  // réexécutions ; seul un vrai démontage du composant en crée un nouveau.
  const animesRef = useRef<Set<HTMLElement>>(new Set())
  const minuteriesRef = useRef<Set<number>>(new Set())

  // Effet à part, aux dépendances vides : son retour ne s'exécute donc
  // qu'au vrai démontage du composant, jamais à un simple changement de
  // route. C'est le seul moment où il faut arrêter les compteurs encore en
  // vol — les arrêter à chaque changement de route interromprait le
  // compteur d'un élément persistant du layout à mi-course, et le garde
  // `animes` (jamais vidé, par design) l'empêcherait alors de jamais
  // reprendre.
  useEffect(() => {
    const minuteries = minuteriesRef.current
    return () => {
      minuteries.forEach((timer) => window.clearInterval(timer))
      minuteries.clear()
    }
  }, [])

  useEffect(() => {
    const mouvement = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tous = Array.from(
      document.querySelectorAll<HTMLElement>('[data-rv],[data-clip],[data-line],[data-count]'),
    )

    // Éléments déjà révélés/comptés : évite que le filet de sécurité ne
    // relance l'animation d'un compteur déjà déclenché par l'observateur
    // (et inversement), et — grâce au ref — qu'un changement de route ne
    // relance celle d'un élément persistant déjà animé.
    const animes = animesRef.current
    // Minuteries des compteurs en cours, partagées avec l'effet de
    // démontage ci-dessus.
    const minuteries = minuteriesRef.current

    function compter(el: HTMLElement) {
      if (animes.has(el)) return
      animes.add(el)
      const cible = Number(el.getAttribute('data-count') ?? '0')
      if (!mouvement) {
        el.textContent = String(cible)
        return
      }
      const paliers = paliersCompteur(cible, 40)
      let i = 0
      const timer = window.setInterval(() => {
        el.textContent = String(paliers[i])
        if (++i >= paliers.length) {
          window.clearInterval(timer)
          minuteries.delete(timer)
        }
      }, 26)
      minuteries.add(timer)
    }

    function activer(el: HTMLElement) {
      el.classList.add('rv-in')
      if (el.hasAttribute('data-count')) compter(el)
    }

    let observateur: IntersectionObserver | undefined
    let secours: number | undefined

    if (!mouvement) {
      tous.forEach(activer)
    } else {
      observateur = new IntersectionObserver(
        (entrees) => {
          entrees.forEach((e) => {
            if (!e.isIntersecting) return
            const el = e.target as HTMLElement
            const delai = Number(el.getAttribute('data-d') ?? '0')
            window.setTimeout(() => el.classList.add('rv-in'), delai)
            if (el.hasAttribute('data-count')) compter(el)
            observateur!.unobserve(el)
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
      tous.forEach((el) => observateur!.observe(el))

      // Filet de sécurité : si l'observateur n'a rien déclenché au bout de
      // 4 s (bloc jamais intersecté, page très courte, navigateur exotique),
      // on révèle et on compte tout ce qui ne l'a pas encore été — les
      // compteurs y compris, sinon un bloc jamais intersecté resterait figé
      // sur 0. Une page dont le contenu reste invisible est pire qu'une
      // page sans animation.
      secours = window.setTimeout(() => {
        tous.forEach(activer)
      }, 4000)
    }

    // Barre de progression + parallaxe, sur un seul écouteur de scroll
    // throttlé par requestAnimationFrame. Installé inconditionnellement,
    // y compris sous mouvement réduit : une barre de position de lecture
    // n'est pas une animation, seules les révélations le sont.
    const barre = document.querySelector<HTMLElement>('[data-prog]')
    const parallaxes = Array.from(document.querySelectorAll<HTMLElement>('[data-par]'))
    let enAttente = false

    function auScroll() {
      if (enAttente) return
      enAttente = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const h = document.body.scrollHeight - window.innerHeight
        if (barre) barre.style.width = `${Math.min(100, (y / Math.max(h, 1)) * 100)}%`
        parallaxes.forEach((el) => {
          const facteur = Number(el.getAttribute('data-par') ?? '0')
          const r = el.getBoundingClientRect()
          const centre = r.top + r.height / 2 - window.innerHeight / 2
          el.style.transform = `translate3d(0, ${(-centre * facteur).toFixed(1)}px, 0)`
        })
        enAttente = false
      })
    }

    window.addEventListener('scroll', auScroll, { passive: true })
    auScroll()

    return () => {
      observateur?.disconnect()
      if (secours !== undefined) window.clearTimeout(secours)
      window.removeEventListener('scroll', auScroll)
      // Les minuteries des compteurs ne sont volontairement pas annulées
      // ici : ce nettoyage se déclenche à chaque changement de route, et
      // un compteur d'élément persistant interrompu à mi-course ne
      // reprendrait jamais (le garde `animes` bloque toute reprise). Leur
      // annulation au vrai démontage est gérée par l'effet dédié ci-dessus.
    }
  }, [pathname])

  return (
    <div
      data-prog=""
      aria-hidden="true"
      className="fixed left-0 top-0 z-[70] h-0.5 w-0"
      style={{ background: 'linear-gradient(90deg, var(--terra), var(--accent))' }}
    />
  )
}
