import { useCallback, useEffect, useEffectEvent, useState } from 'react'

export type RequestState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T }

type Outcome<T> = { status: 'error'; error: unknown } | { status: 'success'; data: T }

/**
 * Runs `request` on mount and whenever `key` changes; `retry` runs it again.
 * A request superseded by a newer one is aborted and its result ignored.
 */
export function useRequest<T>(request: (signal: AbortSignal) => Promise<T>, key: string | number) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ requestId: string; outcome: Outcome<T> } | null>(null)
  const runRequest = useEffectEvent(request)
  const requestId = `${key}#${attempt}`

  useEffect(() => {
    const controller = new AbortController()
    runRequest(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ requestId, outcome: { status: 'success', data } })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ requestId, outcome: { status: 'error', error } })
      },
    )
    return () => controller.abort()
  }, [requestId])

  const retry = useCallback(() => setAttempt((value) => value + 1), [])

  // Until the current request finishes, an older result is not shown.
  const state: RequestState<T> = result?.requestId === requestId ? result.outcome : { status: 'loading' }
  return { state, retry }
}
