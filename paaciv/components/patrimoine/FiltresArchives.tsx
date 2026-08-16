'use client'

import { useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'
import type { Ref } from '@/lib/data/patrimoine'

type Options = { types: Ref[]; programmes: Ref[]; districts: Ref[]; epoques: Ref[] }

export function FiltresArchives({ options, locale }: { options: Options; locale: string }) {
  const t = useTranslations('archives')
  const router = useRouter()
  const pathname = usePathname()
  const sp = useSearchParams()

  function maj(cle: string, valeur: string) {
    const params = new URLSearchParams(sp.toString())
    if (valeur) params.set(cle, valeur)
    else params.delete(cle)
    router.push(`${pathname}?${params.toString()}`)
  }

  const majDebounce = useDebouncedCallback(maj, 300)

  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  const selects: [string, Ref[]][] = [
    ['type', options.types],
    ['programme', options.programmes],
    ['district', options.districts],
    ['epoque', options.epoques],
  ]

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('recherche')}</span>
        <input
          type="search"
          defaultValue={sp.get('q') ?? ''}
          onChange={(e) => majDebounce('q', e.target.value)}
          placeholder={t('recherche')}
          className="rounded-xl border border-filet bg-fond text-encre-t px-3 py-2"
        />
      </label>
      {selects.map(([cle, refs]) => (
        <label key={cle} className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t(cle)}</span>
          <select
            value={sp.get(cle) ?? ''}
            onChange={(e) => maj(cle, e.target.value)}
            className="rounded-xl border border-filet bg-fond text-encre-t px-3 py-2"
          >
            <option value="">{t('tous')}</option>
            {refs.map((r) => (
              <option key={r.id} value={r.id}>
                {nom(r)}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  )
}
