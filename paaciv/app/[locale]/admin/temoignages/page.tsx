import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerTemoignage } from './actions'

export const dynamic = 'force-dynamic'

type LigneTemoignage = {
  id: string
  nom: string
  role_fr: string | null
  note: number
  ordre: number
  statut: 'brouillon' | 'publie'
}

export default async function AdminTemoignagesListe() {
  const t = await getTranslations('adminTemoignages')
  const sb = await createServerClient()
  const { data } = await sb
    .from('temoignages')
    .select('id, nom, role_fr, note, ordre, statut')
    .order('ordre', { ascending: true })
  const items = (data ?? []) as LigneTemoignage[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <Link href="/admin/temoignages/nouveau">
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
              <th className="py-2">{t('role')}</th>
              <th className="py-2">{t('note')}</th>
              <th className="py-2">{t('ordre')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((tm) => (
              <tr key={tm.id} className="border-t border-creme2">
                <td className="py-2">{tm.nom}</td>
                <td className="py-2">{tm.role_fr ?? '—'}</td>
                <td className="py-2">{tm.note}/5</td>
                <td className="py-2">{tm.ordre}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      tm.statut === 'publie' ? 'bg-vert text-sable' : 'bg-creme2 text-encre'
                    }`}
                  >
                    {tm.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/temoignages/${tm.id}`} className="text-brun underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerTemoignage.bind(null, tm.id)}>
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
