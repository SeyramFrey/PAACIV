import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerReportage } from './actions'

type LigneReportage = {
  id: string
  slug: string
  titre_fr: string
  date: string
  statut: 'brouillon' | 'publie'
}

export default async function AdminReportagesListe() {
  const t = await getTranslations('adminReportages')
  const sb = await createServerClient()
  const { data } = await sb
    .from('reportages')
    .select('id, slug, titre_fr, date, statut')
    .order('date', { ascending: false })
  const items = (data ?? []) as unknown as LigneReportage[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <Link href="/admin/reportages/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-encre/70">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('colonneTitre')}</th>
              <th className="py-2">{t('date')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-creme2">
                <td className="py-2">{r.titre_fr}</td>
                <td className="py-2">{r.date}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      r.statut === 'publie' ? 'bg-vert text-sable' : 'bg-creme2 text-encre'
                    }`}
                  >
                    {r.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/reportages/${r.id}`} className="text-brun underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerReportage.bind(null, r.id)}>
                    <BoutonSupprimer message={t('confirmer')} className="text-terracotta underline">
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
