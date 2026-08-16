'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { EditeurRiche } from '@/components/admin/EditeurRiche'
import { enregistrerEvenement } from '@/app/[locale]/admin/evenements/actions'
import { imageUrl } from '@/lib/media'

// Forme brute de la ligne `evenements` telle que renvoyée par `select('*')`
// côté admin.
export type EvenementAdmin = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  description_fr: string | null
  description_en: string | null
  image: string | null
  lieu: string | null
  date_debut: string
  date_fin: string | null
  statut: 'brouillon' | 'publie'
}

export function FormulaireEvenement({ initial }: { initial?: Partial<EvenementAdmin> | null }) {
  const t = useTranslations('formEvenement')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  // `null` = pas d'erreur ; sinon le message déjà traduit à afficher dans la
  // région d'alerte. `enregistrerEvenement` distingue erreurs *attendues*
  // (retour `{ ok: false, erreur }`, mappé ici vers une clé i18n précise —
  // « date de début requise » / « dates incohérentes ») et erreurs
  // *inattendues* (`throw`, catch générique ci-dessous) : voir le commentaire
  // dans actions.ts pour le raisonnement complet.
  const [erreur, setErreur] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await enregistrerEvenement(fd)
      if (!resultat.ok) {
        setErreur(t(resultat.erreur === 'dateDebutRequise' ? 'erreurDateDebutRequise' : 'erreurDatesIncoherentes'))
        return
      }
      // Même contrat que FormulaireArticle / FormulaireReportage : retour sur
      // la liste après enregistrement (décision de contrôleur, cohérence de
      // l'admin éditorial).
      router.push('/admin/evenements?enregistre=1')
      router.refresh()
    } catch {
      setErreur(t('erreurEnregistrement'))
    } finally {
      setEnCours(false)
    }
  }

  const valeurInitiale = (name: string) =>
    ((initial as Record<string, unknown> | undefined)?.[name] as string | undefined) ?? ''

  const champ = (name: string, label: string, type = 'text') => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        aria-label={label}
        defaultValue={valeurInitiale(name)}
        className="rounded-xl border border-encre/20 bg-white px-3 py-2"
      />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      {/* Onglets FR / EN */}
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
        {champ('titre_fr', t('titre_fr'))}
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('description_fr')}</span>
          <EditeurRiche name="description_fr" defaultValue={initial?.description_fr ?? ''} ariaLabel={t('description_fr')} />
        </div>
      </div>
      <div className={onglet === 'en' ? 'grid gap-4' : 'hidden'}>
        {champ('titre_en', t('titre_en'))}
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('description_en')}</span>
          <EditeurRiche name="description_en" defaultValue={initial?.description_en ?? ''} ariaLabel={t('description_en')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {champ('slug', t('slug'))}
        {champ('lieu', t('lieu'))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('dateDebut')}</span>
          <input
            name="date_debut"
            type="date"
            aria-label={t('dateDebut')}
            defaultValue={valeurInitiale('date_debut')}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('dateFin')}</span>
          <input
            name="date_fin"
            type="date"
            aria-label={t('dateFin')}
            defaultValue={valeurInitiale('date_fin')}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          />
        </label>
      </div>

      {/* Image */}
      <div className="space-y-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('image')}</span>
          <input type="file" name="image" accept="image/*" aria-label={t('image')} className="text-sm" />
        </label>
        {initial?.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(initial.image)} alt="" className="h-24 w-24 rounded-xl object-cover" />
        )}
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('statut')}</span>
        <select
          name="statut"
          defaultValue={initial?.statut ?? 'brouillon'}
          aria-label={t('statut')}
          className="w-48 rounded-xl border border-encre/20 bg-white px-3 py-2"
        >
          <option value="brouillon">{t('brouillon')}</option>
          <option value="publie">{t('publie')}</option>
        </select>
      </label>

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
