'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCarnet, useCarnetCommence } from '@/components/carnet/useCarnet'
import type { LieuCarnet } from '@/components/carnet/PageCarnet'
import { commencerCarnet, dateAbidjan } from '@/lib/carnet'

// L'étape « Votre carnet » de l'accueil (choix de Sey du 14/11/2026 : selon
// l'état du carnet).
//
// - Pas commencé : une phrase et « Commencer mon carnet ». Rien n'est écrit
//   dans le navigateur avant ce clic (même règle que les fiches, lib/carnet.ts).
// - Commencé, vide : une invitation à ouvrir une fiche.
// - Commencé, avec des tampons : le compte et les trois derniers, du plus
//   récent au plus ancien, puis le lien vers la page du carnet.
//
// Rendu serveur et hydratation : l'état est inconnu (`null`). Le bloc garde
// alors sa hauteur minimale, vide, pour que rien ne saute à l'arrivée.
const DERNIERS = 3

export function EtapeCarnet({
  surtitre,
  lieux,
  locale,
}: {
  surtitre: string
  lieux: LieuCarnet[]
  locale: string
}) {
  const t = useTranslations('visite')
  const tc = useTranslations('carnet')
  const commence = useCarnetCommence()
  const carnet = useCarnet()
  const parSlug = new Map(lieux.map((l) => [l.slug, l]))
  // Un tampon dont la fiche n'est plus publiée n'a plus de lieu où mener.
  const vus = carnet.filter((c) => parSlug.has(c.slug))
  const derniers = vus.slice(-DERNIERS).reverse()

  const bouton =
    'inline-block rounded-full border px-5 py-2.5 text-sm transition hover:bg-[var(--accent)] hover:text-[var(--surAccent)]'
  const filet = { borderColor: 'color-mix(in oklab, currentColor 35%, transparent)' }

  return (
    <section
      aria-labelledby="etape-carnet-titre"
      className="bande-chaux px-[clamp(20px,5vw,80px)] py-[clamp(70px,8vw,120px)]"
      data-testid="etape-carnet"
    >
      <div className="mx-auto max-w-[1100px]">
        <p className="mb-4 text-[10px] uppercase tracking-[0.24em] opacity-60">{surtitre}</p>
        <h2
          id="etape-carnet-titre"
          className="m-0 font-serif text-[clamp(30px,3.6vw,52px)] leading-[1.05] tracking-[-0.01em]"
        >
          {t('carnetTitre')}
        </h2>

        <div className="mt-8 min-h-[120px]">
          {commence === false && (
            <div className="space-y-6" data-testid="etape-carnet-invitation">
              <p className="m-0 max-w-[60ch] text-[17px] font-light leading-[1.7]">{t('carnetInvitation')}</p>
              <button type="button" onClick={() => commencerCarnet()} className={bouton} style={filet}>
                {tc('commencer')}
              </button>
            </div>
          )}

          {commence === true && vus.length === 0 && (
            <div className="space-y-6" data-testid="etape-carnet-vide">
              <p className="m-0 max-w-[60ch] text-[17px] font-light leading-[1.7]">{t('carnetVide')}</p>
              <Link href="/archives" className={bouton} style={filet}>
                {t('explorerLieux')}
              </Link>
            </div>
          )}

          {commence === true && vus.length > 0 && (
            <div className="space-y-6" data-testid="etape-carnet-tampons">
              <p className="m-0 text-[11px] uppercase tracking-[0.18em]" data-testid="etape-carnet-compte">
                {t('carnetCompte', { n: vus.length })}
              </p>
              <h3 className="sr-only">{t('carnetDerniers')}</h3>
              <ol className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3">
                {derniers.map((tampon) => {
                  const lieu = parSlug.get(tampon.slug)!
                  return (
                    <li key={tampon.slug}>
                      <Link
                        href={`/patrimoine/${lieu.slug}`}
                        className="block h-full rounded-2xl border p-4 transition-colors hover:border-[var(--accent)]"
                        style={filet}
                      >
                        <span className="block font-serif text-xl leading-tight">{lieu.titre}</span>
                        {lieu.ville && <span className="mt-1 block text-sm opacity-75">{lieu.ville}</span>}
                        <span className="mt-3 block text-xs opacity-60">
                          {tc('vu', { date: dateAbidjan(tampon.premiere, locale) })}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
              <Link href="/carnet" className={bouton} style={filet}>
                {t('voirCarnet')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
