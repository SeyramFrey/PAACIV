'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { BasculeTheme } from '@/components/ui/BasculeTheme'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

export type Entree = { href: string; cle: string }

export function MenuMobile({ entrees }: { entrees: readonly Entree[] }) {
  const t = useTranslations('nav')
  const { ouvrir } = useSoutien()
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDialogElement>(null)

  // `<dialog>` natif plutôt qu'un div sur-mesure (même choix que
  // `components/ui/Modal.tsx`) : le navigateur déplace le focus dedans à
  // l'ouverture, le piège tant qu'il est ouvert, le restitue au bouton
  // déclencheur à la fermeture, et rend le reste de la page inerte — quatre
  // garanties qu'un `<div role="dialog">` fait seulement semblant d'offrir
  // sans JavaScript dédié pour chacune.
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  // Le corps ne défile plus derrière le panneau : sans ce verrou, le fond
  // continue de scroller sous le doigt sur iOS malgré l'inertie du <dialog>.
  useEffect(() => {
    if (!ouvert) return
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = precedent
    }
  }, [ouvert])

  // Le déclencheur disparaît dès `lg` (`lg:hidden` ci-dessous) : si le
  // panneau reste ouvert pendant qu'on franchit ce seuil (rotation, fenêtre
  // redimensionnée), plus aucun contrôle visible ne permet de le refermer.
  // On le ferme réellement (close() natif : focus restitué, page réactivée)
  // dès que la largeur atteint le point de rupture `lg` de Tailwind (1024px).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    function fermerSiDesktop() {
      if (mq.matches) setOuvert(false)
    }
    mq.addEventListener('change', fermerSiDesktop)
    return () => mq.removeEventListener('change', fermerSiDesktop)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label={t('ouvrirMenu')}
        aria-expanded={ouvert}
        className="flex flex-col gap-1.5 p-2 lg:hidden"
      >
        <span aria-hidden="true" className="block h-px w-6 bg-current" />
        <span aria-hidden="true" className="block h-px w-6 bg-current" />
      </button>

      <dialog
        ref={ref}
        aria-label={t('menu')}
        onCancel={(e) => {
          // Échap : on laisse React piloter l'état plutôt que le DOM, sinon
          // `ouvert` resterait à true et le panneau ne pourrait plus se
          // rouvrir (même logique que Modal.tsx).
          e.preventDefault()
          setOuvert(false)
        }}
        onClick={(e) => {
          // Le fond du <dialog> occupe tout le viewport : un clic dont la
          // cible est le dialog lui-même (pas un enfant) tombe hors contenu.
          if (e.target === ref.current) setOuvert(false)
        }}
        // `hidden open:flex` plutôt qu'un simple `flex` : un `<dialog>` fermé
        // n'est masqué que par le style par défaut du navigateur
        // (`dialog:not([open]) { display: none }`), une règle d'origine
        // « agent utilisateur ». Poser `flex` (règle d'origine « auteur »,
        // via Tailwind) directement sur l'élément la fait gagner dans la
        // cascade malgré sa spécificité plus faible — l'origine prime sur la
        // spécificité — et le panneau restait alors affiché (et cliquable)
        // même fermé, recouvrant le reste de la page. `open:flex` rend le
        // bascule explicite et gérée entièrement par des règles d'auteur.
        className="hidden fixed inset-0 z-[80] m-0 h-dvh max-h-none w-dvw max-w-none flex-col justify-between border-0 p-8 open:flex"
        style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setOuvert(false)}
            aria-label={t('fermerMenu')}
            className="p-2 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <nav aria-label={t('principale')}>
          <ul className="space-y-4">
            {entrees.map((e, i) => (
              <li
                key={e.cle}
                style={{
                  animation: ouvert ? `drop .5s cubic-bezier(.16,1,.3,1) ${i * 60}ms both` : undefined,
                }}
              >
                <Link
                  href={e.href}
                  onClick={() => setOuvert(false)}
                  className="text-4xl transition hover:opacity-70"
                  style={{ fontFamily: 'var(--font-fraunces), serif' }}
                >
                  {t(e.cle)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => {
              setOuvert(false)
              ouvrir('adhesion')
            }}
            className="rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: 'var(--accent)', color: 'oklch(0.15 0.012 45)' }}
          >
            {t('adherer')}
          </button>
          <div className="flex items-center gap-4">
            <BasculeTheme className="p-2" />
            <LanguageSwitcher />
          </div>
        </div>
      </dialog>
    </>
  )
}
