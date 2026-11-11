import { getTranslations } from 'next-intl/server'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { supprimerImage, definirPrincipale } from '@/app/[locale]/admin/patrimoine/actions'
import { FormulaireAjoutImages } from '@/components/admin/FormulaireAjoutImages'

export async function GestionImages({
  patrimoineId,
  images,
  locale,
}: {
  patrimoineId: string
  images: ImageRow[]
  locale: string
}) {
  const t = await getTranslations('adminImages')
  const triees = [...images].sort((a, b) => a.ordre - b.ordre)

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-2xl text-ocre">{t('titre')}</h2>

      <FormulaireAjoutImages patrimoineId={patrimoineId} />

      {triees.length === 0 ? (
        <p className="text-doux">{t('aucune')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {triees.map((img) => (
            <li key={img.id} data-testid="vignette-image" className="space-y-2 rounded-xl bg-fond p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(img.chemin, 480)} alt={champ(img.legende_fr, img.legende_en, locale)} className="aspect-square w-full rounded object-cover" />
              {img.est_principale && <span className="text-xs font-semibold text-foret">{t('principale')}</span>}
              <div className="flex justify-between text-xs">
                {!img.est_principale && (
                  <form action={definirPrincipale.bind(null, patrimoineId, img.id)}>
                    <button className="text-ocre underline" type="submit">{t('definirPrincipale')}</button>
                  </form>
                )}
                <form action={supprimerImage.bind(null, img.id)}>
                  <BoutonSupprimer message={t('confirmerSuppression')} className="text-danger underline">
                    {t('supprimer')}
                  </BoutonSupprimer>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
