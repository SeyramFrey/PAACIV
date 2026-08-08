export function champ(fr: string | null, en: string | null, locale: string): string {
  if (locale === 'en') return en || fr || ''
  return fr || ''
}
