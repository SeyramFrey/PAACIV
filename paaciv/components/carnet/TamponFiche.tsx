'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { commencerCarnet, tamponner } from '@/lib/carnet'
import { useCarnet, useCarnetCommence } from '@/components/carnet/useCarnet'

// Sous le titre de chaque fiche bâtiment publiée.
//
// Carnet pas encore commencé : une invitation discrète. Rien n'est écrit dans
// le navigateur avant ce clic (décision du 14/11/2026, voir lib/carnet.ts).
// Carnet commencé : la fiche pose son tampon toute seule, et une marque
// « Dans votre carnet » le confirme.
export function TamponFiche({ slug }: { slug: string }) {
  const t = useTranslations('carnet')
  const commence = useCarnetCommence()
  const dedans = useCarnet().some((c) => c.slug === slug)

  useEffect(() => {
    if (commence) tamponner(slug)
  }, [slug, commence])

  // Rendu serveur et hydratation : on ne sait pas encore, on ne montre rien.
  if (commence === null) return null

  if (!commence) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 print:hidden" data-testid="carnet-invitation">
        <button
          type="button"
          onClick={() => commencerCarnet(slug)}
          className="rounded-full border px-3.5 py-1.5 text-sm transition hover:bg-[var(--accent)] hover:text-[var(--surAccent)]"
          style={{ borderColor: 'color-mix(in oklab, currentColor 35%, transparent)' }}
        >
          {t('commencer')}
        </button>
        <p className="m-0 max-w-[52ch] text-xs text-doux">{t('commencerAide')}</p>
      </div>
    )
  }

  return (
    <p role="status" className="m-0 text-xs uppercase tracking-[0.12em] text-doux" data-testid="carnet-marque">
      {dedans && (
        <>
          <span aria-hidden="true">✓ </span>
          {t('dansCarnet')}
        </>
      )}
    </p>
  )
}
