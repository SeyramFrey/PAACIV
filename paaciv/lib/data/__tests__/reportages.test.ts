import { describe, it, expect } from 'vitest'
import { miniatureReportage } from '@/lib/data/reportages'

describe('miniatureReportage', () => {
  it('renvoie une miniature ytimg pour une URL YouTube exploitable', () => {
    expect(miniatureReportage('https://youtu.be/PAACIVdemo3')).toBe(
      'https://i.ytimg.com/vi/PAACIVdemo3/hqdefault.jpg',
    )
  })

  it("renvoie null pour une URL non exploitable, sans planter (dégradation gracieuse)", () => {
    expect(miniatureReportage('https://example.com/pas-une-video')).toBeNull()
    expect(miniatureReportage('')).toBeNull()
  })
})
