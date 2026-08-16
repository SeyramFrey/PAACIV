import { test, expect } from '@playwright/test'
import { inscrireNewsletter } from '@/app/[locale]/actions/newsletter'
import { deposerDemande } from '@/app/[locale]/actions/soutien'

function fd(o: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(o)) f.append(k, v)
  return f
}

test('inscrireNewsletter refuse une adresse invalide', async () => {
  expect(await inscrireNewsletter(fd({ email: 'pas-une-adresse' }))).toEqual({
    ok: false,
    erreur: 'emailInvalide',
  })
})

test('inscrireNewsletter accepte, puis répond succès sur doublon', async () => {
  const email = `abonne-${Date.now()}@exemple.ci`
  expect(await inscrireNewsletter(fd({ email, langue: 'fr' }))).toEqual({ ok: true })
  // Deuxième passage : même réponse, pour ne pas révéler que l'adresse est
  // déjà connue.
  expect(await inscrireNewsletter(fd({ email, langue: 'fr' }))).toEqual({ ok: true })
})

test('deposerDemande valide le nom, l’adresse, le montant et le type', async () => {
  expect(await deposerDemande(fd({ type: 'don', nom: '', email: 'a@b.ci' })))
    .toEqual({ ok: false, erreur: 'nomRequis' })
  expect(await deposerDemande(fd({ type: 'don', nom: 'A', email: 'nope' })))
    .toEqual({ ok: false, erreur: 'emailInvalide' })
  expect(await deposerDemande(fd({ type: 'don', nom: 'A', email: 'a@b.ci', montant: 'beaucoup' })))
    .toEqual({ ok: false, erreur: 'montantInvalide' })
  expect(await deposerDemande(fd({ type: 'inconnu', nom: 'A', email: 'a@b.ci' })))
    .toEqual({ ok: false, erreur: 'typeInvalide' })
})

test('deposerDemande enregistre les trois types', async () => {
  for (const type of ['adhesion', 'don', 'archive']) {
    const r = await deposerDemande(
      fd({ type, nom: 'Test', email: `demande-${type}-${Date.now()}@exemple.ci`, message: 'Test automatisé' }),
    )
    expect(r, type).toEqual({ ok: true })
  }
})

test('un don sans montant reste valide', async () => {
  const r = await deposerDemande(
    fd({ type: 'don', nom: 'Test', email: `sans-montant-${Date.now()}@exemple.ci`, montant: '' }),
  )
  expect(r).toEqual({ ok: true })
})
