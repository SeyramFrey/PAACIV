import { getTranslations } from 'next-intl/server'
import { FormulaireActivite } from '@/components/admin/FormulaireActivite'

export default async function NouvelleActivite() {
  const t = await getTranslations('adminActivites')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{t('nouveau')}</h1>
      <FormulaireActivite />
    </div>
  )
}
