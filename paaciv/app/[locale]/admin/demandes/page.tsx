import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { createServerClient } from '@/lib/supabase/server'
import { marquerDemandeTraitee } from './actions'

export const dynamic = 'force-dynamic'

type LigneDemande = {
  id: string
  type: 'adhesion' | 'don' | 'archive'
  nom: string
  email: string
  telephone: string | null
  montant: number | null
  message: string | null
  statut: 'nouvelle' | 'traitee'
  created_at: string
}

const TYPES = ['adhesion', 'don', 'archive'] as const

export default async function AdminDemandes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { type } = await searchParams
  const t = await getTranslations('adminDemandes')
  const sb = await createServerClient()
  const filtreType = (TYPES as readonly string[]).includes(type ?? '') ? (type as (typeof TYPES)[number]) : undefined

  let requete = sb
    .from('demandes')
    .select('id, type, nom, email, telephone, montant, message, statut, created_at')
    .order('created_at', { ascending: false })
  if (filtreType) requete = requete.eq('type', filtreType)
  const { data } = await requete
  const items = (data ?? []) as LigneDemande[]

  const onglets: { valeur: (typeof TYPES)[number] | undefined; label: string }[] = [
    { valeur: undefined, label: t('tous') },
    { valeur: 'adhesion', label: t('adhesion') },
    { valeur: 'don', label: t('don') },
    { valeur: 'archive', label: t('archive') },
  ]

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>

      <div className="flex gap-4 text-sm">
        {onglets.map((o) => (
          <Link
            key={o.label}
            href={o.valeur ? `/admin/demandes?type=${o.valeur}` : '/admin/demandes'}
            className={filtreType === o.valeur ? 'font-bold text-brun' : 'text-encre/60 underline'}
          >
            {o.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="text-encre/70">{t('aucune')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('type')}</th>
              <th className="py-2">{t('nom')}</th>
              <th className="py-2">{t('email')}</th>
              <th className="py-2">{t('telephone')}</th>
              <th className="py-2">{t('montant')}</th>
              <th className="py-2">{t('message')}</th>
              <th className="py-2">{t('date')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t border-creme2 align-top">
                <td className="py-2">{t(d.type)}</td>
                <td className="py-2">{d.nom}</td>
                <td className="py-2">{d.email}</td>
                <td className="py-2">{d.telephone ?? '—'}</td>
                <td className="py-2">{d.montant ?? '—'}</td>
                <td className="max-w-xs whitespace-pre-line py-2">{d.message ?? '—'}</td>
                <td className="py-2">{new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      d.statut === 'traitee' ? 'bg-vert text-sable' : 'bg-creme2 text-encre'
                    }`}
                  >
                    {d.statut === 'traitee' ? t('traitee') : t('nouvelle')}
                  </span>
                </td>
                <td className="py-2">
                  {d.statut === 'nouvelle' && (
                    <form action={marquerDemandeTraitee.bind(null, d.id)}>
                      <button type="submit" className="text-brun underline">
                        {t('marquerTraitee')}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
