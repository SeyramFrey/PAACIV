export function slugify(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Un `params.slug` arrive PERCENT-ENCODÉ dans l'App Router (vérifié sur Next
// 16.3 : /fr/architectes/Aka%20Raymond livre littéralement « Aka%20Raymond »).
// Comparé tel quel au slug en base, il ne correspond à rien et la fiche part
// en 404 — c'est exactement ce qui est arrivé au premier architecte saisi avec
// un espace dans son slug.
//
// Un slug passé par `slugify` est ASCII pur et ne bouge pas au décodage : ce
// filet ne sert donc que les slugs HÉRITÉS, écrits avant que la normalisation
// ne soit imposée côté admin. Il ne remplace pas cette normalisation, il évite
// que les lignes déjà en base restent inaccessibles.
export function slugParam(brut: string): string {
  try {
    return decodeURIComponent(brut)
  } catch {
    // Séquence % invalide (« 100% ») : `decodeURIComponent` lève une URIError.
    // Chercher le slug brut rendra un 404 honnête, là où laisser passer
    // l'exception rendrait une erreur 500.
    return brut
  }
}

// Normalisation du slug à l'ÉCRITURE. Le champ Slug de l'admin est libre :
// sans ce passage, ce qui y est tapé partait tel quel en base, y compris des
// espaces et des majuscules, et fabriquait une URL qu'aucune fiche ne sait
// résoudre. Une saisie vide — ou qui ne laisse rien d'utile une fois
// normalisée, comme « --- » — retombe sur le repli (le nom ou le titre).
export function normaliserSlug(saisi: string | null | undefined, repli: string): string {
  return (saisi ? slugify(saisi) : '') || slugify(repli)
}
