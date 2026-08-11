import { notFound } from 'next/navigation'
import { FormulaireArticle, type ArticleAdmin } from '@/components/admin/FormulaireArticle'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerArticle({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const sb = await createServerClient()
  const [{ data: a }, { data: categories }, { data: patrimoines }] = await Promise.all([
    sb.from('articles').select('*').eq('id', id).maybeSingle(),
    sb.from('categories_article').select('id, nom_fr, nom_en').order('ordre'),
    sb.from('patrimoine').select('id, titre_fr, titre_en').order('titre_fr'),
  ])
  if (!a) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{(a as ArticleAdmin).titre_fr}</h1>
      <FormulaireArticle
        initial={a as ArticleAdmin}
        categories={categories ?? []}
        patrimoines={patrimoines ?? []}
        locale={locale}
      />
    </div>
  )
}
