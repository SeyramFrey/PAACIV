import { notFound } from 'next/navigation'
import { FormulaireActivite, type ActiviteAdmin } from '@/components/admin/FormulaireActivite'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerActivite({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = await createServerClient()
  const { data: a } = await sb.from('activites').select('*').eq('id', id).maybeSingle()
  if (!a) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{(a as ActiviteAdmin).titre_fr}</h1>
      <FormulaireActivite initial={a as ActiviteAdmin} />
    </div>
  )
}
