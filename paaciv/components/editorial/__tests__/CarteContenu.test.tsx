import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { CarteContenu } from '@/components/editorial/CarteContenu'

// `@/i18n/navigation`'s `Link` (next-intl) exige un contexte d'intl côté
// client — même convention que `components/carte/__tests__/FiltresCarte.test.tsx`.
function renderAvecProvider(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="fr" messages={{}}>
      {ui}
    </NextIntlClientProvider>,
  )
}

describe('CarteContenu', () => {
  it('rend le titre dans un lien', () => {
    // `href` ne porte pas le préfixe de locale : `Link` (next-intl) l'ajoute
    // lui-même, comme dans CartePatrimoine (`/patrimoine/${item.slug}`).
    renderAvecProvider(<CarteContenu href="/articles/a" image={null} titre="Mon titre" />)
    expect(screen.getByRole('link', { name: /Mon titre/ })).toHaveAttribute('href', '/fr/articles/a')
  })

  it("omet le badge, la date et l'image quand ils sont absents", () => {
    const { container } = renderAvecProvider(<CarteContenu href="/x" image={null} titre="T" />)
    expect(container.querySelector('img')).toBeNull()
    expect(screen.queryByTestId('carte-badge')).toBeNull()
    expect(screen.queryByTestId('carte-date')).toBeNull()
  })

  it('rend le badge, la date et l\'image quand ils sont fournis', () => {
    renderAvecProvider(
      <CarteContenu
        href="/x"
        image="https://exemple.test/i.jpg"
        badge="Histoires"
        date="12 mars 2026"
        titre="T"
        extrait="Chapô"
      />,
    )
    expect(screen.getByTestId('carte-badge')).toHaveTextContent('Histoires')
    expect(screen.getByTestId('carte-date')).toHaveTextContent('12 mars 2026')
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://exemple.test/i.jpg')
  })
})
