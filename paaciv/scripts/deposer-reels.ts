// Dépose des réels Instagram préparés hors de l'admin : la vidéo telle quelle,
// l'affiche avec ses versions WebP (comme `televerserImage`), puis la ligne
// de la table `reels` (migration 0037).
//
//   npx jiti scripts/deposer-reels.ts <manifeste.json>           # dépose
//   npx jiti scripts/deposer-reels.ts <manifeste.json> --essai   # vérifie seulement
//
// Le manifeste est une liste de réels :
//   [{ "video": "C:/…/extrait.mp4", "affiche": "C:/…/affiche.jpg",
//      "lien": "https://www.instagram.com/…", "legende_fr": "…",
//      "legende_en": "…", "credit": null, "ordre": 1, "statut": "publie" }]
//
// Pourquoi un script : un réel tel qu'exporté du montage pèse 100 à 500 Mo,
// au-delà de ce que l'admin accepte (20 Mo). On en tire un extrait léger
// (540×960, 30 i/s, sans le son, ~20 s, 1,5 à 3 Mo) :
//   ffmpeg -ss <début> -t 20 -i réel.mp4 -vf "scale=540:960:flags=lanczos,fps=30,format=yuv420p" \
//     -c:v libx264 -preset slow -crf 26 -profile:v high -level 4.0 -movflags +faststart -an extrait.mp4
// La carte de l'accueil est un aperçu muet : le réel complet, avec le son,
// reste sur Instagram, où la carte renvoie.
//
// Lit .env.local : SUPABASE_SERVICE_ROLE_KEY, ou à défaut TEST_ADMIN_EMAIL et
// TEST_ADMIN_PASSWORD (mêmes droits que l'admin). Un réel dont la légende
// française existe déjà est ignoré : le script peut être relancé.
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { televerserImage } from '../lib/images/televerser'
import { cheminsStockes } from '../lib/media'
import { estLienInstagram } from '../lib/reels'

type Entree = {
  video: string
  affiche: string
  lien: string
  legende_fr: string
  legende_en?: string | null
  credit?: string | null
  date_publication?: string | null
  ordre?: number
  statut?: 'brouillon' | 'publie'
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split(/\r?\n/)
    .map((l) => l.match(/^([A-Z_]+)=(.*)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => [m[1], m[2].replace(/^"|"$/g, '')]),
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL absent de .env.local')

async function client() {
  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  }
  const sb = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  const { error } = await sb.auth.signInWithPassword({ email: env.TEST_ADMIN_EMAIL, password: env.TEST_ADMIN_PASSWORD })
  if (error) throw new Error(`Connexion admin impossible : ${error.message}`)
  return sb
}

const UN_AN = '31536000'
const MAX_VIDEO = 20 * 1024 * 1024

const fichier = process.argv[2]
if (!fichier) throw new Error('Usage : npx jiti scripts/deposer-reels.ts <manifeste.json> [--essai]')
const essai = process.argv.includes('--essai')
const entrees = JSON.parse(readFileSync(fichier, 'utf8')) as Entree[]

// Tout est vérifié avant d'écrire quoi que ce soit.
for (const e of entrees) {
  if (!estLienInstagram(e.lien)) throw new Error(`Lien refusé : ${e.lien}`)
  if (!e.legende_fr) throw new Error(`Légende manquante : ${e.video}`)
  const taille = readFileSync(e.video).length
  if (taille > MAX_VIDEO) throw new Error(`Vidéo trop lourde (${(taille / 1e6).toFixed(1)} Mo) : ${e.video}`)
  readFileSync(e.affiche)
}
console.log(`${entrees.length} réel(s) vérifié(s).`)
if (essai) process.exit(0)

const sb = await client()
const stockage = sb.storage.from('patrimoine')

for (const e of entrees) {
  const { data: deja } = await sb.from('reels').select('id').eq('legende_fr', e.legende_fr).maybeSingle()
  if (deja) {
    console.log(`déjà là, ignoré : ${e.legende_fr}`)
    continue
  }
  const id = randomUUID()
  const horodatage = Date.now()
  const cheminVideo = `reels/${id}/${horodatage}.mp4`
  const cheminAffiche = `reels/${id}/${horodatage}-affiche.jpg`

  const { error: eVideo } = await stockage.upload(cheminVideo, readFileSync(e.video), {
    contentType: 'video/mp4',
    cacheControl: UN_AN,
    upsert: false,
  })
  if (eVideo) throw eVideo

  const affiche = new File([readFileSync(e.affiche)], 'affiche.jpg', { type: 'image/jpeg' })
  const { error: eAffiche } = await televerserImage(sb, cheminAffiche, affiche)
  if (eAffiche) {
    await stockage.remove([cheminVideo])
    throw eAffiche
  }

  const { error: eLigne } = await sb.from('reels').insert({
    id,
    video: cheminVideo,
    affiche: cheminAffiche,
    lien: e.lien,
    legende_fr: e.legende_fr,
    legende_en: e.legende_en ?? null,
    credit: e.credit ?? null,
    date_publication: e.date_publication ?? null,
    ordre: e.ordre ?? 0,
    statut: e.statut ?? 'brouillon',
  })
  if (eLigne) {
    await stockage.remove([cheminVideo, ...cheminsStockes(cheminAffiche)])
    throw eLigne
  }
  console.log(`déposé : ${e.legende_fr}`)
}
