'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { TYPES_BLOC, type TypeBloc } from '@/lib/data/architectes'

export type BlocSaisi = {
  surtitre_fr: string
  surtitre_en: string
  titre_fr: string
  titre_en: string
  texte_fr: string
  texte_en: string
}

export type BlocsSaisis = Record<TypeBloc, BlocSaisi[]>

const VIDE: BlocSaisi = {
  surtitre_fr: '',
  surtitre_en: '',
  titre_fr: '',
  titre_en: '',
  texte_fr: '',
  texte_en: '',
}

// Quels champs chaque type de bloc expose RÉELLEMENT. Les quatre listes
// partagent une table et un composant (voir la migration 0032), mais pas leurs
// besoins : un programme n'est qu'un libellé, un chiffre est une valeur et sa
// légende, une mission a un lieu au-dessus de son intitulé. Afficher six champs
// partout donnerait un formulaire de saisie majoritairement vide — et rien
// n'est plus dissuasif à remplir.
const CHAMPS: Record<TypeBloc, { surtitre: boolean; texte: boolean }> = {
  programme: { surtitre: false, texte: false },
  domaine: { surtitre: false, texte: true },
  mission: { surtitre: true, texte: true },
  chiffre: { surtitre: false, texte: true },
}

export function BlocsArchitecte({ initial }: { initial: BlocsSaisis }) {
  const t = useTranslations('formArchitecte')
  const [blocs, setBlocs] = useState<BlocsSaisis>(initial)

  const majChamp = (type: TypeBloc, i: number, cle: keyof BlocSaisi, valeur: string) =>
    setBlocs((b) => ({
      ...b,
      [type]: b[type].map((ligne, j) => (j === i ? { ...ligne, [cle]: valeur } : ligne)),
    }))

  const ajouter = (type: TypeBloc) =>
    setBlocs((b) => ({ ...b, [type]: [...b[type], { ...VIDE }] }))

  const retirer = (type: TypeBloc, i: number) =>
    setBlocs((b) => ({ ...b, [type]: b[type].filter((_, j) => j !== i) }))

  const libelleType: Record<TypeBloc, string> = {
    programme: t('blocProgramme'),
    domaine: t('blocDomaine'),
    mission: t('blocMission'),
    chiffre: t('blocChiffre'),
  }

  const saisie = (
    libelle: string,
    valeur: string,
    onChange: (v: string) => void,
    name: string,
  ) => (
    <label className="flex flex-col text-xs">
      <span className="mb-1 font-semibold">{libelle}</span>
      <input
        // Champs NOMMÉS et répétés plutôt qu'un JSON caché : l'action serveur
        // les relit avec `getAll()` et les rezippe par index. C'est le même
        // procédé que `architecte_ids` dans LiaisonArchitectes, et il évite
        // d'ouvrir une surface de désérialisation côté serveur pour un contenu
        // qui n'en a pas besoin.
        name={name}
        value={valeur}
        aria-label={libelle}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-filet bg-fond px-2 py-1.5"
      />
    </label>
  )

  return (
    <fieldset className="space-y-5" aria-label={t('blocs')}>
      <legend className="text-sm font-semibold">{t('blocs')}</legend>
      <p className="text-xs text-doux">{t('blocsAide')}</p>

      {TYPES_BLOC.map((type) => (
        <div key={type} className="space-y-2 rounded-xl border border-filet p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-ocre">{libelleType[type]}</span>
            <button
              type="button"
              onClick={() => ajouter(type)}
              className="rounded-lg border border-filet px-2 py-1 text-xs font-semibold"
            >
              + {t('blocAjouter')}
            </button>
          </div>

          {blocs[type].length === 0 && <p className="text-xs text-doux">{t('blocAucun')}</p>}

          {blocs[type].map((ligne, i) => (
            <div
              key={i}
              data-testid={`bloc-${type}`}
              className="grid gap-2 border-t border-filet pt-2 sm:grid-cols-2"
            >
              {/* Le type voyage avec la ligne : c'est lui qui permet à l'action
                  serveur de rezipper les colonnes sans se fier à l'ordre des
                  groupes dans le DOM. */}
              <input type="hidden" name="bloc_type" value={type} />

              {CHAMPS[type].surtitre && (
                <>
                  {saisie(`${t('blocSurtitre')} FR`, ligne.surtitre_fr, (v) => majChamp(type, i, 'surtitre_fr', v), 'bloc_surtitre_fr')}
                  {saisie(`${t('blocSurtitre')} EN`, ligne.surtitre_en, (v) => majChamp(type, i, 'surtitre_en', v), 'bloc_surtitre_en')}
                </>
              )}
              {!CHAMPS[type].surtitre && (
                <>
                  <input type="hidden" name="bloc_surtitre_fr" value="" />
                  <input type="hidden" name="bloc_surtitre_en" value="" />
                </>
              )}

              {saisie(
                `${type === 'chiffre' ? t('blocValeur') : t('blocTitre')} FR`,
                ligne.titre_fr,
                (v) => majChamp(type, i, 'titre_fr', v),
                'bloc_titre_fr',
              )}
              {saisie(
                `${type === 'chiffre' ? t('blocValeur') : t('blocTitre')} EN`,
                ligne.titre_en,
                (v) => majChamp(type, i, 'titre_en', v),
                'bloc_titre_en',
              )}

              {CHAMPS[type].texte && (
                <>
                  {saisie(
                    `${type === 'chiffre' ? t('blocLibelle') : t('blocTexte')} FR`,
                    ligne.texte_fr,
                    (v) => majChamp(type, i, 'texte_fr', v),
                    'bloc_texte_fr',
                  )}
                  {saisie(
                    `${type === 'chiffre' ? t('blocLibelle') : t('blocTexte')} EN`,
                    ligne.texte_en,
                    (v) => majChamp(type, i, 'texte_en', v),
                    'bloc_texte_en',
                  )}
                </>
              )}
              {!CHAMPS[type].texte && (
                <>
                  <input type="hidden" name="bloc_texte_fr" value="" />
                  <input type="hidden" name="bloc_texte_en" value="" />
                </>
              )}

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => retirer(type, i)}
                  className="text-xs font-semibold text-danger"
                >
                  {t('blocRetirer')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </fieldset>
  )
}
