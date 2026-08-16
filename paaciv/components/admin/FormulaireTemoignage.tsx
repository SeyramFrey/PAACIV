'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { enregistrerTemoignage } from '@/app/[locale]/admin/temoignages/actions'

export type TemoignageAdmin = {
  id: string
  nom: string
  role_fr: string | null
  role_en: string | null
  citation_fr: string
  citation_en: string | null
  note: number
  ordre: number
  statut: 'brouillon' | 'publie'
}

export function FormulaireTemoignage({ initial }: { initial?: Partial<TemoignageAdmin> | null }) {
  const t = useTranslations('adminTemoignages')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await enregistrerTemoignage(fd)
      if (!resultat.ok) {
        const cles = {
          nomRequis: 'erreurNomRequis',
          citationRequise: 'erreurCitationRequise',
          echec: 'erreurEnregistrement',
        } as const
        setErreur(t(cles[resultat.erreur]))
        return
      }
      router.push('/admin/temoignages?enregistre=1')
      router.refresh()
    } catch {
      setErreur(t('erreurEnregistrement'))
    } finally {
      setEnCours(false)
    }
  }

  const valeurInitiale = (name: string) =>
    ((initial as Record<string, unknown> | undefined)?.[name] as string | undefined) ?? ''

  const champ = (name: string, label: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        aria-label={label}
        defaultValue={valeurInitiale(name)}
        className="rounded-xl border border-encre/20 bg-white px-3 py-2"
      />
    </label>
  )

  const zoneTexte = (name: string, label: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <textarea
        name={name}
        aria-label={label}
        rows={3}
        defaultValue={valeurInitiale(name)}
        className="rounded-xl border border-encre/20 bg-white px-3 py-2"
      />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      {champ('nom', t('nom'))}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet('fr')}
          className={onglet === 'fr' ? 'font-bold text-brun' : 'text-encre/60'}
        >
          {t('ongletFr')}
        </button>
        <button
          type="button"
          onClick={() => setOnglet('en')}
          className={onglet === 'en' ? 'font-bold text-brun' : 'text-encre/60'}
        >
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4' : 'hidden'}>
        {champ('role_fr', `${t('role')} (FR)`)}
        {zoneTexte('citation_fr', `${t('citation')} (FR)`)}
      </div>
      <div className={onglet === 'en' ? 'grid gap-4' : 'hidden'}>
        {champ('role_en', `${t('role')} (EN)`)}
        {zoneTexte('citation_en', `${t('citation')} (EN)`)}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('note')}</span>
          <input
            name="note"
            type="number"
            min={1}
            max={5}
            aria-label={t('note')}
            defaultValue={initial?.note ?? 5}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('ordre')}</span>
          <input
            name="ordre"
            type="number"
            aria-label={t('ordre')}
            defaultValue={initial?.ordre ?? 0}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('statut')}</span>
          <select
            name="statut"
            defaultValue={initial?.statut ?? 'brouillon'}
            aria-label={t('statut')}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          >
            <option value="brouillon">{t('brouillon')}</option>
            <option value="publie">{t('publie')}</option>
          </select>
        </label>
      </div>

      {erreur && (
        <p role="alert" className="text-sm font-semibold text-brun">
          {erreur}
        </p>
      )}

      <Button type="submit" variant="gold" disabled={enCours}>
        {t('enregistrer')}
      </Button>
    </form>
  )
}
