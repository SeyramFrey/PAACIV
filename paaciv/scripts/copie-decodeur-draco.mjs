// Copie le décodeur Draco de three.js dans `public/draco/`, avant `dev` et `build`.
//
// Le modèle de l'éléphant (`public/3d/elephant/elephant-eclats.glb`) est
// compressé en Draco. `DRACOLoader` va chercher son décodeur (un `.wasm` et son
// enveloppe JS) par URL, au moment du chargement : il doit donc être servi
// tel quel, à une adresse fixe, et non passer dans le bundle.
//
// Même logique que `copie-worker-maplibre.mjs` : le dossier n'est pas
// versionné, il est recopié depuis `node_modules` à chaque build, donc toujours
// à la version de three installée.
import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

const source = path.join(process.cwd(), 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf')
const destination = path.join(process.cwd(), 'public', 'draco')

mkdirSync(destination, { recursive: true })
for (const fichier of ['draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
  copyFileSync(path.join(source, fichier), path.join(destination, fichier))
}
