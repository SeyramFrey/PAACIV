import { notFound } from 'next/navigation'
import { FormulaireEvenement, type EvenementAdmin } from '@/components/admin/FormulaireEvenement'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerEvenement({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = await createServerClient()
  const { data: e } = await sb.from('evenements').select('*').eq('id', id).maybeSingle()
  if (!e) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{(e as EvenementAdmin).titre_fr}</h1>
      <FormulaireEvenement initial={e as EvenementAdmin} />
    </div>
  )
}
