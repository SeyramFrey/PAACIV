export type PopupProps = {
  titre: string
  ville: string | null
  image: string | null
  typeNom: string | null
  typeCouleur: string | null
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
    const badge = document.createElement('div')
    badge.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:12px;margin-top:4px'
    const dot = document.createElement('span')
    dot.style.cssText = `display:inline-block;width:10px;height:10px;border-radius:9999px;background:${
      p.typeCouleur ?? '#8A3E1B'
    }`
    const lab = document.createElement('span')
    lab.textContent = p.typeNom
    badge.append(dot, lab)
    contenu.appendChild(badge)
  }

  if (p.ville) {
    const v = document.createElement('div')
    v.textContent = p.ville
    v.style.cssText = 'font-size:12px;margin-top:2px'
    contenu.appendChild(v)
  }

  return contenu
}
