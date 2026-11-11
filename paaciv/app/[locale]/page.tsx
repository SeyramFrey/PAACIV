import { setRequestLocale } from 'next-intl/server'
import { chargerTextes, texte, libelleOuNull } from '@/lib/data/contenu-site'
import { chargerMedias, visuel } from '@/lib/data/medias'
import {
  chiffresCles, listeActivites, listeTypes,
  statistiquesTerritoire,
  vignettesArchive, villesArchive,
} from '@/lib/data/accueil'
import { listeArticles } from '@/lib/data/articles'
import { listeEvenements } from '@/lib/data/evenements'
import { partitionnerEvenements } from '@/lib/evenements-dates'
import { Hero } from '@/components/accueil/Hero'
import { IntroFilm } from '@/components/accueil/IntroFilm'
import { CarteFilm } from '@/components/accueil/CarteFilm'
import { EmblemeElephant } from '@/components/accueil/EmblemeElephant'
import { BandeauVilles } from '@/components/accueil/BandeauVilles'
import { Activites } from '@/components/accueil/Activites'
import { ApercuCarte } from '@/components/accueil/ApercuCarte'
import { Agenda } from '@/components/accueil/Agenda'
import { AppelArchives, SECOURS_PARALLAXE } from '@/components/accueil/AppelArchives'
import { GrilleArchive } from '@/components/accueil/GrilleArchive'
import { Journal, SECOURS_JOURNAL } from '@/components/accueil/Journal'
import { Newsletter } from '@/components/accueil/Newsletter'
import { SeparateurTisse } from '@/components/ui/SeparateurTisse'

// La page lit Supabase et n'a pas de segment dynamique : sans ce flag, Next
// la prérend au build et aucun contenu publié ensuite n'y apparaît jamais
// (bug déjà rencontré côté architectes, puis articles).
export const dynamic = 'force-dynamic'

// L'accueil est une visite des lieux, pas la présentation de l'association
// (décision du 12 novembre 2026, voir docs/design-ref/exploration-immersive.md
// § 2) : les blocs Association, Notre travail, Pourquoi nous suivre, Cinq
// raisons et Témoignages vivent désormais sur « À propos ».
export default async function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  // Un seul palier d'attente : ces lectures sont indépendantes, les
  // enchaîner en série multiplierait le temps de rendu par dix.
  const [
    textes, medias, statsTerritoire, villes, chiffres,
    activites, types, evenements, vignettes, articles,
  ] = await Promise.all([
    chargerTextes(),
    chargerMedias(),
    statistiquesTerritoire(),
    villesArchive(),
    chiffresCles(),
    listeActivites(),
    listeTypes(),
    listeEvenements(),
    vignettesArchive(12),
    listeArticles(),
  ])

  const { aVenir } = partitionnerEvenements(evenements, new Date())
  const tx = (cle: string) => texte(textes, cle, locale)
  // Libellés d'interface : remplacement facultatif venu de la base, `null`
  // si rien n'est à substituer — le composant retombe sur sa traduction.
  const lib = (cle: string) => libelleOuNull(textes, cle, locale)

  return (
    <main className="flex-1">
      <IntroFilm />
      <Hero
        titre={tx('hero_titre')}
        intro={tx('hero_intro')}
        accroche={lib('hero_accroche')}
      />
      <CarteFilm textes={textes} />
      <EmblemeElephant />
      <BandeauVilles villes={villes} />
      <SeparateurTisse />
      <Activites
        activites={activites}
        surtitre={tx('activites_surtitre')}
        titre={tx('activites_titre')}
        intro={tx('activites_intro')}
      />
      <ApercuCarte
        stats={statsTerritoire}
        locale={locale}
        surtitre={tx('carte_surtitre')}
        titre={tx('carte_titre')}
        texte={tx('carte_texte')}
      />
      <Agenda evenements={aVenir.slice(0, 4)} textes={textes} />
      <AppelArchives
        texte={tx('parallaxe_texte')}
        cta={lib('parallaxe_cta')}
        image={visuel(medias, 'parallaxe_image', locale, SECOURS_PARALLAXE)}
      />
      <GrilleArchive
        vignettes={vignettes}
        types={types}
        total={chiffres.fiches}
        surtitre={tx('archive_surtitre')}
        titre={tx('archive_titre')}
      />
      <Journal
        articles={articles.slice(0, 3)}
        surtitre={tx('journal_surtitre')}
        titre={tx('journal_titre')}
        image={visuel(medias, 'journal_image', locale, SECOURS_JOURNAL)}
      />
      <SeparateurTisse densite="large" dessin="chevrons" />
      <Newsletter titre={tx('newsletter_titre')} texte={tx('newsletter_texte')} />
    </main>
  )
}
