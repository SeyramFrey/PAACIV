import { describe, expect, it } from 'vitest'
import { modeLeger } from '../mode-leger'

describe('modeLeger', () => {
  it("suit la connexion tant que le visiteur n'a rien choisi", () => {
    expect(modeLeger(null, true)).toBe(true)
    expect(modeLeger(null, false)).toBe(false)
  })

  it('fait primer le choix du visiteur sur la connexion', () => {
    expect(modeLeger('oui', false)).toBe(true)
    expect(modeLeger('non', true)).toBe(false)
  })
})
