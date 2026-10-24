# Déploiement

*État au 24 octobre 2026.*

## En un paragraphe

Le site tourne sur l'**hébergement Business** de Hostinger, dans le lanceur
Node.js. `staging.paaciv.com` est la préproduction et **fonctionne déjà**.
`paaciv.com` reste vide, en attente des photographies et des crédits
(`docs/brief-visuels.md`). **La préproduction se déploie par archive, depuis
Claude Code et le MCP Hostinger** : un push sur `main` ne la met pas à jour. Elle
a été créée en « Importés manuellement », et Hostinger ne permet pas de la
rebrancher sur GitHub sans la recréer (voir l'étape 1).

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
| Déploiement de la préprod | par archive, via le MCP Hostinger — pas de lien GitHub |
| Contrôles | GitHub Actions, `.github/workflows/ci.yml` |

Le premier déploiement a été fait à la main depuis une archive, pour **prouver
que la chaîne fonctionne** avant de la câbler : build réussi, toutes les routes
compilées, données Supabase servies, `/api/carte/points` répond.

## Les quatre étapes qui restent, et qui demandent vos mains

Elles passent toutes par hPanel ou par un compte tiers : elles ne peuvent pas
être faites depuis le dépôt.

### 1 · Connecter le dépôt GitHub (c'est ça, l'automatisation)

**Non faite, et pas faisable en l'état pour la préproduction.** Hostinger ne
propose la connexion GitHub d'une application Node.js qu'**à sa création**. Une
application importée par archive, ce qu'est `staging.paaciv.com`, n'affiche ni
bouton Git ni moyen d'en changer la source. Pour automatiser, il faudrait
supprimer l'application et la recréer par **Sites web** → **Ajouter un site** →
**Application web Node.js** → **Importer un dépôt Git**, puis ressaisir les
variables de l'étape 2. On a choisi de garder l'archive (voir « Déployer par
archive » plus bas). Pour `paaciv.com`, qui n'a pas encore d'application, il
suffira de passer par Git dès la création.

**À ne pas confondre** : *Avancé* → **Git** est la fonction Git générique de
Hostinger, prévue pour les sites statiques ou PHP. Elle copie le dépôt tel quel,
sans `npm install` ni build. Branchée sur ce site, elle casserait la
préproduction.

Réglages à reprendre à la création :

- Dépôt : `SeyramFrey/PAACIV`
- Branche : `main`
- **Répertoire racine : `paaciv`** ← le point à ne pas rater. Le `package.json`
  n'est pas à la racine du dépôt ; sans ce réglage, Hostinger cherche une
  application là où il n'y a que `docs/` et `.github/`.
- Version de Node : **22**
- Script de build : `build`

Hostinger installe son application GitHub et demande l'accès au dépôt. À partir
de là, un push sur `main` suffit : rebuild et redémarrage automatiques.

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

Créer l'application de `paaciv.com` directement depuis GitHub (étape 1), avec
la même branche, puis déclarer ses variables (étape 2). La production se
reconstruira alors à chaque push, mais la préproduction, toujours en archive,
ne suivra pas d'elle-même. Or elle n'a d'intérêt que si elle montre exactement
ce que verra la production. Deux façons de les garder alignées : déployer
l'archive du même commit sur la préproduction **avant** chaque push sur `main`,
ou profiter de l'ouverture pour recréer aussi la préproduction en Git.

Ne pas ouvrir la production avant d'avoir réglé ce que liste
`docs/brief-visuels.md` — les sept fiches partagent encore la même photographie
générique, et les douze images de l'accueil n'ont ni auteur ni licence.

## Le rôle de GitHub Actions

Le workflow `.github/workflows/ci.yml` **ne déploie pas**. Il vérifie, à chaque
push et sur chaque pull request : types, lint, 210 tests unitaires, contraste de
la palette, build de production.

Tant que la préproduction se déploie par archive, c'est le feu vert à attendre
avant d'en construire une. Le jour où un site sera branché sur GitHub, elle
deviendra le garde-fou du déploiement automatique : Hostinger reconstruira sans
rien demander à personne, et la CI, qui tourne sur le même push, sera la plus
rapide à crier.

Attention : la CI ne reproduit pas l'environnement de build de Hostinger. En
octobre 2026, elle était verte alors que le build Hostinger échouait (voir
« Le piège du build Turbopack/PostCSS »).

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

**Revenir en arrière** : on redéploie l'archive d'un commit antérieur. Un build
qui échoue ne remplace rien, et le site continue de servir la dernière version
« Actuel ». Pour que la préproduction reste lisible, on ne déploie que des
commits déjà poussés sur `main` : l'état du site est alors celui d'un commit de
`main`, qu'on peut nommer.

## Déployer par archive (la voie actuelle)

C'est ainsi que la préproduction est mise à jour, depuis sa création.

### Le MCP Hostinger

Le serveur MCP `hostinger` (`npx -y hostinger-api-mcp`, jeton dans la variable
`APITOKEN`) est déclaré **par dossier de projet**, dans `~/.claude.json`, sous
`projects["C:/Projets/Clients/PAACIV/Code/PAACIV"].mcpServers`. Deux
conséquences :

- **si le dépôt change de dossier**, le MCP ne se charge plus : il faut recopier
  l'entrée sous le nouveau chemin. C'est arrivé quand le projet est passé de
  `C:/Projets/PAACIV` à son emplacement actuel ;
- **les MCP se chargent au démarrage de la session** : une entrée ajoutée en
  cours de route ne sert qu'à partir de la session suivante. `claude mcp list`,
  lancé depuis le dossier, dit s'il est vu et connecté.

### Construire l'archive

```bash
# depuis la racine du dépôt — fichiers d'un COMMIT, pas de la copie de travail
rev=main
python -I - "$rev" <<'EOF'
import subprocess, zipfile, sys
rev = sys.argv[1]
ls = subprocess.run(["git", "ls-tree", "-r", "-z", "--name-only", rev, "--", "paaciv/"],
                    capture_output=True, check=True).stdout.decode().split("\0")
with zipfile.ZipFile("/tmp/paaciv-app.zip", "w", zipfile.ZIP_DEFLATED) as z:
    for f in filter(None, ls):
        z.writestr(f[len("paaciv/"):],
                   subprocess.run(["git", "show", f"{rev}:{f}"], capture_output=True, check=True).stdout)
    env = [l for l in open("paaciv/.env.local", encoding="utf-8").read().splitlines()
           if l.startswith("NEXT_PUBLIC_")]
    z.writestr(".env.production", "\n".join(env) + "\n")
EOF
```

L'archive ne doit contenir **que des sources**, avec `package.json` à sa racine :
ni `node_modules/` ni `.next/`, le build tourne sur le serveur. Les prendre dans
un commit plutôt que dans la copie de travail garantit qu'on déploie exactement
ce qui est sur `main`. Supprimer l'archive après coup : elle contient le
`.env.production`.

### Déployer et vérifier

1. `hosting_deployJsApplication` avec `domain: staging.paaciv.com` et le chemin
   de l'archive. La réponse donne l'`uuid` du build ; Hostinger détecte seul
   Next.js, Node 22 et le script `build`.
2. Suivre le build avec `hosting_listNodeJSBuildsV1` (état `running`, puis
   `completed` ou `failed`) et lire `hosting_getNodeJSBuildLogsV1`. Compter une
   minute environ.
3. Vérifier en ligne : `/fr`, `/fr/architectes`, `/fr/carte` et
   `/api/carte/points` doivent répondre 200, ainsi qu'un fichier ajouté par le
   déploiement (par exemple une vidéo de `public/videos/`).
4. `hosting_listNode_jsVulnerabilitiesV1` pour l'état des failles npm.

### Pièges rencontrés

- `hosting_createNodeJSBuildFromArchiveV1` refuse l'archive (« The archive field
  must be a file ») quel que soit le chemin. **Utiliser
  `hosting_deployJsApplication`**, qui accepte le même fichier sans broncher.
