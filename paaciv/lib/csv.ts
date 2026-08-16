// Export CSV minimal (RFC 4180). Écrit à la main plutôt qu'avec une
// dépendance : quatre lignes de code contre un paquet de plus à maintenir.
function cellule(v: string | number | null): string {
  if (v === null) return ''
  const s = String(v)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function versCsv(lignes: Record<string, string | number | null>[]): string {
  if (lignes.length === 0) return ''
  const colonnes = Object.keys(lignes[0])
  const entete = colonnes.join(',')
  const corps = lignes.map((l) => colonnes.map((c) => cellule(l[c] ?? null)).join(','))
  return [entete, ...corps].join('\r\n')
}
