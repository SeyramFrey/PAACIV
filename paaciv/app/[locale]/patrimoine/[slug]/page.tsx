import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { Galerie } from '@/components/patrimoine/Galerie'
import { MiniCarte } from '@/components/carte/MiniCarte'
import { TexteRiche } from '@/components/patrimoine/TexteRiche'
import { FacadeVideo } from '@/components/editorial/FacadeVideo'
import { PictoType } from '@/components/ui/PictoType'
import { PastilleEtat } from '@/components/patrimoine/PastilleEtat'
import { OngletsFiche, type Onglet } from '@/components/patrimoine/OngletsFiche'
import { PhotosDossier } from '@/components/patrimoine/PhotosDossier'
import { TamponFiche } from '@/components/carnet/TamponFiche'
import { getPatrimoineParSlugCache as getPatrimoineParSlug, contenusLies } from '@/lib/data/patrimoine'
import { champ } from '@/lib/i18n-champ'
import { imageUrl } from '@/lib/media'
import { maquette3d } from '@/lib/maquettes'
import { slugify, slugParam } from '@/lib/slug'
import { COULEUR_DEFAUT } from '@/lib/carte-style'
import { estEtatConservation } from '@/lib/etats-conservation'
import { estEtatOccupation } from '@/lib/etats-occupation'

