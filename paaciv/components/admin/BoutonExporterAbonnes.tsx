'use client'

import { useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/Button'
import { exporterAbonnesCsv } from '@/app/[locale]/admin/abonnes/actions'

// Le CSV produit par versCsv() n'a ni Content-Type ni Content-Disposition —
// une Server Action renvoie une valeur sérialisée, pas une Response HTTP. On
// construit donc le téléchargement côté client à partir de la chaîne reçue.
export function BoutonExporterAbonnes() {
  const t = useTranslations('adminAbonnes')
  const [enCours, demarrer] = useTransition()

  function exporter() {
    demarrer(async () => {
      const csv = await exporterAbonnesCsv()
      // BOM UTF-8 : Excel (destinataire probable côté association) sinon
      // mésinterprète l'encodage des accents.
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const lien = document.createElement('a')
      lien.href = url
      lien.download = `abonnes-${new Date().toISOString().slice(0, 10)}.csv`
      lien.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <Button type="button" variant="ghost" onClick={exporter} disabled={enCours}>
      {t('exporter')}
    </Button>
  )
}
