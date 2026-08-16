import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const anon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Lecture publique : le pied de page affiche les attributions sur TOUTES les
// pages, y compris pour un visiteur anonyme. Une policy trop stricte les
// ferait disparaître silencieusement — et une attribution qui disparaît est
// exactement le défaut que cette table existe pour corriger.
test('un anonyme lit medias_site', async () => {
  const { data, error } = await anon.from('medias_site').select('emplacement')
  expect(error).toBeNull()
  expect(data!.length).toBeGreaterThanOrEqual(12)
})

test('RLS : un anonyme ne peut pas insérer de média', async () => {
  const { error } = await anon
    .from('medias_site')
    .insert({ emplacement: 'test-anon-interdit', chemin: 'x.jpg' })
  expect(error).not.toBeNull()
})

// Ancré sur le code 42501 et non sur « une erreur quelconque » : PostgREST
// valide les colonnes AVANT la RLS, si bien qu'une colonne inexistante
// renverrait PGRST204 et ferait passer ce test au vert sans jamais atteindre
// la policy (piège consigné).
test('RLS : le refus d’insertion vient bien de la policy', async () => {
  const { error } = await anon
    .from('medias_site')
    .insert({ emplacement: 'test-anon-interdit-2', chemin: 'x.jpg' })
  expect(error?.code).toBe('42501')
})

// Un UPDATE bloqué par RLS ne lève PAS d'erreur : il filtre à zéro ligne et
// répond succès. Le seul contrôle opposable est donc le nombre de lignes
// renvoyées — c'est aussi ce que vérifie l'action d'admin avant d'afficher
// « Enregistré ».
test('RLS : un anonyme ne modifie aucune ligne', async () => {
  const { data, error } = await anon
    .from('medias_site')
    .update({ credit: 'usurpation' })
    .eq('emplacement', 'journal_image')
    .select('emplacement')
  expect(error).toBeNull()
  expect(data ?? []).toHaveLength(0)
})

// Les douze emplacements attendus par le code doivent exister : un composant
// qui lit un emplacement absent retombe sur son visuel codé, donc en silence.
// Ce test est le seul endroit où l'écart se voit.
test('les douze emplacements de la page d’accueil existent', async () => {
  const { data, error } = await anon.from('medias_site').select('emplacement, chemin')
  expect(error).toBeNull()
  const emplacements = (data ?? []).map((m) => m.emplacement).sort()
  expect(emplacements).toEqual(
    [
      'journal_image',
      'parallaxe_image',
      'raisons_1_image',
      'raisons_2_image',
      'raisons_3_image',
      'raisons_4_image',
      'raisons_5_image',
      'soutien_adhesion_image',
      'soutien_don_image',
      'soutien_en_danger_image',
      'travail_1_image',
      'travail_2_image',
    ].sort(),
  )
  // `chemin` est `not null` : aucune ligne ne peut exister sans image.
  expect((data ?? []).every((m) => Boolean(m.chemin))).toBe(true)
})
