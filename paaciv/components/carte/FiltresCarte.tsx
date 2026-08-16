'use client'

import { useTranslations } from 'next-intl'
import type { Ref } from '@/lib/data/patrimoine'
import type { ReferencesFiltres } from '@/lib/data/references'
import { ETATS_CONSERVATION } from '@/lib/etats-conservation'

type Valeurs = { type: string; programme: string; district: string; epoque: string; etat: string }

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
  const tEtat = useTranslations('etats')
  const nom = (r: Ref) => (locale === 'en' ? r.nom_en || r.nom_fr : r.nom_fr)

  const selects: [keyof Valeurs, Ref[]][] = [
    ['type', options.types],
    ['programme', options.programmes],
    ['district', options.districts],
    ['epoque', options.epoques],
  ]

  // Fond et texte pris aux MÊMES jetons de thème. Les champs portaient
  // `bg-white` en dur alors que leur couleur de texte était héritée du thème :
  // en mode sombre, `--ink` (presque blanc) sur blanc rendait la saisie et les
  // options illisibles. C'est le pendant, côté surface, du piège déjà consigné
  // « un `color` en style inline tue toute classe `hover:` ».
  const champStyle = { background: 'var(--bg)', color: 'var(--ink)', borderColor: 'var(--line)' }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('recherche')}</span>
        <input
          type="search"
          defaultValue=""
          onChange={(e) => onChange('q', e.target.value)}
          placeholder={t('recherche')}
          className="rounded-xl border px-3 py-2"
          style={champStyle}
        />
      </label>
      {selects.map(([cle, refs]) => (
        <label key={cle} className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t(cle)}</span>
          <select
            value={valeurs[cle]}
            onChange={(e) => onChange(cle, e.target.value)}
            className="rounded-xl border px-3 py-2"
            style={champStyle}
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
      {/* Hors de la boucle sur les `Ref[]` : l'état est un vocabulaire fermé,
          pas une table de référence — mêmes jetons de thème pour la surface et
          le texte, sans quoi les options redeviendraient illisibles en mode
          sombre (cf. le commentaire sur `champStyle` ci-dessus). */}
      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('etat')}</span>
        <select
          value={valeurs.etat}
          onChange={(e) => onChange('etat', e.target.value)}
          className="rounded-xl border px-3 py-2"
          style={champStyle}
        >
          <option value="">{t('tous')}</option>
          {ETATS_CONSERVATION.map((e) => (
            <option key={e} value={e}>
              {tEtat(e)}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
