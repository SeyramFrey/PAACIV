import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { champ } from '@/lib/i18n-champ'
import { PictoType } from '@/components/ui/PictoType'
import { PastilleEtat } from '@/components/patrimoine/PastilleEtat'
import {
  anneeEdifice, bornesFrise, positionRelative, graduations, repartirVoies, segmentsEpoques,
} from '@/lib/frise'
import type { PatrimoineListItem, Ref } from '@/lib/data/patrimoine'
import type { RefEpoque } from '@/lib/data/references'

// Frise chronologique du bâti.
//
// LA DONNÉE EXISTAIT DÉJÀ et ne se voyait nulle part : `annee_debut`,
// `annee_fin`, `date_texte` et `epoque_id` sont renseignés depuis la phase 2 et
// n'apparaissaient qu'en ligne de définition, au bas de la colonne latérale
// d'une fiche ouverte. L'archive se lisait donc comme une grille de vignettes
// sans profondeur historique, alors que c'est le temps qui donne son sens à ce
// corpus : voir d'un coup d'œil que le pont Houphouët-Boigny date de 1957 et la
// basilique de 1990 raconte ce qu'aucune vignette ne raconte.
//
// Toute la géométrie vit dans `lib/frise.ts`, pure et testée ; ce fichier ne
// fait que dessiner. C'est ce partage qui permet d'AFFIRMER par un test que
// deux édifices de 1963 et 1964 ne se recouvrent pas — ce qu'aucun coup d'œil
// ne garantit une fois la donnée changée.
//
// Composant SERVEUR : la frise n'a aucune interaction propre (les étiquettes
// sont des liens, le défilement est celui du navigateur). L'envoyer au client
// coûterait du JavaScript pour dessiner des rectangles.

/** Encombrement horizontal réservé à une étiquette, en pixels. */
const LARGEUR_ETIQUETTE = 168
/**
 * Échelle de l'axe. Le corpus publié va de 1893 à 1990 : à 8 px/an il occupe un
 * millier de pixels — assez pour respirer, et le conteneur défile sur les
 * écrans plus étroits plutôt que de comprimer l'axe jusqu'à l'illisible.
 */
const PX_PAR_AN = 8
const MARGE = 28
const H_EPOQUES = 30
const H_AXE = 34
/**
 * Hauteur d'une voie. Doit tenir la PLUS HAUTE étiquette possible : la pastille
 * (30 px), un titre sur deux lignes (« Pont Félix Houphouët-Boigny » y passe,
 * et ce n'est pas le plus long du corpus), puis la ligne année + état. À 64 px,
 * la pastille de la voie suivante venait mordre sur cette dernière ligne.
 */
const H_VOIE = 88
/**
 * Réserve à droite de l'axe, exactement de la largeur d'une étiquette.
 *
 * Une étiquette part de son point et s'étend VERS LA DROITE : celle du dernier
 * édifice, posée au bout de l'axe, sortait donc du cadre et se faisait couper
 * en deux. Réserver la place plutôt que rogner l'étiquette au bord — un titre
 * tronqué ne se lit pas — et plutôt que la décaler vers la gauche, ce qui la
 * ferait entrer en collision avec sa voisine de voie, dont le placement a été
 * calculé sur l'hypothèse inverse.
 */
const RESERVE_DROITE = 168
const LARGEUR_MIN = 760

