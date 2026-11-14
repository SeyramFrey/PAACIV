import { getTranslations } from 'next-intl/server'
import { FormulaireReel } from '@/components/admin/FormulaireReel'

export default async function NouveauReel() {
  const t = await getTranslations('adminReels')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ocre">{t('nouveau')}</h1>
      <FormulaireReel />
    </div>
  )
}
