'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCarnet } from '@/components/carnet/useCarnet'
import { useSoutien } from '@/components/soutenir/ContexteSoutien'
import { dateAbidjan, effacerCarnet } from '@/lib/carnet'

// Ce que la page serveur sait de chaque fiche publiée, déjà dans la langue de
// la page. Le carnet ne garde que des slugs : c'est ici qu'ils redeviennent
// des lieux, avec leur nom, leur commune et leur photo à jour.
export type LieuCarnet = {
  slug: string
  titre: string
  ville: string | null
  image: string | null
}

export function PageCarnet({ lieux, locale }: { lieux: LieuCarnet[]; locale: string }) {
  const t = useTranslations('carnet')
  const { ouvrir } = useSoutien()
  const carnet = useCarnet()
  const parSlug = new Map(lieux.map((l) => [l.slug, l]))
  // Dans l'ordre des visites. Un tampon dont la fiche a été dépubliée ou
  // supprimée n'est pas montré : il n'y a plus de lieu où le relier.
  const vus = carnet
    .filter((tampon) => parSlug.has(tampon.slug))
    .map((tampon) => ({ tampon, lieu: parSlug.get(tampon.slug)! }))

  function effacer() {
    if (window.confirm(t('confirmerEffacer'))) effacerCarnet()
  }

  return (
    <div className="space-y-10">
      {vus.length === 0 ? (
        <div className="space-y-4" data-testid="carnet-vide">
          <p className="max-w-[60ch] text-encre-t">{t('vide')}</p>
          <Link href="/archives" className="inline-block rounded-full bg-or px-4 py-2 text-sm font-semibold text-encre">
            {t('explorer')}
          </Link>
        </div>
      ) : (
        <>
          <p className="text-doux" aria-live="polite">
            {t('progression', { n: vus.length, total: lieux.length })}
          </p>
          <ol className="grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3" data-testid="carnet-tampons">
            {vus.map(({ tampon, lieu }, i) => (
              <li key={tampon.slug} className="break-inside-avoid">
                <Link
                  href={`/patrimoine/${lieu.slug}`}
                  className="group block overflow-hidden rounded-2xl border border-filet transition-colors hover:border-[var(--accent)]"
                >
                  {lieu.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={lieu.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : (
                    <div aria-hidden="true" className="aspect-[4/3] w-full bg-creme2" />
                  )}
                  <div className="space-y-1 p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-doux">
                      {t('numero', { n: i + 1 })}
                    </p>
                    <h2 className="font-serif text-xl text-ocre">{lieu.titre}</h2>
                    {lieu.ville && <p className="text-sm text-encre-t">{lieu.ville}</p>}
                    <p className="text-xs text-doux">{t('vu', { date: dateAbidjan(tampon.premiere, locale) })}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap gap-3 print:hidden">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full border border-filet px-4 py-2 text-sm font-semibold"
            >
              {t('imprimer')}
            </button>
            <button
              type="button"
              onClick={effacer}
              className="rounded-full px-4 py-2 text-sm text-doux underline"
            >
              {t('effacer')}
            </button>
          </div>
        </>
      )}

      <p className="max-w-[60ch] text-xs text-doux">{t('confidentialite')}</p>

      {/* La fin de la visite est le bon moment pour proposer d'adhérer : le
          visiteur vient de voir ce que l'association documente. */}
      <div className="flex flex-wrap items-center gap-4 border-t border-filet pt-8 print:hidden">
        <p className="font-serif text-xl text-encre-t">{t('adhererTexte')}</p>
        <button
          type="button"
          onClick={() => ouvrir('adhesion')}
          className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5"
          style={{ background: 'var(--accent)', color: 'var(--surAccent)' }}
        >
          {t('adherer')}
        </button>
      </div>
    </div>
  )
}
