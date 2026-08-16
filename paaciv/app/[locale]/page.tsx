import { setRequestLocale } from 'next-intl/server'
import { chargerTextes, texte } from '@/lib/data/contenu-site'
import {
  chiffresCles, listeActivites, listePointsCles, listeTemoignages, listeTypes,
  vedettesHero, vignettesArchive, villesArchive,
} from '@/lib/data/accueil'
import { listeArticles } from '@/lib/data/articles'
import { listeEvenements } from '@/lib/data/evenements'
import { partitionnerEvenements } from '@/lib/evenements-dates'
import { Hero } from '@/components/accueil/Hero'
import { CarteFilm } from '@/components/accueil/CarteFilm'
import { BandeauVilles } from '@/components/accueil/BandeauVilles'
import { Association } from '@/components/accueil/Association'
import { NotreTravail } from '@/components/accueil/NotreTravail'
import { PourquoiNousSuivre } from '@/components/accueil/PourquoiNousSuivre'
import { Activites } from '@/components/accueil/Activites'
import { ApercuCarteLoader as ApercuCarte } from '@/components/accueil/ApercuCarteLoader'
import { CinqRaisons } from '@/components/accueil/CinqRaisons'
import { Agenda } from '@/components/accueil/Agenda'
import { AppelArchives } from '@/components/accueil/AppelArchives'
import { GrilleArchive } from '@/components/accueil/GrilleArchive'
import { Temoignages } from '@/components/accueil/Temoignages'
import { Journal } from '@/components/accueil/Journal'
import { Newsletter } from '@/components/accueil/Newsletter'

// La page lit Supabase et n'a pas de segment dynamique : sans ce flag, Next
// la prérend au build et aucun contenu publié ensuite n'y apparaît jamais
// (bug déjà rencontré côté architectes, puis articles).
export const dynamic = 'force-dynamic'

export default async function Accueil({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  // Un seul palier d'attente : ces lectures sont indépendantes, les
  // enchaîner en série multiplierait le temps de rendu par dix.
  const [
    textes, vedettes, villes, chiffres, pourquoi, raisons,
    activites, types, evenements, vignettes, temoignages, articles,
  ] = await Promise.all([
    chargerTextes(),
    vedettesHero(5),
    villesArchive(),
    chiffresCles(),
    listePointsCles('pourquoi'),
    listePointsCles('raisons'),
    listeActivites(),
    listeTypes(),
    listeEvenements(),
    vignettesArchive(12),
    listeTemoignages(),
    listeArticles(),
  ])

  const { aVenir } = partitionnerEvenements(evenements, new Date())
  const tx = (cle: string) => texte(textes, cle, locale)

  return (
    <main className="flex-1">
      <Hero vedettes={vedettes} titre={tx('hero_titre')} intro={tx('hero_intro')} />
      <CarteFilm />
      <BandeauVilles villes={villes} />
      <Association textes={textes} chiffres={chiffres} montant={tx('soutien_adhesion_montant')} />
      <NotreTravail textes={textes} />
      <PourquoiNousSuivre points={pourquoi} titre={tx('pourquoi_titre')} />
      <Activites
        activites={activites}
        surtitre={tx('activites_surtitre')}
        titre={tx('activites_titre')}
        intro={tx('activites_intro')}
      />
      <ApercuCarte
        types={types}
        nombre={chiffres.fiches}
        surtitre={tx('carte_surtitre')}
        titre={tx('carte_titre')}
        texte={tx('carte_texte')}
      />
      <CinqRaisons points={raisons} textes={textes} />
      <Agenda evenements={aVenir.slice(0, 4)} textes={textes} />
      <AppelArchives texte={tx('parallaxe_texte')} />
      <GrilleArchive
        vignettes={vignettes}
        types={types}
        total={chiffres.fiches}
        surtitre={tx('archive_surtitre')}
        titre={tx('archive_titre')}
      />
      <Temoignages
        temoignages={temoignages}
        surtitre={tx('temoignages_surtitre')}
        titre={tx('temoignages_titre')}
      />
      <Journal
        articles={articles.slice(0, 3)}
        surtitre={tx('journal_surtitre')}
        titre={tx('journal_titre')}
      />
      <Newsletter titre={tx('newsletter_titre')} texte={tx('newsletter_texte')} />
    </main>
  )
}
