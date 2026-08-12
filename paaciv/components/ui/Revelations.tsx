'use client'

import { useEffect } from 'react'
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

  useEffect(() => {
    const mouvement = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tous = Array.from(
      document.querySelectorAll<HTMLElement>('[data-rv],[data-clip],[data-line],[data-count]'),
    )

    // Éléments déjà révélés/comptés : évite que le filet de sécurité ne
    // relance l'animation d'un compteur déjà déclenché par l'observateur
    // (et inversement).
    const animes = new Set<HTMLElement>()
    // Minuteries des compteurs en cours : un compteur qui tourne encore au
    // démontage (double montage du mode strict, changement de route)
    // écrirait sinon dans un nœud détaché indéfiniment.
    const minuteries = new Set<number>()

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
      minuteries.forEach((timer) => window.clearInterval(timer))
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
