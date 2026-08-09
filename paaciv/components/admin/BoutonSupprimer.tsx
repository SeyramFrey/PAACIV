'use client'

// Bouton de soumission pour les formulaires de suppression (Server Actions).
// Le texte de confirmation dépend de la locale : on le reçoit en prop depuis
// le composant serveur appelant (le message doit déjà être traduit).
export function BoutonSupprimer({
  message,
  className,
  children,
}: {
  message: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
