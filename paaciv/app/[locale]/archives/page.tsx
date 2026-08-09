import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { FiltresArchives } from '@/components/patrimoine/FiltresArchives'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { createServerClient } from '@/lib/supabase/server'
import type { Ref } from '@/lib/data/patrimoine'

async function chargerReferences() {
  const sb = await createServerClient()
  const [types, programmes, districts, epoques] = await Promise.all([
    sb.from('types').select('*').order('ordre'),
    sb.from('programmes').select('*').order('ordre'),
    sb.from('districts').select('*').order('ordre'),
    sb.from('epoques').select('*').order('ordre'),
  ])
  return {
    types: (types.data ?? []) as Ref[],
    programmes: (programmes.data ?? []) as Ref[],
    districts: (districts.data ?? []) as Ref[],
    epoques: (epoques.data ?? []) as Ref[],
  }
}

export default async function ArchivesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const f = await searchParams
  const t = await getTranslations('archives')

  const [items, options] = await Promise.all([
    listePatrimoine({
      type: f.type,
      programme: f.programme,
      district: f.district,
      epoque: f.epoque,
      q: f.q,
    }),
    chargerReferences(),
  ])

  return (
    <main className="flex-1 py-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-brun">{t('titre')}</h1>
          <p className="text-encre/70">{t('intro')}</p>
        </header>

        <FiltresArchives options={options} locale={locale} />

        <p className="text-sm text-encre/60">{t('resultats', { n: items.length })}</p>

        {items.length === 0 ? (
          <p className="text-encre/70">{t('aucun')}</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <CartePatrimoine key={item.id} item={item} locale={locale} />
            ))}
          </div>
        )}
      </Container>
    </main>
  )
}
