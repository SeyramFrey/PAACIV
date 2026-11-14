'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  ETAPES_VISITE, estEtapeVisite, numeroEtape, railVisible, rangEtape,
  type EtapeVisite, type ZoneVisite,
} from '@/lib/etapes-visite'

// Le repère de la visite de l'accueil (choix de Sey du 14/11/2026 : « rail
// fixe + surtitres »).
//
// - Grand écran (xl et plus) : une colonne de six numéros à gauche. Le numéro
//   de l'étape en cours s'allume, et son nom s'affiche quelques secondes quand
//   on y arrive, puis se replie pour ne pas rester sur le texte. Survoler ou
//   parcourir le rail au clavier déplie tous les noms.
// - En dessous : une barre en bas d'écran, « 3/6 · Carte », qui déplie la
//   liste des étapes.
//
// Le rail n'apparaît que pendant la visite : ni sur l'entrée, où le film
// occupe l'écran, ni dans l'épilogue (voir `railVisible`).
//
// L'étape en cours est celle qui coupe le milieu de l'écran : un seul
// IntersectionObserver, réduit à une ligne horizontale (`rootMargin`), sans
// écoute du défilement. Les liens sont de simples ancres : le défilement doux
// de `html` s'applique, et `globals.css` le coupe en mouvement réduit.
const DUREE_NOM = 2200

export function RailVisite() {
  const t = useTranslations('visite')
  const [zone, setZone] = useState<ZoneVisite | null>(null)
  // L'étape dont le nom est déplié, le temps de son arrivée.
  const [nomDeplie, setNomDeplie] = useState<ZoneVisite | null>(null)
  const [ouvert, setOuvert] = useState(false)
  const barre = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const zones = document.querySelectorAll<HTMLElement>('[data-etape]')
    if (zones.length === 0) return
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue
          const z = e.target.getAttribute('data-etape') as ZoneVisite
          setZone(z)
          setNomDeplie(z)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    zones.forEach((z) => obs.observe(z))
    return () => obs.disconnect()
  }, [])

  // Le nom de l'étape s'affiche à son arrivée, puis se replie.
  useEffect(() => {
    if (nomDeplie === null) return
    const minuteur = window.setTimeout(() => setNomDeplie(null), DUREE_NOM)
    return () => window.clearTimeout(minuteur)
  }, [nomDeplie])
  const nomVisible = nomDeplie !== null && nomDeplie === zone

  const visible = railVisible(zone)

  // La liste dépliée se referme si le rail disparaît, à Échap, ou au clic
  // ailleurs.
  useEffect(() => {
    if (!ouvert) return
    function touche(e: KeyboardEvent) {
      if (e.key === 'Escape') setOuvert(false)
    }
    function clic(e: PointerEvent) {
      if (!barre.current?.contains(e.target as Node)) setOuvert(false)
    }
    document.addEventListener('keydown', touche)
    document.addEventListener('pointerdown', clic)
    return () => {
      document.removeEventListener('keydown', touche)
      document.removeEventListener('pointerdown', clic)
    }
  }, [ouvert])
  if (!visible && ouvert) setOuvert(false)

  const courante: EtapeVisite | null = estEtapeVisite(zone) ? zone : null
  const nom = (e: EtapeVisite) => t(`etapes.${e}`)
  const total = ETAPES_VISITE.length

  // Même verre que l'en-tête une fois opaque : le fond de page à 82 %, flouté.
  // Le rail est hors des bandes, il suit donc le thème et non la section
  // qu'il survole.
  const verre = {
    background: 'color-mix(in oklab, var(--bg) 82%, transparent)',
    color: 'var(--ink)',
    borderColor: 'var(--line)',
  }
  const masque = visible ? 'opacity-100' : 'pointer-events-none opacity-0'

  return (
    <>
      <nav
        aria-label={t('rail')}
        data-testid="rail-visite"
        data-zone={zone ?? ''}
        inert={!visible}
        className={`group fixed left-3 top-1/2 z-30 hidden -translate-y-1/2 motion-safe:transition-opacity motion-safe:duration-[var(--duree-pas)] xl:block print:hidden ${masque}`}
      >
        <ol className="m-0 flex list-none flex-col items-start gap-1 p-0">
          {ETAPES_VISITE.map((e) => {
            const actif = e === courante
            return (
              <li key={e}>
                <a
                  href={`#${e}`}
                  aria-current={actif ? 'step' : undefined}
                  className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-medium uppercase leading-none tracking-[0.18em] backdrop-blur-[14px]"
                  style={{ ...verre, color: actif ? 'var(--accent)' : verre.color }}
                >
                  <span className="tabular-nums">{numeroEtape(e)}</span>
                  <span
                    data-testid={actif ? 'rail-nom-courant' : undefined}
                    className={`overflow-hidden whitespace-nowrap motion-safe:transition-[max-width,opacity] motion-safe:duration-[var(--duree-pas)] group-hover:max-w-[22ch] group-hover:opacity-100 group-focus-within:max-w-[22ch] group-focus-within:opacity-100 ${
                      actif && nomVisible ? 'max-w-[22ch] opacity-100' : 'max-w-0 opacity-0'
                    }`}
                  >
                    {nom(e)}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
      </nav>

      <div
        ref={barre}
        data-testid="barre-visite"
        inert={!visible}
        className={`fixed inset-x-3 bottom-3 z-30 mx-auto max-w-[440px] xl:hidden print:hidden motion-safe:transition-opacity motion-safe:duration-[var(--duree-pas)] ${masque}`}
      >
        {ouvert && (
          <ol
            id="etapes-visite"
            className="mb-2 list-none overflow-hidden rounded-2xl border p-1 backdrop-blur-[14px]"
            style={verre}
          >
            {ETAPES_VISITE.map((e) => (
              <li key={e}>
                <a
                  href={`#${e}`}
                  onClick={() => setOuvert(false)}
                  aria-current={e === courante ? 'step' : undefined}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
                  style={{ color: e === courante ? 'var(--accent)' : 'inherit' }}
                >
                  <span className="text-[11px] tabular-nums tracking-[0.18em]">{numeroEtape(e)}</span>
                  {nom(e)}
                </a>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          aria-expanded={ouvert}
          aria-controls="etapes-visite"
          onClick={() => setOuvert((o) => !o)}
          className="flex w-full items-center justify-between gap-4 rounded-full border px-4 py-3 text-left backdrop-blur-[14px]"
          style={verre}
        >
          <span className="sr-only">
            {courante ? t('position', { n: rangEtape(courante), total, nom: nom(courante) }) : t('ouvrir')}
          </span>
          <span aria-hidden="true" className="text-[11px] font-medium uppercase tracking-[0.18em]" data-testid="barre-position">
            {courante ? `${rangEtape(courante)}/${total} · ${nom(courante)}` : ''}
          </span>
          <span aria-hidden="true" className="flex gap-1">
            {ETAPES_VISITE.map((e) => (
              <span
                key={e}
                className="h-2 w-2 rounded-[2px] border"
                style={{
                  borderColor: 'currentColor',
                  background: e === courante ? 'var(--accent)' : 'transparent',
                  opacity: e === courante ? 1 : 0.45,
                }}
              />
            ))}
          </span>
        </button>
      </div>
    </>
  )
}
