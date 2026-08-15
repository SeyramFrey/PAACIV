import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Revelations } from '@/components/ui/Revelations'

// `usePathname` (next-intl, adossé à `next/navigation`) exige un contexte de
// routeur App Router indisponible sous jsdom. On le simule pour piloter la
// route observée par `Revelations` sans monter tout Next.
const usePathnameMock = vi.hoisted(() => vi.fn(() => '/fr'))
vi.mock('@/i18n/navigation', () => ({ usePathname: usePathnameMock }))

// jsdom n'implémente pas IntersectionObserver : on fournit un double
// pilotable (observe/unobserve/disconnect espionnés, déclenchement manuel
// des intersections) pour exercer le moteur sans navigateur réel.
class IOMock {
  static instances: IOMock[] = []
  callback: IntersectionObserverCallback
  observe = vi.fn((el: Element) => this.observed.push(el))
  unobserve = vi.fn()
  disconnect = vi.fn()
  observed: Element[] = []
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    IOMock.instances.push(this)
  }
  trigger(el: Element) {
    this.callback(
      [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    )
  }
}

function setMatchMedia(reducedMotion: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reducedMotion,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function ajouterCible(attrs: Record<string, string>) {
  const el = document.createElement('div')
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  IOMock.instances = []
  usePathnameMock.mockReturnValue('/fr')
  vi.stubGlobal('IntersectionObserver', IOMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('Revelations — nettoyage au démontage', () => {
  it("libère l'observateur et l'écouteur de scroll", () => {
    setMatchMedia(false)
    ajouterCible({ 'data-rv': '' })
    const removeSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = render(<Revelations />)
    const io = IOMock.instances[0]
    expect(io).toBeDefined()

    unmount()

    expect(io.disconnect).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
  })

  it('annule les minuteries des compteurs encore actifs au démontage', () => {
    vi.useFakeTimers()
    setMatchMedia(false)
    const compteur = ajouterCible({ 'data-rv': '', 'data-count': '1240' })

    const { unmount } = render(<Revelations />)
    const io = IOMock.instances[0]
    io.trigger(compteur)

    // Le compteur a démarré mais n'a pas fini ses 40 paliers.
    vi.advanceTimersByTime(26 * 3)
    const valeurAvantDemontage = compteur.textContent

    unmount()
    // Si l'intervalle n'était pas annulé, `compteur` continuerait de
    // recevoir de nouvelles valeurs malgré le démontage.
    vi.advanceTimersByTime(26 * 40)

    expect(compteur.textContent).toBe(valeurAvantDemontage)
    expect(compteur.textContent).not.toBe('1240')
  })
})

describe('Revelations — filet de sécurité', () => {
  it('révèle et anime les compteurs jamais intersectés, sans relancer celui déjà animé', () => {
    vi.useFakeTimers()
    setMatchMedia(false)
    const jamaisVu = ajouterCible({ 'data-rv': '', 'data-count': '37' })
    const dejaVu = ajouterCible({ 'data-rv': '', 'data-count': '9' })
    // Preuve directe du non-double-déclenchement : la seule valeur finale
    // ne suffit pas, deux intervalles concurrents sur le même élément
    // convergeraient vers la même cible sans que ça ne prouve qu'un seul a
    // tourné. On compte donc les appels à `setInterval` lui-même.
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    render(<Revelations />)
    const io = IOMock.instances[0]
    // Celui-ci est révélé normalement, avant le filet de sécurité.
    io.trigger(dejaVu)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(26 * 40 + 10)
    expect(dejaVu.textContent).toBe('9')
    expect(dejaVu.classList.contains('rv-in')).toBe(true)

    // Le filet de sécurité (4 s) doit rattraper le second, jamais intersecté,
    // et créer un unique nouvel intervalle pour lui — aucun pour `dejaVu`.
    vi.advanceTimersByTime(4000)
    expect(setIntervalSpy).toHaveBeenCalledTimes(2)

    // Sous mouvement activé, `compter()` écrit la cible via son propre
    // intervalle : on laisse le temps aux 40 paliers de s'écouler.
    vi.advanceTimersByTime(26 * 40 + 10)

    expect(jamaisVu.classList.contains('rv-in')).toBe(true)
    expect(jamaisVu.textContent).toBe('37')

    // Le premier n'a pas été relancé par le filet de sécurité : toujours
    // exactement deux appels à `setInterval` au total sur tout le test.
    expect(dejaVu.textContent).toBe('9')
    expect(setIntervalSpy).toHaveBeenCalledTimes(2)
  })
})

describe('Revelations — mouvement réduit', () => {
  it('la barre de progression fonctionne malgré prefers-reduced-motion', async () => {
    setMatchMedia(true)
    render(<Revelations />)

    // `auScroll()` throttle via `requestAnimationFrame` : on laisse la
    // frame s'écouler avant de lire le style inline.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const barre = document.querySelector<HTMLElement>('[data-prog]')
    expect(barre).not.toBeNull()
    // Sous mouvement réduit, l'ancien code ne posait jamais l'écouteur de
    // scroll ni n'appelait `auScroll()` une première fois : la largeur
    // inline restait vide. Ici elle doit avoir été calculée au moins une
    // fois dès le montage.
    expect(barre?.style.width).toBe('0%')
  })

  it('révèle les blocs immédiatement, sans observateur', () => {
    setMatchMedia(true)
    const bloc = ajouterCible({ 'data-rv': '', 'data-count': '5' })

    render(<Revelations />)

    expect(bloc.classList.contains('rv-in')).toBe(true)
    expect(bloc.textContent).toBe('5')
    expect(IOMock.instances).toHaveLength(0)
  })
})

describe('Revelations — rescan au changement de route', () => {
  it("observe les nouveaux blocs `data-rv` posés par une navigation client", () => {
    setMatchMedia(false)
    const { rerender } = render(<Revelations />)
    const premierIo = IOMock.instances[0]
    expect(premierIo.observed).toHaveLength(0)

    // Simule une navigation `<Link>` : App Router remplace le contenu de la
    // page (nouveaux blocs `data-rv`) sans remonter le layout, donc sans
    // remonter `Revelations`. Seul le changement de `pathname` doit
    // déclencher un nouveau scan.
    const nouveauBloc = ajouterCible({ 'data-rv': '' })
    usePathnameMock.mockReturnValue('/fr/carte')
    rerender(<Revelations />)

    expect(IOMock.instances.length).toBeGreaterThan(1)
    const nouvelIo = IOMock.instances[IOMock.instances.length - 1]
    expect(nouvelIo.observed).toContain(nouveauBloc)
    // L'observateur précédent a bien été libéré, pas laissé actif en double.
    expect(premierIo.disconnect).toHaveBeenCalledTimes(1)
  })

  it("ne réanime pas un data-count resté monté à travers un changement de route", () => {
    // Simule un compteur d'un élément persistant du layout (en-tête, pied
    // de page) : il n'est jamais remonté par la navigation, contrairement
    // au contenu de la page. Le rescan déclenché par le changement de route
    // doit le retrouver mais ne doit jamais relancer son animation.
    vi.useFakeTimers()
    setMatchMedia(false)
    const persistant = ajouterCible({ 'data-rv': '', 'data-count': '20' })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    const { rerender } = render(<Revelations />)
    const premierIo = IOMock.instances[0]
    premierIo.trigger(persistant)
    vi.advanceTimersByTime(26 * 40 + 10)
    expect(persistant.textContent).toBe('20')
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    // Navigation : le pathname change, l'effet se relance et rescanne le
    // DOM — l'élément persistant y est toujours et se retrouve réobservé.
    usePathnameMock.mockReturnValue('/fr/carte')
    rerender(<Revelations />)
    const nouvelIo = IOMock.instances[IOMock.instances.length - 1]
    expect(nouvelIo.observed).toContain(persistant)

    // Il intersecte de nouveau (il n'a jamais quitté l'écran) : si le garde
    // anti-relance ne survivait pas au changement de route, ceci créerait
    // un second intervalle et repartirait de 0.
    nouvelIo.trigger(persistant)
    vi.advanceTimersByTime(26 * 40 + 10)

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    expect(persistant.textContent).toBe('20')
  })
})
