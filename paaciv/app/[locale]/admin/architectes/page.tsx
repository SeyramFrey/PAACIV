import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerArchitecte } from './actions'

export default async function AdminArchitectesListe() {
  const t = await getTranslations('adminArchitectes')
  const tForm = await getTranslations('formArchitecte')
  const sb = await createServerClient()
  const { data } = await sb
    .from('architectes')
    .select('id, slug, nom, origine, statut')
    .order('ordre')
    .order('nom')
  const items = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <Link href="/admin/architectes/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-encre/70">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('nom')}</th>
              <th className="py-2">{t('origine')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-creme2">
                <td className="py-2">{a.nom}</td>
                <td className="py-2">{a.origine === 'ivoirien' ? tForm('ivoirien') : tForm('etranger')}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      a.statut === 'publie' ? 'bg-vert text-sable' : 'bg-creme2 text-encre'
                    }`}
                  >
                    {a.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/architectes/${a.id}`} className="text-brun underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerArchitecte.bind(null, a.id)}>
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
