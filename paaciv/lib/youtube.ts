// Parsing d'URL YouTube — fonctions pures, testées sans réseau ni base.

const HOTES = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com']
const ID = /^[\w-]{11}$/

/** Renvoie l'identifiant de 11 caractères, ou null si l'URL n'est pas une vidéo YouTube exploitable. */
export function extraireIdYoutube(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') return null
  let u: URL
  try {
    u = new URL(url.trim())
  } catch {
    return null
  }
  if (!HOTES.includes(u.hostname)) return null

  const candidat =
    u.searchParams.get('v') ??
    (u.hostname.endsWith('youtu.be')
      ? u.pathname.slice(1)
      : u.pathname.replace(/^\/(embed|shorts)\//, ''))

  return ID.test(candidat) ? candidat : null
}

export function miniatureYoutube(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
}

export function lecteurYoutube(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}
