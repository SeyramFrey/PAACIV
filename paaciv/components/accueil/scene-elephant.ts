// Scène three.js de l'éléphant de l'emblème.
//
// Chargé seulement par `import()` dynamique depuis `EmblemeElephant`, une fois
// la section en vue et l'appareil jugé capable : three.js (environ 150 Ko gzip)
// et le modèle (1,1 Mo) ne pèsent jamais sur le premier écran.
//
// Le modèle : `public/3d/elephant/elephant-eclats.glb`, sculpté dans Blender
// sans IA, d'après l'emblème de PAACIV. Chaque patrimoine est un éclat du
// corps, un nœud glTF à part, portant les extras `groupe` et `cliquable`. Au
// survol, l'éclat avance de 3,5 cm vers le visiteur (+Z en glTF, Y vers le
// haut), et laisse voir le creux derrière lui.
//
// Rendu à la demande : une image n'est calculée que si quelque chose bouge
// (survol, inclinaison qui suit le pointeur, redimensionnement). Au repos, la
// scène ne coûte rien.
import {
  ACESFilmicToneMapping,
  Box3,
  Clock,
  DirectionalLight,
  Group,
  HemisphereLight,
  MathUtils,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { FIN, partEclat } from './demontage'

export type Groupe = 'basilique' | 'mosquee' | 'pyramide' | 'carte'

export type SceneElephant = {
  surligner: (groupe: Groupe | null) => void
  // Avancement du démontage, de 0 (éléphant entier) à 1 (vue éclatée), lu
  // sur le défilement de la section.
  progression: (p: number) => void
  detruire: () => void
}


type Options = {
  hote: HTMLElement
  modele: string
  decodeur: string
  // Éclats qui ouvrent une fiche. Un éclat sans fiche ne bouge pas : un
  // patrimoine qui se soulève sans rien ouvrir serait un gadget.
  actifs: ReadonlySet<Groupe>
  // Ordre de démontage au défilement (les seuls éclats actifs).
  ordre: readonly Groupe[]
  mouvementReduit: boolean
  auSurvol: (groupe: Groupe | null) => void
  auClic: (groupe: Groupe) => void
  // Premier geste du visiteur sur la scène (glisser pour tourner) : la
  // section retire alors son indication « Faites-le tourner ».
  auGeste?: () => void
  pret: () => void
  echec: () => void
}

// Avancée de l'éclat survolé, en mètres (le modèle mesure 1,75 m de large).
const AVANCEE = 0.035
// Cadrage identique à l'image fixe rendue dans Blender (objectif de 50 mm
// sur capteur de 36 mm, soit 39,6° de champ) : la 3D prend le relais de
// l'affiche sans saut visible.
const CHAMP = 39.6
const POSITION_CAMERA = new Vector3(0.55, 0.25, 2.9)
const CIBLE = new Vector3(0, 0.05, 0)
// Inclinaison maximale qui suit le pointeur, en radians. Doublée le 12/11/2026 :
// à 0,12, on ne voyait pas que l'éléphant était en volume.
const INCLINAISON = 0.24
// Balancement au repos : amplitude (radians) et période (secondes). C'est lui
// qui montre le relief quand personne ne touche à rien.
const BALANCEMENT = 0.2
const PERIODE = 9
// Entrée : depuis la vue de face de l'image fixe (pas de saut au fondu),
// l'éléphant tourne la tête d'un côté puis revient vers le visiteur.
const ENTREE_ANGLE = 0.6
const ENTREE_DUREE = 2.4
// Rotation au glisser : radians par largeur de scène, et butée.
const GLISSER_GAIN = 3
const GLISSER_MAX = 1.1

export function monterSceneElephant(o: Options): SceneElephant {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.domElement.setAttribute('aria-hidden', 'true')
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  o.hote.appendChild(renderer.domElement)

  const scene = new Scene()
  const camera = new PerspectiveCamera(CHAMP, 1, 0.1, 20)
  camera.position.copy(POSITION_CAMERA)
  camera.lookAt(CIBLE)

  // Trois lumières, reprises du rendu Blender : une principale chaude en
  // haut à droite, un contre-jour froid qui détache les oreilles du fond
  // bleu nuit, un débouché doux à gauche.
  scene.add(new HemisphereLight(0xf3eee4, 0x1a2333, 0.9))
  const cle = new DirectionalLight(0xfff1df, 2.6)
  cle.position.set(2.5, 3, 3)
  const contre = new DirectionalLight(0xcfe0ff, 1.6)
  contre.position.set(-2.5, 2, -3)
  const debouche = new DirectionalLight(0xffffff, 0.6)
  debouche.position.set(-3, 0.5, 2)
  scene.add(cle, contre, debouche)

  // Pivot : c'est lui qui s'incline vers le pointeur, pas la caméra, pour que
  // l'éclairage reste fixe et que les ombres ne glissent pas sur la peau.
  const pivot = new Group()
  scene.add(pivot)

  // `base` : position d'origine du nœud ; `sortie` : déplacement en vue
  // éclatée, calculé au chargement à partir de la place de l'éclat sur le corps
  // (les oreilles s'écartent sur les côtés, le front avance).
  const eclats = new Map<Groupe, { noeud: Object3D; base: Vector3; sortie: Vector3; penche: number }>()
  const cible = new Vector3()
  let avancement = 0

  let survol: Groupe | null = null
  let demandeExterne: Groupe | null = null
  const pointeur = new Vector2(0, 0)
  const inclinaisonVisee = new Vector2(0, 0)
  const raycaster = new Raycaster()
  const horloge = new Clock()
  let enVue = true
  let boucle = 0
  let detruit = false
  // Temps écoulé depuis l'apparition du modèle, et état du glisser.
  let temps = 0
  let charge = false
  let lacetVisiteur = 0
  let glisse: { x: number; depart: number; bouge: boolean } | null = null
  let pointeurDedans = false
  let repos = 1

  function dimensionner() {
    const { clientWidth: l, clientHeight: h } = o.hote
    if (!l || !h) return
    renderer.setSize(l, h, false)
    camera.aspect = l / h
    camera.updateProjectionMatrix()
    demander()
  }

  // Une image, puis d'autres seulement tant qu'une animation n'a pas rejoint
  // sa cible.
  function demander() {
    if (detruit || !enVue || boucle) return
    horloge.getDelta()
    boucle = requestAnimationFrame(image)
  }

  function image() {
    boucle = 0
    const dt = Math.min(horloge.getDelta(), 0.05)
    const k = o.mouvementReduit ? 1 : 1 - Math.exp(-dt * 12)
    let encore = false

    for (const [groupe, e] of eclats) {
      const part = partEclat(avancement, o.ordre.indexOf(groupe), o.ordre.length)
      const actif = (demandeExterne ?? survol) === groupe
      cible.copy(e.base).addScaledVector(e.sortie, part)
      if (actif) cible.z += AVANCEE
      e.noeud.position.lerp(cible, k)
      if (e.noeud.position.distanceToSquared(cible) < 1e-8) e.noeud.position.copy(cible)
      else encore = true
      const angle = e.penche * part
      e.noeud.rotation.y = MathUtils.lerp(e.noeud.rotation.y, angle, k)
      if (Math.abs(e.noeud.rotation.y - angle) > 1e-4) encore = true
      else e.noeud.rotation.y = angle
    }

    // En se démontant, l'éléphant tourne un peu de trois quarts : une vue
    // éclatée de face ne montrerait pas l'épaisseur des éclats.
    const demonte = MathUtils.clamp(avancement / FIN, 0, 1)
    const lacet = 0.3 * demonte
    let anime = 0
    if (!o.mouvementReduit && charge) {
      temps += dt
      // Entrée : aller-retour de 0 à ENTREE_ANGLE, doux aux deux bouts.
      const e = Math.min(1, temps / ENTREE_DUREE)
      anime += ENTREE_ANGLE * Math.pow(Math.sin(Math.PI * e), 2)
      // Balancement : s'efface quand le pointeur prend la main, quand le
      // visiteur fait tourner l'éléphant, et pendant le démontage.
      const viseRepos = pointeurDedans || glisse ? 0 : 1
      repos = MathUtils.lerp(repos, viseRepos, 1 - Math.exp(-dt * 2))
      // Le balancement prend le relais après l'entrée, sans à-coup.
      const apres = Math.max(0, temps - ENTREE_DUREE)
      anime += BALANCEMENT * repos * (1 - demonte) * Math.min(1, apres / 2) * Math.sin((apres / PERIODE) * Math.PI * 2)
      // Hors glisser, la rotation du visiteur revient doucement à zéro.
      if (!glisse) lacetVisiteur = MathUtils.lerp(lacetVisiteur, 0, 1 - Math.exp(-dt * 0.8))
      if (e < 1 || repos > 0.001 || Math.abs(lacetVisiteur) > 1e-3) encore = true
    }
    const viseY = lacet + anime + lacetVisiteur + (o.mouvementReduit ? 0 : inclinaisonVisee.x)
    const viseX = o.mouvementReduit ? 0 : inclinaisonVisee.y
    const kr = o.mouvementReduit ? 1 : glisse ? 1 - Math.exp(-dt * 20) : 1 - Math.exp(-dt * 4)
    pivot.rotation.y = MathUtils.lerp(pivot.rotation.y, viseY, kr)
    pivot.rotation.x = MathUtils.lerp(pivot.rotation.x, viseX, kr)
    if (Math.abs(pivot.rotation.y - viseY) > 1e-4 || Math.abs(pivot.rotation.x - viseX) > 1e-4) encore = true

    renderer.render(scene, camera)
    if (encore) demander()
  }

  function eclatSous(x: number, y: number): Groupe | null {
    const r = renderer.domElement.getBoundingClientRect()
    pointeur.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
    raycaster.setFromCamera(pointeur, camera)
    const [touche] = raycaster.intersectObjects(pivot.children, true)
    if (!touche) return null
    // Le premier objet touché peut être la tête, devant un éclat : seul
    // l'objet le plus proche compte, comme à l'œil.
    let n: Object3D | null = touche.object
    while (n && !n.userData?.cliquable) n = n.parent
    const g = n?.userData?.groupe as Groupe | undefined
    return g && o.actifs.has(g) ? g : null
  }

  function auMouvement(e: PointerEvent) {
    const r = renderer.domElement.getBoundingClientRect()
    pointeurDedans = e.pointerType !== 'touch'
    if (glisse) {
      const dx = e.clientX - glisse.x
      if (Math.abs(dx) > 6 && !glisse.bouge) {
        glisse.bouge = true
        o.auGeste?.()
      }
      if (glisse.bouge) {
        lacetVisiteur = MathUtils.clamp(glisse.depart + (dx / r.width) * GLISSER_GAIN, -GLISSER_MAX, GLISSER_MAX)
        renderer.domElement.style.cursor = 'grabbing'
        demander()
        return
      }
    }
    if (!o.mouvementReduit) {
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1
      inclinaisonVisee.set(MathUtils.clamp(nx, -1, 1) * INCLINAISON, MathUtils.clamp(ny, -1, 1) * INCLINAISON * 0.5)
    }
    // Au doigt, pas de survol : le premier toucher passe par `auClic`.
    const g = e.pointerType === 'touch' ? null : eclatSous(e.clientX, e.clientY)
    if (g !== survol) {
      survol = g
      o.auSurvol(g)
    }
    renderer.domElement.style.cursor = g ? 'pointer' : 'grab'
    demander()
  }

  function auAppui(e: PointerEvent) {
    if (o.mouvementReduit) return
    glisse = { x: e.clientX, depart: lacetVisiteur, bouge: false }
  }

  function auDepart() {
    inclinaisonVisee.set(0, 0)
    pointeurDedans = false
    glisse = null
    if (survol) {
      survol = null
      renderer.domElement.style.cursor = ''
      o.auSurvol(null)
    }
    demander()
  }

  // Sur écran tactile : un premier toucher soulève l'éclat, un second l'ouvre.
  // Ouvrir dès le premier toucher, sans avoir vu ce qu'on touche, surprendrait.
  let armeTactile: Groupe | null = null
  function auClic(e: PointerEvent) {
    // Fin d'un glisser : ce n'était pas un clic, rien ne s'ouvre.
    const aGlisse = glisse?.bouge
    glisse = null
    if (aGlisse) {
      renderer.domElement.style.cursor = 'grab'
      demander()
      return
    }
    const g = eclatSous(e.clientX, e.clientY)
    if (!g) {
      armeTactile = null
      if (e.pointerType === 'touch' && survol) {
        survol = null
        o.auSurvol(null)
        demander()
      }
      return
    }
    if (e.pointerType === 'touch' && armeTactile !== g) {
      armeTactile = g
      survol = g
      o.auSurvol(g)
      demander()
      return
    }
    o.auClic(g)
  }

  const obsTaille = new ResizeObserver(dimensionner)
  obsTaille.observe(o.hote)
  const obsVue = new IntersectionObserver(([e]) => {
    enVue = e.isIntersecting
    if (enVue) demander()
  })
  obsVue.observe(o.hote)
  renderer.domElement.addEventListener('pointermove', auMouvement)
  renderer.domElement.addEventListener('pointerleave', auDepart)
  renderer.domElement.addEventListener('pointerup', auClic)
  renderer.domElement.addEventListener('pointerdown', auAppui)
  // Le doigt peut glisser à l'horizontale pour tourner, le défilement
  // vertical de la page reste au navigateur.
  renderer.domElement.style.touchAction = 'pan-y'
  renderer.domElement.style.cursor = 'grab'

  const draco = new DRACOLoader()
  draco.setDecoderPath(o.decodeur)
  const chargeur = new GLTFLoader()
  chargeur.setDRACOLoader(draco)
  chargeur.load(
    o.modele,
    (gltf) => {
      if (detruit) return
      const racine = gltf.scene
      // Le modèle est centré dans Blender ; on recentre quand même sur sa
      // boîte, pour qu'une retouche du modèle ne décale pas le cadrage.
      const boite = new Box3().setFromObject(racine)
      const centre = boite.getCenter(new Vector3())
      racine.position.x -= centre.x
      racine.updateMatrixWorld(true)
      racine.traverse((n) => {
        if (n.userData?.cliquable && n.userData.groupe) {
          const g = n.userData.groupe as Groupe
          const c = new Box3().setFromObject(n).getCenter(new Vector3())
          // Les oreilles (|x| > 0,3 m) partent sur le côté ; le front avance
          // davantage, la carte monte, la Pyramide descend un peu.
          const cote = Math.abs(c.x) > 0.3 ? Math.sign(c.x) : 0
          const sortie = new Vector3(cote * 0.2, (c.y - 0.1) * 0.35, cote ? 0.26 : 0.36)
          eclats.set(g, { noeud: n, base: n.position.clone(), sortie, penche: cote * 0.22 })
        }
      })
      pivot.add(racine)
      dimensionner()
      charge = true
      renderer.render(scene, camera)
      o.pret()
      demander()
    },
    undefined,
    () => {
      if (!detruit) o.echec()
    },
  )

  return {
    surligner(groupe) {
      demandeExterne = groupe && o.actifs.has(groupe) ? groupe : null
      demander()
    },
    progression(p) {
      const v = MathUtils.clamp(p, 0, 1)
      if (Math.abs(v - avancement) < 1e-4) return
      avancement = v
      demander()
    },
    detruire() {
      detruit = true
      cancelAnimationFrame(boucle)
      obsTaille.disconnect()
      obsVue.disconnect()
      renderer.domElement.removeEventListener('pointermove', auMouvement)
      renderer.domElement.removeEventListener('pointerleave', auDepart)
      renderer.domElement.removeEventListener('pointerup', auClic)
      renderer.domElement.removeEventListener('pointerdown', auAppui)
      draco.dispose()
      scene.traverse((n) => {
        const m = n as Object3D & { geometry?: { dispose(): void }; material?: unknown }
        m.geometry?.dispose()
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
        for (const mat of mats as { dispose(): void; [k: string]: unknown }[]) {
          for (const v of Object.values(mat)) {
            if (v && typeof v === 'object' && 'isTexture' in v) (v as unknown as { dispose(): void }).dispose()
          }
          mat.dispose()
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
