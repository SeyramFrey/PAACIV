'use client'

import { useEffect, useState } from 'react'
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

  // Échap ferme, et le corps ne défile plus derrière le panneau : sans ce
  // verrou, le fond continue de scroller sous le doigt sur iOS.
  useEffect(() => {
    if (!ouvert) return
    function auClavier(e: KeyboardEvent) {
      if (e.key === 'Escape') setOuvert(false)
    }
    const precedent = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', auClavier)
    return () => {
      document.body.style.overflow = precedent
      document.removeEventListener('keydown', auClavier)
    }
  }, [ouvert])

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

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('menu')}
        hidden={!ouvert}
        className="fixed inset-0 z-[80] flex flex-col justify-between p-8"
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
      </div>
    </>
  )
}
