'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { normaliserSlug } from '@/lib/slug'
import { texteOuNull, intOuNull, richeOuNull } from '@/lib/admin/champs'

export async function enregistrerArchitecte(formData: FormData): Promise<{ id: string }> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const nom = (formData.get('nom') ?? '').toString().trim()
  if (!nom) throw new Error('Nom requis')
  // Le champ Slug de l'admin est libre : normalisé ici comme il l'est quand
  // il est déduit du titre, sinon un « Aka Raymond » tapé à la main part tel
  // quel en base et fabrique une URL qu'aucune fiche ne résout.
  const slug = normaliserSlug(texteOuNull(formData.get('slug')), nom)

  const valeurs = {
    slug,
    nom,
    origine: (formData.get('origine') ?? 'ivoirien').toString(),
    annee_naissance: intOuNull(formData.get('annee_naissance')),
    annee_deces: intOuNull(formData.get('annee_deces')),
    periode_texte: texteOuNull(formData.get('periode_texte')),
    bio_fr: richeOuNull(formData.get('bio_fr')),
    bio_en: richeOuNull(formData.get('bio_en')),
    parcours_fr: richeOuNull(formData.get('parcours_fr')),
    parcours_en: richeOuNull(formData.get('parcours_en')),
    realisations_texte_fr: richeOuNull(formData.get('realisations_texte_fr')),
    realisations_texte_en: richeOuNull(formData.get('realisations_texte_en')),
    lieu_naissance: texteOuNull(formData.get('lieu_naissance')),
    profession_fr: texteOuNull(formData.get('profession_fr')),
    profession_en: texteOuNull(formData.get('profession_en')),
    agence: texteOuNull(formData.get('agence')),
    distinction_fr: texteOuNull(formData.get('distinction_fr')),
    distinction_en: texteOuNull(formData.get('distinction_en')),
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: (formData.get('statut') ?? 'brouillon').toString(),
  }

  let resultId: string
  if (id) {
    const { error } = await sb.from('architectes').update(valeurs).eq('id', id)
    if (error) throw error
    resultId = id
  } else {
    const { data, error } = await sb.from('architectes').insert(valeurs).select('id').single()
    if (error) throw error
    resultId = data.id
  }

  // Photo (optionnelle) : upload dans le bucket patrimoine, préfixe architectes/<id>/.
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    const ext = photo.name.split('.').pop() ?? 'jpg'
    const chemin = `architectes/${resultId}/${Date.now()}.${ext}`
    const { error: upErr } = await sb.storage.from('patrimoine').upload(chemin, photo, {
      contentType: photo.type || 'image/jpeg',
      upsert: false,
    })
    if (upErr) throw upErr
    const { error } = await sb.from('architectes').update({ photo: chemin }).eq('id', resultId)
    if (error) throw error
  }

  await enregistrerBlocs(sb, resultId, formData)

  revalidatePath('/[locale]/admin/architectes', 'page')
  return { id: resultId }
}

// Les quatre listes de la fiche sont réécrites EN BLOC : on supprime celles de
// l'architecte puis on réinsère ce que le formulaire envoie.
//
// Un rapprochement ligne à ligne serait plus économe, mais il faudrait faire
// voyager les identifiants jusqu'au navigateur et distinguer création,
// modification, suppression et réordonnancement — pour une poignée de lignes
// par fiche, réécrites une fois de temps en temps par une seule personne. Le
// coût réel de ce choix, c'est que les `id` changent à chaque enregistrement :
// rien ne les référence (la clé étrangère va dans l'autre sens, et le rendu les
// lit par `bloc`/`ordre`), donc rien ne casse.
//
// L'ordre est celui de la SAISIE, rang par rang à l'intérieur de chaque type :
// déplacer une ligne dans le formulaire déplace le bloc sur la fiche.
async function enregistrerBlocs(
  sb: Awaited<ReturnType<typeof createServerClient>>,
  architecteId: string,
  formData: FormData,
): Promise<void> {
  const types = formData.getAll('bloc_type').map(String)
  // Formulaire d'une version antérieure, ou sans le champ : on ne touche à
  // rien plutôt que d'effacer des blocs qu'on n'a pas reçus.
  if (types.length === 0) return

  const colonne = (nom: string) => formData.getAll(nom).map(String)
  const surtitreFr = colonne('bloc_surtitre_fr')
  const surtitreEn = colonne('bloc_surtitre_en')
  const titreFr = colonne('bloc_titre_fr')
  const titreEn = colonne('bloc_titre_en')
  const texteFr = colonne('bloc_texte_fr')
  const texteEn = colonne('bloc_texte_en')

  const rangs: Record<string, number> = {}
  const lignes = types
    .map((bloc, i) => ({
      architecte_id: architecteId,
      bloc,
      surtitre_fr: surtitreFr[i]?.trim() || null,
      surtitre_en: surtitreEn[i]?.trim() || null,
      titre_fr: titreFr[i]?.trim() ?? '',
      titre_en: titreEn[i]?.trim() || null,
      texte_fr: texteFr[i]?.trim() || null,
      texte_en: texteEn[i]?.trim() || null,
    }))
    // `titre_fr` est NOT NULL en base et porte le seul contenu obligatoire :
    // une ligne ajoutée puis laissée vide est un abandon de saisie, pas une
    // donnée. On la jette ici plutôt que de faire échouer l'insertion entière.
    .filter((l) => l.titre_fr.length > 0)
    .map((l) => ({ ...l, ordre: (rangs[l.bloc] = (rangs[l.bloc] ?? 0) + 1) }))

  const { error: delErr } = await sb
    .from('architecte_blocs')
    .delete()
    .eq('architecte_id', architecteId)
  if (delErr) throw delErr

  if (lignes.length > 0) {
    const { error } = await sb.from('architecte_blocs').insert(lignes)
    if (error) throw error
  }
}

export async function supprimerArchitecte(id: string): Promise<void> {
  const sb = await createServerClient()
  const { error } = await sb.from('architectes').delete().eq('id', id)
  if (error) throw error
  revalidatePath('/[locale]/admin/architectes', 'page')
}