- Une archive faite avec `Compress-Archive` de PowerShell contient des chemins à
  antislashs, que l'extraction Linux ne découpe pas. Passer par `zip`, ou par
  `zipfile` de Python, qui écrivent des séparateurs POSIX.

### Le piège du build Turbopack/PostCSS

Depuis le passage à `next` 16.4.1, le build Hostinger échouait à chaque essai,
alors qu'il passait en local et dans la CI :

```
FATAL: An unexpected Turbopack error occurred.
Error [TurbopackInternalError]: [project]/app/globals.css [app-client] (css)
- node process exited before we could connect to it with exit status: 0
```

Par défaut, Turbopack lance PostCSS (donc Tailwind) dans des processus enfants
et leur parle par socket. Sur l'hébergement mutualisé, ces processus sortent
avant que la connexion s'établisse. Le fichier mis en cause varie d'un essai à
l'autre (`globals.css`, `maplibre-gl.css`) : ce n'est pas le CSS qui est en
cause.

**Le correctif est dans `paaciv/next.config.ts`** :
`experimental.turbopackPluginRuntimeStrategy: "workerThreads"`, une option
apparue en 16.4.0. PostCSS tourne alors dans le processus de Next, sans socket.
Dans les logs Hostinger, la ligne `· turbopackPluginRuntimeStrategy:
"workerThreads"` confirme qu'elle est prise en compte.

- **Ne pas la retirer** sans avoir réussi un build Hostinger sans elle.
- **En local, sous Node 24.13.1 ou plus**, Next ignore cette option, à cause
  d'un bug de Node avec les worker threads, et revient aux processus enfants. Il
  l'annonce par un avertissement au build. Un build local qui passe ne prouve
  donc pas que le correctif marche : seul le build Hostinger, en Node 22, le
  teste vraiment.
- **Si Hostinger passe en Node 24**, Next ignorera l'option là aussi, et le
  piège reviendra. Les solutions seraient alors `forceWorkerThreads`, au risque
  d'un plantage décrit dans la doc Next, ou un build webpack
  (`next build --webpack`).

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
