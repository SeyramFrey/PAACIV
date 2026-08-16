import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { Journal } from '@/components/accueil/Journal'

function article(image: string | null) {
  return {
    id: 'a1',
    slug: 'un-article',
    titre_fr: 'Un article',
    titre_en: null,
    chapo_fr: 'Chapô',
    chapo_en: null,
    image,
    categorie: null,
    date_publication: '2026-08-01',
  }
}

function rendre(image: string | null) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <Journal articles={[article(image)]} surtitre="Journal" titre="Ce que nous publions" />
    </NextIntlClientProvider>,
  )
}

describe('Journal', () => {
  it('ne rend rien sans article publié', () => {
    const { container } = render(
      <NextIntlClientProvider locale="fr" messages={messages}>
        <Journal articles={[]} surtitre="Journal" titre="Ce que nous publions" />
      </NextIntlClientProvider>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  // Aucun des six articles n'a d'image de couverture en base : le cas « sans
  // image » est le cas RÉEL, pas une hypothèse. Avant ce repli, la moitié
  // gauche du cadre était un noeud vide — un trou dans la composition.
  // Requêtes portées sur l'`<article>`, pas sur le conteneur : la section a
  // sa propre image de fond en parallaxe, qui répondrait à `querySelector`.
  it('pose un visuel de repli quand l’article n’a pas d’image', () => {
    const { getByTestId, container } = rendre(null)
    expect(getByTestId('visuel-absent')).toBeInTheDocument()
    expect(container.querySelector('article img')).toBeNull()
  })

  it('rend l’image quand elle existe, sans repli', () => {
    const { queryByTestId, container } = rendre('https://exemple.test/photo.jpg')
    expect(queryByTestId('visuel-absent')).toBeNull()
    expect(container.querySelector('article img')?.getAttribute('src')).toBe('https://exemple.test/photo.jpg')
  })
})
