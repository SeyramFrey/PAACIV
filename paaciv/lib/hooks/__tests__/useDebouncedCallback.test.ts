import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('n\'appelle le callback qu\'une fois, avec les derniers arguments', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(fn, 300))
    result.current('a')
    result.current('b')
    result.current('c')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('utilise la dernière référence du callback', () => {
    const premier = vi.fn()
    const second = vi.fn()
    const { result, rerender } = renderHook(({ cb }) => useDebouncedCallback(cb, 200), {
      initialProps: { cb: premier },
    })
    result.current('x')
    rerender({ cb: second })
    vi.advanceTimersByTime(200)
    expect(premier).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledWith('x')
  })
})
