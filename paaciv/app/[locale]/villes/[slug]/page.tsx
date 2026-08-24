import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { CartePatrimoine } from '@/components/patrimoine/CartePatrimoine'
import { FriseChrono } from '@/components/patrimoine/FriseChrono'
import { CarteVille } from '@/components/carte/CarteVille'
import { SeparateurTisse } from '@/components/ui/SeparateurTisse'
import { PastilleEtat } from '@/components/patrimoine/PastilleEtat'
import { villeParSlug } from '@/lib/data/villes'
import { chargerReferences } from '@/lib/data/references'
import { chargerTextes, libelleOuNull } from '@/lib/data/contenu-site'
import { cleTexteVille } from '@/lib/villes'
import { champ } from '@/lib/i18n-champ'
import { estEtatConservation, ETATS_CONSERVATION } from '@/lib/etats-conservation'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

// « patrimoine Grand-Bassam » est une requête que les gens tapent : le titre et
// la description sont écrits pour elle, et non comme une variation du nom du
// site. C'est tout l'intérêt d'avoir des pages de commune plutôt qu'un simple
// filtre — un filtre n'a ni URL stable, ni titre, ni description.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const ville = await villeParSlug(slug)
  if (!ville) return {}
  const t = await getTranslations({ locale, namespace: 'villes' })
  return {
    title: `${t('titreVille', { ville: ville.nom })} — PAACIV`,
    description: t('descriptionVille', { ville: ville.nom, n: ville.items.length }),
  }
}

export default async function PageVille({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations('villes')

  const ville = await villeParSlug(slug)
  if (!ville) notFound()

  const [refs, textes] = await Promise.all([chargerReferences(), chargerTextes()])

  // Texte de présentation : remplacement FACULTATIF venu de la base. Tant que
  // l'association ne l'a pas écrit (ligne absente, vide ou encore marquée
  // « À COMPLÉTER »), la page se passe de paragraphe plutôt que d'afficher un
  // marqueur de chantier — même règle que partout ailleurs sur le site.
  const presentation = libelleOuNull(textes, cleTexteVille(ville.slug), locale)

  const district = refs.districts.find(
    (d) => d.id === ville.items.find((i) => i.district_id)?.district_id,
  )

  const points = ville.items
    .filter((i): i is typeof i & { lat: number; lng: number } => i.lat != null && i.lng != null)
    .map((i) => ({
      slug: i.slug,
      titre: champ(i.titre_fr, i.titre_en, locale),
      lat: i.lat,
      lng: i.lng,
      couleur: refs.types.find((ty) => ty.id === i.type_id)?.couleur ?? null,
    }))

  // Répartition par état, dans l'ordre du vocabulaire (du plus intact au
  // démoli) et non par effectif : c'est une échelle, pas un classement.
  const parEtat = ETATS_CONSERVATION.map((e) => ({
    etat: e,
    n: ville.items.filter((i) => i.etat_conservation === e).length,
  })).filter((x) => x.n > 0)
  const nonRenseignes = ville.items.filter((i) => !estEtatConservation(i.etat_conservation)).length

  return (
    <main className="flex-1 pt-20 py-10">
      <Container className="space-y-4">
        <p className="text-xs uppercase tracking-[0.18em] text-doux">
          <Link href="/villes" className="underline hover:text-ocre">
            {t('titre')}
          </Link>
          {district ? <> · {champ(district.nom_fr, district.nom_en, locale)}</> : null}
        </p>
        <h1 className="font-serif text-4xl text-ocre">
          {t('titreVille', { ville: ville.nom })}
        </h1>
        <p className="text-doux">{t('compte', { n: ville.items.length })}</p>
        {presentation ? (
          <p className="max-w-2xl whitespace-pre-line text-encre-t">{presentation}</p>
        ) : null}

        {parEtat.length > 0 ? (
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2">
            {parEtat.map(({ etat, n }) => (
              <li key={etat} className="flex items-center gap-1.5">
                <PastilleEtat etat={etat} />
                <span className="text-sm tabular-nums text-doux">{n}</span>
              </li>
            ))}
            {nonRenseignes > 0 ? (
              // Ce qui n'est pas renseigné est DIT. Passer les fiches sans état
              // sous silence laisserait croire que la répartition ci-dessus
              // couvre toute la commune.
              <li className="text-xs text-doux">{t('etatNonRenseigne', { n: nonRenseignes })}</li>
            ) : null}
          </ul>
        ) : (
          // Aucun état renseigné dans toute la commune : on le dit plutôt que
          // de laisser un blanc que le visiteur lirait comme « tout va bien ».
          <p className="text-xs text-doux">{t('aucunEtat')}</p>
        )}
      </Container>

      <div className="my-10">
        <SeparateurTisse densite="fin" />
      </div>

      <Container className="space-y-10">
        {points.length > 0 ? (
          <section aria-labelledby="ville-carte" className="space-y-3">
            <h2 id="ville-carte" className="font-serif text-2xl text-ocre">
              {t('surLaCarte')}
            </h2>
            <CarteVille points={points} />
            <p className="text-xs text-doux">
              <Link href="/carte" className="underline hover:text-ocre">
                {t('ouvrirCarteComplete')}
              </Link>
            </p>
          </section>
        ) : null}

        <FriseChrono
          items={ville.items}
          epoques={refs.epoques}
          types={refs.types}
          locale={locale}
        />

        <section aria-labelledby="ville-fiches" className="space-y-4">
          <h2 id="ville-fiches" className="font-serif text-2xl text-ocre">
            {t('lesEdifices')}
          </h2>
          <div data-testid="grille-patrimoine" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ville.items.map((item) => (
              <CartePatrimoine key={item.id} item={item} locale={locale} types={refs.types} />
            ))}
          </div>
        </section>
      </Container>
    </main>
  )
}
