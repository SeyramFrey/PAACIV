import { createClient } from '@supabase/supabase-js'

// Les tests e2e déposent de vraies lignes dans `demandes` et
// `newsletter_abonnes`, qui sont des tables de PRODUCTION : c'est voulu — ils
// exercent le formulaire public de bout en bout, sans base de test ni clé de
// service. Sans ce nettoyage, chaque exécution complète y laissait environ
// cinq lignes définitivement, et les écrans d'admin les présentaient à
// l'association comme de vraies inscriptions et de vraies demandes de don.
// Une purge manuelle a déjà dû être faite une fois (308 lignes le 16/08/2026,
// cf. docs/nettoyage-tables-collecte-2026-08-16.md) ; ce fichier tarit la
// source au lieu de reporter la prochaine purge.
//
// TROIS CONDITIONS CUMULÉES, pour qu'aucune donnée réelle ne puisse être
// atteinte même si l'une d'elles se révélait fausse :
//   - le domaine `@exemple.ci`, réservé aux fixtures par convention de la
//     phase et vérifié exhaustivement avant la purge du 16/08 ;
//   - `created_at >= ` l'instant de démarrage de CETTE exécution ;
//   - une session administrateur, donc les mêmes droits RLS que le
//     back-office — jamais de clé de service.
// Un échec de nettoyage est signalé sur la sortie d'erreur mais ne fait PAS
// échouer la suite : la suppression n'est pas ce que ces tests vérifient, et
// masquer un résultat vert derrière un défaut d'entretien induirait en erreur.
export default async function globalTeardown() {
  const debut = process.env.E2E_DEBUT
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = process.env.TEST_ADMIN_EMAIL
  const motDePasse = process.env.TEST_ADMIN_PASSWORD
  if (!debut || !url || !cle || !email || !motDePasse) {
    console.warn('[teardown] variables manquantes, nettoyage ignoré — les lignes de test restent en base')
    return
  }

  const sb = createClient(url, cle)
  const { error: erreurConnexion } = await sb.auth.signInWithPassword({ email, password: motDePasse })
  if (erreurConnexion) {
    console.error('[teardown] connexion admin impossible, nettoyage ignoré', erreurConnexion.message)
    return
  }

  for (const table of ['demandes', 'newsletter_abonnes'] as const) {
    const { data, error } = await sb
      .from(table)
      .delete()
      .like('email', '%@exemple.ci')
      .gte('created_at', debut)
      .select('id')
    if (error) {
      console.error(`[teardown] ${table} : nettoyage en échec`, error.message)
      continue
    }
    // `delete()` filtré par la RLS ne lève pas d'erreur : il renvoie zéro
    // ligne (piège consigné à la Task 4). Le compte rendu explicite permet de
    // distinguer « rien à supprimer » de « suppression silencieusement
    // bloquée » quand la suite vient d'écrire.
    console.log(`[teardown] ${table} : ${data?.length ?? 0} ligne(s) de test supprimée(s)`)
  }
}
