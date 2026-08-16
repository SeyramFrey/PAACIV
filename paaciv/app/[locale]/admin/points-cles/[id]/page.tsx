import { notFound } from 'next/navigation'
import { FormulairePointCle, type PointCleAdmin } from '@/components/admin/FormulairePointCle'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerPointCle({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = await createServerClient()
  const { data: p } = await sb.from('points_cles').select('*').eq('id', id).maybeSingle()
  if (!p) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{(p as PointCleAdmin).titre_fr}</h1>
      <FormulairePointCle initial={p as PointCleAdmin} />
    </div>
  )
}
