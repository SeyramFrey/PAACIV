'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { inscrireNewsletter } from '@/app/[locale]/actions/newsletter'

// Transposition des lignes 572-581 de la référence de design.
//
// `inscrireNewsletter` écrit réellement dans `newsletter_abonnes` (table de
// production) : ce composant ne fait qu'appeler l'action déjà livrée et
// testée (Task 7), il ne réimplémente rien côté serveur.
//
// `onSubmit` + `preventDefault` + `useTransition`, PAS `<form action={fn}>` :
// React 19 appelle `requestFormReset` inconditionnellement après un `action`
// de formulaire, y compris sur une réponse d'échec — le champ, non contrôlé,
// se viderait juste avant que le message d'erreur ne s'affiche. C'est le
// défaut trouvé et corrigé pour `FormulaireSoutien` en Task 8
// (`components/soutenir/FormulaireSoutien.tsx:58-69`) ; même correctif ici.
export function Newsletter({ titre, texte }: { titre: string; texte: string }) {
  const locale = useLocale()
  const t = useTranslations('accueil')
  const ts = useTranslations('soutien')
  const [erreur, setErreur] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)
  const [enCours, demarrer] = useTransition()

  function soumettre(formData: FormData) {
    setErreur(null)
    demarrer(async () => {
      const r = await inscrireNewsletter(formData)
      if (r.ok) {
        setEnvoye(true)
        return
      }
      setErreur(ts(r.erreur === 'emailInvalide' ? 'erreurEmailInvalide' : 'erreurEchec'))
    })
  }

  return (
    <section id="adherer" className="px-[clamp(20px,5vw,80px)] py-[clamp(70px,8vw,120px)] text-center" style={{ background: 'var(--bg3)' }}>
      <div className="mx-auto max-w-[640px]">
        <h2 data-rv="" className="m-0 font-serif text-[clamp(28px,3.4vw,50px)] leading-[1.1]" style={{ color: 'var(--ink)' }}>
          {titre}
        </h2>
        <p data-rv="" data-d="80" className="mt-3.5 text-[15px] font-light leading-[1.7]" style={{ color: 'var(--soft)' }}>
          {texte}
        </p>

        {envoye ? (
          <p role="status" className="mt-[30px] text-sm" style={{ color: 'var(--ink)' }}>
            {t('merciNewsletter')}
          </p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              soumettre(new FormData(e.currentTarget))
            }}
            data-rv=""
            data-d="140"
            className="mt-[30px] flex flex-wrap justify-center gap-2.5"
          >
            <label className="min-w-[240px] flex-1">
              <span className="sr-only">{t('votreEmail')}</span>
              {/* Bordure de repos en CLASSE, pas en `style` : un `borderColor`
                  inline gagnerait toujours sur `focus:border-[var(--accent)]`,
                  ci-dessous, tuant l'indicateur de focus clavier (WCAG 2.4.7) —
                  exactement le piège déjà évité sur les flèches des
                  carrousels. */}
              <input
                name="email"
                type="email"
                required
                placeholder={t('votreEmail')}
                className="w-full rounded-full border border-[var(--line)] bg-[var(--bg)] px-[22px] py-4 text-sm leading-none text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <input type="hidden" name="langue" value={locale} />
            <button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-[var(--ink)] px-8 py-4 text-[11px] font-semibold uppercase leading-none tracking-[0.2em] text-[var(--bg)] transition-colors duration-[0.4s] hover:bg-[var(--terra)] hover:text-[oklch(0.98_0.01_84)] disabled:opacity-60"
            >
              {t('sInscrire')}
            </button>
            {erreur && (
              <p role="alert" className="w-full text-sm" style={{ color: 'var(--terra)' }}>
                {erreur}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
