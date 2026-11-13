import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { PageCarnet, type LieuCarnet } from '@/components/carnet/PageCarnet'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'carnet' })
  return {
    title: `${t('titre')} — PAACIV`,
    // Page propre à chaque visiteur, vide pour un robot : rien à indexer.
    robots: { index: false, follow: true },
  }
}

// Le carnet du visiteur (décision de Sey, 13/11/2026). La page serveur fournit
// la liste des fiches publiées ; le composant client la croise avec les
// tampons gardés dans le navigateur.
export default async function Carnet({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('carnet')
  const fiches = await listePatrimoine()

  const lieux: LieuCarnet[] = fiches.map((f) => {
    // La photo de couverture vient de la galerie du haut, comme partout.
    const galerie = (f.images ?? []).filter((i) => !i.groupe || i.groupe === 'galerie')
    const principale = galerie.find((i) => i.est_principale) ?? [...galerie].sort((a, b) => a.ordre - b.ordre)[0]
    return {
      slug: f.slug,
      titre: champ(f.titre_fr, f.titre_en, locale),
      ville: f.ville,
      image: principale ? imageUrl(principale.chemin, 960) : null,
    }
  })

  return (
    <main className="flex-1 sous-entete pb-16">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-ocre">{t('titre')}</h1>
          <p className="max-w-[60ch] text-doux">{t('intro')}</p>
        </header>
        <PageCarnet lieux={lieux} locale={locale} />
      </Container>
    </main>
  )
}
