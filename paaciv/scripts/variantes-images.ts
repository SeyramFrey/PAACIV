// Crée les versions réduites qui manquent dans le bucket `patrimoine` : images
// envoyées avant leur mise en place, ou par une version du site qui ne les
// fabriquait pas. Sans elles, ces images s'afficheraient cassées.
//
//   npx jiti scripts/variantes-images.ts           # crée ce qui manque
//   npx jiti scripts/variantes-images.ts --essai   # liste sans rien écrire
//
// Lit .env.local : SUPABASE_SERVICE_ROLE_KEY, ou à défaut TEST_ADMIN_EMAIL et
// TEST_ADMIN_PASSWORD.
// Peut être relancé sans risque : rien n'est réécrit.
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { LARGEURS_IMAGE, cheminVariante } from '../lib/media'
import { variantesImage } from '../lib/images/televerser'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => [m[1], m[2].replace(/^"|"$/g, '')]),
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL absent de .env.local')

// La clé de service si elle est là, sinon le compte admin de test : les règles
// du bucket l'autorisent à écrire.
async function client() {
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  }
  const sb = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { error } = await sb.auth.signInWithPassword({ email: env.TEST_ADMIN_EMAIL, password: env.TEST_ADMIN_PASSWORD })
  if (error) throw new Error(`Connexion admin impossible : ${error.message}`)
  return sb
}

const essai = process.argv.includes('--essai')
const stockage = (await client()).storage.from('patrimoine')
const EST_VARIANTE = new RegExp(`\\.(?:${LARGEURS_IMAGE.join('|')})\\.webp$`)

async function lister(dossier = ''): Promise<string[]> {
  const fichiers: string[] = []
  for (let page = 0; ; page += 1) {
    const { data, error } = await stockage.list(dossier, { limit: 1000, offset: page * 1000 })
    if (error) throw error
    for (const e of data) {
      const chemin = dossier ? `${dossier}/${e.name}` : e.name
      // Un dossier n'a pas d'identifiant dans la réponse de Storage.
      if (e.id === null) fichiers.push(...(await lister(chemin)))
      else fichiers.push(chemin)
    }
    if (data.length < 1000) return fichiers
  }
}

const tous = await lister()
const presents = new Set(tous)
const originaux = tous.filter((c) => !EST_VARIANTE.test(c) && !c.endsWith('.emptyFolderPlaceholder'))
let crees = 0
let illisibles = 0

for (const chemin of originaux) {
  const manquantes = LARGEURS_IMAGE.filter((l) => !presents.has(cheminVariante(chemin, l)))
  if (manquantes.length === 0) continue
  console.log(`${essai ? 'à faire' : 'création'} : ${chemin} (${manquantes.join(', ')})`)
  if (essai) continue

  const { data, error } = await stockage.download(chemin)
  if (error) throw error
  let variantes
  try {
    variantes = await variantesImage(Buffer.from(await data.arrayBuffer()))
  } catch {
    console.warn(`  illisible, ignorée : ${chemin}`)
    illisibles += 1
    continue
  }
  for (const v of variantes.filter((v) => manquantes.includes(v.largeur))) {
    const { error: e } = await stockage.upload(cheminVariante(chemin, v.largeur), v.contenu, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    })
    if (e) throw e
    crees += 1
  }
}

console.log(`${originaux.length} image(s) dans le bucket, ${crees} version(s) créée(s), ${illisibles} illisible(s).`)
