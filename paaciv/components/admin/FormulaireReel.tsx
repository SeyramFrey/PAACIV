'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/navigation'
import { Button } from '@/components/ui/Button'
import { enregistrerReel } from '@/app/[locale]/admin/reels/actions'
import { fichierUrl, imageUrl } from '@/lib/media'
import { TAILLE_MAX_VIDEO, TYPES_VIDEO } from '@/lib/admin/reels'

export type ReelAdmin = {
  id: string
  video: string
  affiche: string | null
  lien: string
  legende_fr: string | null
  legende_en: string | null
  credit: string | null
  date_publication: string | null
  ordre: number
  statut: 'brouillon' | 'publie'
}

// L'affiche est l'image montrée tant que la vidéo ne joue pas. Elle est tirée
// de la vidéo ici, dans le navigateur : l'association n'a rien à préparer.
// L'aperçu se règle à l'instant voulu, puis « Prendre cette image ». Une
// image déposée à la main reste possible.
const LARGEUR_AFFICHE = 1080

async function capturer(video: HTMLVideoElement): Promise<File | null> {
  if (!video.videoWidth) return null
  const echelle = Math.min(1, LARGEUR_AFFICHE / video.videoWidth)
  const toile = document.createElement('canvas')
  toile.width = Math.round(video.videoWidth * echelle)
  toile.height = Math.round(video.videoHeight * echelle)
  toile.getContext('2d')!.drawImage(video, 0, 0, toile.width, toile.height)
  const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, 'image/jpeg', 0.86))
  return blob ? new File([blob], 'affiche.jpg', { type: 'image/jpeg' }) : null
}

function poser(entree: HTMLInputElement | null, fichier: File) {
  if (!entree) return
  const dt = new DataTransfer()
  dt.items.add(fichier)
  entree.files = dt.files
}

