'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { EditeurRiche } from '@/components/admin/EditeurRiche'
import { enregistrerArticle } from '@/app/[locale]/admin/articles/actions'
import { imageUrl } from '@/lib/media'

// Forme brute de la ligne `articles` telle que renvoyée par `select('*')`
// côté admin (contrairement à `ArticleDetail`, la projection publique).
export type ArticleAdmin = {
  id: string
  slug: string
  titre_fr: string
  titre_en: string | null
  chapo_fr: string | null
  chapo_en: string | null
  corps_fr: string | null
  corps_en: string | null
  image_couverture: string | null
  categorie_id: string | null
  patrimoine_id: string | null
  date_publication: string
  statut: 'brouillon' | 'publie'
}

type CategorieOption = { id: string; nom_fr: string; nom_en: string | null }
type PatrimoineOption = { id: string; titre_fr: string; titre_en: string | null }

export function FormulaireArticle({
  initial,
  categories,
  patrimoines,
  locale,
}: {
  initial?: Partial<ArticleAdmin> | null
  categories: CategorieOption[]
  patrimoines: PatrimoineOption[]
  locale: string
}) {
  const t = useTranslations('formArticle')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  // `null` = pas d'erreur ; sinon le message déjà traduit à afficher dans la
  // région d'alerte. `enregistrerArticle` distingue erreurs *attendues*
  // (retour `{ ok: false, erreur }`, mappé ici vers une clé i18n précise —
  // titre requis / slug déjà utilisé) et erreurs *inattendues* (`throw`,
  // catch générique ci-dessous) : voir le commentaire dans actions.ts pour
  // le raisonnement complet.
  const [erreur, setErreur] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    const fd = new FormData(e.currentTarget)
    try {
      const resultat = await enregistrerArticle(fd)
      if (!resultat.ok) {
        setErreur(t(resultat.erreur === 'titreRequis' ? 'erreurTitreRequis' : 'erreurSlugDuplique'))
        return
      }
      // Contrairement à FormulaireArchitecte / FormulairePatrimoine (qui
      // rouvrent la fiche éditée), le contrat e2e de cette liste attend un
      // retour sur le tableau après enregistrement.
      router.push('/admin/articles?enregistre=1')
      router.refresh()
    } catch {
      setErreur(t('erreurEnregistrement'))
    } finally {
      setEnCours(false)
    }
  }

  const valeurInitiale = (name: string) =>
    ((initial as Record<string, unknown> | undefined)?.[name] as string | undefined) ?? ''

  const champ = (name: string, label: string, type = 'text', ariaLabel?: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        aria-label={ariaLabel}
        defaultValue={valeurInitiale(name)}
        className="rounded-xl border border-filet bg-fond px-3 py-2"
      />
    </label>
  )

  const zoneTexte = (name: string, label: string) => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <textarea
        name={name}
        defaultValue={valeurInitiale(name)}
        rows={3}
        className="rounded-xl border border-filet bg-fond px-3 py-2"
      />
    </label>
  )

  const nomCategorie = (c: CategorieOption) => (locale === 'en' ? c.nom_en || c.nom_fr : c.nom_fr)
  const nomPatrimoine = (p: PatrimoineOption) => (locale === 'en' ? p.titre_en || p.titre_fr : p.titre_fr)

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      {/* Onglets FR / EN */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOnglet('fr')}
          className={onglet === 'fr' ? 'font-bold text-ocre' : 'text-doux'}
        >
          {t('ongletFr')}
        </button>
        <button
          type="button"
          onClick={() => setOnglet('en')}
          className={onglet === 'en' ? 'font-bold text-ocre' : 'text-doux'}
        >
          {t('ongletEn')}
        </button>
      </div>

      <div className={onglet === 'fr' ? 'grid gap-4' : 'hidden'}>
        {champ('titre_fr', t('titre_fr'))}
        {zoneTexte('chapo_fr', t('chapo_fr'))}
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('corps_fr')}</span>
          <EditeurRiche name="corps_fr" defaultValue={initial?.corps_fr ?? ''} ariaLabel={t('corps_fr')} />
        </div>
      </div>
      <div className={onglet === 'en' ? 'grid gap-4' : 'hidden'}>
        {champ('titre_en', t('titre_en'))}
        {zoneTexte('chapo_en', t('chapo_en'))}
        <div className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('corps_en')}</span>
          <EditeurRiche name="corps_en" defaultValue={initial?.corps_en ?? ''} ariaLabel={t('corps_en')} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {champ('slug', t('slug'))}
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('datePublication')}</span>
          <input
            name="date_publication"
            type="date"
            aria-label={t('datePublication')}
            defaultValue={valeurInitiale('date_publication')}
            className="rounded-xl border border-filet bg-fond px-3 py-2"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('categorie')}</span>
          <select
            name="categorie_id"
            defaultValue={initial?.categorie_id ?? ''}
            aria-label={t('categorie')}
            className="rounded-xl border border-filet bg-fond px-3 py-2"
          >
            <option value="">{t('choisir')}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {nomCategorie(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('patrimoine')}</span>
          <select
            name="patrimoine_id"
            defaultValue={initial?.patrimoine_id ?? ''}
            aria-label={t('patrimoine')}
            className="rounded-xl border border-filet bg-fond px-3 py-2"
          >
            <option value="">{t('choisir')}</option>
            {patrimoines.map((p) => (
              <option key={p.id} value={p.id}>
                {nomPatrimoine(p)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Image de couverture */}
      <div className="space-y-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('image')}</span>
          <input type="file" name="image" accept="image/*" aria-label={t('image')} className="text-sm" />
        </label>
        {initial?.image_couverture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl(initial.image_couverture)} alt="" className="h-24 w-24 rounded-xl object-cover" />
        )}
      </div>

      <label className="flex flex-col text-sm">
        <span className="mb-1 font-semibold">{t('statut')}</span>
        <select
          name="statut"
          defaultValue={initial?.statut ?? 'brouillon'}
          aria-label={t('statut')}
          className="w-48 rounded-xl border border-filet bg-fond px-3 py-2"
        >
          <option value="brouillon">{t('brouillon')}</option>
          <option value="publie">{t('publie')}</option>
        </select>
      </label>

      {erreur && (
        <p role="alert" className="text-sm font-semibold text-ocre">
          {erreur}
        </p>
      )}

      <Button type="submit" variant="gold" disabled={enCours}>
        {t('enregistrer')}
      </Button>
    </form>
  )
}
