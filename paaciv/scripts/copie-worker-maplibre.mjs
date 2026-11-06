// Copie le worker de MapLibre dans `public/maplibre/`, avant `dev` et `build`.
//
// Depuis la v6, MapLibre ne livre plus de worker autonome : sans
// `setWorkerUrl()`, il déduit l'adresse du fichier de `import.meta.url`, qui ne
// désigne rien de servable une fois passé dans Turbopack. Aucun worker ne
// démarre, ni fond vectoriel ni points ne se chargent, et l'évènement `load` ne
// part jamais. C'est ce qui avait fait redescendre le projet en v4 en août 2026
// (commit d8a2e24).
//
// `new URL(..., import.meta.url)` ne suffit pas sous Next : le worker est bien
// émis, mais pas `maplibre-gl-shared.mjs`, qu'il importe par chemin relatif.
// D'où la copie des DEUX fichiers, côte à côte.
//
// Le dossier n'est pas versionné : recopié à chaque build depuis `node_modules`,
// le worker a toujours la version de la bibliothèque installée, et une archive
// de déploiement, qui ne contient que des sources, le reconstitue sur le serveur.
import { copyFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const dist = path.join(
  path.dirname(createRequire(import.meta.url).resolve('maplibre-gl/package.json')),
  'dist',
)
const destination = path.join(process.cwd(), 'public', 'maplibre')

mkdirSync(destination, { recursive: true })
for (const fichier of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  copyFileSync(path.join(dist, fichier), path.join(destination, fichier))
}
