import type { Page } from '@playwright/test'
import { CLE_INTRO_VUE } from '@/lib/intro'

// Le film d'ouverture couvre la page à la première arrivée sur l'accueil dans
// un onglet (choix de Sey du 13/11/2026, lib/intro.ts) : un test qui clique
// dans l'accueil y buterait. Celui-ci arrive comme un visiteur qui l'a déjà
// vu dans cet onglet. Le film lui-même est couvert par
// `tests/accueil-film.spec.ts`.
export async function filmDejaVu(page: Page) {
  await page.addInitScript((cle) => sessionStorage.setItem(cle, 'oui'), CLE_INTRO_VUE)
}
