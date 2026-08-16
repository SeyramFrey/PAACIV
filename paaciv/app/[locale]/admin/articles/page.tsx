import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { BoutonSupprimer } from '@/components/admin/BoutonSupprimer'
import { createServerClient } from '@/lib/supabase/server'
import { supprimerArticle } from './actions'

type LigneArticle = {
  id: string
  slug: string
  titre_fr: string
  date_publication: string
  statut: 'brouillon' | 'publie'
  categorie: { nom_fr: string; nom_en: string | null } | null
}

export default async function AdminArticlesListe() {
  const t = await getTranslations('adminArticles')
  const sb = await createServerClient()
  const { data } = await sb
    .from('articles')
    .select('id, slug, titre_fr, date_publication, statut, categorie:categories_article(nom_fr, nom_en)')
    .order('date_publication', { ascending: false })
  const items = (data ?? []) as unknown as LigneArticle[]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl text-ocre">{t('titre')}</h1>
        <Link href="/admin/articles/nouveau">
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
              <th className="py-2">{t('categorie')}</th>
              <th className="py-2">{t('date')}</th>
              <th className="py-2">{t('statut')}</th>
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-t border-filet">
                <td className="py-2">{a.titre_fr}</td>
                <td className="py-2">{a.categorie?.nom_fr ?? '—'}</td>
                <td className="py-2">{a.date_publication}</td>
                <td className="py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      a.statut === 'publie' ? 'bg-vert text-sable' : 'bg-fond2 text-encre-t'
                    }`}
                  >
                    {a.statut === 'publie' ? t('publie') : t('brouillon')}
                  </span>
                </td>
                <td className="flex justify-end gap-2 py-2">
                  <Link href={`/admin/articles/${a.id}`} className="text-ocre underline">
                    {t('editer')}
                  </Link>
                  <form action={supprimerArticle.bind(null, a.id)}>
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
