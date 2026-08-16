import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Temoignages } from '@/components/accueil/Temoignages'

describe('Temoignages', () => {
  it('ne rend rien avec une table vide — comportement nominal aujourd’hui (spec §4.4)', () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Temoignages temoignages={[]} surtitre="Paroles" titre="Ils travaillent avec nous" />
      </NextIntlClientProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
