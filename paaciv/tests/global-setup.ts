// Marque l'instant de départ de l'exécution. `global-teardown.ts` s'en sert
// pour ne supprimer QUE les lignes que cette exécution a insérées : une
// condition portant seulement sur `@exemple.ci` effacerait aussi les artefacts
// d'une exécution concurrente ou d'un travail en cours d'inspection.
//
// `globalSetup` et `globalTeardown` s'exécutent dans le même processus
// Playwright, donc la variable d'environnement posée ici est bien lue là-bas.
// Une seconde de marge en arrière absorbe l'écart d'horloge entre cette
// machine et le serveur Postgres, qui pose lui-même `created_at default now()`.
export default async function globalSetup() {
  process.env.E2E_DEBUT = new Date(Date.now() - 1000).toISOString()
}
