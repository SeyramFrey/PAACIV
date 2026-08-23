'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { CI_CONTOUR, CI_DISTRICTS, CI_VIEWBOX, projeter, dansLeCadre } from '@/lib/carte-ci'
import type { PointCarte } from '@/lib/data/accueil'

// Le territoire, dessiné à sa vraie forme et parcourable.
//
// `'use client'` ne retire RIEN du HTML servi : le tracé, les districts et les
// villes sont rendus par le serveur comme avant. Seule l'interaction — survol,
// focus clavier — a besoin du navigateur.
//
// Ce composant remplace la mini-carte MapLibre : celle-ci enfermait le pays
// dans un carré et coûtait 785 Ko de WebGL. Ici le contour EST le pays, tracé
// à 771 points, et l'ensemble tient dans une vingtaine de kilo-octets de
// chemins SVG — qui se compressent, eux, très bien.

// Rayon proportionnel au NOMBRE d'édifices, en racine carrée : c'est l'aire du
// disque que l'œil compare, pas son rayon.
const rayon = (n: number) => 10 + Math.sqrt(n) * 6

type VilleTracee = PointCarte & { x: number; y: number; yLabel: number; aGauche: boolean }

/**
 * Place les étiquettes en évitant qu'elles se chevauchent.
 *
 * Abidjan et Grand-Bassam sont distantes d'une quarantaine d'unités sur le
 * littoral : leurs deux noms écrits à la même hauteur se superposeraient
 * purement et simplement. On décale verticalement toute étiquette trop proche
 * d'une déjà posée, et on bascule à gauche celles du bord droit, dont le texte
 * sortirait du cadre.
 */
function placer(points: PointCarte[]): VilleTracee[] {
  const posees: VilleTracee[] = []
  for (const p of points) {
    const { x, y } = projeter(p.lng, p.lat)
    if (!dansLeCadre(x, y)) continue
    const aGauche = x > CI_VIEWBOX.largeur * 0.62
    let yLabel = y
    // Tant que l'étiquette heurte une voisine, on la descend d'un cran.
    for (let garde = 0; garde < 12; garde++) {
      const heurte = posees.some(
        (q) => q.aGauche === aGauche && Math.abs(q.yLabel - yLabel) < 46 && Math.abs(q.x - x) < 260,
      )
      if (!heurte) break
      yLabel += 46
    }
    posees.push({ ...p, x, y, yLabel, aGauche })
  }
  return posees
}

export function CarteCoteIvoire({ points }: { points: PointCarte[] }) {
  // Les libellés sont traduits ICI et non passés en props : une fonction ne
  // franchit pas la frontière serveur/client, et `useTranslations` fonctionne
  // dans les deux — c'est le fournisseur monté par le layout qui l'alimente.
  const t = useTranslations('accueil')
  const [districtSurvole, setDistrictSurvole] = useState<string | null>(null)
  const villes = placer(points)

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${CI_VIEWBOX.largeur} ${CI_VIEWBOX.hauteur}`}
        role="img"
        aria-label={t('legendeCarte')}
        className="h-auto w-full overflow-visible"
      >
        <defs>
          {/* Les districts sont simplifiés plus grossièrement que le contour :
              sans ce détourage, leurs bords dépasseraient par endroits de la
              frontière nationale. */}
          <clipPath id="ci-dedans">
            <path d={CI_CONTOUR} />
          </clipPath>
          <filter id="ci-lueur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="12" result="flou" />
            <feMerge>
              <feMergeNode in="flou" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Socle : le pays plein. Il bouche l'écart entre le bord des districts
            et la frontière, écart inévitable dès lors que les deux jeux de
            données ne sont pas simplifiés à la même tolérance. */}
        <path d={CI_CONTOUR} fill="color-mix(in oklab, var(--onDeep) 9%, transparent)" />

        <g clipPath="url(#ci-dedans)">
          {CI_DISTRICTS.map((d) => (
            <path
              key={d.nom}
              d={d.d}
              fill={
                districtSurvole === d.nom
                  ? 'color-mix(in oklab, var(--accent) 22%, transparent)'
                  : 'transparent'
              }
              stroke="var(--onDeep)"
              strokeOpacity={districtSurvole === d.nom ? 0.5 : 0.22}
              strokeWidth={2}
              onMouseEnter={() => setDistrictSurvole(d.nom)}
              onMouseLeave={() => setDistrictSurvole(null)}
              className="transition-[fill,stroke-opacity] duration-200"
            >
              <title>{d.nom}</title>
            </path>
          ))}
        </g>

        <path
          d={CI_CONTOUR}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={5}
          strokeLinejoin="round"
          // Le contour est décoratif par-dessus les districts : sans cela, il
          // capterait tous les survols destinés à ceux-ci.
          pointerEvents="none"
        />

        {villes.map((v) => (
          <Link
            key={v.ville}
            href={{ pathname: '/archives', query: { q: v.ville } }}
            className="group outline-none"
            aria-label={`${v.ville} — ${t('compteEdifices', { n: v.nombre })}`}
          >
            {/* Trait de rappel quand l'étiquette a dû être décalée. */}
            {v.yLabel !== v.y && (
              <line
                x1={v.x}
                y1={v.y}
                x2={v.aGauche ? v.x - (rayon(v.nombre) + 10) : v.x + rayon(v.nombre) + 10}
                y2={v.yLabel}
                stroke="var(--onDeep)"
                strokeOpacity={0.4}
                strokeWidth={1.5}
              />
            )}
            <g filter="url(#ci-lueur)">
              <circle
                cx={v.x}
                cy={v.y}
                r={rayon(v.nombre)}
                fill="var(--terra)"
              />
              <circle
                cx={v.x}
                cy={v.y}
                r={rayon(v.nombre)}
                fill="none"
                stroke="var(--onDeep)"
                strokeWidth={4}
                strokeOpacity={0.9}
              />
            </g>
            {/* Écart PROPORTIONNEL au rayon : à décalage fixe, l'étiquette
                d'une commune à cinq édifices venait buter contre son propre
                point, dont le disque fait déjà 23 unités. */}
            <text
              x={v.aGauche ? v.x - (rayon(v.nombre) + 14) : v.x + rayon(v.nombre) + 14}
              y={v.yLabel}
              textAnchor={v.aGauche ? 'end' : 'start'}
              dominantBaseline="middle"
              fill="var(--onDeep)"
              fontSize={30}
              className="opacity-[0.85] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {v.ville}
              <tspan fillOpacity={0.6}> · {v.nombre}</tspan>
            </text>
          </Link>
        ))}
      </svg>

      {/* Attribution des frontières. Sur un site qui reproche à ses propres
          photographies de n'être pas créditées, importer une frontière sans
          dire d'où elle vient serait incohérent. */}
      <figcaption className="mt-3 text-center text-[11px] opacity-45">
        {districtSurvole ?? (
          <>
            Frontières :{' '}
            <a
              href="https://www.geoboundaries.org/"
              rel="noopener noreferrer"
              target="_blank"
              className="underline"
            >
              geoBoundaries
            </a>{' '}
            — Banque mondiale / OCHA, CC BY 4.0
          </>
        )}
      </figcaption>
    </figure>
  )
}
