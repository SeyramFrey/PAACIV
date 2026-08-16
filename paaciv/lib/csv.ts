// Export CSV minimal (RFC 4180). Écrit à la main plutôt qu'avec une
// dépendance : quatre lignes de code contre un paquet de plus à maintenir.

// Neutralise l'injection de formule (CSV injection) : Excel et LibreOffice
// exécutent comme une formule toute cellule commençant par =, +, - ou @ à
// l'ouverture du fichier. Ce n'est pas théorique ici : lib/validation.ts
// accepte volontairement des adresses permissives comme "=1+1@exemple.ci",
// donc un anonyme peut déposer une adresse-piège via le formulaire
// newsletter public ; elle ressortirait telle quelle dans le CSV que
// l'association ouvre. On préfixe d'une apostrophe, convention reconnue par
// les deux tableurs pour forcer l'interprétation en texte.
const CARACTERE_FORMULE = /^[=+\-@]/

function cellule(v: string | number | null): string {
  if (v === null) return ''
  let s = String(v)
  if (CARACTERE_FORMULE.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function versCsv(lignes: Record<string, string | number | null>[]): string {
  if (lignes.length === 0) return ''
  const colonnes = Object.keys(lignes[0])
  const entete = colonnes.join(',')
  const corps = lignes.map((l) => colonnes.map((c) => cellule(l[c] ?? null)).join(','))
  return [entete, ...corps].join('\r\n')
}
