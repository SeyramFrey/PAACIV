import { getLocale } from 'next-intl/server'
import { champ } from '@/lib/i18n-champ'
import { fichierUrl, imageUrl, srcsetImage } from '@/lib/media'
import type { Reel } from '@/lib/data/reels'
import { RoueReels, type CarteReel } from '@/components/accueil/RoueReels'

// Les réels Instagram de l'association, dans l'épilogue de l'accueil
// (décision de Sey du 15/11/2026). Les adresses des fichiers sont résolues
// ici, côté serveur : la roue ne reçoit que ce qu'elle affiche.
export async function Reels({ reels }: { reels: Reel[] }) {
  // Aucun réel publié : le bloc entier disparaît.
  if (reels.length === 0) return null
  const locale = await getLocale()

  const cartes: CarteReel[] = reels.map((r) => {
    const affiche = r.affiche ? imageUrl(r.affiche, 960) : null
    return {
      id: r.id,
      video: fichierUrl(r.video),
      affiche,
      srcset: srcsetImage(affiche) ?? null,
      lien: r.lien,
      legende: champ(r.legende_fr, r.legende_en, locale) || null,
      credit: r.credit,
    }
  })

  return <RoueReels cartes={cartes} />
}
