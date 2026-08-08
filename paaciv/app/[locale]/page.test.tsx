import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import Home from './page'
import messages from '@/i18n/messages/fr.json'

describe('Home', () => {
  it("affiche l'accroche localisée (FR)", () => {
    render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Home />
      </NextIntlClientProvider>
    )
    expect(screen.getByTestId('accroche')).toHaveTextContent('patrimoine')
  })
})
