import { notFound } from 'next/navigation'
import { FormulairePatrimoine } from '@/components/admin/FormulairePatrimoine'
import { GestionImages } from '@/components/admin/GestionImages'
import { createServerClient } from '@/lib/supabase/server'
import type { PatrimoineDetail, Ref } from '@/lib/data/patrimoine'

export default async function EditerPatrimoine({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const sb = await createServerClient()
  const [{ data: p }, types, programmes, districts, epoques, architectesRes, liaisonsRes] = await Promise.all([
    sb.from('patrimoine').select('*, images(*)').eq('id', id).maybeSingle(),
    sb.from('types').select('*').order('ordre'),
    sb.from('programmes').select('*').order('ordre'),
    sb.from('districts').select('*').order('ordre'),
    sb.from('epoques').select('*').order('ordre'),
    sb.from('architectes').select('id, nom').order('nom'),
    sb.from('patrimoine_architecte').select('architecte_id, role').eq('patrimoine_id', id),
  ])
  if (!p) notFound()

  const opts = {
    types: (types.data ?? []) as Ref[],
    programmes: (programmes.data ?? []) as Ref[],
    districts: (districts.data ?? []) as Ref[],
    epoques: (epoques.data ?? []) as Ref[],
  }

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl text-ocre">{(p as PatrimoineDetail).titre_fr}</h1>
      <FormulairePatrimoine
        options={opts}
        initial={p as PatrimoineDetail}
        locale={locale}
        architectes={architectesRes.data ?? []}
        liaisons={liaisonsRes.data ?? []}
      />
      <GestionImages patrimoineId={id} images={(p as PatrimoineDetail).images ?? []} locale={locale} />
    </div>
  )
}
