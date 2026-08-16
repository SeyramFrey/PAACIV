'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ArchitecteOpt = { id: string; nom: string }
type LiaisonInit = { architecte_id: string; role: string | null; principal?: boolean }

const ROLES = ['architecte', 'co-auteur', 'bureau']

export function LiaisonArchitectes({
  architectes,
  initial,
  label,
}: {
  architectes: ArchitecteOpt[]
  initial: LiaisonInit[]
  label: string
}) {
  const t = useTranslations('formPatrimoine')
  const [coches, setCoches] = useState<Record<string, boolean>>(
    Object.fromEntries(initial.map((l) => [l.architecte_id, true])),
  )
  // Rôles choisis, initialisés depuis `initial` puis tenus à jour par
  // l'utilisateur. Contrairement à un `defaultValue` sur le <select> (qui se
  // réinitialiserait à la valeur d'origine à chaque montage), cet état
  // survit au démontage/remontage du <select> quand on décoche puis recoche
  // une case : le rôle choisi n'est jamais remplacé par une valeur stale.
  const [roles, setRoles] = useState<Record<string, string>>(
    Object.fromEntries(initial.map((l) => [l.architecte_id, l.role ?? ''])),
  )
  // Architecte PRINCIPAL : un seul par fiche, d'où un état unique plutôt qu'un
  // dictionnaire de booléens — la contrainte est portée par le modèle, pas
  // seulement par l'apparence des boutons radio. La base la tient de son côté
  // par un index unique partiel.
  const [principal, setPrincipal] = useState<string>(
    initial.find((l) => l.principal)?.architecte_id ?? '',
  )

  return (
    <fieldset className="space-y-2" aria-label={label}>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {architectes.map((a) => (
          <div
            key={a.id}
            data-testid="liaison-architecte"
            className="flex items-center gap-2 rounded-lg border border-filet p-2 text-sm"
          >
            <input
              type="checkbox"
              name="architecte_ids"
              value={a.id}
              defaultChecked={!!coches[a.id]}
              onChange={(e) => {
                setCoches((c) => ({ ...c, [a.id]: e.target.checked }))
                // Délier un architecte qui était le principal le libère :
                // sans cela, le formulaire enverrait un `architecte_principal`
                // ne figurant plus dans `architecte_ids`, et l'action serveur
                // écrirait un principal sur une liaison inexistante.
                if (!e.target.checked && principal === a.id) setPrincipal('')
              }}
            />
            <span className="flex-1">{a.nom}</span>
            {/* Le choix du principal n'apparaît que pour un architecte
                effectivement lié : proposer « principal » sur une case
                décochée laisserait désigner un architecte qui ne figure pas
                sur la fiche. Décocher la case du principal le libère aussi
                (voir le `onChange` de la case ci-dessus). */}
            {coches[a.id] && (
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="radio"
                  name="architecte_principal"
                  value={a.id}
                  checked={principal === a.id}
                  onChange={() => setPrincipal(a.id)}
                />
                {t('principal')}
              </label>
            )}
            {coches[a.id] && (
              <select
                name={`role_${a.id}`}
                value={roles[a.id] ?? ''}
                onChange={(e) => setRoles((r) => ({ ...r, [a.id]: e.target.value }))}
                aria-label={t('roleAria', { nom: a.nom })}
                className="rounded border border-filet px-2 py-1 text-xs"
              >
                <option value="">{t('aucunRole')}</option>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>
    </fieldset>
  )
}
