import { notFound } from 'next/navigation'
import { FormulaireTemoignage, type TemoignageAdmin } from '@/components/admin/FormulaireTemoignage'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerTemoignage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const sb = await createServerClient()
  const { data: tm } = await sb.from('temoignages').select('*').eq('id', id).maybeSingle()
  if (!tm) notFound()

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{(tm as TemoignageAdmin).nom}</h1>
      <FormulaireTemoignage initial={tm as TemoignageAdmin} />
    </div>
  )
}
