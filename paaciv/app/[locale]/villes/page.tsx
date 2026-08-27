import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Container } from '@/components/ui/Container'
import { Link } from '@/i18n/navigation'
import { SeparateurTisse } from '@/components/ui/SeparateurTisse'
import { PictoType } from '@/components/ui/PictoType'
import { VisuelAbsent } from '@/components/ui/VisuelAbsent'
import { listeVilles } from '@/lib/data/villes'
import { chargerReferences } from '@/lib/data/references'
import { imagePrincipale } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'

// Route sans segment dynamique mais qui lit Supabase : sans ce drapeau, Next la
// prérend au build et aucune commune publiée ensuite n'y apparaît jamais. Même
// piège que sur les architectes, puis les articles, puis l'accueil.
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'villes' })
  return { title: `${t('titre')} — PAACIV`, description: t('intro') }
}

export default async function VillesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('villes')

  const [villes, refs] = await Promise.all([listeVilles(), chargerReferences()])
  const nomDistrict = (id: string | null) => {
    const d = refs.districts.find((x) => x.id === id)
    return d ? champ(d.nom_fr, d.nom_en, locale) : null
  }

  return (
    <main className="flex-1 sous-entete pb-10">
      <Container className="space-y-8">
        <header className="space-y-2">
          <h1 className="font-serif text-4xl text-ocre">{t('titre')}</h1>
          <p className="max-w-2xl text-doux">{t('intro')}</p>
        </header>
      </Container>

      <div className="my-10">
        <SeparateurTisse densite="fin" />
      </div>

      <Container>
        {villes.length === 0 ? (
          <p className="text-doux">{t('aucune')}</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {villes.map((v) => {
              // La vignette de la commune est l'image principale de sa première
              // fiche qui en a une. Aucune image n'est inventée : à défaut,
              // c'est le repli de matière de `VisuelAbsent`, pas un trou.
              const couverture = v.items
                .map((i) => imagePrincipale(i.images))
                .find((u): u is string => u !== null)
              const district = nomDistrict(v.items.find((i) => i.district_id)?.district_id ?? null)
              // Les typologies présentes dans la commune, dédoublonnées : c'est
              // la signature de son bâti, lisible d'un coup d'œil.
              const typologies = [...new Set(v.items.map((i) => i.type_id).filter(Boolean))]

              return (
                <li key={v.slug}>
                  <Link
                    href={`/villes/${v.slug}`}
                    className="filet-double group block h-full overflow-hidden rounded-2xl transition hover:-translate-y-0.5"
                    style={{ background: 'var(--bg2)' }}
                  >
                    <div
                      className="aspect-[16/10] overflow-hidden"
                      style={{ background: 'var(--bg3)' }}
                    >
                      {couverture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={couverture}
                          alt=""
                          aria-hidden="true"
                          loading="lazy"
                          className="duotone h-full w-full object-cover transition-[filter,transform] duration-500 group-hover:scale-105 group-hover:[filter:var(--imgf)]"
                        />
                      ) : (
                        <VisuelAbsent />
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <h2 className="font-serif text-xl text-ocre">{v.nom}</h2>
                      <p className="text-xs uppercase tracking-[0.14em] text-doux">
                        {district ? `${district} · ` : ''}
                        {t('compte', { n: v.items.length })}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 pt-1 text-terra">
                        {typologies.map((id) => (
                          <PictoType key={id} type={id} taille={18} />
                        ))}
                      </p>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Container>
    </main>
  )
}
