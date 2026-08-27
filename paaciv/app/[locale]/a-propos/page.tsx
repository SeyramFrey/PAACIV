import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { Logo } from '@/components/ui/Logo'
import { Compteurs } from '@/components/accueil/Compteurs'
import { chargerTextes, texte, libelleOuNull } from '@/lib/data/contenu-site'
import { chiffresCles, listePointsCles, listeActivites, statistiquesTerritoire } from '@/lib/data/accueil'
import { champ } from '@/lib/i18n-champ'

// Lit Supabase sans segment dynamique : sans ce drapeau, Next prérendrait la
// page au build et aucune correction de texte n'y apparaîtrait jamais.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const textes = await chargerTextes()
  const t = await getTranslations({ locale, namespace: 'nav' })
  const description =
    libelleOuNull(textes, 'apropos_texte', locale) ?? texte(textes, 'association_texte', locale)
  return {
    title: `${t('apropos')} — PAACIV`,
    // Tronquée à ~160 caractères : au-delà, les moteurs coupent eux-mêmes, et
    // souvent au milieu d'un mot.
    description: description.slice(0, 157) + (description.length > 157 ? '…' : ''),
  }
}

export default async function APropos({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('accueil')
  const tNav = await getTranslations('nav')

  const [textes, chiffres, pourquoi, activites, stats] = await Promise.all([
    chargerTextes(),
    chiffresCles(),
    listePointsCles('pourquoi'),
    listeActivites(),
    statistiquesTerritoire(),
  ])

  const tx = (cle: string) => texte(textes, cle, locale)
  const lib = (cle: string) => libelleOuNull(textes, cle, locale)

  // Remplacement facultatif : tant que l'association n'a pas écrit sa
  // présentation longue, la page reprend le titre et le texte qu'elle a déjà
  // rédigés pour la page d'accueil. Jamais de page vide, jamais de texte
  // inventé.
  const titre = lib('apropos_titre') ?? tx('association_titre')
  const intro = lib('apropos_texte') ?? tx('association_texte')

  return (
    <main className="flex-1 sous-entete-ras">
      <section className="px-[clamp(20px,5vw,80px)] py-[clamp(48px,7vw,96px)]">
        <div className="mx-auto max-w-[820px] text-center">
          <Logo hauteur={104} className="mb-10 justify-center" />
          <p className="text-[10px] uppercase tracking-[0.28em] text-ocre">{tNav('apropos')}</p>
          <h1 className="mt-4 text-balance font-serif text-[clamp(32px,4.6vw,62px)] leading-[1.05] text-encre-t">
            {titre}
          </h1>
          <p className="mx-auto mt-7 max-w-[680px] whitespace-pre-line text-[17px] font-light leading-[1.85] text-doux">
            {intro}
          </p>
        </div>

        <div className="mx-auto mt-[clamp(44px,6vw,80px)] max-w-[900px]">
          <Compteurs
            chiffres={chiffres}
            libelles={{
              fiches: lib('association_chiffre_fiches'),
              villes: lib('association_chiffre_villes'),
              architectes: lib('association_chiffre_architectes'),
              articles: lib('association_chiffre_articles'),
            }}
          />
        </div>
      </section>

      {/* Notre travail — mêmes clés que le bloc de la page d'accueil, sans les
          photographies : ici le propos est la méthode, pas l'illustration. */}
      <section className="px-[clamp(20px,5vw,80px)] py-[clamp(40px,6vw,80px)]" style={{ background: 'var(--bg2)' }}>
        <Container className="max-w-[900px]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-ocre">{tx('travail_surtitre')}</p>
          <h2 className="mt-3 text-balance font-serif text-[clamp(26px,3.4vw,44px)] leading-tight text-encre-t">
            {tx('travail_titre')}
          </h2>
          <p className="mt-5 max-w-[680px] text-[16px] font-light leading-[1.85] text-doux">
            {tx('travail_texte')}
          </p>
          <div className="mt-9 grid gap-5 sm:grid-cols-2">
            {[
              { titre: tx('travail_releve_titre'), texte: tx('travail_releve_texte') },
              { titre: tx('travail_recit_titre'), texte: tx('travail_recit_texte') },
            ]
              // Un volet dont le titre n'est pas renseigné disparaît plutôt que
              // de laisser une carte vide dans la grille.
              .filter((v) => v.titre.length > 0)
              .map((v) => (
                <div key={v.titre} className="rounded-[6px] border border-filet p-6">
                  <h3 className="font-serif text-xl text-ocre">{v.titre}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-doux">{v.texte}</p>
                </div>
              ))}
          </div>
        </Container>
      </section>

      {pourquoi.length > 0 && (
        <section className="px-[clamp(20px,5vw,80px)] py-[clamp(40px,6vw,80px)]">
          <Container className="max-w-[900px]">
            <h2 className="text-balance font-serif text-[clamp(26px,3.4vw,44px)] leading-tight text-encre-t">
              {tx('pourquoi_titre')}
            </h2>
            <ol className="mt-8 grid gap-6 sm:grid-cols-2">
              {pourquoi.map((p, i) => (
                <li key={p.id}>
                  <p className="text-[11px] font-medium tracking-[0.2em] text-ocre">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1.5 font-serif text-lg text-encre-t">
                    {champ(p.titre_fr, p.titre_en, locale)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-doux">
                    {champ(p.texte_fr, p.texte_en, locale)}
                  </p>
                </li>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {activites.length > 0 && (
        <section className="px-[clamp(20px,5vw,80px)] py-[clamp(40px,6vw,80px)]" style={{ background: 'var(--bg2)' }}>
          <Container className="max-w-[900px]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-ocre">{tx('activites_surtitre')}</p>
            <h2 className="mt-3 text-balance font-serif text-[clamp(26px,3.4vw,44px)] leading-tight text-encre-t">
              {tx('activites_titre')}
            </h2>
            <ul className="mt-8 divide-y divide-filet border-y border-filet">
              {activites.map((a) => (
                <li key={a.id} className="grid gap-1 py-5 sm:grid-cols-[220px_1fr] sm:gap-6">
                  <div>
                    <h3 className="font-serif text-lg text-encre-t">{champ(a.titre_fr, a.titre_en, locale)}</h3>
                    {champ(a.cadence_fr, a.cadence_en, locale) && (
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ocre">
                        {champ(a.cadence_fr, a.cadence_en, locale)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed text-doux">
                    {champ(a.description_fr, a.description_en, locale)}
                  </p>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      <section className="px-[clamp(20px,5vw,80px)] py-[clamp(48px,7vw,96px)]">
        <Container className="max-w-[900px] text-center">
          <p className="text-doux">
            {t('compteEdifices', { n: stats.edifices })} · {stats.communes} {t('statCommunes')}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/archives"
              className="rounded-full px-8 py-4 text-sm font-semibold transition hover:-translate-y-0.5"
              style={{ background: 'var(--accent)', color: 'var(--surAccent)' }}
            >
              {t('explorer')}
            </Link>
            <Link
              href="/carte"
              className="rounded-full border border-filet px-8 py-4 text-sm font-semibold text-encre-t transition hover:-translate-y-0.5"
            >
              {t('ouvrirCarte')}
            </Link>
          </div>
        </Container>
      </section>
    </main>
  )
}
