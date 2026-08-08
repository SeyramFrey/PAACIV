import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CarteClient } from '@/components/carte/CarteClient'
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

export default async function CartePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('carte')
  const sb = await createServerClient()
  const { data } = await sb.from('types').select('*').order('ordre')
  const types = (data ?? []) as Ref[]

  return (
    <main className="flex-1">
      <Container className="py-6">
        <h1 className="font-serif text-3xl text-brun">{t('titre')}</h1>
      </Container>
      <CarteClient types={types} locale={locale} />
    </main>
  )
}
