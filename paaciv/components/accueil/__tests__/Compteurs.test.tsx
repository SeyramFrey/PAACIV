import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Compteurs } from '@/components/accueil/Compteurs'

function monter() {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Compteurs chiffres={{ fiches: 8, villes: 5, architectes: 7, articles: 6 }} />
    </NextIntlClientProvider>,
  )
}

describe('Compteurs', () => {
  it('expose la cible en data-count pour le moteur d’animation', () => {
    monter()
    const cibles = screen.getAllByTestId('compteur').map((el) => el.getAttribute('data-count'))
    expect(cibles).toEqual(['8', '5', '7', '6'])
  })

  it('affiche 0 au rendu serveur, avant animation', () => {
    monter()
    expect(screen.getAllByTestId('compteur').every((el) => el.textContent === '0')).toBe(true)
  })

  it('affiche les quatre libellés', () => {
    monter()
    for (const l of ['Fiches', 'Communes', 'Architectes', 'Publications']) {
      expect(screen.getByText(l)).toBeInTheDocument()
    }
  })
})
