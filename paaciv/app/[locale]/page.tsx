import { getTranslations, setRequestLocale } from 'next-intl/server'
import { chargerTextes, texte, libelleOuNull } from '@/lib/data/contenu-site'
import { chargerMedias, visuel } from '@/lib/data/medias'
import {
  chiffresCles, listeActivites, listeTypes,
  statistiquesTerritoire,
  vignettesArchive, villesArchive,
} from '@/lib/data/accueil'
import { listeArticles } from '@/lib/data/articles'
import { listeEvenements } from '@/lib/data/evenements'
import { listePatrimoine } from '@/lib/data/patrimoine'
import { listeReels } from '@/lib/data/reels'
import { champ } from '@/lib/i18n-champ'
import { numeroEtape, type EtapeVisite } from '@/lib/etapes-visite'
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
import { Reels } from '@/components/accueil/Reels'
import { SeparateurTisse } from '@/components/ui/SeparateurTisse'
import { Etape } from '@/components/accueil/Etape'
import { RailVisite } from '@/components/accueil/RailVisite'
import { EtapeCarnet } from '@/components/carnet/EtapeCarnet'

// La page lit Supabase et n'a pas de segment dynamique : sans ce flag, Next
// la prérend au build et aucun contenu publié ensuite n'y apparaît jamais
// (bug déjà rencontré côté architectes, puis articles).
export const dynamic = 'force-dynamic'

// L'accueil est une visite des lieux, pas la présentation de l'association
// (décision du 12 novembre 2026, voir docs/design-ref/exploration-immersive.md
// § 2) : les blocs Association, Notre travail, Pourquoi nous suivre, Cinq
// raisons et Témoignages vivent désormais sur « À propos ».
//
// La visite a six étapes, dans cet ordre (décision du 14/11/2026,
// lib/etapes-visite.ts) : Entrée · Sommaire · Carte · Les lieux · Archives ·
// Votre carnet. Chacune porte son surtitre numéroté, et le rail suit le
// visiteur. Ce qui n'est pas une étape (agenda, journal, réels Instagram,
// activités, adhésion) forme l'épilogue, « La vie de l'association », après
// le carnet.
export default async function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  // Un seul palier d'attente : ces lectures sont indépendantes, les
  // enchaîner en série multiplierait le temps de rendu par dix.
  const [
    textes, medias, statsTerritoire, villes, chiffres,
    activites, types, evenements, vignettes, articles,
    fiches, tv, reels,
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
    listePatrimoine(),
    getTranslations('visite'),
    listeReels(),
  ])

  const { aVenir } = partitionnerEvenements(evenements, new Date())
  const tx = (cle: string) => texte(textes, cle, locale)
  // Libellés d'interface : remplacement facultatif venu de la base, `null`
  // si rien n'est à substituer — le composant retombe sur sa traduction.
  const lib = (cle: string) => libelleOuNull(textes, cle, locale)
  // « 03 · Carte » : remplace, sur l'accueil, le surtitre propre à chaque bloc.
  const surtitre = (e: EtapeVisite) => tv('surtitre', { numero: numeroEtape(e), nom: tv(`etapes.${e}`) })
  // Le carnet ne garde que des slugs : ce sont les fiches publiées qui leur
  // rendent un nom et une commune.
  const lieuxCarnet = fiches.map((f) => ({
    slug: f.slug,
    titre: champ(f.titre_fr, f.titre_en, locale),
    ville: f.ville,
    image: null,
  }))

  return (
    <main className="flex-1">
      <Etape zone="entree">
        <IntroFilm />
        <Hero
          titre={tx('hero_titre')}
          intro={tx('hero_intro')}
          accroche={lib('hero_accroche')}
        />
        <CarteFilm textes={textes} />
      </Etape>

      <Etape zone="sommaire">
        <EmblemeElephant surtitre={surtitre('sommaire')} />
      </Etape>

      <Etape zone="carte">
        <ApercuCarte
          stats={statsTerritoire}
          locale={locale}
          surtitre={surtitre('carte')}
          titre={tx('carte_titre')}
          texte={tx('carte_texte')}
        />
      </Etape>

      <Etape zone="lieux">
        <BandeauVilles villes={villes} />
        <GrilleArchive
          vignettes={vignettes}
          types={types}
          total={chiffres.fiches}
          surtitre={surtitre('lieux')}
          titre={tx('archive_titre')}
        />
      </Etape>

      <Etape zone="archives">
        <AppelArchives
          surtitre={surtitre('archives')}
          texte={tx('parallaxe_texte')}
          cta={lib('parallaxe_cta')}
          image={visuel(medias, 'parallaxe_image', locale, SECOURS_PARALLAXE)}
        />
      </Etape>

      <Etape zone="carnet">
        <EtapeCarnet surtitre={surtitre('carnet')} lieux={lieuxCarnet} locale={locale} />
      </Etape>

      <Etape zone="epilogue">
        <SeparateurTisse />
        <header className="px-[clamp(20px,5vw,80px)] pt-[clamp(60px,7vw,110px)] pb-[clamp(20px,3vw,40px)] text-center">
          <h2 className="m-0 font-serif text-[clamp(30px,3.6vw,52px)] leading-[1.05] tracking-[-0.01em]">
            {tv('epilogueTitre')}
          </h2>
          <p className="mx-auto mt-4 max-w-[52ch] text-[17px] font-light leading-[1.7] text-doux">
            {tv('epilogueTexte')}
          </p>
        </header>
        <Agenda evenements={aVenir.slice(0, 4)} textes={textes} />
        <Journal
          articles={articles.slice(0, 3)}
          surtitre={tx('journal_surtitre')}
          titre={tx('journal_titre')}
          image={visuel(medias, 'journal_image', locale, SECOURS_JOURNAL)}
        />
        <Reels reels={reels} />
        <Activites
          activites={activites}
          surtitre={tx('activites_surtitre')}
          titre={tx('activites_titre')}
          intro={tx('activites_intro')}
        />
        <SeparateurTisse densite="large" dessin="chevrons" />
        <Newsletter titre={tx('newsletter_titre')} texte={tx('newsletter_texte')} />
      </Etape>

      <RailVisite />
    </main>
  )
}
