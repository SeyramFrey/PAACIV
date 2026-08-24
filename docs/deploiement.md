# Déploiement

*État au 24 août 2026.*

## En un paragraphe

Le site tourne sur l'**hébergement Business** de Hostinger, dans le lanceur
Node.js. `staging.paaciv.com` est la préproduction et **fonctionne déjà**.
`paaciv.com` reste vide, en attente des photographies et des crédits
(`docs/brief-visuels.md`). Une fois le dépôt connecté dans hPanel, **chaque push
sur `main` déclenche une reconstruction automatique** — Hostinger clone, installe,
build et redémarre tout seul.

## Ce qui est en place

| Élément | Valeur |
|---|---|
| Hébergement | Business Web Hosting, compte `u382331247` |
| Préproduction | `https://staging.paaciv.com` — **en ligne** |
| Production | `paaciv.com` — vide, DNS déjà sur l'hébergement |
| Racine du site de préprod | `/home/u382331247/domains/paaciv.com/public_html/staging` |
| Runtime | Node **22** (imposé par `engines.node` de `paaciv/package.json`) |
| Type détecté | `next` — Hostinger reconnaît Next.js tout seul |
| Script de build | `build` |
| Contrôles | GitHub Actions, `.github/workflows/ci.yml` |

Le premier déploiement a été fait à la main depuis une archive, pour **prouver
que la chaîne fonctionne** avant de la câbler : build réussi, toutes les routes
compilées, données Supabase servies, `/api/carte/points` répond.

## Les quatre étapes qui restent, et qui demandent vos mains

Elles passent toutes par hPanel ou par un compte tiers : elles ne peuvent pas
être faites depuis le dépôt.

### 1 · Connecter le dépôt GitHub (c'est ça, l'automatisation)

hPanel → **Sites web** → `staging.paaciv.com` → **Node.js** → *Déploiement* →
**Connecter un dépôt GitHub**.

- Dépôt : `SeyramFrey/PAACIV`
- Branche : `main`
- **Répertoire racine : `paaciv`** ← le point à ne pas rater. Le `package.json`
  n'est pas à la racine du dépôt ; sans ce réglage, Hostinger cherche une
  application là où il n'y a que `docs/` et `.github/`.
- Version de Node : **22**
- Script de build : `build`

Hostinger installe son application GitHub et demande l'accès au dépôt. À partir
de là, **un push sur `main` suffit** : rebuild et redémarrage automatiques.

### 2 · Déclarer les trois variables d'environnement

