import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerPatrimoine } from './actions'

export default async function AdminPatrimoineListe() {
  const t = await getTranslations('adminPatrimoine')
  const sb = await createServerClient()
  const { data } = await sb
    .from('patrimoine')
    .select('id, slug, titre_fr, statut, updated_at')
    .order('updated_at', { ascending: false })
  const items = data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <Link href="/admin/patrimoine/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-encre/70">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('titre')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-creme2">
                <td className="py-2">{p.titre_fr}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      p.statut === 'publie' ? 'bg-vert text-sable' : 'bg-creme2 text-encre'
                    }`}
                  >
                    {p.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/patrimoine/${p.id}`} className="text-brun underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerPatrimoine.bind(null, p.id)}>
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
