'use client'

import { useState } from 'react'
import { imageUrl } from '@/lib/media'
import { champ } from '@/lib/i18n-champ'
import type { ImageRow } from '@/lib/data/patrimoine'

export function Galerie({ images, locale }: { images: ImageRow[]; locale: string }) {
  const [actif, setActif] = useState(0)
  if (images.length === 0) return null
  const courante = images[actif]

  return (
    <figure className="space-y-3">
      <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-creme2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(courante.chemin)}
          alt={champ(courante.legende_fr, courante.legende_en, locale) || ''}
          className="h-full w-full object-cover"
        />
      </div>
      {(courante.legende_fr || courante.credit) && (
        <figcaption className="text-xs text-doux">
          {champ(courante.legende_fr, courante.legende_en, locale)}
          {courante.credit && <span className="italic"> — {courante.credit}</span>}
        </figcaption>
      )}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActif(i)}
              aria-current={i === actif}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ${
                i === actif ? 'ring-or' : 'ring-transparent'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl(img.chemin)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </figure>
  )
}
