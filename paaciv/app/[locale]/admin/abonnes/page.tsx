import { getTranslations } from 'next-intl/server'
import { createServerClient } from '@/lib/supabase/server'
import { BoutonExporterAbonnes } from '@/components/admin/BoutonExporterAbonnes'
import { FormSupprimerAction } from '@/components/admin/FormSupprimerAction'
import { supprimerAbonne } from './actions'

export const dynamic = 'force-dynamic'

type LigneAbonne = { id: string; email: string; langue: 'fr' | 'en'; created_at: string }

export default async function AdminAbonnes() {
  const t = await getTranslations('adminAbonnes')
  const sb = await createServerClient()
  const { data, error } = await sb
    .from('newsletter_abonnes')
    .select('id, email, langue, created_at')
    .order('created_at', { ascending: false })
  // Une lecture en échec ne doit jamais se confondre avec « aucun abonné » —
  // l'association conclurait à tort qu'elle n'a pas de donateur.
  if (error) console.error('newsletter_abonnes select', error)
  const items = (data ?? []) as LigneAbonne[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
        <BoutonExporterAbonnes />
      </div>
      <p className="text-sm text-encre/60">{t('total', { n: items.length })}</p>

      {error ? (
        <p role="alert" className="text-terracotta">
          {t('erreurChargement')}
        </p>
      ) : items.length === 0 ? (
        <p className="text-encre/70">{t('aucun')}</p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-encre/50">
            <tr>
              <th className="py-2">{t('email')}</th>
              <th className="py-2">{t('langue')}</th>
              <th className="py-2">{t('date')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-creme2">
                <td className="py-2">{a.email}</td>
                <td className="py-2">{a.langue.toUpperCase()}</td>
                <td className="py-2">{new Date(a.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="py-2">
                  {/* `.bind(null, a.id)`, voir le commentaire équivalent dans
                      `admin/demandes/page.tsx` : un closure inline
                      enveloppant l'action casse la frontière serveur/client
                      (constaté à l'exécution), `.bind()` sur la référence
                      directe la préserve. */}
                  <FormSupprimerAction
                    action={supprimerAbonne.bind(null, a.id)}
                    message={t('confirmer')}
                    erreurLabel={t('erreurAction')}
                    className="text-terracotta underline"
                  >
                    {t('supprimer')}
                  </FormSupprimerAction>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
