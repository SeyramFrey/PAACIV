import { setWorkerUrl } from 'maplibre-gl'

// À importer par TOUT composant qui crée une `Map`, avant sa création : l'appel
// doit précéder le premier worker, et un composant oublié n'afficherait qu'un
// rectangle vide, sans aucune erreur. Le fichier est déposé là par
// `scripts/copie-worker-maplibre.mjs`, qui explique pourquoi.
setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
