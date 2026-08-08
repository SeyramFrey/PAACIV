import { clsx } from 'clsx'

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'terracotta' | 'vert' | 'or' | 'neutral'
}

export function Badge({ variant = 'neutral', className, ...props }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
        variant === 'terracotta' && 'bg-terracotta text-sable',
        variant === 'vert' && 'bg-vert text-sable',
        variant === 'or' && 'bg-or text-encre',
        variant === 'neutral' && 'bg-creme2 text-encre',
        className,
      )}
      {...props}
    />
  )
}
