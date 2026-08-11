import { getTranslations } from 'next-intl/server'
import { FormulaireEvenement } from '@/components/admin/FormulaireEvenement'

export default async function NouvelEvenement() {
  const t = await getTranslations('adminEvenements')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{t('nouveau')}</h1>
      <FormulaireEvenement />
    </div>
  )
}
