import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { Galerie } from '@/components/patrimoine/Galerie'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { FacadeVideo } from '@/components/editorial/FacadeVideo'
import { getPatrimoineParSlugCache as getPatrimoineParSlug, contenusLies } from '@/lib/data/patrimoine'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import { estEtatConservation } from '@/lib/etats-conservation'

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
  const tEtats = await getTranslations('etats')
  const p = await getPatrimoineParSlug(slug)
  if (!p) notFound()
  const { articles, reportages } = await contenusLies(p.id)

  const titre = champ(p.titre_fr, p.titre_en, locale)
  const ligne = (label: string, valeur: string | null | undefined) =>
    valeur ? (
      <div>
        <dt className="text-xs uppercase tracking-wide text-doux">{label}</dt>
        <dd className="text-encre-t">{valeur}</dd>
      </div>
    ) : null

  const datation =
    p.date_texte ||
    [p.annee_debut, p.annee_fin].filter(Boolean).join(' – ') ||
    null

  // La colonne stocke un slug (`en_danger`), le libellé bilingue vit en i18n.
  // Une valeur hors vocabulaire — ligne écrite avant la contrainte 0023 —
  // n'affiche rien plutôt que d'exposer le slug brut au visiteur, et `ligne()`
  // fait alors disparaître la définition entière.
  const etatLisible = estEtatConservation(p.etat_conservation)
    ? tEtats(p.etat_conservation)
    : null

  return (
    <main className="flex-1 pt-20 py-10">
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
          <h1 className="font-serif text-4xl text-ocre">{titre}</h1>
          <Galerie images={p.images} locale={locale} />
          <TexteRiche html={champ(p.description_fr, p.description_en, locale)} />
          <FacadeVideo url={p.video_url} titre={titre} labelLire={tVideo('lire')} />
          {champ(p.sources_fr, p.sources_en, locale) && (
            <section>
              <h2 className="font-serif text-lg text-ocre">{t('sources')}</h2>
              <p className="whitespace-pre-line text-sm text-doux">
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
            {ligne(t('etat'), etatLisible)}
            {ligne(
              t('localisation'),
              [champ(p.adresse_fr, p.adresse_en, locale), p.ville].filter(Boolean).join(', ') || null,
            )}
          </dl>
          {p.lat != null && p.lng != null && (
            <MiniCarte lat={p.lat} lng={p.lng} titre={titre} />
          )}
          {p.architectes.length > 0 && (
            <section data-testid="architectes-fiche">
              <h2 className="mb-2 font-serif text-lg text-ocre">{t('architectes')}</h2>
              <ul className="space-y-1 text-sm">
                {p.architectes.map((a) => (
                  <li key={a.slug}>
                    <Link
                      href={`/architectes/${a.slug}`}
                      className={`text-ocre underline${a.principal ? ' font-semibold' : ''}`}
                    >
                      {a.nom}
                    </Link>
                    {/* L'architecte principal est marqué explicitement, et il
                        est déjà remonté en tête par `mapLiaisonsArchitectes` :
                        le rang seul ne se lit pas, deux noms l'un sous l'autre
                        n'annoncent pas lequel a conçu l'édifice. */}
                    {a.principal ? (
                      <span className="ml-1 rounded-full border border-current px-2 py-0.5 text-[10px] uppercase tracking-wide text-ocre">
                        {t('architectePrincipal')}
                      </span>
                    ) : null}
                    {a.role ? <span className="text-doux"> ({a.role})</span> : null}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(articles.length > 0 || reportages.length > 0) && (
            <section data-testid="contenus-lies" className="space-y-4">
              {articles.length > 0 && (
                <div>
                  <h2 className="mb-2 font-serif text-lg text-ocre">{t('aLire')}</h2>
                  <ul className="space-y-1 text-sm">
                    {articles.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/articles/${a.slug}`} className="text-ocre underline">
                          {champ(a.titre_fr, a.titre_en, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reportages.length > 0 && (
                <div>
                  <h2 className="mb-2 font-serif text-lg text-ocre">{t('aVoir')}</h2>
                  <ul className="space-y-1 text-sm">
                    {reportages.map((r) => (
                      <li key={r.slug}>
                        <Link href={`/reportages/${r.slug}`} className="text-ocre underline">
                          {champ(r.titre_fr, r.titre_en, locale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}
        </aside>
      </Container>
    </main>
  )
}
