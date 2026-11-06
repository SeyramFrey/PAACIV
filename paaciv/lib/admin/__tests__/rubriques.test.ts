import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import fr from '@/i18n/messages/fr.json'
import en from '@/i18n/messages/en.json'
import { GROUPES_RUBRIQUES, TABLEAU_DE_BORD, estActive, rubriqueCourante } from '@/lib/admin/rubriques'

const rubriques = GROUPES_RUBRIQUES.flatMap((g) => g.rubriques)

describe('estActive', () => {
  it('garde la rubrique active sur ses sous-écrans', () => {
    expect(estActive('/admin/patrimoine', '/admin/patrimoine')).toBe(true)
    expect(estActive('/admin/patrimoine/12', '/admin/patrimoine')).toBe(true)
    expect(estActive('/admin/patrimoine/nouveau', '/admin/patrimoine')).toBe(true)
  })

  it("n'allume pas le tableau de bord sur les autres rubriques", () => {
    expect(estActive('/admin', '/admin')).toBe(true)
    expect(estActive('/admin/patrimoine', '/admin')).toBe(false)
  })

  it("n'allume pas une rubrique pour une voisine au nom plus long", () => {
    expect(estActive('/admin/articles-archives', '/admin/articles')).toBe(false)
  })
})

describe('rubriqueCourante', () => {
  it('retrouve la rubrique depuis un sous-écran', () => {
    expect(rubriqueCourante('/admin/medias/3')?.href).toBe('/admin/medias')
    expect(rubriqueCourante('/admin')).toBe(TABLEAU_DE_BORD)
  })
})

describe('carte des rubriques', () => {
  // Une rubrique ajoutée sans entrée de navigation serait un écran orphelin :
  // la seule façon d'y arriver serait de connaître son adresse.
  it('couvre tous les dossiers de app/[locale]/admin', () => {
    const dossiers = readdirSync(path.resolve('app/[locale]/admin'), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/admin/${d.name}`)
      .sort()
    expect(rubriques.map((r) => r.href).sort()).toEqual(dossiers)
  })

  it('a ses libellés dans les deux langues', () => {
    for (const messages of [fr, en] as Record<string, Record<string, unknown>>[]) {
      for (const r of [TABLEAU_DE_BORD, ...rubriques]) {
        expect(messages[r.espace]?.titre, r.espace).toBeTruthy()
      }
      const groupes = messages.admin.groupes as Record<string, string>
      for (const g of GROUPES_RUBRIQUES) expect(groupes[g.cle], g.cle).toBeTruthy()
    }
  })
})
