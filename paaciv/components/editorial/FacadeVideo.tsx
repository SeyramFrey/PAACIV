'use client'

import { useState } from 'react'
import { extraireIdYoutube, lecteurYoutube, miniatureYoutube } from '@/lib/youtube'

type Props = { url: string | null; titre: string; labelLire: string }

/**
 * Lecteur YouTube différé : on n'affiche que la miniature jusqu'au clic, puis on insère
 * l'iframe sur youtube-nocookie.com. Aucun script ni cookie Google avant action de
 * l'utilisateur — donc pas de bandeau de consentement, et ~500 Ko économisés par page.
 */
export function FacadeVideo({ url, titre, labelLire }: Props) {
  const [lecture, setLecture] = useState(false)
  const id = extraireIdYoutube(url)
  if (!id) return null

  if (lecture) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl" data-testid="facade-video">
        <iframe
          src={`${lecteurYoutube(id)}?autoplay=1`}
          title={titre}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-encre" data-testid="facade-video">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={miniatureYoutube(id)}
        alt=""
        aria-hidden="true"
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <button
        type="button"
        onClick={() => setLecture(true)}
        aria-label={`${labelLire} : ${titre}`}
        className="absolute inset-0 flex items-center justify-center transition hover:bg-encre/20"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terre text-2xl text-sable shadow-lg">
          ▶
        </span>
      </button>
    </div>
  )
}
