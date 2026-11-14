import { describe, expect, it } from 'vitest'
import {
  ETAPES_VISITE, EPILOGUE, estEtapeVisite, numeroEtape, railVisible, rangEtape,
} from '@/lib/etapes-visite'

describe('étapes de la visite', () => {
  it("suivent l'ordre décidé le 14/11/2026", () => {
    expect(ETAPES_VISITE).toEqual(['entree', 'sommaire', 'carte', 'lieux', 'archives', 'carnet'])
  })

  it('se numérotent sur deux chiffres, à partir de 01', () => {
    expect(rangEtape('entree')).toBe(1)
    expect(numeroEtape('carte')).toBe('03')
    expect(numeroEtape('carnet')).toBe('06')
  })

  it("reconnaissent une étape, pas l'épilogue ni une valeur inconnue", () => {
    expect(estEtapeVisite('lieux')).toBe(true)
    expect(estEtapeVisite(EPILOGUE)).toBe(false)
    expect(estEtapeVisite('salles')).toBe(false)
    expect(estEtapeVisite(undefined)).toBe(false)
  })

  it("n'affichent le rail ni sur l'entrée, ni dans l'épilogue, ni avant de savoir", () => {
    expect(railVisible(null)).toBe(false)
    expect(railVisible('entree')).toBe(false)
    expect(railVisible(EPILOGUE)).toBe(false)
    expect(railVisible('sommaire')).toBe(true)
    expect(railVisible('carnet')).toBe(true)
  })
})
