import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Hero } from '@/components/accueil/Hero'
import type { VedetteHero } from '@/lib/data/accueil'

vi.mock('@/components/soutenir/ContexteSoutien', () => ({
  useSoutien: () => ({ ouvrir: vi.fn() }),
}))

// jsdom n'implémente pas `matchMedia` (Hero.tsx l'appelle, comme
// Revelations.tsx, sans garde) : même double pilotable que
// components/ui/__tests__/Revelations.test.tsx.
function setMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  setMatchMedia(false)
})

const VEDETTES: VedetteHero[] = [
  { slug: 'kong', titre_fr: 'Grande mosquée de Kong', titre_en: null, ville: 'Kong', date_texte: 'XVIIIᵉ siècle', image: 'https://x/1.jpg' },
  { slug: 'bassam', titre_fr: 'Mairie de Grand-Bassam', titre_en: null, ville: 'Grand-Bassam', date_texte: '1895', image: 'https://x/2.jpg' },
]

function monter(vedettes = VEDETTES) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Hero vedettes={vedettes} titre="Ce qui tient debout" intro="Nous documentons." accroche={null} />
    </NextIntlClientProvider>,
  )
}

describe('Hero', () => {
  it('affiche le titre en un seul h1', () => {
    monter()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ce qui tient debout')
  })

  it('affiche une vignette par vedette et la légende de la première', () => {
    monter()
    expect(screen.getAllByRole('button', { name: /voir/i })).toHaveLength(2)
    expect(screen.getByTestId('hero-legende')).toHaveTextContent('Grande mosquée de Kong')
  })

  it('change la légende au clic sur une vignette, en l’échangeant au creux du fondu', async () => {
    monter()
    await userEvent.click(screen.getAllByRole('button', { name: /voir/i })[1])

    // Immédiatement après le clic, le fondu sortant vient de démarrer : la
    // maquette échange le texte à 260 ms, pas avant. S'il changeait déjà ici,
    // ce serait un saut visible plutôt que le fondu attendu.
    expect(screen.getByTestId('hero-legende')).toHaveTextContent('Grande mosquée de Kong')

    // Le texte n'apparaît qu'une fois le creux du fondu passé.
    await waitFor(() => {
      expect(screen.getByTestId('hero-legende')).toHaveTextContent('Mairie de Grand-Bassam')
    })
  })

  it('reste affichable sans aucune vedette, fond sombre plein écran conservé', () => {
    const { container } = monter([])
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /voir/i })).toHaveLength(0)

    // La dette héritée de la Task 9 repose sur ce fond sombre plein écran :
    // sans vedette, ni la hauteur ni le fond ne doivent bouger, sous peine
    // de rendre l'en-tête transparent illisible.
    const section = container.querySelector('#top')
    expect(section).not.toBeNull()
    expect(section).toHaveClass('min-h-[100svh]')
    expect(section).toHaveStyle({ background: 'var(--deep)' })
  })
})
