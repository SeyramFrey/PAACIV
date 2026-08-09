import { useEffect, useMemo, useRef } from 'react'

export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  }, [callback])

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  return useMemo(
    () =>
      (...args: A) => {
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => cbRef.current(...args), delay)
      },
    [delay],
  )
}
