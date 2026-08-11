import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { Galerie } from '@/components/patrimoine/Galerie'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { FacadeVideo } from '@/components/editorial/FacadeVideo'
import { getPatrimoineParSlugCache as getPatrimoineParSlug } from '@/lib/data/patrimoine'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const p = await getPatrimoineParSlug(slug)
  if (!p) return {}
  const titre = champ(p.titre_fr, p.titre_en, locale)
  const description = champ(p.resume_fr, p.resume_en, locale)
  const principale = p.images.find((i) => i.est_principale) ?? p.images[0]
  return {
    title: `${titre} — PAACIV`,
    description,
    openGraph: {
      title: titre,
      description,
      images: principale ? [imageUrl(principale.chemin)] : [],
      type: 'article',
    },
  }
}

export default async function FichePatrimoine({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('fiche')
  const tVideo = await getTranslations('video')
  const p = await getPatrimoineParSlug(slug)
  if (!p) notFound()

  const titre = champ(p.titre_fr, p.titre_en, locale)
  const ligne = (label: string, valeur: string | null | undefined) =>
    valeur ? (
      <div>
        <dt className="text-xs uppercase tracking-wide text-encre/50">{label}</dt>
        <dd className="text-encre">{valeur}</dd>
      </div>
    ) : null

  const datation =
    p.date_texte ||
    [p.annee_debut, p.annee_fin].filter(Boolean).join(' – ') ||
    null

  return (
    <main className="flex-1 py-10">
      <Container className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            {p.type && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-sable"
                style={{ backgroundColor: p.type.couleur ?? '#8A3E1B' }}
              >
                {champ(p.type.nom_fr, p.type.nom_en, locale)}
              </span>
            )}
          </div>
          <h1 className="font-serif text-4xl text-brun">{titre}</h1>
          <Galerie images={p.images} locale={locale} />
          <TexteRiche html={champ(p.description_fr, p.description_en, locale)} />
          <FacadeVideo url={p.video_url} titre={titre} labelLire={tVideo('lire')} />
          {champ(p.sources_fr, p.sources_en, locale) && (
            <section>
              <h2 className="font-serif text-lg text-brun">{t('sources')}</h2>
              <p className="whitespace-pre-line text-sm text-encre/70">
                {champ(p.sources_fr, p.sources_en, locale)}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <dl className="space-y-3">
            {ligne(t('programme'), p.programme && champ(p.programme.nom_fr, p.programme.nom_en, locale))}
            {ligne(t('datation'), datation)}
            {ligne(t('epoque'), p.epoque && champ(p.epoque.nom_fr, p.epoque.nom_en, locale))}
            {ligne(t('style'), champ(p.style_fr, p.style_en, locale) || null)}
            {ligne(t('statutPatrimonial'), p.statut_patrimonial)}
            {ligne(t('etat'), p.etat_conservation)}
            {ligne(
              t('localisation'),
              [champ(p.adresse_fr, p.adresse_en, locale), p.ville].filter(Boolean).join(', ') || null,
            )}
          </dl>
          {p.lat != null && p.lng != null && (
            <MiniCarte lat={p.lat} lng={p.lng} titre={titre} />
          )}
          {p.architectes.length > 0 && (
            <section>
              <h2 className="mb-2 font-serif text-lg text-brun">{t('architectes')}</h2>
              <ul className="space-y-1 text-sm">
                {p.architectes.map((a) => (
                  <li key={a.slug}>
                    <Link href={`/architectes/${a.slug}`} className="text-brun underline">
                      {a.nom}
                    </Link>
                    {a.role ? <span className="text-encre/60"> ({a.role})</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </Container>
    </main>
  )
}
