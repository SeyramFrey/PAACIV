// La ligne d'heure « Plateau, Abidjan · 16 h 20 » (moodboard du 13/11/2026,
// geste de Radio Garden : l'heure du lieu, pas celle du visiteur).
//
// Abidjan vit à UTC+0 toute l'année, sans heure d'été. On passe quand même par
// `Intl` et le fuseau `Africa/Abidjan` : c'est le fuseau qui fait foi, pas une
// hypothèse codée en dur.
//
// Module sans React, pour être testé seul. Le composant est
// `components/ui/LigneHeure.tsx`.

export type HeureAbidjan = {
  /** L'heure telle qu'on l'affiche : « 16 h 20 » en français, « 16:20 » en anglais. */
  texte: string
  /** La valeur machine de `<time datetime>` : « 16:20 ». */
  iso: string
}

export function heureAbidjan(instant: Date, locale: string): HeureAbidjan {
  const parties = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Abidjan',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const h = parties.find((p) => p.type === 'hour')?.value ?? '00'
  const m = parties.find((p) => p.type === 'minute')?.value ?? '00'
  const iso = `${h}:${m}`
  // Typographie française : « 16 h 20 », heure sans zéro initial, espaces
  // insécables pour que la ligne ne se coupe jamais au milieu de l'heure.
  const texte = locale === 'en' ? iso : `${Number(h)} h ${m}`
  return { texte, iso }
}

/** Le numéro de la minute en cours : il ne change qu'une fois par minute. */
export function minuteCourante(maintenant = Date.now()): number {
  return Math.floor(maintenant / 60_000)
}

/** Millisecondes avant la prochaine minute pleine, pour changer l'heure pile à temps. */
export function delaiAvantMinute(maintenant = Date.now()): number {
  return 60_000 - (maintenant % 60_000)
}
