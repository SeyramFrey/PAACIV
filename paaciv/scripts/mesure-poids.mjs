// Poids réel d'une page, sans cache : `node scripts/mesure-poids.mjs <url> [url…]`.
// Mesure le HTML, le JS et le CSS que la page charge d'emblée, en gzip.
import { gzipSync } from 'node:zlib'

const ko = (n) => `${(n / 1024).toFixed(0)} Ko`
const gz = (b) => gzipSync(b).length

for (const url of process.argv.slice(2)) {
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
  console.log(`${url}\n  HTML ${ko(gz(Buffer.from(html)))} · JS ${ko(js)} · CSS ${ko(css)} (gzip)`)
}
