'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n/navigation'
import { LogoutButton } from '@/components/LogoutButton'
import {
  GROUPES_RUBRIQUES,
  TABLEAU_DE_BORD,
  estActive,
  rubriqueCourante,
  type Rubrique,
} from '@/lib/admin/rubriques'

function LienRubrique({
  rubrique,
  chemin,
  onClick,
}: {
  rubrique: Rubrique
  chemin: string
  onClick: () => void
}) {
  const t = useTranslations()
  const active = estActive(chemin, rubrique.href)

  return (
    <Link
      href={rubrique.href}
      onClick={onClick}
      // `page` sur l'écran de la rubrique, `true` sur ses sous-écrans : une
      // fiche en édition appartient à la rubrique mais n'est pas sa page.
      aria-current={active ? (chemin === rubrique.href ? 'page' : 'true') : undefined}
      className={clsx(
        'block rounded-r-lg border-l-2 px-3 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent lg:py-1.5',
        active
          ? 'border-terra bg-fond3 font-semibold text-encre-t'
          : 'border-transparent text-doux hover:bg-fond3 hover:text-encre-t',
      )}
    >
      {t(`${rubrique.espace}.titre`)}
    </Link>
  )
}

// Un seul arbre pour les deux formats : colonne fixe à partir de `lg`, barre
// repliable en dessous. Deux composants auraient rendu deux fois les liens et
// deux repères « navigation » identiques à la synthèse vocale.
export function NavigationAdmin() {
  const t = useTranslations()
  const chemin = usePathname()
  const [ouvert, setOuvert] = useState(false)
  const nav = useRef<HTMLElement>(null)
  const bouton = useRef<HTMLButtonElement>(null)
  const idPanneau = useId()
  const courante = rubriqueCourante(chemin) ?? TABLEAU_DE_BORD

  // Le panneau recouvre la page sans la pousser : il se referme quand on touche
  // ce qu'il laisse visible, ou avec Échap, qui rend le focus au déclencheur.
  useEffect(() => {
    if (!ouvert) return
    function surPointeur(e: PointerEvent) {
      if (!nav.current?.contains(e.target as Node)) setOuvert(false)
    }
    function surTouche(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      setOuvert(false)
      bouton.current?.focus()
    }
    document.addEventListener('pointerdown', surPointeur)
    document.addEventListener('keydown', surTouche)
    return () => {
      document.removeEventListener('pointerdown', surPointeur)
      document.removeEventListener('keydown', surTouche)
    }
  }, [ouvert])

  const fermer = () => setOuvert(false)

  return (
    <nav
      ref={nav}
      aria-label={t('admin.navigation')}
      className="sticky top-[var(--hauteur-entete)] z-40 border-b border-filet bg-fond2 lg:flex lg:h-[calc(100dvh-var(--hauteur-entete))] lg:w-60 lg:shrink-0 lg:flex-col lg:self-start lg:border-b-0 lg:border-r"
    >
      <button
        ref={bouton}
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-controls={idPanneau}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent sm:px-6 lg:hidden"
      >
        <span className="truncate font-semibold text-encre-t">{t(`${courante.espace}.titre`)}</span>
        <span className="flex shrink-0 items-center gap-2 text-doux">
          {t(ouvert ? 'admin.fermerMenu' : 'admin.menu')}
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className={clsx('size-3 transition-transform motion-reduce:transition-none', ouvert && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M2 4.5 6 8.5l4-4" />
          </svg>
        </span>
      </button>

      <div
        id={idPanneau}
        className={clsx(
          'absolute inset-x-0 top-full max-h-[calc(100dvh-var(--hauteur-entete)-3rem)] flex-col border-b border-filet bg-fond2',
          'lg:static lg:flex lg:max-h-none lg:min-h-0 lg:flex-1 lg:border-b-0',
          ouvert ? 'flex' : 'hidden',
        )}
      >
        {/* Seule la liste défile : la déconnexion reste épinglée sous elle, y
            compris sur un écran trop court pour tout montrer. */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-2 py-4">
          <LienRubrique rubrique={TABLEAU_DE_BORD} chemin={chemin} onClick={fermer} />
          {GROUPES_RUBRIQUES.map((groupe) => {
            const idTitre = `${idPanneau}-${groupe.cle}`
            return (
              <div key={groupe.cle}>
                <p id={idTitre} className="pb-1 pl-3.5 font-serif text-sm text-ocre">
                  {t(`admin.groupes.${groupe.cle}`)}
                </p>
                <ul aria-labelledby={idTitre}>
                  {groupe.rubriques.map((rubrique) => (
                    <li key={rubrique.href}>
                      <LienRubrique rubrique={rubrique} chemin={chemin} onClick={fermer} />
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <div className="border-t border-filet p-3">
          <LogoutButton className="w-full" />
        </div>
      </div>
    </nav>
  )
}
