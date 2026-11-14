'use client'

import { useSyncExternalStore } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { delaiAvantMinute, heureAbidjan, minuteCourante } from '@/lib/heure-abidjan'

// « Plateau, Abidjan · 16 h 20 » : l'heure du lieu, sous l'éléphant et sur la
// carte (Radio Garden, moodboard du 13/11/2026).
//
// L'heure n'existe que dans le navigateur. Les pages sont prégénérées : une
// heure calculée au rendu serveur serait fausse dès la minute suivante, et
// différente de celle du client (erreur d'hydratation). Le serveur rend donc
// le lieu et une heure fantôme de même largeur, invisible : rien ne bouge
// quand la vraie heure arrive.
//
// Lecteurs d'écran : la ligne est lue comme une phrase (« Heure locale au
// Plateau, à Abidjan : 16 h 20 »), mais elle ne s'annonce PAS d'elle-même à
// chaque minute. Une zone `aria-live` qui parle toutes les soixante secondes
// interromprait la lecture du reste de la page pour une information qui n'a
// rien d'urgent. On la lit quand on passe dessus, comme une horloge murale.

function abonner(rappel: () => void) {
  let minuterie: ReturnType<typeof setTimeout>
  function suivante() {
    minuterie = setTimeout(() => {
      rappel()
      suivante()
    }, delaiAvantMinute())
  }
  suivante()
  // Un onglet en arrière-plan ralentit ses minuteries : au retour, l'heure
  // se recale tout de suite.
  const auRetour = () => {
    if (document.visibilityState === 'visible') rappel()
  }
  document.addEventListener('visibilitychange', auRetour)
  return () => {
    clearTimeout(minuterie)
    document.removeEventListener('visibilitychange', auRetour)
  }
}

const surServeur = () => null

export function LigneHeure({ className = '' }: { className?: string }) {
  const t = useTranslations('heure')
  const locale = useLocale()
  const minute = useSyncExternalStore(abonner, minuteCourante, surServeur)
  const heure = minute === null ? null : heureAbidjan(new Date(minute * 60_000), locale)

  return (
    <p
      data-testid="ligne-heure"
      className={`m-0 text-[11px] font-medium uppercase tracking-[0.22em] tabular-nums ${className}`}
    >
      <span aria-hidden="true">
        {t('lieu')}
        <span className="mx-[0.6em] opacity-60">·</span>
        {heure ? (
          <time dateTime={heure.iso}>{heure.texte}</time>
        ) : (
          // Fantôme de largeur : la ligne garde sa taille avant l'heure réelle.
          <span className="invisible">{locale === 'en' ? '00:00' : '00 h 00'}</span>
        )}
      </span>
      {heure && <span className="sr-only">{t('lecture', { heure: heure.texte })}</span>}
    </p>
  )
}