export async function FriseChrono({
  items,
  epoques,
  types,
  locale,
}: {
  items: PatrimoineListItem[]
  epoques: RefEpoque[]
  types: Ref[]
  locale: string
}) {
  const t = await getTranslations('frise')

  // Un édifice non datable n'est PAS placé au hasard sur l'axe : il est listé à
  // part, sous la frise. Poser « fin XIXᵉ – début XXᵉ » à une année inventée
  // ferait mentir la seule chose que la frise prétend dire.
  const dates = items.map((item) => ({ item, annee: anneeEdifice(item) }))
  const places = dates.filter(
    (d): d is { item: PatrimoineListItem; annee: number } => d.annee !== null,
  )
  const sansDate = dates.filter((d) => d.annee === null).map((d) => d.item)

  if (places.length === 0) return null

  const bornes = bornesFrise(places.map((d) => d.annee))
  const largeur = Math.max(
    LARGEUR_MIN,
    (bornes.max - bornes.min) * PX_PAR_AN + MARGE * 2 + RESERVE_DROITE,
  )
  // L'axe s'arrête une largeur d'étiquette avant le bord : c'est cette bande
  // vide qui accueille le titre du dernier édifice.
  const utile = largeur - MARGE * 2 - RESERVE_DROITE
  const abscisse = (annee: number) => MARGE + positionRelative(annee, bornes) * utile

  const xs = places.map((d) => abscisse(d.annee))
  const voies = repartirVoies(xs, LARGEUR_ETIQUETTE)
  const nbVoies = Math.max(...voies) + 1
  const hauteur = H_EPOQUES + H_AXE + nbVoies * H_VOIE + 12
  const yAxe = H_EPOQUES + H_AXE / 2

  const segments = segmentsEpoques(epoques, bornes)
  // `globalThis.Map` : le nom `Map` est celui de MapLibre dans la moitié des
  // fichiers de ce dépôt, autant ne pas rouvrir la confusion ici.
  const couleurType = new globalThis.Map(types.map((ty) => [ty.id, ty.couleur]))
  const nomType = new globalThis.Map(
    types.map((ty) => [ty.id, champ(ty.nom_fr, ty.nom_en, locale)]),
  )

  return (
    <section data-testid="frise" aria-labelledby="frise-titre" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="frise-titre" className="font-serif text-2xl text-ocre">
          {t('titre')}
        </h2>
        <p className="text-sm text-doux">{t('intro')}</p>
      </div>

      {/*
        `tabIndex` sur le conteneur défilant, et pas seulement `overflow-x-auto` :
        une zone qui défile doit être atteignable au clavier, sans quoi tout ce
        qui est à droite du cadre est hors d'atteinte pour qui n'a pas de souris.
        `role="group"` et `aria-label` lui donnent un nom — un lecteur d'écran
        annoncerait sinon un groupe anonyme au milieu de la page.
      */}
      <div
        role="group"
        tabIndex={0}
        aria-label={t('aria', { min: bornes.min, max: bornes.max })}
        // `defilement-ombre` porte le fond ET l'indication de défilement (voir
        // app/globals.css) : une ombre apparaît du côté où il reste du contenu
        // et s'efface en bout de course. Le fond ne peut donc pas rester en
        // style inline — il ferait partie du même raccourci `background` et
        // écraserait les quatre couches.
        className="surface-papier filet-double defilement-ombre overflow-x-auto rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
      >
        <div className="relative" style={{ width: largeur, height: hauteur }}>
          {/* ── Bandes d'époque ─────────────────────────────────────────── */}
          {segments.map((s) => (
            <div
              key={s.epoque.id}
              className="absolute top-0 flex items-center overflow-hidden"
              style={{
                left: MARGE + s.debut * utile,
                width: (s.fin - s.debut) * utile,
                height: H_EPOQUES,
                // Aplat très dilué : la bande SITUE, elle ne doit pas rivaliser
                // avec les points qu'elle porte.
                background: `color-mix(in oklab, ${s.epoque.couleur ?? 'var(--soft)'} 16%, transparent)`,
                borderLeft: `1px solid color-mix(in oklab, ${s.epoque.couleur ?? 'var(--soft)'} 55%, transparent)`,
              }}
            >
              <span
                className="truncate px-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: s.epoque.couleur ?? 'var(--soft)' }}
              >
                {champ(s.epoque.nom_fr, s.epoque.nom_en, locale)}
              </span>
            </div>
          ))}

          {/* ── Axe et graduations ──────────────────────────────────────── */}
          <div
            aria-hidden="true"
            className="absolute"
            style={{
              left: MARGE,
              width: utile,
              top: yAxe,
              height: 1,
              background: 'color-mix(in oklab, var(--ink) 32%, transparent)',
            }}
          />
          {graduations(bornes).map((annee) => (
            <div
              key={annee}
              aria-hidden="true"
              className="absolute"
              style={{ left: abscisse(annee), top: yAxe - 5 }}
            >
              <span
                className="block h-2.5 w-px"
                style={{ background: 'color-mix(in oklab, var(--ink) 32%, transparent)' }}
              />
              <span className="absolute left-0 top-3 -translate-x-1/2 text-[10px] tabular-nums text-doux">
                {annee}
              </span>
            </div>
          ))}

          {/* ── Édifices ────────────────────────────────────────────────── */}
          {places.map((d, i) => {
            const x = xs[i]
            const hautVoie = H_EPOQUES + H_AXE + voies[i] * H_VOIE
            const couleur = couleurType.get(d.item.type_id ?? '') ?? 'var(--terra)'
            return (
              <div key={d.item.id}>
                {/* Rappel vertical entre l'axe et le point : la seule chose qui
                    dise à quelle année appartient une étiquette descendue en
                    deuxième ou troisième voie. */}
                <span
                  aria-hidden="true"
                  className="absolute w-px"
                  style={{
                    left: x,
                    top: yAxe,
                    height: hautVoie - yAxe + 8,
                    background: 'color-mix(in oklab, var(--ink) 22%, transparent)',
                  }}
                />
                <Link
                  href={`/patrimoine/${d.item.slug}`}
                  className="group absolute flex flex-col gap-1 rounded-lg p-1 transition-colors hover:bg-[color-mix(in_oklab,var(--ink)_7%,transparent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  style={{ left: x - 15, top: hautVoie, width: LARGEUR_ETIQUETTE - 10 }}
                >
                  <span
                    className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full transition-transform group-hover:scale-110"
                    style={{
                      background: `color-mix(in oklab, ${couleur} 18%, var(--bg))`,
                      border: `1.5px solid ${couleur}`,
                      color: couleur,
                    }}
                  >
                    <PictoType type={d.item.type_id} taille={17} />
                  </span>
                  <span className="text-[13px] leading-tight text-encre-t group-hover:text-ocre">
                    {champ(d.item.titre_fr, d.item.titre_en, locale)}
                  </span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[11px] tabular-nums text-doux">{d.annee}</span>
                    <PastilleEtat etat={d.item.etat_conservation} taille="compact" />
                  </span>
                  {/* Le pictogramme est décoratif (le type n'est pas écrit dans
                      l'étiquette, faute de place) : son nom est donc porté ici,
                      pour que le lien reste complet à l'oreille. */}
                  <span className="sr-only">{nomType.get(d.item.type_id ?? '') ?? ''}</span>
                </Link>
              </div>
            )
          })}
        </div>
      </div>

      {/* Les non datés sont ANNONCÉS, pas escamotés : une frise qui perdrait des
          fiches en silence donnerait un compte faux de l'archive. */}
      {sansDate.length > 0 && (
        <p className="text-xs text-doux">
          {t('sansDate', { n: sansDate.length })}{' '}
          {sansDate.map((s, i) => (
            <span key={s.id}>
              {i > 0 ? ', ' : null}
              <Link href={`/patrimoine/${s.slug}`} className="underline hover:text-ocre">
                {champ(s.titre_fr, s.titre_en, locale)}
              </Link>
            </span>
          ))}
        </p>
      )}
    </section>
  )
}
