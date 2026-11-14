// Limites des vidéos de réels, partagées par le formulaire (contrôle avant
// envoi) et l'action serveur (contrôle qui fait foi).
//
// 20 Mo : l'action serveur accepte 25 Mo (next.config.ts), l'enveloppe du
// formulaire et l'affiche doivent tenir dans la marge. Un réel de 30 à 60 s
// en 720p pèse en général 5 à 15 Mo.
export const TAILLE_MAX_VIDEO = 20 * 1024 * 1024

// Ni .mov ni .hevc : la vidéo d'un iPhone est souvent en HEVC, que Chrome et
// Firefox ne lisent pas. Un réel téléchargé depuis Instagram est un MP4 H.264.
export const TYPES_VIDEO = ['video/mp4', 'video/webm'] as const