export function FormulaireReel({ initial }: { initial?: ReelAdmin | null }) {
  const t = useTranslations('adminReels')
  const router = useRouter()
  const [onglet, setOnglet] = useState<'fr' | 'en'>('fr')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [apercuVideo, setApercuVideo] = useState<string | null>(initial ? fichierUrl(initial.video) : null)
  const [apercuAffiche, setApercuAffiche] = useState<string | null>(
    initial?.affiche ? imageUrl(initial.affiche, 480) : null,
  )
  const lecteur = useRef<HTMLVideoElement>(null)
  const entreeAffiche = useRef<HTMLInputElement>(null)
  // Une nouvelle vidéo attend sa capture automatique. Une affiche choisie à
  // la main l'annule.
  const captureEnAttente = useRef(false)

  // Les aperçus locaux sont des URL d'objet : à libérer quand ils changent.
  useEffect(() => () => { if (apercuVideo?.startsWith('blob:')) URL.revokeObjectURL(apercuVideo) }, [apercuVideo])
  useEffect(() => () => { if (apercuAffiche?.startsWith('blob:')) URL.revokeObjectURL(apercuAffiche) }, [apercuAffiche])

  async function prendreImage() {
    const v = lecteur.current
    if (!v) return
    const f = await capturer(v)
    if (!f) return
    poser(entreeAffiche.current, f)
    setApercuAffiche(URL.createObjectURL(f))
  }

  function surVideo(e: React.ChangeEvent<HTMLInputElement>) {
    setErreur(null)
    const f = e.target.files?.[0]
    if (!f) return
    if (!(TYPES_VIDEO as readonly string[]).includes(f.type)) {
      setErreur(t('erreurVideoFormat'))
      e.target.value = ''
      return
    }
    if (f.size > TAILLE_MAX_VIDEO) {
      setErreur(t('erreurVideoTropLourde'))
      e.target.value = ''
      return
    }
    captureEnAttente.current = true
    setApercuVideo(URL.createObjectURL(f))
  }

  // Première image utile de la vidéo choisie : une seconde après le début,
  // pour éviter le noir d'ouverture fréquent dans les réels.
  async function surDonneesChargees() {
    const v = lecteur.current
    if (!v || !captureEnAttente.current) return
    if (v.currentTime < 1 && v.duration > 1.2) {
      v.currentTime = 1
      return // `seeked` fera la capture
    }
    captureEnAttente.current = false
    await prendreImage()
  }

  async function surPositionnee() {
    if (!captureEnAttente.current) return
    captureEnAttente.current = false
    await prendreImage()
  }

  function surAffiche(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    captureEnAttente.current = false
    setApercuAffiche(URL.createObjectURL(f))
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEnCours(true)
    setErreur(null)
    try {
      const resultat = await enregistrerReel(new FormData(e.currentTarget))
      if (!resultat.ok) {
        const cles = {
          lienInvalide: 'erreurLien',
          videoRequise: 'erreurVideoRequise',
          videoFormat: 'erreurVideoFormat',
          videoTropLourde: 'erreurVideoTropLourde',
          afficheIllisible: 'erreurAffiche',
          echec: 'erreurEnregistrement',
        } as const
        setErreur(t(cles[resultat.erreur]))
        return
      }
      router.push('/admin/reels?enregistre=1')
      router.refresh()
    } catch {
      setErreur(t('erreurEnregistrement'))
    } finally {
      setEnCours(false)
    }
  }

  const classeChamp = 'rounded-xl border border-filet bg-fond px-3 py-2'
  const champ = (name: keyof ReelAdmin, label: string, type = 'text') => (
    <label className="flex flex-col text-sm">
      <span className="mb-1 font-semibold">{label}</span>
      <input
        name={name}
        type={type}
        aria-label={label}
        defaultValue={(initial?.[name] as string | null | undefined) ?? ''}
        className={classeChamp}
      />
    </label>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {initial?.id && <input type="hidden" name="id" defaultValue={initial.id} />}

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-4">
          <label className="flex flex-col text-sm">
            <span className="mb-1 font-semibold">{t('lien')}</span>
            <input
              name="lien"
              type="url"
              required
              aria-label={t('lien')}
              placeholder="https://www.instagram.com/reel/…"
              defaultValue={initial?.lien ?? ''}
              className={classeChamp}
            />
            <span className="mt-1 text-xs text-doux">{t('lienAide')}</span>
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 font-semibold">{t('video')}</span>
            <input
              type="file"
              name="video"
              accept={TYPES_VIDEO.join(',')}
              aria-label={t('video')}
              onChange={surVideo}
              className="text-sm"
            />
            <span className="mt-1 text-xs text-doux">{t('videoAide')}</span>
          </label>

          <label className="flex flex-col text-sm">
            <span className="mb-1 font-semibold">{t('affiche')}</span>
            <input
              ref={entreeAffiche}
              type="file"
              name="affiche"
              accept="image/*"
              aria-label={t('affiche')}
              onChange={surAffiche}
              className="text-sm"
            />
            <span className="mt-1 text-xs text-doux">{t('afficheAide')}</span>
          </label>
        </div>

        <div className="space-y-3">
          {apercuVideo ? (
            <>
              <video
                ref={lecteur}
                src={apercuVideo}
                controls
                muted
                playsInline
                preload="metadata"
                crossOrigin="anonymous"
                onLoadedData={surDonneesChargees}
                onSeeked={surPositionnee}
                aria-label={t('apercu')}
                className="aspect-[9/16] w-full rounded-xl bg-encre object-cover"
              />
              <button type="button" onClick={prendreImage} className="text-sm text-ocre underline">
                {t('prendreImage')}
              </button>
            </>
          ) : (
            <div className="grid aspect-[9/16] w-full place-items-center rounded-xl border border-dashed border-filet p-4 text-center text-xs text-doux">
              {t('apercuVide')}
            </div>
          )}
          {apercuAffiche && (
            <figure className="m-0 space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={apercuAffiche} alt="" className="aspect-[9/16] w-24 rounded-lg object-cover" />
              <figcaption className="text-xs text-doux">{t('afficheRetenue')}</figcaption>
            </figure>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setOnglet('fr')} className={onglet === 'fr' ? 'font-bold text-ocre' : 'text-doux'}>
          {t('ongletFr')}
        </button>
        <button type="button" onClick={() => setOnglet('en')} className={onglet === 'en' ? 'font-bold text-ocre' : 'text-doux'}>
          {t('ongletEn')}
        </button>
      </div>
      <div className={onglet === 'fr' ? 'grid gap-4' : 'hidden'}>{champ('legende_fr', `${t('legende')} (FR)`)}</div>
      <div className={onglet === 'en' ? 'grid gap-4' : 'hidden'}>{champ('legende_en', `${t('legende')} (EN)`)}</div>

      <div className="grid gap-4 sm:grid-cols-2">
        {champ('credit', t('credit'))}
        {champ('date_publication', t('date'), 'date')}
      </div>
      <p className="-mt-3 text-xs text-doux">{t('creditAide')}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('ordre')}</span>
          <input name="ordre" type="number" aria-label={t('ordre')} defaultValue={initial?.ordre ?? 0} className={classeChamp} />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 font-semibold">{t('statut')}</span>
          <select name="statut" defaultValue={initial?.statut ?? 'brouillon'} aria-label={t('statut')} className={classeChamp}>
            <option value="brouillon">{t('brouillon')}</option>
            <option value="publie">{t('publie')}</option>
          </select>
        </label>
      </div>

      {erreur && (
        <p role="alert" className="text-sm font-semibold text-ocre">
          {erreur}
        </p>
      )}

      <Button type="submit" variant="gold" disabled={enCours}>
        {enCours ? t('envoi') : t('enregistrer')}
      </Button>
    </form>
  )
}
