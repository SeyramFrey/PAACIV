'use client'

import { useTranslations } from 'next-intl'
import type { Ref } from '@/lib/data/patrimoine'
import type { ReferencesFiltres } from '@/lib/data/references'

type Valeurs = { type: string; programme: string; district: string; epoque: string }

export function FiltresCarte({
  options,
  valeurs,
  onChange,
  locale,
}: {
  options: ReferencesFiltres
  valeurs: Valeurs
  onChange: (cle: string, valeur: string) => void
  locale: string
}) {
  const t = useTranslations('carte')
  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  const selects: [keyof Valeurs, Ref[]][] = [
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
          defaultValue=""
          onChange={(e) => onChange('q', e.target.value)}
          placeholder={t('recherche')}
          className="rounded-xl border border-encre/20 bg-white px-3 py-2"
        />
      </label>
      {selects.map(([cle, refs]) => (
        <label key={cle} className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t(cle)}</span>
          <select
            value={valeurs[cle]}
            onChange={(e) => onChange(cle, e.target.value)}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
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
