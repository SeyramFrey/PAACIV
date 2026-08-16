# Nettoyage des tables de collecte — 16 août 2026

Suppression des artefacts de test accumulés dans `demandes` et
`newsletter_abonnes` pendant la phase 5 (refonte de la page d'accueil).

**Autorisé explicitement par le propriétaire du projet** avant exécution.

## Périmètre, vérifié avant suppression

| Table | Lignes totales | Dont `@exemple.ci` | Hors périmètre |
|---|---|---|---|
| `demandes` | 222 | **222** | **0** |
| `newsletter_abonnes` | 86 | **86** | **0** |

Plage de dates : **12 au 16 août 2026** — exactement la durée de la phase.
Aucune ligne antérieure, aucune ligne hors du domaine réservé `@exemple.ci`.

**Condition de suppression :** `email like '%@exemple.ci'`
Elle a été prouvée exacte avant exécution : elle capture 100 % des lignes des
deux tables, et aucune ligne réelle n'existait pour être capturée à tort.

## Nature des lignes supprimées

Toutes générées par les campagnes de tests automatisés, reconnaissables à leurs
six motifs de fabrication :

- `test-rls@exemple.ci` et `test-rls-<horodatage>@exemple.ci` — tests de
  politiques d'accès (Task 4)
- `test-rls-update-*` et `test-rls-statut-ok-*` — témoins positifs des tests
  d'`UPDATE` bloqué par RLS
- `demande-{adhesion,don,archive}-*` et `sans-montant-*` — tests des actions
  serveur (Task 7)
- `e2e-don-*`, `e2e-news-*`, `e2e-abonne-*`, `e2e-admin-*` — parcours de bout
  en bout (Tasks 14 et 15)
- `abonne-*` — tests d'inscription à la newsletter

Champs `nom` correspondants : `Test`, `Test Playwright`, `Test RLS`,
`Test RLS update`, `Test RLS statut explicite`, `Vérification admin`.
Aucun nom de personne, aucune adresse réelle, aucun message rédigé par un
humain. Le domaine `exemple.ci` n'est attribué à personne.

Aucune copie complète n'a été conservée : ces lignes sont des fixtures
machine, sans contenu informationnel à préserver.

## ⚠️ La source n'est pas tarie

La suite e2e **réinsère environ cinq lignes par exécution complète** — c'est
ainsi que 246 lignes sont devenues 308 pendant la seule vague de correction
finale.

Sans un `globalTeardown` Playwright qui supprime les lignes de l'exécution
courante (identifiables par le préfixe `Date.now()` qu'elles portent déjà),
ces tables se rempliront de nouveau au premier `npm run e2e`.

Le patron existe déjà dans le dépôt : `tests/admin-accueil.spec.ts` crée et
supprime une clé dédiée de `contenu_site` par `try/finally`, et le contrôle
d'après campagne a confirmé qu'il ne laisse rien derrière.

La réponse durable reste un projet Supabase de préproduction jetable : cette
phase a montré à trois reprises que la base de production sert d'environnement
de test.
