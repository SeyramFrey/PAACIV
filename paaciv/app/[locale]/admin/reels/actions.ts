'use server'

import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { texteOuNull, intOuNull } from '@/lib/admin/champs'
import { televerserImage } from '@/lib/images/televerser'
import { cheminsStockes } from '@/lib/media'
import { estLienInstagram } from '@/lib/reels'
import { TAILLE_MAX_VIDEO, TYPES_VIDEO } from '@/lib/admin/reels'

// Les réels Instagram de l'accueil (migration 0037). La vidéo est stockée
// telle quelle dans le bucket `patrimoine`, sous `reels/<id>/` ; l'affiche,
// tirée de la vidéo par le formulaire, passe par `televerserImage` comme toute
// image (versions WebP, métadonnées retirées).

export type ErreurReel =
  | 'lienInvalide'
  | 'videoRequise'
  | 'videoFormat'
  | 'videoTropLourde'
  | 'afficheIllisible'
  | 'echec'

export type ResultatReel = { ok: true; id: string } | { ok: false; erreur: ErreurReel }

const UN_AN = '31536000'

function extensionVideo(type: string): string {
  return type === 'video/webm' ? 'webm' : 'mp4'
}

export async function enregistrerReel(formData: FormData): Promise<ResultatReel> {
  const sb = await createServerClient()
  const id = texteOuNull(formData.get('id'))
  const lien = (formData.get('lien') ?? '').toString().trim()
  if (!estLienInstagram(lien)) return { ok: false, erreur: 'lienInvalide' }

  const video = formData.get('video')
  const nouvelleVideo = video instanceof File && video.size > 0 ? video : null
  if (!id && !nouvelleVideo) return { ok: false, erreur: 'videoRequise' }
  if (nouvelleVideo) {
    if (!(TYPES_VIDEO as readonly string[]).includes(nouvelleVideo.type)) return { ok: false, erreur: 'videoFormat' }
    if (nouvelleVideo.size > TAILLE_MAX_VIDEO) return { ok: false, erreur: 'videoTropLourde' }
  }
  const affiche = formData.get('affiche')
  const nouvelleAffiche = affiche instanceof File && affiche.size > 0 ? affiche : null

  const valeurs = {
    lien,
    legende_fr: texteOuNull(formData.get('legende_fr')),
    legende_en: texteOuNull(formData.get('legende_en')),
    credit: texteOuNull(formData.get('credit')),
    date_publication: texteOuNull(formData.get('date_publication')),
    ordre: intOuNull(formData.get('ordre')) ?? 0,
    statut: formData.get('statut') === 'publie' ? 'publie' : 'brouillon',
  }

  const stockage = sb.storage.from('patrimoine')
  const reelId = id ?? crypto.randomUUID()
  // Fichiers déposés par CET appel : à retirer si la suite échoue, pour ne
  // pas laisser d'orphelins dans le stockage.
  const deposes: string[] = []
  let ancien: { video: string; affiche: string | null } | null = null

  try {
    if (id) {
      const { data } = await sb.from('reels').select('video, affiche').eq('id', id).maybeSingle()
      // Ligne introuvable ou session expirée (RLS) : rien à modifier.
      if (!data) return { ok: false, erreur: 'echec' }
      ancien = data as { video: string; affiche: string | null }
    }

    const fichiers: { video?: string; affiche?: string } = {}
    if (nouvelleVideo) {
      const chemin = `reels/${reelId}/${Date.now()}.${extensionVideo(nouvelleVideo.type)}`
      const { error } = await stockage.upload(chemin, nouvelleVideo, {
        contentType: nouvelleVideo.type,
        cacheControl: UN_AN,
        upsert: false,
      })
      if (error) throw error
      deposes.push(chemin)
      fichiers.video = chemin
    }
    if (nouvelleAffiche) {
      const chemin = `reels/${reelId}/${Date.now()}-affiche.jpg`
      const { error, illisible } = await televerserImage(sb, chemin, nouvelleAffiche)
      if (illisible) {
        await stockage.remove(deposes)
        return { ok: false, erreur: 'afficheIllisible' }
      }
      if (error) throw error
      deposes.push(...cheminsStockes(chemin))
      fichiers.affiche = chemin
    }

    if (id) {
      const { data, error } = await sb
        .from('reels')
        .update({ ...valeurs, ...fichiers })
        .eq('id', id)
        .select('id')
      if (error) throw error
      // Un UPDATE bloqué par RLS ne lève pas d'erreur : zéro ligne touchée.
      if (!data || data.length === 0) {
        await stockage.remove(deposes)
        return { ok: false, erreur: 'echec' }
      }
    } else {
      const { error } = await sb.from('reels').insert({ id: reelId, ...valeurs, ...fichiers })
      if (error) throw error
    }

    // Les fichiers remplacés ne servent plus : la ligne pointe déjà ailleurs.
    if (ancien) {
      const remplaces: string[] = []
      if (fichiers.video) remplaces.push(ancien.video)
      if (fichiers.affiche && ancien.affiche) remplaces.push(...cheminsStockes(ancien.affiche))
      if (remplaces.length > 0) await stockage.remove(remplaces)
    }
  } catch (e) {
    console.error('reels enregistrer', reelId, e)
    if (deposes.length > 0) await stockage.remove(deposes)
    return { ok: false, erreur: 'echec' }
  }

  revalidatePath('/[locale]/admin/reels', 'page')
  revalidatePath('/[locale]', 'page')
  return { ok: true, id: reelId }
}

export async function supprimerReel(id: string): Promise<void> {
  const sb = await createServerClient()
  const { data, error } = await sb.from('reels').delete().eq('id', id).select('video, affiche')
  if (error) {
    console.error('reels delete', id, error)
    throw error
  }
  const ligne = data?.[0] as { video: string; affiche: string | null } | undefined
  if (ligne) {
    const fichiers = [ligne.video, ...(ligne.affiche ? cheminsStockes(ligne.affiche) : [])]
    const { error: e } = await sb.storage.from('patrimoine').remove(fichiers)
    // La ligne est déjà partie : un fichier resté au stockage est inerte.
    if (e) console.error('reels suppression des fichiers', id, e)
  }
  revalidatePath('/[locale]/admin/reels', 'page')
  revalidatePath('/[locale]', 'page')
}
