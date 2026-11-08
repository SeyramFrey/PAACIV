import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Hero } from '@/components/accueil/Hero'

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

function monter() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Hero titre="Ce qui tient debout" intro="Nous documentons." accroche={null} />
    </NextIntlClientProvider>,
  )
}

describe('Hero', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-leger')
    // jsdom n'a ni IntersectionObserver ni lecture vidéo.
    window.IntersectionObserver = class {
      observe() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver
  })

  it('affiche le titre en un seul h1', () => {
    monter()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ce qui tient debout')
  })

  it('pose l’affiche du film en priorité haute, puis monte le film', async () => {
    monter()
    expect(screen.getByTestId('hero-affiche')).toHaveAttribute('fetchpriority', 'high')
    await waitFor(() => expect(screen.getByTestId('hero-film')).toBeInTheDocument())
    expect(screen.getByTestId('hero-film').querySelectorAll('source')).toHaveLength(2)
  })

  it('garde l’affiche seule en mouvement réduit', async () => {
    setMatchMedia(true)
    monter()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.getByTestId('hero-affiche')).toBeInTheDocument()
    expect(screen.queryByTestId('hero-film')).toBeNull()
  })

  it('garde l’affiche seule en mode léger', async () => {
    document.documentElement.setAttribute('data-leger', '')
    monter()
    await new Promise((r) => setTimeout(r, 20))
    expect(screen.queryByTestId('hero-film')).toBeNull()
  })

  it('montre le petit emblème et garde le fond plein écran', () => {
    const { container } = monter()
    expect(screen.getByTestId('hero-embleme')).toBeInTheDocument()
    const section = container.querySelector('#top')
    expect(section).toHaveClass('min-h-[100svh]')
    expect(section).toHaveStyle({ background: 'var(--deep)' })
  })
})
