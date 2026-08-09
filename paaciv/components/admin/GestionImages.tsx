import { getTranslations } from 'next-intl/server'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { ajouterImage, supprimerImage, definirPrincipale } from '@/app/[locale]/admin/patrimoine/actions'

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
      <h2 className="font-serif text-2xl text-brun">{t('titre')}</h2>

      <form action={ajouterImage} className="flex flex-wrap items-end gap-3 rounded-2xl bg-creme2/50 p-4">
        <input type="hidden" name="patrimoine_id" value={patrimoineId} />
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('ajouter')}</span>
          <input name="fichiers" aria-label={t('ajouter')} type="file" accept="image/*" multiple />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('legende')}</span>
          <input name="legende_fr" className="rounded border border-encre/20 px-2 py-1" />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('credit')}</span>
          <input name="credit" className="rounded border border-encre/20 px-2 py-1" />
        </label>
        <button type="submit" className="rounded-full bg-or px-4 py-2 text-sm font-semibold text-encre">
          {t('ajouter')}
        </button>
      </form>

      {triees.length === 0 ? (
        <p className="text-encre/70">{t('aucune')}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {triees.map((img) => (
            <li key={img.id} data-testid="vignette-image" className="space-y-2 rounded-xl bg-white p-2 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(img.chemin)} alt={champ(img.legende_fr, img.legende_en, locale)} className="aspect-square w-full rounded object-cover" />
              {img.est_principale && <span className="text-xs font-semibold text-vert">{t('principale')}</span>}
              <div className="flex justify-between text-xs">
                {!img.est_principale && (
                  <form action={definirPrincipale.bind(null, patrimoineId, img.id)}>
                    <button className="text-brun underline" type="submit">{t('definirPrincipale')}</button>
                  </form>
                )}
                <form action={supprimerImage.bind(null, img.id)}>
                  <BoutonSupprimer message={t('confirmerSuppression')} className="text-terracotta underline">
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
