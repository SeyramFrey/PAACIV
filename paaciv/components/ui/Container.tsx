import { clsx } from 'clsx'

type Props = React.HTMLAttributes<HTMLDivElement>

export function Container({ className, ...props }: Props) {
  return (
    <div
      className={clsx('mx-auto w-full max-w-6xl px-4 sm:px-6', className)}
      {...props}
    />
  )
}