Dans le même écran, section *Variables d'environnement* :

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MAPTILER_KEY
```

Les valeurs sont celles de votre `paaciv/.env.local`.

**Pourquoi pas dans le dépôt.** Ces trois variables sont `NEXT_PUBLIC_*` : Next
les inscrit dans le JavaScript envoyé à chaque visiteur, elles sont donc
publiques par construction, et la clé anonyme Supabase est *faite* pour ça — ce
sont les politiques RLS qui protègent la base, pas le secret de cette clé.
Malgré tout, **le dépôt est public**, et y committer ces valeurs les livrerait
aux robots qui balaient GitHub. Le gain serait nul, le bruit certain. Elles
restent donc côté hébergeur.

C'est aussi la raison de la ligne `.env.production` ajoutée au `.gitignore` :
la chaîne de déploiement fabrique ce fichier à la volée, et sans cette ligne un
`git add -A` distrait le publierait.

### 3 · Restreindre la clé MapTiler à vos domaines

Tableau de bord MapTiler → la clé → *Allowed origins* :

```
https://paaciv.com
https://www.paaciv.com
https://staging.paaciv.com
http://localhost:3100
```

C'est la seule des trois variables qui coûte quelque chose si on s'en sert à
votre place : une clé non restreinte consomme votre quota de tuiles depuis
n'importe quel site. Les deux autres ne donnent accès qu'à ce que la RLS
autorise déjà à un visiteur anonyme.

### 4 · Le jour où la production s'ouvre

Refaire les étapes 1 et 2 pour `paaciv.com`, avec la même branche. Les deux
sites se reconstruiront alors ensemble à chaque push, ce qui est le
comportement voulu : la préproduction n'a d'intérêt que si elle montre
exactement ce que verra la production.

Ne pas ouvrir la production avant d'avoir réglé ce que liste
`docs/brief-visuels.md` — les sept fiches partagent encore la même photographie
générique, et les douze images de l'accueil n'ont ni auteur ni licence.

## Le rôle de GitHub Actions

Le workflow `.github/workflows/ci.yml` **ne déploie pas**. Il vérifie, à chaque
push et sur chaque pull request : types, lint, 210 tests unitaires, contraste de
la palette, build de production.

C'est le garde-fou du déploiement automatique. Hostinger reconstruit sans rien
demander à personne ; sans ces contrôles, la seule façon d'apprendre qu'une
régression est partie en ligne serait de regarder le site. Les deux chaînes
tournent en parallèle sur le même push, et celle de GitHub est la plus rapide à
crier.

Le build de la CI utilise des **valeurs factices** pour les trois variables : il
prouve que le projet compile, pas qu'il se connecte. Les vraies valeurs ne
servent qu'au build réel, chez Hostinger.

Les tests de bout en bout (Playwright) n'y tournent pas : ils s'authentifient
sur la vraie base et écrivent dans les tables de collecte de production. Ils
restent une commande locale, `npm run e2e`.

## Vérifier, redémarrer, revenir en arrière

Depuis une session Claude Code disposant du connecteur Hostinger :

- **État des builds** — `hosting_listNodeJSBuildsV1` (`username: u382331247`,
  `domain: staging.paaciv.com`).
- **Logs d'un build** — `hosting_getNodeJSBuildLogsV1` avec l'`uuid` du build.
  Le paramètre `from_line` permet de suivre un build en cours sans tout relire.
- **Redémarrer l'application** sans reconstruire — `hosting_restartNode_jsApplicationV1`.
  C'est ce qu'il faut après un changement de variable d'environnement.
- **Vulnérabilités npm** — `hosting_listNode_jsVulnerabilitiesV1`, et
  `hosting_patchNode_jsVulnerabilitiesV1` ouvre une pull request de correction.
  Cette dernière **exige le dépôt connecté** (étape 1) : sur un site déployé par
  archive, elle répond 404.

**Revenir en arrière** se fait par le dépôt, pas par l'hébergeur : `git revert`
puis push. C'est une conséquence directe du déploiement continu, et c'est
voulu — l'état du site est celui de `main`, sans exception à retenir.

## La porte de secours : déployer sans GitHub

Si la connexion GitHub tombe ou n'est pas encore faite, on peut pousser une
archive à la main. C'est ainsi que la préproduction a été mise en ligne la
première fois.

```bash
# depuis la racine du dépôt — sources SUIVIES PAR GIT uniquement
mkdir -p /tmp/paaciv-deploy
git ls-files -z paaciv/ | while IFS= read -r -d '' f; do
  dest="/tmp/paaciv-deploy/${f#paaciv/}"
  mkdir -p "$(dirname "$dest")" && cp "$f" "$dest"
done
grep -E '^NEXT_PUBLIC_' paaciv/.env.local > /tmp/paaciv-deploy/.env.production
(cd /tmp/paaciv-deploy && zip -qr /tmp/paaciv-app.zip .)
```

Puis `hosting_deployJsApplication` avec `domain: staging.paaciv.com` et le
chemin de l'archive. L'archive ne doit contenir **que des sources** — ni
`node_modules/`, ni `.next/` : le build tourne sur le serveur.

Deux pièges rencontrés, notés pour la prochaine fois :

- `hosting_createNodeJSBuildFromArchiveV1` refuse l'archive (« The archive field
  must be a file ») quel que soit le chemin. **Utiliser
  `hosting_deployJsApplication`**, qui accepte le même fichier sans broncher.
- Une archive faite avec `Compress-Archive` de PowerShell contient des chemins à
  antislashs, que l'extraction Linux ne découpe pas. Passer par `zip`, ou par
  `zipfile` de Python, qui écrivent des séparateurs POSIX.

## Ce qui n'a pas été retenu, et pourquoi

- **Le VPS KVM 4** (`187.77.168.171`, Ubuntu 24.04, 4 vCPU / 16 Go) est la
  maison naturelle d'un Next.js rendu à la demande, et il est inoccupé — aucun
  de vos domaines ne pointe dessus. Il a été écarté au profit de l'hébergement
  Business, déjà relié à `paaciv.com` et sans administration serveur à tenir.
  Il reste disponible si la mutualisation montre ses limites.
- **Un export statique** est impossible : toutes les pages portent
  `force-dynamic` parce qu'elles lisent Supabase à chaque requête. Le site a
  besoin d'un processus Node qui tourne.
- **Un déploiement piloté par GitHub Actions** (Actions qui pousse vers
  Hostinger) doublonnerait avec la reconstruction automatique de l'hébergeur, et
  demanderait d'y confier un jeton d'API. Deux chaînes de déploiement
  concurrentes valent moins qu'une seule qu'on comprend.