type Props = { params: Promise<{ locale: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug: slugBrut } = await params
  const slug = slugParam(slugBrut)
  const p = await getPatrimoineParSlug(slug)
  if (!p) return {}
  const titre = champ(p.titre_fr, p.titre_en, locale)
  const description = champ(p.resume_fr, p.resume_en, locale)
  // L'image de partage vient de la galerie du haut, jamais d'un plan ou d'un
  // document d'archive rangé dans un onglet.
  const galerie = p.images.filter((i) => (i.groupe ?? 'galerie') === 'galerie')
  const principale = galerie.find((i) => i.est_principale) ?? galerie[0]
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
  const { locale, slug: slugBrut } = await params
  const slug = slugParam(slugBrut)
  setRequestLocale(locale)
  const t = await getTranslations('fiche')
  const tVideo = await getTranslations('video')
  const tOccupation = await getTranslations('occupations')
  const p = await getPatrimoineParSlug(slug)
  if (!p) notFound()
  const { articles, reportages } = await contenusLies(p.id)

  const titre = champ(p.titre_fr, p.titre_en, locale)
  const maquette = maquette3d(p.slug)
  // Les photos se rangent par emplacement depuis 0036 : la galerie du haut
  // reste sur « Présentation », les deux autres groupes vont dans leur onglet.
  const parGroupe = (g: string) => p.images.filter((i) => (i.groupe ?? 'galerie') === g)
  const galerie = parGroupe('galerie')
  const photosEtat = parGroupe('etat_actuel')
  const photosDoc = parGroupe('documentation')

  const ligne = (label: string, valeur: ReactNode) =>
    valeur ? (
      <div>
        <dt className="text-xs uppercase tracking-wide text-doux">{label}</dt>
        <dd className="text-encre-t">{valeur}</dd>
      </div>
    ) : null

  // Texte saisi en champ long : rendu tel quel, retours à la ligne compris.
  const bloc = (intitule: string, texte: string | null | undefined, enfants?: ReactNode) =>
    texte || enfants ? (
      <section className="space-y-3">
        <h2 className="font-serif text-xl text-ocre">{intitule}</h2>
        {texte && <p className="whitespace-pre-line text-encre-t">{texte}</p>}
        {enfants}
      </section>
    ) : null

  const libelleSource = (source: string) => t('legendeSource', { source })

  const datation =
    p.date_texte ||
    [p.annee_debut, p.annee_fin].filter(Boolean).join(' – ') ||
    null

  const sources = champ(p.sources_fr, p.sources_en, locale)
  const transformations = champ(p.transformations_fr, p.transformations_en, locale)
  const textePhotos = champ(p.photographies_fr, p.photographies_en, locale)
  const contenus = champ(p.documentation_fr, p.documentation_en, locale)
  const etatConnu = estEtatConservation(p.etat_conservation)
  const occupationConnue = estEtatOccupation(p.etat_occupation)

  // ── Onglet « Présentation » : la fiche telle qu'elle était, enrichie des
  // quatre mentions demandées par l'association.
  const presentation = (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-6">
        <Galerie images={galerie} locale={locale} />
        {maquette && (
          // Lien natif : la maquette est une page statique de `public/`,
          // hors du routage par langue.
          <a
            href={maquette}
            className="inline-block rounded-full bg-or px-4 py-2 text-sm font-semibold text-encre"
          >
            {t('maquette3d')}
          </a>
        )}
        <TexteRiche html={champ(p.description_fr, p.description_en, locale)} />
        <FacadeVideo url={p.video_url} titre={titre} labelLire={tVideo('lire')} />
      </div>

      <aside className="space-y-6">
        <dl className="space-y-3">
          {ligne(t('programme'), p.programme && champ(p.programme.nom_fr, p.programme.nom_en, locale))}
          {ligne(t('fonctionActuelle'), champ(p.fonction_actuelle_fr, p.fonction_actuelle_en, locale) || null)}
          {ligne(t('datation'), datation)}
          {ligne(t('epoque'), p.epoque && champ(p.epoque.nom_fr, p.epoque.nom_en, locale))}
          {ligne(t('style'), champ(p.style_fr, p.style_en, locale) || null)}
          {ligne(t('maitreOuvrage'), p.maitre_ouvrage)}
          {ligne(t('entrepriseConstruction'), p.entreprise_construction)}
          {ligne(t('statutPatrimonial'), p.statut_patrimonial)}
          {ligne(
            t('localisation'),
            champ(p.adresse_fr, p.adresse_en, locale) || null,
          )}
          {/* La commune est un LIEN vers sa page, là où l'adresse reste du
              texte : « patrimoine Grand-Bassam » est une entrée du site à
              part entière depuis qu'existe /villes, et une fiche est le
              meilleur endroit d'où y renvoyer. */}
          {p.ville && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-doux">{t('commune')}</dt>
              <dd>
                <Link href={`/villes/${slugify(p.ville)}`} className="text-ocre underline">
                  {p.ville}
                </Link>
              </dd>
            </div>
          )}
          {ligne(t('photographe'), p.photographe)}
        </dl>
        {p.lat != null && p.lng != null && (
          <div className="filet-double overflow-hidden rounded-2xl">
            <MiniCarte lat={p.lat} lng={p.lng} titre={titre} />
          </div>
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
    </div>
  )

  // ── Onglet « Photographies et état actuel ». Il n'existe que s'il a quelque
  // chose à montrer : un onglet vide sur un site public promet un contenu
  // absent. Le formulaire d'admin, lui, montre toujours ses champs.
  const aEtatActuel =
    etatConnu || occupationConnue || transformations || textePhotos || photosEtat.length > 0 || sources
  const etatActuel = aEtatActuel ? (
    <div className="max-w-4xl space-y-10">
      {(etatConnu || occupationConnue) && (
        <dl className="grid gap-6 sm:grid-cols-2">
          {etatConnu && (
            <div>
              <dt className="text-xs uppercase tracking-wide text-doux">{t('etatConservation')}</dt>
              <dd className="mt-1">
                <PastilleEtat etat={p.etat_conservation} />
              </dd>
            </div>
          )}
          {ligne(t('etatOccupation'), occupationConnue ? tOccupation(p.etat_occupation!) : null)}
        </dl>
      )}
      {bloc(t('transformations'), transformations)}
      {bloc(
        t('photographies'),
        textePhotos,
        photosEtat.length > 0 ? (
          <PhotosDossier images={photosEtat} locale={locale} libelleSource={libelleSource} />
        ) : null,
      )}
      {bloc(t('sources'), sources)}
    </div>
  ) : null

  // ── Onglet « Documentation » : les pièces que possède l'association.
  const aDocumentation = contenus || photosDoc.length > 0
  const documentation = aDocumentation ? (
    <div className="max-w-4xl space-y-10">
      {bloc(t('contenus'), contenus)}
      <PhotosDossier images={photosDoc} locale={locale} libelleSource={libelleSource} />
    </div>
  ) : null

  const onglets: Onglet[] = [
    { id: 'presentation', libelle: t('ongletPresentation'), contenu: presentation },
    ...(etatActuel ? [{ id: 'etat-actuel', libelle: t('ongletEtatActuel'), contenu: etatActuel }] : []),
    ...(documentation ? [{ id: 'documentation', libelle: t('ongletDocumentation'), contenu: documentation }] : []),
  ]

  return (
    <main className="flex-1 sous-entete pb-10">
      {/* Ouvrir la fiche pose son tampon dans le carnet du visiteur. */}
      <TamponFiche slug={p.slug} />
      <Container className="space-y-6">
        {/* L'état de conservation est REMONTÉ dans le bandeau de titre, aux
            côtés de la typologie : c'est une clé de lecture, elle doit se voir
            avant la photographie, quel que soit l'onglet ouvert. */}
        <div className="flex flex-wrap items-center gap-3">
          {p.type && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-sable"
              style={{ backgroundColor: p.type.couleur ?? COULEUR_DEFAUT }}
            >
              {/* Décoratif : le nom du type suit immédiatement, en toutes
                  lettres. L'annoncer deux fois ne ferait que bavarder. */}
              <PictoType type={p.type.id} taille={15} />
              {champ(p.type.nom_fr, p.type.nom_en, locale)}
            </span>
          )}
          <PastilleEtat etat={p.etat_conservation} />
        </div>
        <h1 className="font-serif text-4xl text-ocre">{titre}</h1>
        {/* Une fiche sans onglet rempli reste une page simple : une barre
            d'onglets à un seul onglet ne serait qu'un titre de plus. */}
        {onglets.length > 1 ? (
          <OngletsFiche onglets={onglets} libelle={t('ongletsLibelle')} />
        ) : (
          presentation
        )}
      </Container>
    </main>
  )
}
