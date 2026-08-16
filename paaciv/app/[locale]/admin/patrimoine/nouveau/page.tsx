import { FormulairePatrimoine } from '@/components/admin/FormulairePatrimoine'
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

async function options() {
  const sb = await createServerClient()
  const [types, programmes, districts, epoques] = await Promise.all([
    sb.from('types').select('*').order('ordre'),
    sb.from('programmes').select('*').order('ordre'),
    sb.from('districts').select('*').order('ordre'),
    sb.from('epoques').select('*').order('ordre'),
  ])
  return {
    types: (types.data ?? []) as Ref[],
    programmes: (programmes.data ?? []) as Ref[],
    districts: (districts.data ?? []) as Ref[],
    epoques: (epoques.data ?? []) as Ref[],
  }
}

export default async function NouveauPatrimoine({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const sb = await createServerClient()
  const [opts, { data: architectes }] = await Promise.all([
    options(),
    sb.from('architectes').select('id, nom').order('nom'),
  ])
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">Nouveau patrimoine</h1>
      <FormulairePatrimoine options={opts} locale={locale} architectes={architectes ?? []} liaisons={[]} />
    </div>
  )
}
