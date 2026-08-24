// Vérificateur de contraste de la palette « Matières ».
//
// POURQUOI un script plutôt qu'un test : les jetons vivent dans app/globals.css
// en OKLCH, et rien dans la chaîne de build ne vérifie qu'un réglage de
// luminosité garde 4,5:1. La palette a été recalée sur le bâti ivoirien
// (latérite, banco, chaux, lagune, tôle) ; sans ce garde-fou, « rendre le banco
// plus terreux » se traduit silencieusement par un titre illisible en thème
// clair. Lancer : `node scripts/contraste.mjs` — sortie non nulle si un couple
// passe sous son seuil.
//
// Les valeurs sont LUES dans globals.css, jamais recopiées ici : un script qui
// contrôlerait sa propre copie de la palette ne contrôlerait rien.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const racine = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(racine, 'app/globals.css'), 'utf8')

/** Extrait le bloc `:root { … }` ou `[data-theme="dark"] { … }`. */
function bloc(selecteur) {
  const i = css.indexOf(selecteur + ' {')
  if (i < 0) throw new Error(`bloc introuvable : ${selecteur}`)
  return css.slice(i, css.indexOf('\n}', i))
}

/** Table `--jeton → valeur brute` pour un bloc. */
function jetons(selecteur) {
  const out = {}
  for (const m of bloc(selecteur).matchAll(/^\s*(--[\w-]+):\s*([^;]+);/gm)) out[m[1]] = m[2].trim()
  return out
}

const CLAIR = jetons(':root')
const SOMBRE = { ...CLAIR, ...jetons('[data-theme="dark"]') }

/** Résout un `var(--x)` en chaîne, puis en triplet OKLCH. */
function oklch(nom, table, profondeur = 0) {
  if (profondeur > 8) throw new Error(`cycle de var() sur ${nom}`)
  const brut = table[nom]
  if (!brut) throw new Error(`jeton absent : ${nom}`)
  const ref = brut.match(/^var\((--[\w-]+)\)$/)
  if (ref) return oklch(ref[1], table, profondeur + 1)
  const m = brut.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/)
  if (!m) throw new Error(`${nom} n'est pas un oklch() : ${brut}`)
  return [Number(m[1]), Number(m[2]), Number(m[3])]
}

/** OKLCH → sRGB linéaire (Björn Ottosson). */
function versLineaire([L, C, hDeg]) {
  const h = (hDeg * Math.PI) / 180
  const a = C * Math.cos(h)
  const b = C * Math.sin(h)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Luminance relative WCAG. Les canaux hors gamme sont bornés, comme le fait
 *  le navigateur à l'affichage — c'est cette couleur-là que l'œil compare. */
function luminance(t) {
  const [r, g, b] = versLineaire(t).map((v) => Math.min(1, Math.max(0, v)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// Couples réellement rendus par le site, avec leur seuil WCAG AA :
// 4,5 pour du texte courant, 3 pour du grand texte (titres ≥ 24 px) et pour
// les frontières d'éléments d'interface.
const COUPLES = [
  ['--ink', '--bg', 4.5, 'texte courant'],
  ['--ink', '--bg2', 4.5, 'texte sur surface secondaire'],
  ['--ink', '--bg3', 4.5, 'texte sur surface tertiaire'],
  ['--soft', '--bg', 4.5, 'texte secondaire'],
  ['--soft', '--bg2', 4.5, 'texte secondaire sur surface'],
  ['--ocre', '--bg', 3, 'titres (font-serif, ≥ 24 px)'],
  ['--ocre', '--bg2', 3, 'titres sur surface'],
  ['--terra', '--bg', 3, 'accent de texte'],
  ['--danger', '--bg', 4.5, 'alerte / état en danger'],
  ['--danger', '--bg2', 4.5, 'alerte sur surface'],
  ['--onDeep', '--deep', 4.5, 'texte sur les blocs sombres'],
  ['--surAccent', '--accent', 4.5, 'texte des boutons pleins'],
  ['--vert', '--bg', 3, 'état intact'],
]

let echecs = 0
console.log('couple                          clair   sombre  seuil')
for (const [avant, arriere, seuil, quoi] of COUPLES) {
  const c = contraste(oklch(avant, CLAIR), oklch(arriere, CLAIR))
  const s = contraste(oklch(avant, SOMBRE), oklch(arriere, SOMBRE))
  const ko = c < seuil || s < seuil
  if (ko) echecs++
  console.log(
    `${(avant + ' / ' + arriere).padEnd(30)} ${c.toFixed(2).padStart(5)} ${s.toFixed(2).padStart(7)} ${String(seuil).padStart(6)}` +
      (ko ? `   ✗ ${quoi}` : ''),
  )
}

if (echecs > 0) {
  console.error(`\n${echecs} couple(s) sous le seuil.`)
  process.exit(1)
}
console.log('\nTous les couples tiennent leur seuil dans les deux thèmes.')
