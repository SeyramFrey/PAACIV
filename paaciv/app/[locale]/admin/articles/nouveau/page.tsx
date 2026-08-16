import { getTranslations } from 'next-intl/server'
import { FormulaireArticle } from '@/components/admin/FormulaireArticle'
import { createServerClient } from '@/lib/supabase/server'

export default async function NouvelArticle({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('adminArticles')
  const sb = await createServerClient()
  const [{ data: categories }, { data: patrimoines }] = await Promise.all([
    sb.from('categories_article').select('id, nom_fr, nom_en').order('ordre'),
    sb.from('patrimoine').select('id, titre_fr, titre_en').order('titre_fr'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{t('nouveau')}</h1>
      <FormulaireArticle categories={categories ?? []} patrimoines={patrimoines ?? []} locale={locale} />
    </div>
  )
}
