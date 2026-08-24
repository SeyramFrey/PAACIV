import { COULEUR_DEFAUT } from '@/lib/carte-style'

export type PopupProps = {
  titre: string
  ville: string | null
  image: string | null
  typeNom: string | null
  typeCouleur: string | null
  /** Libellé traduit de l'état de conservation, ou `null` s'il n'est pas
   *  renseigné — ou hors vocabulaire. Le popup n'affiche alors pas la ligne
   *  plutôt qu'un slug brut, comme la fiche patrimoine. */
  etatNom?: string | null
  etatCouleur?: string | null
  /** Rature le libellé d'état. Réservé au démoli : la couleur seule ne dit pas
   *  qu'il n'y a plus de bâtiment. */
  etatDemoli?: boolean
}

/** Une ligne « pastille + libellé », commune au type et à l'état. */
function ligneAPastille(couleur: string, libelle: string, barre = false): HTMLElement {
  const ligne = document.createElement('div')
  ligne.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;margin-top:4px'
  const pastille = document.createElement('span')
  pastille.style.cssText =
    `display:inline-block;width:10px;height:10px;border-radius:9999px;flex:none;background:${couleur}`
  const texte = document.createElement('span')
  texte.textContent = libelle
  // Le démoli est RATURÉ, comme dans la pastille d'état du reste du site : la
  // couleur seule ne dit pas qu'il n'y a plus de bâtiment.
  if (barre) texte.style.textDecoration = 'line-through'
  ligne.append(pastille, texte)
  return ligne
}

export function construirePopupContenu(p: PopupProps): HTMLElement {
  const contenu = document.createElement('div')
  contenu.style.maxWidth = '180px'

  if (p.image) {
    const img = document.createElement('img')
    img.src = p.image
    img.loading = 'lazy'
    img.alt = ''
    img.style.cssText =
      'width:100%;height:96px;object-fit:cover;border-radius:6px;display:block;margin-bottom:6px'
    img.onerror = () => img.remove()
    contenu.appendChild(img)
  }

  const fort = document.createElement('strong')
  fort.textContent = p.titre
  contenu.appendChild(fort)

  if (p.typeNom) {
    contenu.appendChild(ligneAPastille(p.typeCouleur ?? COULEUR_DEFAUT, p.typeNom))
  }

  // L'état de conservation apparaît AU SURVOL, et pas seulement après avoir
  // ouvert la fiche : c'est le propos de l'association, il doit se lire sur la
  // carte elle-même.
  if (p.etatNom && p.etatCouleur) {
    contenu.appendChild(ligneAPastille(p.etatCouleur, p.etatNom, p.etatDemoli === true))
  }

  if (p.ville) {
    const v = document.createElement('div')
    v.textContent = p.ville
    v.style.cssText = 'font-size:12px;margin-top:2px'
    contenu.appendChild(v)
  }

  return contenu
}
