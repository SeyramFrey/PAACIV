'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

type ArchitecteOpt = { id: string; nom: string }
type LiaisonInit = { architecte_id: string; role: string | null }

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
              onChange={(e) => setCoches((c) => ({ ...c, [a.id]: e.target.checked }))}
            />
            <span className="flex-1">{a.nom}</span>
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
