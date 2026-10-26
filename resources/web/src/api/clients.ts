import type { Client, ClientDetail } from '@/types/client'

const API_BASE = '/api/v1'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { signal })
  if (!response.ok) {
    throw new ApiError(response.status, `Request to ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}

export function getClients(signal?: AbortSignal): Promise<Client[]> {
  return getJson<Client[]>('/client', signal)
}

export function getClient(id: number, signal?: AbortSignal): Promise<ClientDetail> {
  return getJson<ClientDetail>(`/client/${id}`, signal)
}
