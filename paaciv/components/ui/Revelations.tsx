'use client'

import { useEffect } from 'react'
import { paliersCompteur } from '@/lib/compteur'

// Moteur d'animation unique pour toute la page. Monté une seule fois dans le
// layout : les blocs restent des Server Components et se contentent de poser
// des attributs `data-*`, sans jamais devenir clients pour s'animer.
export function Revelations() {
  useEffect(() => {
    const mouvement = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tous = Array.from(
      document.querySelectorAll<HTMLElement>('[data-rv],[data-clip],[data-line],[data-count]'),
    )

    function compter(el: HTMLElement) {
      const cible = Number(el.getAttribute('data-count') ?? '0')
      if (!mouvement) {
        el.textContent = String(cible)
        return
      }
      const paliers = paliersCompteur(cible, 40)
      let i = 0
      const timer = window.setInterval(() => {
        el.textContent = String(paliers[i])
        if (++i >= paliers.length) window.clearInterval(timer)
      }, 26)
    }

    if (!mouvement) {
      tous.forEach((el) => {
        el.classList.add('rv-in')
        if (el.hasAttribute('data-count')) compter(el)
      })
      return
    }

    const io = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          if (!e.isIntersecting) return
          const el = e.target as HTMLElement
          const delai = Number(el.getAttribute('data-d') ?? '0')
          window.setTimeout(() => el.classList.add('rv-in'), delai)
          if (el.hasAttribute('data-count')) compter(el)
          io.unobserve(el)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    tous.forEach((el) => io.observe(el))

    // Filet de sécurité : si l'observateur n'a rien déclenché au bout de 4 s
    // (bloc jamais intersecté, page très courte, navigateur exotique), on
    // révèle tout. Une page dont le contenu reste invisible est pire qu'une
    // page sans animation.
    const secours = window.setTimeout(() => {
      tous.forEach((el) => el.classList.add('rv-in'))
    }, 4000)

    // Barre de progression + parallaxe, sur un seul écouteur de scroll
    // throttlé par requestAnimationFrame.
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
      io.disconnect()
      window.clearTimeout(secours)
      window.removeEventListener('scroll', auScroll)
    }
  }, [])

  return (
    <div
      data-prog=""
      aria-hidden="true"
      className="fixed left-0 top-0 z-[70] h-0.5 w-0"
      style={{ background: 'linear-gradient(90deg, var(--terra), var(--accent))' }}
    />
  )
}
