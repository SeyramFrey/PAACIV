import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteClient } from '@/components/carte/CarteClient'
import { chargerReferences } from '@/lib/data/references'

export default async function CartePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('carte')
  const options = await chargerReferences()

  return (
    <main className="flex-1 pt-20">
      <Container className="py-6">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
      </Container>
      <CarteClient options={options} locale={locale} />
    </main>
  )
}
