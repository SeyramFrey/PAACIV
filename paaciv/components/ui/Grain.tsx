// Voile de grain fixe repris de la référence (docs/design-ref, ligne 55).
// `mix-blend-mode: soft-light` casse l'aspect trop lisse des aplats et des
// photos ; sans lui la page perd sa matière.
const MOTIF =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/></filter><rect width='160' height='160' filter='url(%23n)' opacity='0.42'/></svg>\")"

export function Grain() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] opacity-50"
      style={{ mixBlendMode: 'soft-light', backgroundImage: MOTIF }}
    />
  )
}
