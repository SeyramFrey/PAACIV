// Poids réel d'une page, sans cache. Mesure le HTML, le JS et le CSS que la
// page charge d'emblée, en gzip.
//
//   node scripts/mesure-poids.mjs <url> [url…]          affiche les poids
//   node scripts/mesure-poids.mjs --budgets <origine>    compare aux budgets
//
// Avec `--budgets`, les pages et leurs plafonds viennent de
// `scripts/budgets-poids.json`, et le script sort en erreur si une page les
// dépasse. À lancer sur le staging après chaque déploiement (voir
// docs/deploiement.md) : les pages lisent la vraie base, elles ne se mesurent
// pas dans la CI, qui n'a que des identifiants factices.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const ko = (n) => Math.round(n / 1024)
const gz = (b) => gzipSync(b).length

async function mesurer(url) {
  const reponse = await fetch(url)
  if (!reponse.ok) throw new Error(`${url} : ${reponse.status}`)
  const html = await reponse.text()
  const liens = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css)[^"]*)"/g)].map((m) => m[1])
  let js = 0
  let css = 0
  for (const chemin of new Set(liens)) {
    const corps = Buffer.from(await (await fetch(new URL(chemin, url))).arrayBuffer())
    if (chemin.includes('.css')) css += gz(corps)
    else js += gz(corps)
  }
  return { html: ko(gz(Buffer.from(html))), js: ko(js), css: ko(css) }
}

const args = process.argv.slice(2)
if (args[0] === '--budgets') {
  const origine = args[1]
  if (!origine) throw new Error('Usage : --budgets <origine>, par exemple https://staging.paaciv.com')
  const budgets = JSON.parse(readFileSync(new URL('./budgets-poids.json', import.meta.url), 'utf8'))
  let depasse = false
  for (const [chemin, plafond] of Object.entries(budgets)) {
    if (chemin.startsWith('_')) continue
    const poids = await mesurer(new URL(chemin, origine).href)
    const ecarts = Object.keys(plafond).filter((k) => poids[k] > plafond[k])
    if (ecarts.length) depasse = true
    const detail = Object.keys(plafond)
      .map((k) => `${k.toUpperCase()} ${poids[k]}/${plafond[k]} Ko${ecarts.includes(k) ? ' ✗' : ''}`)
      .join(' · ')
    console.log(`${ecarts.length ? 'DÉPASSE' : 'ok     '} ${chemin}  ${detail}`)
  }
  if (depasse) {
    console.error('\nAu moins une page dépasse son budget (scripts/budgets-poids.json).')
    process.exit(1)
  }
} else {
  for (const url of args) {
    const p = await mesurer(url)
    console.log(`${url}\n  HTML ${p.html} Ko · JS ${p.js} Ko · CSS ${p.css} Ko (gzip)`)
  }
}
