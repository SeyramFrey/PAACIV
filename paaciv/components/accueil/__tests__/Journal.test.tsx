import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Journal } from '@/components/accueil/Journal'

describe('Journal', () => {
  it('ne rend rien sans article publié', () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Journal articles={[]} surtitre="Journal" titre="Ce que nous publions" />
      </NextIntlClientProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
