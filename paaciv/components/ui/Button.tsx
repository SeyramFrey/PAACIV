import { clsx } from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'gold' | 'ghost' }

export function Button({ variant = 'gold', className, ...props }: Props) {
  return (
    <button
      className={clsx(
        'rounded-full px-5 py-3 text-sm font-semibold transition',
        variant === 'gold' && 'bg-or text-encre hover:brightness-95',
        // Couleurs héritées, comme `BasculeTheme` : ce bouton est posé aussi
        // bien sur le fond clair que sur le fond sombre, et son `text-brun`
        // figé y tombait à 2,62:1 en mode sombre (« Se déconnecter »,
        // « Exporter en CSV »).
        variant === 'ghost' && 'border border-current text-encre-t hover:bg-fond2',
        className,
      )}
      {...props}
    />
  )
}
