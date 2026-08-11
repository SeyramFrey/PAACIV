import { notFound } from 'next/navigation'
import { FormulaireReportage, type ReportageAdmin } from '@/components/admin/FormulaireReportage'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerReportage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const sb = await createServerClient()
  const [{ data: r }, { data: patrimoines }] = await Promise.all([
    sb.from('reportages').select('*').eq('id', id).maybeSingle(),
    sb.from('patrimoine').select('id, titre_fr, titre_en').order('titre_fr'),
  ])
  if (!r) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{(r as ReportageAdmin).titre_fr}</h1>
      <FormulaireReportage initial={r as ReportageAdmin} patrimoines={patrimoines ?? []} locale={locale} />
    </div>
  )
}
