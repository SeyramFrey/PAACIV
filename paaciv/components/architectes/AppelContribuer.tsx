'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'

// Section `#contribuer` de la maquette. Composant client pour une seule
// raison : le bouton principal ouvre la modale de soutien existante
// (`ouvrir('archive')`), plutôt que de pointer vers une ancre `#contact` qui
// n'existe pas sur ce site. La maquette proposait un lien ; on branche le
// mécanisme réel, qui écrit dans `demandes` — c'est le même geste pour le
// visiteur, et il aboutit.
export function AppelContribuer() {
  const t = useTranslations('ficheArchitecte')
  const { ouvrir } = useSoutien()

  return (
    <section
      className="relative overflow-hidden px-[clamp(20px,4vw,54px)] py-[clamp(60px,8vw,120px)]"
      style={{ background: 'var(--deep)', color: 'var(--onDeep)' }}
    >
      <div
        aria-hidden="true"
        data-par="0.06"
        className="pointer-events-none absolute left-1/2 top-[-30%] h-[70vw] w-[70vw] -translate-x-1/2"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--accent) 12%, transparent), transparent 60%)',
        }}
      />
      <div className="relative mx-auto max-w-[900px] text-center">
        <p
          data-rv=""
          className="m-0 mb-[18px] text-[11px] font-medium uppercase leading-none tracking-[0.3em]"
          style={{ color: 'var(--accent)' }}
        >
          {t('contribuerSurtitre')}
        </p>
        <h2
          data-rv=""
          data-d="70"
          className="m-0 text-balance font-serif text-[clamp(30px,4.2vw,64px)] leading-[1.04]"
        >
          {t('contribuerTitre')}
        </h2>
        <p
          data-rv=""
          data-d="130"
          className="mx-auto mt-[22px] max-w-[560px] text-base font-light leading-[1.8]"
          style={{ color: 'color-mix(in oklab, var(--onDeep) 75%, transparent)' }}
        >
          {t('contribuerTexte')}
        </p>
        <div
          data-rv=""
          data-d="190"
          className="mt-[38px] flex flex-wrap justify-center gap-3.5"
        >
          {/* Fond et texte en CLASSES, pas en `style` : un `background` inline
              gagnerait toujours sur `:hover`. Piège déjà consigné dans
              AppelArchives.tsx et CinqRaisons.tsx. */}
          <button
            type="button"
            onClick={() => ouvrir('archive')}
            className="relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-accent px-[30px] py-[17px] text-xs font-semibold uppercase tracking-[0.16em] text-surAccent transition hover:brightness-110"
          >
            <span>{t('contribuerCta')}</span>
            <span aria-hidden="true" className="text-[15px]">
              →
            </span>
            {/* Le reflet balayant de la maquette. Décoratif et purement
                animé : `prefers-reduced-motion` le fige via la règle
                `[data-floaty]`-like ? Non — `sweep` n'est pas listé là-bas, on
                le neutralise donc explicitement par `motion-reduce:hidden`. */}
            <span
              aria-hidden="true"
              className="absolute left-0 top-0 h-full w-2/5 motion-reduce:hidden"
              style={{
                background:
                  'linear-gradient(90deg, transparent, color-mix(in oklab, var(--onDeep) 55%, transparent), transparent)',
                animation: 'sweep 3.4s 1.6s infinite',
              }}
            />
          </button>
          <Link
            href="/archives"
            className="inline-flex items-center gap-3 rounded-full border px-[30px] py-[17px] text-xs font-semibold uppercase tracking-[0.16em] transition hover:bg-[color-mix(in_oklab,var(--onDeep)_12%,transparent)]"
            style={{
              borderColor: 'color-mix(in oklab, var(--onDeep) 45%, transparent)',
              color: 'var(--onDeep)',
            }}
          >
            {t('retourArchive')}
          </Link>
        </div>
      </div>
    </section>
  )
}
