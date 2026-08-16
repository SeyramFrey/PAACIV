import { getTranslations } from 'next-intl/server'
import { FormulaireTemoignage } from '@/components/admin/FormulaireTemoignage'

export default async function NouveauTemoignage() {
  const t = await getTranslations('adminTemoignages')

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-brun">{t('nouveau')}</h1>
      <FormulaireTemoignage />
    </div>
  )
}
