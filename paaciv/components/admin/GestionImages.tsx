import { getTranslations } from 'next-intl/server'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'
import type { GroupeImage } from '@/lib/groupes-image'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { supprimerImage, definirPrincipale, modifierImage } from '@/app/[locale]/admin/patrimoine/actions'
import { FormulaireAjoutImages } from '@/components/admin/FormulaireAjoutImages'

// Photos d'une fiche, pour UN emplacement : la galerie du haut, ou l'un des
// deux onglets demandés par l'association (« Photographies et état actuel »,
// « Documentation »). La page d'édition rend ce bloc trois fois.
//
// Chaque vignette porte son propre petit formulaire : la légende, la date et la
// source se renseignent photo par photo (« 1959-1970. Ensemble de logements,
// Adjamé, district d'Abidjan »), là où l'envoi en lot pose les mêmes valeurs
// sur toute la sélection.
export async function GestionImages({
  patrimoineId,
  images,
  locale,
  groupe = 'galerie',
}: {
  patrimoineId: string
  images: ImageRow[]
  locale: string
  groupe?: GroupeImage
}) {
  const t = await getTranslations('adminImages')
  const triees = images
    .filter((i) => (i.groupe ?? 'galerie') === groupe)
    .sort((a, b) => a.ordre - b.ordre)
  const titre = t(`groupe_${groupe}`)

  const saisie = (name: string, label: string, valeur: string | null, repere: string) => (
    <label className="flex flex-col">
      <span className="text-[11px] font-semibold">{label}</span>
      <input
        name={name}
        defaultValue={valeur ?? ''}
        aria-label={`${label} — ${repere}`}
        className="rounded border border-filet bg-fond px-2 py-1"
      />
    </label>
  )

  return (
    <section className="space-y-4" data-testid={`images-${groupe}`}>
      <h2 className="font-serif text-2xl text-ocre">{titre}</h2>

      <FormulaireAjoutImages patrimoineId={patrimoineId} groupe={groupe} />

      {triees.length === 0 ? (
        <p className="text-doux">{t('aucune')}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {triees.map((img, rang) => {
            const repere = `${titre} ${rang + 1}`
            return (
              <li key={img.id} data-testid="vignette-image" className="space-y-2 rounded-xl bg-fond p-2 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(img.chemin, 480)}
                  alt={champ(img.legende_fr, img.legende_en, locale)}
                  className="aspect-[4/3] w-full rounded object-cover"
                />
                {img.est_principale && groupe === 'galerie' && (
                  <span className="text-xs font-semibold text-foret">{t('principale')}</span>
                )}
                <form action={modifierImage} className="grid gap-1.5 text-xs">
                  <input type="hidden" name="id" value={img.id} />
                  {saisie('legende_fr', t('legende'), img.legende_fr, repere)}
                  {saisie('legende_en', t('legendeEn'), img.legende_en, repere)}
                  <div className="grid grid-cols-2 gap-1.5">
                    {saisie('date_texte', t('date'), img.date_texte, repere)}
                    {saisie('credit', t('credit'), img.credit, repere)}
                  </div>
                  {saisie('source', t('source'), img.source, repere)}
                  <button
                    type="submit"
                    className="justify-self-start rounded-full bg-or px-3 py-1 font-semibold text-encre"
                  >
                    {t('enregistrer')}
                  </button>
                </form>
                <div className="flex justify-between text-xs">
                  {!img.est_principale && groupe === 'galerie' && (
                    <form action={definirPrincipale.bind(null, patrimoineId, img.id)}>
                      <button className="text-ocre underline" type="submit">
                        {t('definirPrincipale')}
                      </button>
                    </form>
                  )}
                  <form action={supprimerImage.bind(null, img.id)}>
                    <BoutonSupprimer message={t('confirmerSuppression')} className="text-danger underline">
                      {t('supprimer')}
                    </BoutonSupprimer>
                  </form>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
