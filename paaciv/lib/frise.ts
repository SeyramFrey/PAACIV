// Mécanique de la frise chronologique du bâti.
//
// Tout ce qui est ici est PUR : ni React, ni base de données, ni DOM. C'est ce
// qui rend la frise testable — un test peut affirmer que deux édifices de 1963
// et 1964 ne se chevauchent pas, ce qu'aucune inspection visuelle ne garantit
// une fois la donnée changée. Le composant, lui, ne fait que dessiner ce que
// ces fonctions ont décidé.
//
// Le corpus est actuellement de sept fiches ; ces fonctions sont écrites pour
// en tenir plusieurs centaines, parce que c'est l'objet même de l'association
// d'en documenter plus.

/** Époque telle qu'elle vit en base depuis la migration 0029. */
export type EpoqueBornee = {
  id: string
  nom_fr: string
  nom_en: string | null
  couleur: string | null
  /** Nulle sur le précolonial : la période est ouverte vers le passé. */
  annee_min: number | null
  /** Nulle sur le contemporain : la période est ouverte vers le futur. */
  annee_max: number | null
}

export type DatationBrute = {
  annee_debut: number | null
  annee_fin: number | null
  date_texte: string | null
}

/**
 * Année à laquelle placer un édifice sur l'axe, ou `null` s'il n'est pas
 * datable.
 *
 * Ordre de préférence délibéré : `annee_debut` d'abord — un édifice se situe
 * dans le temps par sa CONSTRUCTION, pas par son achèvement ni par sa dernière
 * campagne de travaux. À défaut, `annee_fin`. En dernier recours seulement, un
 * millésime lu dans `date_texte`, qui est un champ libre.
 *
 * Le repli sur `date_texte` accepte le PREMIER nombre de quatre chiffres entre
 * 1000 et l'année courante + 10. Les deux bornes comptent : sans la borne
 * basse, « Quartier France, 1893, parcelle 2400 » placerait l'édifice en l'an
 * 2400 si l'ordre des nombres changeait ; sans la borne haute, une coquille de
 * saisie enverrait un point à l'infini et écraserait toute l'échelle. Une
 * mention comme « fin XIXᵉ – début XXᵉ » ne contient aucun millésime : elle
 * rend `null`, et l'édifice est listé hors frise plutôt que placé au hasard.
 */
export function anneeEdifice(d: DatationBrute, anneeCourante = new Date().getFullYear()): number | null {
  if (typeof d.annee_debut === 'number' && Number.isFinite(d.annee_debut)) return d.annee_debut
  if (typeof d.annee_fin === 'number' && Number.isFinite(d.annee_fin)) return d.annee_fin
  for (const m of (d.date_texte ?? '').matchAll(/\d{4}/g)) {
    const n = Number(m[0])
    if (n >= 1000 && n <= anneeCourante + 10) return n
  }
  return null
}

export type Bornes = { min: number; max: number }

/**
 * Bornes de l'axe, arrondies à la décennie.
 *
 * Une marge est ajoutée de part et d'autre pour deux raisons distinctes. À
 * gauche, elle laisse apparaître un pan de la période PRÉCÉDANT le plus ancien
 * édifice documenté — sans lui, une archive qui commence en 1893 donnerait à
 * croire que rien n'a été bâti avant, ce qui est précisément le contresens que
 * la frise doit défaire. À droite, elle empêche le dernier point de coller au
 * bord du cadre.
 */
export function bornesFrise(annees: number[], marge = 20): Bornes {
  if (annees.length === 0) return { min: 1890, max: 2000 }
  const brutMin = Math.min(...annees) - marge
  const brutMax = Math.max(...annees) + Math.round(marge / 2)
  const min = Math.floor(brutMin / 10) * 10
  const max = Math.ceil(brutMax / 10) * 10
  // Un corpus réduit à une seule année donnerait min === max, et une division
  // par zéro dans `positionRelative`.
  return max > min ? { min, max } : { min, max: min + 10 }
}

/** Position d'une année sur l'axe, de 0 (borne gauche) à 1 (borne droite). */
export function positionRelative(annee: number, b: Bornes): number {
  return (annee - b.min) / (b.max - b.min)
}

/**
 * Pas de graduation : le plus petit multiple usuel qui tienne l'axe sous
 * `maxGraduations` traits. Un axe de deux siècles gradué tous les dix ans est
 * illisible ; un axe de trente ans gradué tous les cent ans n'a plus de repère.
 */
export function pasGraduation(b: Bornes, maxGraduations = 14): number {
  for (const pas of [10, 20, 25, 50, 100, 200, 500]) {
    if ((b.max - b.min) / pas <= maxGraduations) return pas
  }
  return 1000
}

/** Les années graduées, bornes comprises. */
export function graduations(b: Bornes, maxGraduations = 14): number[] {
  const pas = pasGraduation(b, maxGraduations)
  const out: number[] = []
  for (let a = Math.ceil(b.min / pas) * pas; a <= b.max; a += pas) out.push(a)
  return out
}

/**
 * Répartit des points en VOIES (rangées) pour qu'aucune étiquette n'en recouvre
 * une autre.
 *
 * Algorithme glouton, sur une entrée triée par position : chaque point descend
 * dans la première voie dont la dernière étiquette est assez loin derrière lui.
 * C'est le placement optimal pour ce problème (coloration d'un graphe
 * d'intervalles) — pas une approximation — et il est linéaire.
 *
 * `largeurEtiquette` est exprimé dans la MÊME unité que `x`. C'est l'encombrement
 * horizontal réservé à une étiquette, pas la largeur du texte : une étiquette
 * plus longue que prévu déborde sur le vide à sa droite, ce qui se voit peu ;
 * deux étiquettes sur la même voie se chevauchent, ce qui se voit toujours.
 */
export function repartirVoies(x: number[], largeurEtiquette: number): number[] {
  const ordre = x.map((v, i) => i).sort((a, b) => x[a] - x[b])
  // `finVoie[v]` : abscisse à partir de laquelle la voie `v` est de nouveau libre.
  const finVoie: number[] = []
  const voies = new Array<number>(x.length)
  for (const i of ordre) {
    let v = 0
    while (v < finVoie.length && x[i] < finVoie[v]) v++
    finVoie[v] = x[i] + largeurEtiquette
    voies[i] = v
  }
  return voies
}

export type SegmentEpoque = {
  epoque: EpoqueBornee
  /** Bornes en position relative (0–1), déjà rognées à l'axe. */
  debut: number
  fin: number
}

/**
 * Découpe l'axe en bandes d'époque, rognées aux bornes visibles.
 *
 * Une époque entièrement hors cadre est écartée : la dessiner à largeur nulle
 * laisserait un nom d'époque flottant sur un segment invisible.
 */
export function segmentsEpoques(epoques: EpoqueBornee[], b: Bornes): SegmentEpoque[] {
  return epoques
    .map((epoque) => {
      const debut = positionRelative(Math.max(b.min, epoque.annee_min ?? b.min), b)
      const fin = positionRelative(Math.min(b.max, epoque.annee_max ?? b.max), b)
      return { epoque, debut, fin }
    })
    .filter((s) => s.fin > s.debut)
    .sort((a, b2) => a.debut - b2.debut)
}
