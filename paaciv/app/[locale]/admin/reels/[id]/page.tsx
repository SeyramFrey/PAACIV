import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { FormulaireReel, type ReelAdmin } from '@/components/admin/FormulaireReel'
import { createServerClient } from '@/lib/supabase/server'

export default async function EditerReel({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('adminReels')
  const sb = await createServerClient()
  const { data } = await sb.from('reels').select('*').eq('id', id).maybeSingle()
  if (!data) notFound()
  const r = data as ReelAdmin

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{r.legende_fr ?? t('sansLegende')}</h1>
      <FormulaireReel initial={r} />
    </div>
  )
}
