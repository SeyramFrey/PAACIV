'use client'

import { useActionState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { inscrireNewsletter, type ResultatNewsletter } from '@/app/[locale]/actions/newsletter'

async function soumettre(
  _etat: ResultatNewsletter | null,
  formData: FormData,
): Promise<ResultatNewsletter> {
  return inscrireNewsletter(formData)
}

// Transposition des lignes 572-581 de la référence de design.
//
// `inscrireNewsletter` écrit réellement dans `newsletter_abonnes` (table de
// production) : ce composant ne fait qu'appeler l'action déjà livrée et
// testée (Task 7), il ne réimplémente rien côté serveur.
export function Newsletter({ titre, texte }: { titre: string; texte: string }) {
  const locale = useLocale()
  const t = useTranslations('accueil')
  const ts = useTranslations('soutien')
  const [etat, action, enCours] = useActionState<ResultatNewsletter | null, FormData>(soumettre, null)

  const cleErreur = etat && !etat.ok ? (etat.erreur === 'emailInvalide' ? 'erreurEmailInvalide' : 'erreurEchec') : null

  return (
    <section id="adherer" className="px-[clamp(20px,5vw,80px)] py-[clamp(70px,8vw,120px)] text-center" style={{ background: 'var(--bg3)' }}>
      <div className="mx-auto max-w-[640px]">
        <h2 data-rv="" className="m-0 font-serif text-[clamp(28px,3.4vw,50px)] leading-[1.1]" style={{ color: 'var(--ink)' }}>
          {titre}
        </h2>
        <p data-rv="" data-d="80" className="mt-3.5 text-[15px] font-light leading-[1.7]" style={{ color: 'var(--soft)' }}>
          {texte}
        </p>

        {etat?.ok ? (
          <p role="status" className="mt-[30px] text-sm" style={{ color: 'var(--ink)' }}>
            {t('merciNewsletter')}
          </p>
        ) : (
          <form
            action={action}
            data-rv=""
            data-d="140"
            className="mt-[30px] flex flex-wrap justify-center gap-2.5"
          >
            <label className="min-w-[240px] flex-1">
              <span className="sr-only">{t('votreEmail')}</span>
              <input
                name="email"
                type="email"
                required
                placeholder={t('votreEmail')}
                className="w-full rounded-full border px-[22px] py-4 text-sm leading-none outline-none"
                style={{ borderColor: 'var(--line)', background: 'var(--bg)', color: 'var(--ink)' }}
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
            {cleErreur && (
              <p role="alert" className="w-full text-sm" style={{ color: 'var(--terra)' }}>
                {ts(cleErreur)}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  )
}
