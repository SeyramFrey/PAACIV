import { clsx } from 'clsx'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'gold' | 'ghost' }

export function Button({ variant = 'gold', className, ...props }: Props) {
  return (
    <button
      className={clsx(
        'rounded-full px-5 py-3 text-sm font-semibold transition',
        variant === 'gold' && 'bg-or text-encre hover:brightness-95',
        variant === 'ghost' && 'border border-terracotta text-brun hover:bg-creme2',
        className,
      )}
      {...props}
    />
  )
}
