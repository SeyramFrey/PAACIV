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
    const { container } = renderAvecProvider(
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
    // `alt=""` (décoratif, le titre est déjà porté par le <h3>) : l'image
    // perd le rôle ARIA « img », on la retrouve donc par sélecteur CSS plutôt
    // que par `getByRole`.
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://exemple.test/i.jpg')
  })

  it('superpose la pastille de lecture quand badgeLecture est fourni', () => {
    const { container } = renderAvecProvider(
      <CarteContenu href="/x" image="https://exemple.test/i.jpg" titre="T" badgeLecture testId="carte-reportage" />,
    )
    expect(container.querySelector('img')).not.toBeNull()
    expect(container.textContent).toContain('▶')
  })

  it('omet la pastille de lecture par défaut', () => {
    const { container } = renderAvecProvider(
      <CarteContenu href="/x" image="https://exemple.test/i.jpg" titre="T" />,
    )
    expect(container.textContent).not.toContain('▶')
  })
})
