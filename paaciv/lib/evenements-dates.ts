// Partition à-venir / passés. La date de référence est injectée pour rester testable.

export type AvecDates = { date_debut: string; date_fin: string | null }

/** Un événement n'est passé qu'une fois son dernier jour terminé (date_fin, sinon date_debut). */
function estPasse(e: AvecDates, reference: Date): boolean {
  const dernierJour = e.date_fin ?? e.date_debut
  return new Date(`${dernierJour}T23:59:59.999Z`).getTime() < reference.getTime()
}

export function partitionnerEvenements<T extends AvecDates>(
  evenements: T[],
  reference: Date,
): { aVenir: T[]; passes: T[] } {
  const aVenir: T[] = []
  const passes: T[] = []
  for (const e of evenements) (estPasse(e, reference) ? passes : aVenir).push(e)
  aVenir.sort((a, b) => a.date_debut.localeCompare(b.date_debut))
  passes.sort((a, b) => b.date_debut.localeCompare(a.date_debut))
  return { aVenir, passes }
}
