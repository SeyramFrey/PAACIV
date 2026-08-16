import { notFound } from 'next/navigation'
import { FormulaireArchitecte, type ArchitecteAdmin } from '@/components/admin/FormulaireArchitecte'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerArchitecte({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const sb = await createServerClient()
  const { data: a } = await sb.from('architectes').select('*').eq('id', id).maybeSingle()
  if (!a) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{(a as ArchitecteAdmin).nom}</h1>
      <FormulaireArchitecte initial={a as ArchitecteAdmin} />
    </div>
  )
}
