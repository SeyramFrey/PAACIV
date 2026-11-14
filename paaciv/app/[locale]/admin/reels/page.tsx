import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { imageUrl } from '@/lib/media'
import { supprimerReel } from './actions'

export const dynamic = 'force-dynamic'

type LigneReel = {
  id: string
  affiche: string | null
  legende_fr: string | null
  lien: string
  ordre: number
  statut: 'brouillon' | 'publie'
}

export default async function AdminReelsListe() {
  const t = await getTranslations('adminReels')
  const sb = await createServerClient()
  const { data } = await sb
    .from('reels')
    .select('id, affiche, legende_fr, lien, ordre, statut')
    .order('ordre', { ascending: true })
    .order('date_publication', { ascending: false, nullsFirst: false })
  const items = (data ?? []) as LigneReel[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-ocre">{t('titre')}</h1>
        <Link href="/admin/reels/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>
      <p className="max-w-[70ch] text-sm text-doux">{t('intro')}</p>

      {items.length === 0 ? (
        <p className="text-doux">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-doux">
            <tr>
              <th className="py-2">{t('affiche')}</th>
              <th className="py-2">{t('legende')}</th>
              <th className="py-2">{t('ordre')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-filet">
                <td className="py-2">
                  {r.affiche ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imageUrl(r.affiche, 480)} alt="" className="aspect-[9/16] w-12 rounded-md object-cover" />
                  ) : (
                    <span className="text-doux">—</span>
                  )}
                </td>
                <td className="py-2">
                  {r.legende_fr ?? t('sansLegende')}
                  <a href={r.lien} target="_blank" rel="noreferrer" className="ml-2 text-xs text-doux underline">
                    {t('voirPost')}
                  </a>
                </td>
                <td className="py-2">{r.ordre}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.statut === 'publie' ? 'bg-vert text-sable' : 'bg-fond2 text-encre-t'
                    }`}
                  >
                    {r.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/reels/${r.id}`} className="text-ocre underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerReel.bind(null, r.id)}>
                    <BoutonSupprimer message={t('confirmer')} className="text-danger underline">
                      {t('supprimer')}
                    </BoutonSupprimer>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
