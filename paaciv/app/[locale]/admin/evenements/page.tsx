import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerEvenement } from './actions'

type LigneEvenement = {
  id: string
  slug: string
  titre_fr: string
  lieu: string | null
  date_debut: string
  statut: 'brouillon' | 'publie'
}

export default async function AdminEvenementsListe() {
  const t = await getTranslations('adminEvenements')
  const sb = await createServerClient()
  const { data } = await sb
    .from('evenements')
    .select('id, slug, titre_fr, lieu, date_debut, statut')
    .order('date_debut', { ascending: false })
  const items = (data ?? []) as LigneEvenement[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-ocre">{t('titre')}</h1>
        <Link href="/admin/evenements/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="text-doux">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-doux">
            <tr>
              <th className="py-2">{t('colonneTitre')}</th>
              <th className="py-2">{t('lieu')}</th>
              <th className="py-2">{t('date')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((e) => (
              <tr key={e.id} className="border-t border-filet">
                <td className="py-2">{e.titre_fr}</td>
                <td className="py-2">{e.lieu ?? '—'}</td>
                <td className="py-2">{e.date_debut}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      e.statut === 'publie' ? 'bg-vert text-sable' : 'bg-fond2 text-encre-t'
                    }`}
                  >
                    {e.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/evenements/${e.id}`} className="text-ocre underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerEvenement.bind(null, e.id)}>
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
