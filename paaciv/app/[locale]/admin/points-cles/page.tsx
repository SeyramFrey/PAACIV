import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerPointCle } from './actions'

export const dynamic = 'force-dynamic'

type LignePointCle = {
  id: string
  bloc: 'pourquoi' | 'raisons'
  titre_fr: string
  ordre: number
  statut: 'brouillon' | 'publie'
}

export default async function AdminPointsClesListe({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { bloc } = await searchParams
  const t = await getTranslations('adminPointsCles')
  const sb = await createServerClient()
  let requete = sb
    .from('points_cles')
    .select('id, bloc, titre_fr, ordre, statut')
    .order('bloc', { ascending: true })
    .order('ordre', { ascending: true })
  if (bloc === 'pourquoi' || bloc === 'raisons') requete = requete.eq('bloc', bloc)
  const { data } = await requete
  const items = (data ?? []) as LignePointCle[]

  const onglets: { valeur: 'pourquoi' | 'raisons' | undefined; label: string }[] = [
    { valeur: undefined, label: t('tous') },
    { valeur: 'pourquoi', label: t('pourquoi') },
    { valeur: 'raisons', label: t('raisons') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <Link href="/admin/points-cles/nouveau">
          <Button variant="gold">{t('nouveau')}</Button>
        </Link>
      </div>

      <div className="flex gap-4 text-sm">
        {onglets.map((o) => (
          <Link
            key={o.label}
            href={o.valeur ? `/admin/points-cles?bloc=${o.valeur}` : '/admin/points-cles'}
            className={(bloc ?? undefined) === o.valeur ? 'font-bold text-brun' : 'text-encre/60 underline'}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-encre/70">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('colonneTitre')}</th>
              <th className="py-2">{t('bloc')}</th>
              <th className="py-2">{t('ordre')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-creme2">
                <td className="py-2">{p.titre_fr}</td>
                <td className="py-2">{p.bloc === 'raisons' ? t('raisons') : t('pourquoi')}</td>
                <td className="py-2">{p.ordre}</td>
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
                  <Link href={`/admin/points-cles/${p.id}`} className="text-brun underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerPointCle.bind(null, p.id)}>
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
