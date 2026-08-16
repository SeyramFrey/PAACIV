import { getTranslations } from 'next-intl/server'
import { FormulaireReportage } from '@/components/admin/FormulaireReportage'
import { createServerClient } from '@/lib/supabase/server'

export default async function NouveauReportage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('adminReportages')
  const sb = await createServerClient()
  const { data: patrimoines } = await sb.from('patrimoine').select('id, titre_fr, titre_en').order('titre_fr')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{t('nouveau')}</h1>
      <FormulaireReportage patrimoines={patrimoines ?? []} locale={locale} />
    </div>
  )
}
