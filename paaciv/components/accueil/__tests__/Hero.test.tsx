import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Hero } from '@/components/accueil/Hero'
import type { VedetteHero } from '@/lib/data/accueil'

vi.mock('@/components/soutenir/ContexteSoutien', () => ({
  useSoutien: () => ({ ouvrir: vi.fn() }),
}))

const VEDETTES: VedetteHero[] = [
  { slug: 'kong', titre_fr: 'Grande mosquée de Kong', titre_en: null, ville: 'Kong', date_texte: 'XVIIIᵉ siècle', image: 'https://x/1.jpg' },
  { slug: 'bassam', titre_fr: 'Mairie de Grand-Bassam', titre_en: null, ville: 'Grand-Bassam', date_texte: '1895', image: 'https://x/2.jpg' },
]

function monter(vedettes = VEDETTES) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Hero vedettes={vedettes} titre="Ce qui tient debout" intro="Nous documentons." />
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

  it('change la légende au clic sur une vignette', async () => {
    monter()
    await userEvent.click(screen.getAllByRole('button', { name: /voir/i })[1])
    expect(screen.getByTestId('hero-legende')).toHaveTextContent('Mairie de Grand-Bassam')
  })

  it('reste affichable sans aucune vedette', () => {
    monter([])
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(screen.queryAllByRole('button', { name: /voir/i })).toHaveLength(0)
  })
})
