import { getTranslations } from 'next-intl/server'
import { FormulaireArchitecte } from '@/components/admin/FormulaireArchitecte'

export default async function NouvelArchitecte({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations('adminArchitectes')
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{t('nouveau')}</h1>
      <FormulaireArchitecte locale={locale} />
    </div>
  )
}
