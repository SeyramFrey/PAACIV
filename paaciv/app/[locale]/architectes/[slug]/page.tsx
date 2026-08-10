import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { CarteRealisation } from '@/components/architectes/CarteRealisation'
import { getArchitecteParSlugCache as getArchitecte } from '@/lib/data/architectes'
import { champ } from '@/lib/i18n-champ'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const a = await getArchitecte(slug)
  if (!a) return {}
  const description = champ(a.bio_fr, a.bio_en, locale).replace(/<[^>]+>/g, '').slice(0, 160)
  return {
    title: `${a.nom} — PAACIV`,
    description,
    openGraph: {
      title: a.nom,
      description,
      images: a.photo ? [a.photo] : [],
      type: 'profile',
    },
  }
}

export default async function FicheArchitecte({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('ficheArchitecte')
  const a = await getArchitecte(slug)
  if (!a) notFound()

  const dates = a.annee_naissance
    ? `${a.annee_naissance}${a.annee_deces ? ` – ${a.annee_deces}` : ''}`
    : a.periode_texte

  const bio = champ(a.bio_fr, a.bio_en, locale)
  const parcours = champ(a.parcours_fr, a.parcours_en, locale)
  const realisationsTexte = champ(a.realisations_texte_fr, a.realisations_texte_en, locale)

  return (
    <main className="flex-1 py-10">
      <Container className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
        <aside className="space-y-4">
          {a.photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={a.photo} alt={a.nom} className="w-full rounded-2xl object-cover" />
          )}
          <h1 className="font-serif text-3xl text-brun">{a.nom}</h1>
          {dates && <p className="text-encre/60">{dates}</p>}
        </aside>

        <div className="space-y-8">
          {bio && (
            <section>
              <h2 className="mb-2 font-serif text-xl text-brun">{t('bio')}</h2>
              <TexteRiche html={bio} />
            </section>
          )}
          {parcours && (
            <section>
              <h2 className="mb-2 font-serif text-xl text-brun">{t('parcours')}</h2>
              <TexteRiche html={parcours} />
            </section>
          )}

          {(a.realisations.length > 0 || realisationsTexte) && (
            <section>
              <h2 className="mb-3 font-serif text-xl text-brun">{t('realisations')}</h2>
              {a.realisations.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {a.realisations.map((r) => (
                    <CarteRealisation key={r.slug} realisation={r} locale={locale} />
                  ))}
                </div>
              ) : (
                <TexteRiche html={realisationsTexte} />
              )}
            </section>
          )}
        </div>
      </Container>
    </main>
  )
}
