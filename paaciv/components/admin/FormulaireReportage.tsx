'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { EditeurRiche } from '@/components/admin/EditeurRiche'
import { enregistrerReportage } from '@/app/[locale]/admin/reportages/actions'
import { extraireIdYoutube, miniatureYoutube } from '@/lib/youtube'

// Forme brute de la ligne `reportages` telle que renvoyée par `select('*')`
// côté admin.
export type ReportageAdmin = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  video_url: string
  description_fr: string | null
  description_en: string | null
  patrimoine_id: string | null
  date: string
  statut: 'brouillon' | 'publie'
}

type PatrimoineOption = { id: string; titre_fr: string; titre_en: string | null }

export function FormulaireReportage({
  initial,
  patrimoines,
  locale,
}: {
  initial?: Partial<ReportageAdmin> | null
  patrimoines: PatrimoineOption[]
  locale: string
}) {
  const t = useTranslations('formReportage')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  // `null` = pas d'erreur ; sinon le message déjà traduit à afficher dans la
  // région d'alerte. `enregistrerReportage` distingue erreurs *attendues*
  // (retour `{ ok: false, erreur }`, mappé ici vers une clé i18n précise —
  // titre requis / slug déjà utilisé / URL invalide) et erreurs *inattendues*
  // (`throw`, catch générique ci-dessous) : voir le commentaire dans
  // actions.ts pour le raisonnement complet.
  const [erreur, setErreur] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState(initial?.video_url ?? '')

  // Aperçu client de la miniature : attrape les fautes de frappe dans
  // l'URL vidéo avant même l'enregistrement (cf. brief Task 12).
  const idVideo = useMemo(() => extraireIdYoutube(videoUrl), [videoUrl])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await enregistrerReportage(fd)
      if (!resultat.ok) {
        const cle =
          resultat.erreur === 'titreRequis'
            ? 'erreurTitreRequis'
            : resultat.erreur === 'slugDuplique'
              ? 'erreurSlugDuplique'
              : 'urlInvalide'
        setErreur(t(cle))
        return
      }
      // Même contrat que FormulaireArticle : retour sur la liste après
      // enregistrement (décision de contrôleur de la Task 12).
      router.push('/admin/reportages?enregistre=1')
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

  const nomPatrimoine = (p: PatrimoineOption) => (locale === 'en' ? p.titre_en || p.titre_fr : p.titre_fr)

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
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('date')}</span>
          <input
            name="date"
            type="date"
            aria-label={t('date')}
            defaultValue={valeurInitiale('date')}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          />
        </label>
      </div>

      {/* URL vidéo + aperçu de la miniature */}
      <div className="space-y-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('video_url')}</span>
          <input
            name="video_url"
            type="text"
            aria-label={t('video_url')}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="rounded-xl border border-encre/20 bg-white px-3 py-2"
          />
        </label>
        {videoUrl.trim() !== '' &&
          (idVideo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              data-testid="apercu-miniature"
              src={miniatureYoutube(idVideo)}
              alt=""
              className="h-24 w-40 rounded-xl object-cover"
            />
          ) : (
            <p data-testid="url-invalide" className="text-sm text-terracotta">
              {t('urlInvalide')}
            </p>
          ))}
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('patrimoine')}</span>
        <select
          name="patrimoine_id"
          defaultValue={initial?.patrimoine_id ?? ''}
          aria-label={t('patrimoine')}
          className="w-full max-w-md rounded-xl border border-encre/20 bg-white px-3 py-2"
        >
          <option value="">{t('choisir')}</option>
          {patrimoines.map((p) => (
            <option key={p.id} value={p.id}>
              {nomPatrimoine(p)}
            </option>
          ))}
        </select>
      </label>

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
