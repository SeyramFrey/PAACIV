import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import messages from '@/i18n/messages/fr.json'
import { CartesSoutien } from '@/components/accueil/CartesSoutien'

// Le vrai fournisseur monte les trois modales de soutien, donc le formulaire
// et ses actions serveur. Seule `ouvrir` intéresse ces cas.
vi.mock('@/components/soutenir/ContexteSoutien', () => ({
  useSoutien: () => ({ ouvrir: vi.fn() }),
}))

const BASE = {
  montant: null,
  enDangerTexte: null,
  demoliTexte: null,
  adhesionAvantages: null,
  donTexte: null,
  nbEnDanger: 0,
  nbDemoli: 0,
}

function rendre(props: Partial<typeof BASE> = {}) {
  return render(
    <NextIntlClientProvider locale="fr" messages={messages}>
      <CartesSoutien {...BASE} {...props} />
    </NextIntlClientProvider>,
  )
}

describe('CartesSoutien', () => {
  // Le corpus réel : au jour de la migration 0023, aucune des 8 fiches n'est
  // classée. Les deux cartes d'état ne doivent donc PAS s'afficher — elles
  // mèneraient vers « Aucun résultat ».
  it('masque les cartes d’état quand aucune fiche n’est classée', () => {
    rendre()
    expect(screen.queryByText('Patrimoine en danger')).toBeNull()
    expect(screen.queryByText('Patrimoine démoli')).toBeNull()
    // Les deux cartes d'action, elles, ne dépendent d'aucun corpus.
    expect(screen.getByText('Adhérer')).toBeTruthy()
    expect(screen.getByText('Faire un don')).toBeTruthy()
  })

  it('affiche « en danger » dès qu’une fiche est classée, et pas « démoli »', () => {
    rendre({ nbEnDanger: 3 })
    expect(screen.getByText('Patrimoine en danger')).toBeTruthy()
    expect(screen.queryByText('Patrimoine démoli')).toBeNull()
  })

  it('mène vers l’archive filtrée, pas vers /articles', () => {
    rendre({ nbEnDanger: 1, nbDemoli: 2 })
    const href = (nom: string) =>
      screen.getByText(nom).closest('a')?.getAttribute('href')
    // Le préfixe de langue porte sur le chemin seul, la requête reste intacte.
    expect(href('Patrimoine en danger')).toBe('/fr/archives?etat=en_danger')
    expect(href('Patrimoine démoli')).toBe('/fr/archives?etat=demoli')
  })

  // Le délai de révélation encode la POSITION dans la grille. Écrit en dur sur
  // chaque bloc, il se télescopait dès qu'une carte d'état manquait : deux
  // cartes voisines animées ensemble, puis un trou.
  it('renumérote les délais de révélation selon les cartes réellement rendues', () => {
    const { container } = rendre({ nbEnDanger: 1 })
    const delais = Array.from(container.querySelectorAll('[data-rv]')).map((el) =>
      el.getAttribute('data-d'),
    )
    expect(delais).toEqual([null, '90', '180'])
  })

  it('numérote les quatre cartes sans collision quand tout est visible', () => {
    const { container } = rendre({ nbEnDanger: 1, nbDemoli: 1 })
    const delais = Array.from(container.querySelectorAll('[data-rv]')).map((el) =>
      el.getAttribute('data-d'),
    )
    expect(delais).toEqual([null, '90', '180', '270'])
  })

  // `À COMPLÉTER` est filtré côté serveur (`Association.tsx`) et arrive donc en
  // `null` : le paragraphe disparaît au lieu d'afficher un texte de chantier.
  it('n’affiche aucun paragraphe quand le texte n’est pas renseigné', () => {
    rendre({ nbEnDanger: 1 })
    expect(screen.queryByText(/COMPLÉTER/)).toBeNull()
  })
})
