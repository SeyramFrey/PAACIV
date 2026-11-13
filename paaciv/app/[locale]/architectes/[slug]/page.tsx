import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { MosaiqueRealisations } from '@/components/architectes/MosaiqueRealisations'
import { HeroFiche } from '@/components/architectes/HeroFiche'
import { SommaireFiche, type EntreeSommaire } from '@/components/architectes/SommaireFiche'
import { FriseParcours } from '@/components/architectes/FriseParcours'
import { DomainesIntervention, MissionsEtranger } from '@/components/architectes/BlocsFiche'
import { AppelContribuer } from '@/components/architectes/AppelContribuer'
import { getArchitecteParSlugCache as getArchitecte, listeProgrammes } from '@/lib/data/architectes'
import { champ } from '@/lib/i18n-champ'
import { slugParam } from '@/lib/slug'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: slugBrut } = await params
  const slug = slugParam(slugBrut)
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

// Fiche architecte, d'après la maquette « Architecte Aka Adjo ».
//
// Le `<main>` ne porte AUCUN retrait haut, contrairement aux quinze autres
// pages du site : le hero est sombre et pleine hauteur, il monte sous
// l'en-tête qui se fond dessus, et sa propre marge
// (`clamp(110px,14vh,168px)`) fait le dégagement. Même parti qu'à l'accueil.
//
// Chaque section se retire d'elle-même quand elle n'a rien à montrer, et le
// sommaire se construit à partir de ce qui reste : la maquette a été dessinée
// sur la fiche la mieux documentée du corpus, mais le gabarit doit tenir pour
// les six autres, dont certaines n'ont qu'une biographie de deux lignes.
export default async function FicheArchitecte({ params }: Props) {
  const { locale, slug: slugBrut } = await params
  const slug = slugParam(slugBrut)
  setRequestLocale(locale)
  const t = await getTranslations('ficheArchitecte')
  const [a, programmes] = await Promise.all([getArchitecte(slug), listeProgrammes()])
  if (!a) notFound()

  const bio = champ(a.bio_fr, a.bio_en, locale)
  const parcours = champ(a.parcours_fr, a.parcours_en, locale)
  const realisationsTexte = champ(a.realisations_texte_fr, a.realisations_texte_en, locale)
  const distinction = champ(a.distinction_fr, a.distinction_en, locale)

  const aDesDomaines = a.blocs.domaine.length > 0
  const aDesRealisations = a.realisations.length > 0 || realisationsTexte.length > 0
  const aDesMissions = a.blocs.mission.length > 0

  const sommaire: EntreeSommaire[] = [
    bio && { id: 'biographie', libelle: t('bio') },
    parcours && { id: 'parcours', libelle: t('parcours') },
    aDesDomaines && { id: 'domaines', libelle: t('domaines') },
    aDesRealisations && { id: 'realisations', libelle: t('realisations') },
    aDesMissions && { id: 'etranger', libelle: t('missions') },
  ].filter((e): e is EntreeSommaire => Boolean(e))

  return (
    <main className="flex-1">
      <HeroFiche a={a} locale={locale} />

      <SommaireFiche entrees={sommaire} />

      {/* « Ce qu'il laisse » : la distinction, reprise en exergue. Elle figure
          AUSSI dans le tableau du hero, et c'est voulu — la maquette la donne
          deux fois, une fois comme donnée, une fois comme phrase. */}
      {distinction && (
        <section
          className="relative overflow-hidden px-[clamp(20px,4vw,54px)] py-[clamp(46px,6vw,88px)]"
          style={{ background: 'var(--bg2)' }}
        >
          <div className="mx-auto flex max-w-[1180px] justify-center">
            <blockquote
              data-rv=""
              className="m-0 text-balance text-center font-serif text-[clamp(26px,4.6vw,62px)] italic leading-[1.12]"
              style={{ color: 'var(--ink)' }}
            >
              <span
                className="mb-[22px] block text-[10px] font-semibold uppercase not-italic leading-none tracking-[0.28em]"
                style={{ color: 'var(--ocre)' }}
              >
                {t('citationSurtitre')}
              </span>
              {distinction}
            </blockquote>
          </div>
        </section>
      )}

      {bio && (
        <section
          id="biographie"
          className="scroll-mt-[calc(var(--hauteur-entete)+3.5rem)] px-[clamp(20px,4vw,54px)] py-[clamp(56px,7vw,110px)]"
        >
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-start gap-[clamp(24px,4vw,64px)]">
            <div className="min-w-0 flex-[1_1_240px]">
              <h2
                data-rv=""
                className="m-0 font-serif text-[clamp(30px,3.4vw,52px)] leading-[1.04] tracking-[-0.02em]"
                style={{ color: 'var(--ink)' }}
              >
                {t('bio')}
              </h2>
              <span
                data-line=""
                className="mt-[18px] block h-px"
                style={{ background: 'var(--terra)' }}
              />
            </div>
            <div data-rv="" className="bio-fiche min-w-0 flex-[3_1_440px]">
              <TexteRiche html={bio} />
            </div>
          </div>
        </section>
      )}

      {parcours && <FriseParcours html={parcours} id="parcours" />}

      <DomainesIntervention domaines={a.blocs.domaine} locale={locale} id="domaines" />

      {aDesRealisations && (
        <section
          id="realisations"
          className="scroll-mt-[calc(var(--hauteur-entete)+3.5rem)] px-[clamp(20px,4vw,54px)] py-[clamp(56px,7vw,110px)]"
        >
          <div className="mx-auto max-w-[1440px]">
            <h2
              data-rv=""
              className="m-0 mb-[clamp(30px,4vw,56px)] font-serif text-[clamp(32px,4.4vw,68px)] leading-none tracking-[-0.025em]"
              style={{ color: 'var(--ink)' }}
            >
              {t('realisations')}
            </h2>

            {/* Mosaïque plutôt que rail défilant, à la demande du client, et
                la bande « Type de programmes » au-dessus : elle remplace
                l'ancienne section « Programmes à son actif ». */}
            {a.realisations.length > 0 && (
              <MosaiqueRealisations
                realisations={a.realisations}
                programmes={programmes}
                locale={locale}
              />
            )}

            {/* Le relevé libre COMPLÈTE les fiches liées au lieu de les
                remplacer : l'ancienne page affichait l'un OU l'autre, si bien
                qu'un architecte ayant les deux perdait silencieusement son
                relevé dès qu'une liaison existait.
                Il est REPLIÉ par défaut. Celui d'Aka Adjo fait plusieurs
                centaines de lignes recopiées des pièces d'agence : déplié, il
                occupe à lui seul plus que tout le reste de la fiche et enterre
                les sections qui suivent. `<details>` plutôt qu'un état React —
                il s'ouvre sans JavaScript, se laisse chercher par Ctrl+F dans
                les navigateurs récents, et s'imprime déplié. */}
            {realisationsTexte && (
              <details
                data-rv=""
                className={
                  a.realisations.length > 0
                    ? 'group mt-[clamp(28px,4vw,56px)] border-t pt-[clamp(24px,3vw,44px)]'
                    : 'group'
                }
                style={a.realisations.length > 0 ? { borderColor: 'var(--line)' } : undefined}
              >
                <summary
                  className="flex cursor-pointer list-none items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors hover:text-terra focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden"
                  style={{ color: 'var(--soft)' }}
                >
                  {/* Chevron dessiné plutôt que le marqueur natif, que les
                      navigateurs rendent chacun à leur façon. Il pivote à
                      l'ouverture, ce qui dit l'état sans mot supplémentaire. */}
                  <span
                    aria-hidden="true"
                    className="inline-block transition-transform duration-300 group-open:rotate-90"
                    style={{ color: 'var(--terra)' }}
                  >
                    ▸
                  </span>
                  {t('releveDetaille')}
                </summary>
                <div className="mt-6 max-w-[80ch]">
                  <TexteRiche html={realisationsTexte} />
                </div>
              </details>
            )}
          </div>
        </section>
      )}

      <MissionsEtranger missions={a.blocs.mission} locale={locale} id="etranger" />

      <AppelContribuer />
    </main>
  )
}
