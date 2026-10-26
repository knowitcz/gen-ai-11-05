import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import { vi } from 'vitest'
import { AppRoutes } from '@/App'

/** Renders the app at `path`; the current location is exposed in a `data-testid="location"` element. */
export function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>,
  )
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location" hidden>{`${location.pathname}${location.search}`}</div>
}

type MockReply = { status: number; body: unknown } | Error | 'pending'

export function json(body: unknown, status = 200): MockReply {
  return { status, body }
}

export const networkError = (): MockReply => new TypeError('Failed to fetch')

export const pending: MockReply = 'pending'

/**
 * Replaces `fetch` with a mock that answers by URL path (the query string is ignored).
 * A list of replies is used one per call; its last reply repeats. An unknown path fails the test.
 */
export function mockApi(routes: Record<string, MockReply | MockReply[]>) {
  const calls = new Map<string, number>()
  const fetchMock = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input), 'http://localhost')
    const route = routes[url.pathname]
    if (route === undefined) throw new Error(`Unexpected request to ${url.pathname}`)
    const replies = Array.isArray(route) ? route : [route]
    const count = calls.get(url.pathname) ?? 0
    calls.set(url.pathname, count + 1)
    const reply = replies[Math.min(count, replies.length - 1)]
    if (reply === 'pending') return new Promise<Response>(() => {})
    if (reply instanceof Error) throw reply
    return new Response(JSON.stringify(reply.body), {
      status: reply.status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** The URLs `fetch` was called with, for one path. */
export function requestedUrls(fetchMock: ReturnType<typeof mockApi>, path: string): URL[] {
  return fetchMock.mock.calls
    .map(([input]) => new URL(String(input), 'http://localhost'))
    .filter((url) => url.pathname === path)
}
