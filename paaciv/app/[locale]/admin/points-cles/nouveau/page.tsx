import { getTranslations } from 'next-intl/server'
import { FormulairePointCle } from '@/components/admin/FormulairePointCle'

export default async function NouveauPointCle() {
  const t = await getTranslations('adminPointsCles')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{t('nouveau')}</h1>
      <FormulairePointCle />
    </div>
  )
}
